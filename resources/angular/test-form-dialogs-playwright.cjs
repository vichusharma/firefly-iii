const { chromium } = require('playwright');

const baseUrl = process.env.FIREFLY_BASE_URL || 'http://localhost:8080';
const viewport = { width: 1440, height: 1200 };
const credentialCandidates = [
  {
    email: process.env.FIREFLY_EMAIL || 'demo@example.com',
    password: process.env.FIREFLY_PASSWORD || 'demo1234',
  },
  ...(process.env.FIREFLY_ALT_EMAIL && process.env.FIREFLY_ALT_PASSWORD
    ? [{ email: process.env.FIREFLY_ALT_EMAIL, password: process.env.FIREFLY_ALT_PASSWORD }]
    : []),
];

const results = [];
const cleanupTargets = {
  accounts: [],
  budgets: [],
  transactions: [],
};

let lastBrowserDialogMessage = null;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function truncate(value, length = 220) {
  if (!value) return '';
  return value.length <= length ? value : `${value.slice(0, length)}...`;
}

function pushResult(name, passed, reason = '') {
  results.push({ name, passed, reason });
  if (passed) {
    console.log(`✅ ${name}`);
  } else {
    console.log(`❌ ${name} - ${reason}`);
  }
}

async function runTest(name, fn) {
  try {
    await fn();
    pushResult(name, true);
  } catch (error) {
    pushResult(name, false, error instanceof Error ? error.message : String(error));
  }
}

async function waitForPageReady(page, headingText) {
  await page.getByRole('heading', { name: headingText, exact: true }).waitFor({ timeout: 15000 });
  await page.waitForLoadState('networkidle');
  const spinner = page.locator('mat-spinner');
  if (await spinner.count()) {
    await spinner.first().waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
  }
}

async function waitForDialog(page, titleText) {
  const title = page.getByRole('heading', { name: titleText, exact: true });
  await title.waitFor({ timeout: 10000 });
  const dialog = page.locator('mat-dialog-container').last();
  await dialog.waitFor({ state: 'visible', timeout: 10000 });
  return dialog;
}

async function navigateWithinSpa(page, path, headingText, navLabel = null) {
  const navLink = navLabel ? page.getByRole('link', { name: new RegExp(navLabel, 'i') }) : null;
  if (navLink && await navLink.count()) {
    await navLink.click();
  } else {
    await page.evaluate((targetPath) => {
      window.history.pushState({}, '', targetPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, path);
  }
  await waitForPageReady(page, headingText);
}

async function collectDialogIssues(dialog, paneLocator, minimumFieldCount) {
  const issues = [];

  const paneBox = await paneLocator.boundingBox();
  if (!paneBox) {
    issues.push('Dialog overlay was not visible for centering check');
  } else {
    const actualCenterX = paneBox.x + paneBox.width / 2;
    const actualCenterY = paneBox.y + paneBox.height / 2;
    const expectedCenterX = viewport.width / 2;
    const expectedCenterY = viewport.height / 2;

    if (Math.abs(actualCenterX - expectedCenterX) > 40 || Math.abs(actualCenterY - expectedCenterY) > 40) {
      issues.push(
        `Dialog center was (${actualCenterX.toFixed(1)}, ${actualCenterY.toFixed(1)}) instead of near (${expectedCenterX}, ${expectedCenterY})`
      );
    }
  }

  const fields = dialog.locator('mat-form-field:visible');
  const fieldCount = await fields.count();
  if (fieldCount < minimumFieldCount) {
    issues.push(`Expected at least ${minimumFieldCount} visible fields, found ${fieldCount}`);
    return issues;
  }

  const dialogBox = await dialog.boundingBox();
  if (!dialogBox) {
    issues.push('Dialog box not available for field size check');
    return issues;
  }

  const fieldsToCheck = Math.min(fieldCount, 4);
  for (let index = 0; index < fieldsToCheck; index += 1) {
    const fieldBox = await fields.nth(index).boundingBox();
    if (!fieldBox) {
      issues.push(`Field ${index + 1} was not visible`);
      continue;
    }
    if (fieldBox.width < 250) {
      issues.push(`Field ${index + 1} width was too small (${fieldBox.width.toFixed(1)}px)`);
    } else if (fieldBox.width / dialogBox.width < 0.72) {
      issues.push(`Field ${index + 1} did not use enough horizontal space (${(fieldBox.width / dialogBox.width).toFixed(2)})`);
    }
  }

  return issues;
}

async function openDialog(page, buttonLabel, titleText) {
  await page.getByRole('button', { name: new RegExp(buttonLabel, 'i') }).click();
  const dialog = await waitForDialog(page, titleText);
  const overlayPane = page.locator('.cdk-overlay-pane.firefly-dialog-container').last();
  await overlayPane.waitFor({ state: 'visible', timeout: 10000 });
  return { dialog, overlayPane };
}

async function selectMaterialOption(page, dialog, formControlName, optionMatcher) {
  const select = dialog.locator(`mat-select[formcontrolname="${formControlName}"]`);
  await select.click();
  const option = typeof optionMatcher === 'string'
    ? page.getByRole('option', { name: optionMatcher, exact: true })
    : page.getByRole('option', { name: optionMatcher });
  await option.waitFor({ timeout: 10000 });
  await option.click();
}

async function submitDialog(page, dialog, submitLabel, endpointPath) {
  lastBrowserDialogMessage = null;
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && response.url().includes(endpointPath),
    { timeout: 15000 }
  );

  await dialog.getByRole('button', { name: new RegExp(submitLabel, 'i') }).click();

  let response;
  try {
    response = await responsePromise;
  } catch (error) {
    if (lastBrowserDialogMessage) {
      throw new Error(lastBrowserDialogMessage);
    }
    const submitButton = dialog.getByRole('button', { name: new RegExp(submitLabel, 'i') });
    if (await submitButton.isDisabled()) {
      throw new Error('Submit button remained disabled after filling the form');
    }
    throw new Error(`No POST request was sent to ${endpointPath}`);
  }

  if (!response.ok()) {
    const bodyText = await response.text().catch(() => 'Unable to read response body');
    throw new Error(`API returned ${response.status()}: ${truncate(bodyText)}`);
  }

  await dialog.waitFor({ state: 'detached', timeout: 15000 });
}

async function collectAccountNames(page) {
  await navigateWithinSpa(page, '/accounts', 'Accounts', 'Accounts');
  const rows = page.locator('table tbody tr');
  const count = await rows.count();
  const names = [];
  for (let index = 0; index < count; index += 1) {
    const name = (await rows.nth(index).locator('td').first().textContent())?.trim();
    if (name) {
      names.push(name);
    }
  }
  return names;
}

async function fetchAccountsViaApi(context) {
  const response = await context.request.get(`${baseUrl}/api/v1/accounts`, { failOnStatusCode: false });
  if (!response.ok()) {
    throw new Error(`Accounts API returned ${response.status()}`);
  }

  const payload = await response.json().catch(() => null);
  return Array.isArray(payload?.data) ? payload.data : payload?.data?.data || [];
}

async function createAccountThroughDialog(page, accountName) {
  await navigateWithinSpa(page, '/accounts', 'Accounts', 'Accounts');
  const { dialog } = await openDialog(page, 'New Account', 'Create New Account');
  await dialog.locator('input[formcontrolname="name"]').fill(accountName);
  await submitDialog(page, dialog, 'Create Account', '/api/v1/accounts');
  await page.getByText(accountName, { exact: true }).waitFor({ timeout: 15000 });
}

async function createAccountViaApi(context, accountName) {
  const response = await context.request.post(`${baseUrl}/api/v1/accounts`, {
    data: {
      name: accountName,
      type: 'asset',
      account_role: 'defaultAsset',
      currency_code: 'EUR',
      active: true,
      include_net_worth: true,
    },
    failOnStatusCode: false,
  });

  if (!response.ok()) {
    const bodyText = await response.text().catch(() => 'Unable to read response body');
    throw new Error(`Helper account creation failed with ${response.status()}: ${truncate(bodyText)}`);
  }

  const payload = await response.json().catch(() => null);
  return payload?.data?.id || null;
}

async function registerFreshUser(page, context) {
  const email = `playwright-${Date.now()}@example.com`;
  const password = 'PlaywrightPassword1234!';

  await context.clearCookies();
  await page.goto(`${baseUrl}/register`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByLabel(/confirm password/i).fill(password);
  await page.getByRole('button', { name: /register/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForLoadState('networkidle');

  return { email, password, registered: true };
}

async function tryDirectSessionLogin(page, context, credentials) {
  const csrfResponse = await context.request.get(`${baseUrl}/csrf-token`, { failOnStatusCode: false });
  if (!csrfResponse.ok()) {
    throw new Error(`CSRF endpoint returned ${csrfResponse.status()}`);
  }

  const csrfPayload = await csrfResponse.json().catch(() => ({}));
  const form = {
    email: credentials.email,
    password: credentials.password,
  };
  if (csrfPayload?.csrf_token) {
    form._token = csrfPayload.csrf_token;
  }

  const loginResponse = await context.request.post(`${baseUrl}/login`, {
    form,
    failOnStatusCode: false,
  });

  const cookieNames = (await context.cookies(baseUrl)).map((cookie) => cookie.name);
  if (!cookieNames.includes('firefly_iii_session')) {
    throw new Error(`No Firefly session cookie after direct login (status ${loginResponse.status()})`);
  }

  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((email) => {
    window.localStorage.setItem('firefly_token', 'session');
    window.localStorage.setItem('firefly_user', JSON.stringify({
      id: '1',
      email,
      name: 'Playwright User',
      role: 'user',
    }));
  }, credentials.email);

  await page.evaluate(() => {
    window.history.pushState({}, '', '/dashboard');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await waitForPageReady(page, 'Financial Dashboard');
  if (!page.url().includes('/dashboard')) {
    throw new Error(`Direct login did not reach dashboard (ended at ${page.url()})`);
  }

  return { ...credentials, directSession: true };
}

async function ensureLogin(page, context) {
  const diagnostics = [];

  for (const credentials of credentialCandidates) {
    await context.clearCookies();
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/email/i).fill(credentials.email);
    await page.getByLabel(/^password$/i).fill(credentials.password);

    await page.getByRole('button', { name: /sign in/i }).click();

    try {
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      return credentials;
    } catch {
      const loginError = (await page.locator('.error-message').textContent().catch(() => ''))?.replace(/\s+/g, ' ').trim();
      const csrfChecks = [];
      for (const path of ['/api/csrf-token', '/csrf-token']) {
        try {
          const response = await context.request.get(`${baseUrl}${path}`, { failOnStatusCode: false });
          csrfChecks.push(`${path}:${response.status()}`);
        } catch (error) {
          csrfChecks.push(`${path}:ERR ${error.message}`);
        }
      }
      const cookieNames = (await context.cookies(baseUrl)).map((cookie) => cookie.name);
      diagnostics.push(
        `${credentials.email} -> ${loginError || 'no dashboard redirect'}; CSRF ${csrfChecks.join(', ')}; cookies: ${cookieNames.join(', ') || 'none'}`
      );

      try {
        return await tryDirectSessionLogin(page, context, credentials);
      } catch (directError) {
        diagnostics.push(`${credentials.email} direct-session -> ${directError.message}`);
      }

      await page.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      }).catch(() => {});
    }
  }

  try {
    return await registerFreshUser(page, context);
  } catch (error) {
    throw new Error(`Unable to log in. ${diagnostics.join(' | ')} | registration fallback failed: ${error.message}`);
  }
}

async function findEntityId(context, endpoint, predicate) {
  const response = await context.request.get(`${baseUrl}/api/v1/${endpoint}`, { failOnStatusCode: false });
  if (!response.ok()) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  const items = Array.isArray(payload?.data) ? payload.data : payload?.data?.data || [];
  const match = items.find(predicate);
  return match?.id || null;
}

async function bestEffortCleanup(context) {
  for (const transactionId of cleanupTargets.transactions) {
    await context.request.delete(`${baseUrl}/api/v1/transactions/${transactionId}`, { failOnStatusCode: false }).catch(() => {});
  }
  for (const budgetId of cleanupTargets.budgets) {
    await context.request.delete(`${baseUrl}/api/v1/budgets/${budgetId}`, { failOnStatusCode: false }).catch(() => {});
  }
  for (const accountId of cleanupTargets.accounts) {
    await context.request.delete(`${baseUrl}/api/v1/accounts/${accountId}`, { failOnStatusCode: false }).catch(() => {});
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: baseUrl, viewport });
  const page = await context.newPage();

  page.on('dialog', async (dialog) => {
    lastBrowserDialogMessage = dialog.message();
    await dialog.dismiss();
  });

  let loginSucceeded = false;
  let loginDetails = null;
  const artifactsDir = 'playwright-artifacts';
  const uniqueSuffix = Date.now();
  const createdNames = {
    account: `E2E Account ${uniqueSuffix}`,
    helperAccount: `E2E Helper ${uniqueSuffix}`,
    transaction: `E2E Transaction ${uniqueSuffix}`,
    budget: `E2E Budget ${uniqueSuffix}`,
  };

  try {
    await runTest('Login', async () => {
      loginDetails = await ensureLogin(page, context);
      loginSucceeded = true;
    });

    if (loginSucceeded) {
      await runTest('Account creation form', async () => {
        await navigateWithinSpa(page, '/accounts', 'Accounts', 'Accounts');

        const { dialog, overlayPane } = await openDialog(page, 'New Account', 'Create New Account');
        const issues = await collectDialogIssues(dialog, overlayPane, 3);
        await dialog.locator('input[formcontrolname="name"]').fill(createdNames.account);
        await submitDialog(page, dialog, 'Create Account', '/api/v1/accounts');
        await page.getByText(createdNames.account, { exact: true }).waitFor({ timeout: 15000 });

        if (issues.length) {
          throw new Error(issues.join('; '));
        }

        const accountId = await findEntityId(context, 'accounts', (item) => item?.name === createdNames.account);
        if (accountId) {
          cleanupTargets.accounts.push(accountId);
        }
      });

      await runTest('Transaction creation form', async () => {
        await navigateWithinSpa(page, '/transactions', 'Transactions', 'Transactions');

        const { dialog, overlayPane } = await openDialog(page, 'New Transaction', 'Create New Transaction');
        const issues = await collectDialogIssues(dialog, overlayPane, 6);

        await dialog.locator('mat-select[formcontrolname="source_account_id"]').click();
        await page.waitForTimeout(500);
        const sourceOptions = page.getByRole('option');
        const sourceOptionCount = await sourceOptions.count();
        if (sourceOptionCount < 2) {
          await page.keyboard.press('Escape').catch(() => {});
          throw new Error([...issues, `Need at least two account options, found ${sourceOptionCount}`].filter(Boolean).join('; '));
        }

        const destinationAccountName = (await sourceOptions.nth(1).textContent())?.trim() || '';
        await sourceOptions.nth(0).click();
        await selectMaterialOption(page, dialog, 'destination_account_id', new RegExp(escapeRegExp(destinationAccountName)));
        await dialog.locator('input[formcontrolname="amount"]').fill('12.34');
        await dialog.locator('input[formcontrolname="description"]').fill(createdNames.transaction);
        await submitDialog(page, dialog, 'Create Transaction', '/api/v1/transactions');
        await page.getByText(createdNames.transaction, { exact: true }).waitFor({ timeout: 15000 });

        if (issues.length) {
          throw new Error(issues.join('; '));
        }

        const transactionId = await findEntityId(context, 'transactions', (item) => item?.description === createdNames.transaction);
        if (transactionId) {
          cleanupTargets.transactions.push(transactionId);
        }
      });

      await runTest('Budget creation form', async () => {
        await navigateWithinSpa(page, '/budgets', 'Budgets', 'Budgets');

        const { dialog, overlayPane } = await openDialog(page, 'New Budget', 'Create New Budget');
        const issues = await collectDialogIssues(dialog, overlayPane, 3);
        await dialog.locator('input[formcontrolname="name"]').fill(createdNames.budget);
        await submitDialog(page, dialog, 'Create Budget', '/api/v1/budgets');
        await page.getByText(createdNames.budget, { exact: true }).waitFor({ timeout: 15000 });

        if (issues.length) {
          throw new Error(issues.join('; '));
        }

        const budgetId = await findEntityId(context, 'budgets', (item) => item?.name === createdNames.budget);
        if (budgetId) {
          cleanupTargets.budgets.push(budgetId);
        }
      });
    } else {
      pushResult('Account creation form', false, 'Skipped because login failed');
      pushResult('Transaction creation form', false, 'Skipped because login failed');
      pushResult('Budget creation form', false, 'Skipped because login failed');
    }
  } finally {
    await page.screenshot({ path: `${artifactsDir}\\form-dialogs-final-state.png`, fullPage: true }).catch(() => {});
    await bestEffortCleanup(context).catch(() => {});
    await browser.close();
  }

  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;
  const workingForms = results
    .filter((result) => result.passed && result.name !== 'Login')
    .map((result) => result.name.replace(' form', ''));
  const issues = results
    .filter((result) => !result.passed)
    .map((result) => `${result.name}: ${result.reason}`);

  console.log('\nSummary');
  const authMode = loginDetails?.registered ? 'registered fallback' : loginDetails?.directSession ? 'direct session fallback' : 'ui login';
  console.log(`Authentication used: ${loginDetails?.email ? `${authMode} (${loginDetails.email})` : 'none'}`);
  console.log(`Total tests passed: ${passed}`);
  console.log(`Total tests failed: ${failed}`);
  console.log(`Forms working correctly: ${workingForms.join(', ') || 'None'}`);
  console.log(`Issues found: ${issues.join(' | ') || 'None'}`);

  process.exit(failed > 0 ? 1 : 0);
})();
