const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

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

let lastBrowserDialogMessage = null;

function truncate(value, length = 220) {
  if (!value) return '';
  return value.length <= length ? value : `${value.slice(0, length)}...`;
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

async function openDialog(page, buttonLabel, titleText) {
  await page.getByRole('button', { name: new RegExp(buttonLabel, 'i') }).click();
  const dialog = await waitForDialog(page, titleText);
  const overlayPane = page.locator('.cdk-overlay-pane.firefly-dialog-container').last();
  await overlayPane.waitFor({ state: 'visible', timeout: 10000 });
  return { dialog, overlayPane };
}

async function captureFormMetrics(page, dialog, formName) {
  const metrics = {
    formName,
    timestamp: new Date().toISOString(),
    fields: [],
    sections: [],
    buttons: [],
    issues: [],
    dialogDimensions: null,
    contentBox: null,
  };

  try {
    // Get dialog dimensions
    const dialogBox = await dialog.boundingBox();
    if (dialogBox) {
      metrics.dialogDimensions = {
        x: Math.round(dialogBox.x),
        y: Math.round(dialogBox.y),
        width: Math.round(dialogBox.width),
        height: Math.round(dialogBox.height),
      };
    }

    // Get the actual content pane - use the wrapper which is already loaded
    const formContent = dialog.locator('.form-content, .mat-mdc-dialog-content, mat-dialog-content').first();
    const contentBox = await formContent.boundingBox().catch(() => null);
    if (contentBox) {
      metrics.contentBox = {
        x: Math.round(contentBox.x),
        y: Math.round(contentBox.y),
        width: Math.round(contentBox.width),
        height: Math.round(contentBox.height),
      };
    }

    // Analyze form fields using mat-mdc-form-field
    const formFields = dialog.locator('mat-mdc-form-field, mat-form-field');
    const fieldCount = await formFields.count();

    for (let i = 0; i < fieldCount; i++) {
      const field = formFields.nth(i);
      const fieldBox = await field.boundingBox().catch(() => null);
      
      if (fieldBox) {
        // Get label
        const labelElement = field.locator('label, mat-label').first();
        const labelText = (await labelElement.textContent().catch(() => '')).trim();

        // Get input type and properties
        const inputElement = field.locator('input, mat-select, textarea').first();
        const inputTag = await inputElement.evaluate((el) => el ? el.tagName.toLowerCase() : 'unknown').catch(() => 'unknown');
        const inputType = await inputElement.evaluate((el) => el ? (el.getAttribute('type') || 'text') : 'text').catch(() => 'text');
        const formControlName = await inputElement.evaluate((el) => el ? (el.getAttribute('formcontrolname') || '') : '').catch(() => '');
        
        // Get input box
        const inputBox = await inputElement.boundingBox().catch(() => null);
        const inputWidth = inputBox ? Math.round(inputBox.width) : 0;
        const inputHeight = inputBox ? Math.round(inputBox.height) : 0;

        // Get label positioning
        const labelBox = await labelElement.boundingBox().catch(() => null);
        const labelPosition = labelBox ? {
          x: Math.round(labelBox.x),
          y: Math.round(labelBox.y),
          width: Math.round(labelBox.width),
          height: Math.round(labelBox.height),
        } : null;

        // Calculate label-to-input alignment
        let labelAlignment = 'unknown';
        if (labelBox && inputBox) {
          const gapX = Math.round(inputBox.x - (labelBox.x + labelBox.width));
          const gapY = Math.round(inputBox.y - (labelBox.y + labelBox.height));
          
          if (Math.abs(inputBox.y - labelBox.y) < 5) {
            labelAlignment = `side-by-side (gap: ${gapX}px)`;
          } else if (inputBox.y > labelBox.y + labelBox.height) {
            labelAlignment = `above (gap: ${gapY}px)`;
          }
        }

        // Check for errors
        const errorElement = field.locator('.mat-mdc-form-field-error, .mat-error').first();
        const hasError = await errorElement.isVisible().catch(() => false);
        const errorText = hasError ? (await errorElement.textContent().catch(() => '')).trim() : '';

        // Check if required
        const isRequired = await inputElement.evaluate((el) => el ? (el.hasAttribute('required') || el.getAttribute('aria-required') === 'true') : false).catch(() => false);

        metrics.fields.push({
          index: i + 1,
          label: labelText,
          formControlName,
          type: inputTag === 'mat-select' ? 'select' : (inputTag === 'textarea' ? 'textarea' : inputType),
          width: inputWidth,
          height: inputHeight,
          fieldContainerDimensions: {
            width: Math.round(fieldBox.width),
            height: Math.round(fieldBox.height),
            x: Math.round(fieldBox.x),
            y: Math.round(fieldBox.y),
          },
          labelPosition,
          labelAlignment,
          isRequired,
          hasError,
          errorText,
        });
      }
    }

    // Analyze form sections
    const sections = dialog.locator('mat-form-field-group, fieldset, .form-section, [role="group"]');
    const sectionCount = await sections.count().catch(() => 0);
    for (let i = 0; i < sectionCount; i++) {
      try {
        const section = sections.nth(i);
        const sectionBox = await section.boundingBox().catch(() => null);
        if (sectionBox) {
          metrics.sections.push({
            index: i + 1,
            dimensions: {
              width: Math.round(sectionBox.width),
              height: Math.round(sectionBox.height),
              x: Math.round(sectionBox.x),
              y: Math.round(sectionBox.y),
            },
          });
        }
      } catch (e) {
        // Continue if section analysis fails
      }
    }

    // Analyze buttons
    const buttons = dialog.locator('button:visible');
    const buttonCount = await buttons.count().catch(() => 0);
    for (let i = 0; i < buttonCount; i++) {
      try {
        const button = buttons.nth(i);
        const buttonBox = await button.boundingBox().catch(() => null);
        const buttonText = (await button.textContent().catch(() => '')).trim();
        const isDisabled = await button.evaluate((el) => el ? (el.hasAttribute('disabled') || el.classList.contains('disabled')) : false).catch(() => false);
        const ariaLabel = await button.getAttribute('aria-label').catch(() => '');

        if (buttonBox) {
          metrics.buttons.push({
            index: i + 1,
            label: buttonText || ariaLabel || 'Unlabeled',
            width: Math.round(buttonBox.width),
            height: Math.round(buttonBox.height),
            x: Math.round(buttonBox.x),
            y: Math.round(buttonBox.y),
            disabled: isDisabled,
          });
        }
      } catch (e) {
        // Continue if button analysis fails
      }
    }

    // Detect alignment issues
    const issues = [];

    if (metrics.fields.length > 1) {
      // Check field width consistency
      const widths = metrics.fields.map((f) => f.width);
      const minWidth = Math.min(...widths);
      const maxWidth = Math.max(...widths);
      const widthVariance = maxWidth - minWidth;

      if (widthVariance > 20) {
        issues.push(`Field width inconsistency: ${minWidth}px to ${maxWidth}px (variance: ${widthVariance}px)`);
      }

      // Check field alignment
      const xPositions = metrics.fields.map((f) => f.fieldContainerDimensions.x);
      const minX = Math.min(...xPositions);
      const maxX = Math.max(...xPositions);
      if (maxX - minX > 10) {
        issues.push(`Fields not vertically aligned: X positions vary from ${minX}px to ${maxX}px`);
      }

      // Check vertical spacing
      const yPositions = metrics.fields.map((f) => f.fieldContainerDimensions.y);
      const spacings = [];
      for (let i = 1; i < yPositions.length; i++) {
        const prevFieldHeight = metrics.fields[i - 1].fieldContainerDimensions.height;
        const spacing = yPositions[i] - (yPositions[i - 1] + prevFieldHeight);
        spacings.push(spacing);
      }
      
      if (spacings.length > 0) {
        const avgSpacing = spacings.reduce((a, b) => a + b) / spacings.length;
        const spacingVariance = Math.max(...spacings) - Math.min(...spacings);
        if (spacingVariance > 10) {
          issues.push(`Inconsistent vertical spacing: ${Math.min(...spacings)}px to ${Math.max(...spacings)}px (average: ${Math.round(avgSpacing)}px)`);
        }
      }
    }

    // Check for label positioning issues
    const labelAlignments = metrics.fields.map((f) => f.labelAlignment);
    const uniqueAlignments = [...new Set(labelAlignments)];
    if (uniqueAlignments.length > 1) {
      issues.push(`Mixed label alignment: ${uniqueAlignments.join(', ')}`);
    }

    // Check for oversized/undersized fields
    metrics.fields.forEach((field) => {
      if (field.width < 200) {
        issues.push(`Field "${field.label}" is narrow (${field.width}px)`);
      }
      if (field.height < 32) {
        issues.push(`Field "${field.label}" is short (${field.height}px)`);
      }
    });

    // Check button alignment
    if (metrics.buttons.length > 1) {
      const buttonXPositions = metrics.buttons.map((b) => b.x);
      const minBtnX = Math.min(...buttonXPositions);
      const maxBtnX = Math.max(...buttonXPositions);
      if (maxBtnX - minBtnX > 10) {
        issues.push(`Buttons not horizontally aligned: X positions vary from ${minBtnX}px to ${maxBtnX}px`);
      }

      const buttonHeights = metrics.buttons.map((b) => b.height);
      const minBtnHeight = Math.min(...buttonHeights);
      const maxBtnHeight = Math.max(...buttonHeights);
      if (maxBtnHeight - minBtnHeight > 5) {
        issues.push(`Button heights inconsistent: ${minBtnHeight}px to ${maxBtnHeight}px`);
      }
    }

    metrics.issues = issues;

  } catch (error) {
    metrics.issues.push(`Error during metric collection: ${error.message}`);
  }

  return metrics;
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
      for (const checkPath of ['/api/csrf-token', '/csrf-token']) {
        try {
          const response = await context.request.get(`${baseUrl}${checkPath}`, { failOnStatusCode: false });
          csrfChecks.push(`${checkPath}:${response.status()}`);
        } catch (error) {
          csrfChecks.push(`${checkPath}:ERR ${error.message}`);
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

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: baseUrl, viewport });
  const page = await context.newPage();

  page.on('dialog', async (dialog) => {
    lastBrowserDialogMessage = dialog.message();
    await dialog.dismiss();
  });

  const artifactsDir = 'playwright-artifacts';
  const reportData = {
    generatedAt: new Date().toISOString(),
    viewport,
    baseUrl,
    forms: {
      accountForm: null,
      transactionForm: null,
      budgetForm: null,
    },
  };

  try {
    // Login
    console.log('Logging in...');
    await ensureLogin(page, context);
    console.log('✅ Login successful');

    // Account Form
    console.log('\nCapturing Account Creation Form...');
    await navigateWithinSpa(page, '/accounts', 'Accounts', 'Accounts');
    const { dialog: accountDialog } = await openDialog(page, 'New Account', 'Create New Account');
    
    // Take screenshot of account form
    await accountDialog.screenshot({ path: path.join(artifactsDir, 'form-account-creation.png') });
    console.log('📸 Screenshot: form-account-creation.png');

    // Capture metrics
    const accountMetrics = await captureFormMetrics(page, accountDialog, 'Account Creation');
    reportData.forms.accountForm = accountMetrics;
    console.log(`✅ Captured ${accountMetrics.fields.length} fields`);

    // Close dialog
    await page.keyboard.press('Escape').catch(() => {});

    // Transaction Form
    console.log('\nCapturing Transaction Creation Form...');
    await navigateWithinSpa(page, '/transactions', 'Transactions', 'Transactions');
    const { dialog: transactionDialog } = await openDialog(page, 'New Transaction', 'Create New Transaction');
    
    // Take screenshot of transaction form
    await transactionDialog.screenshot({ path: path.join(artifactsDir, 'form-transaction-creation.png') });
    console.log('📸 Screenshot: form-transaction-creation.png');

    // Capture metrics
    const transactionMetrics = await captureFormMetrics(page, transactionDialog, 'Transaction Creation');
    reportData.forms.transactionForm = transactionMetrics;
    console.log(`✅ Captured ${transactionMetrics.fields.length} fields`);

    // Close dialog
    await page.keyboard.press('Escape').catch(() => {});

    // Budget Form
    console.log('\nCapturing Budget Creation Form...');
    await navigateWithinSpa(page, '/budgets', 'Budgets', 'Budgets');
    const { dialog: budgetDialog } = await openDialog(page, 'New Budget', 'Create New Budget');
    
    // Take screenshot of budget form
    await budgetDialog.screenshot({ path: path.join(artifactsDir, 'form-budget-creation.png') });
    console.log('📸 Screenshot: form-budget-creation.png');

    // Capture metrics
    const budgetMetrics = await captureFormMetrics(page, budgetDialog, 'Budget Creation');
    reportData.forms.budgetForm = budgetMetrics;
    console.log(`✅ Captured ${budgetMetrics.fields.length} fields`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }

  // Save report
  const reportPath = path.join(artifactsDir, 'form-alignment-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);

  // Print summary
  console.log('\n=== FORM ALIGNMENT REPORT SUMMARY ===\n');
  
  Object.entries(reportData.forms).forEach(([formKey, metrics]) => {
    if (metrics) {
      console.log(`${metrics.formName}:`);
      console.log(`  Fields: ${metrics.fields.length}`);
      console.log(`  Sections: ${metrics.sections.length}`);
      console.log(`  Buttons: ${metrics.buttons.length}`);
      
      if (metrics.issues.length > 0) {
        console.log(`  ⚠️  Issues Found (${metrics.issues.length}):`);
        metrics.issues.forEach((issue) => {
          console.log(`      - ${issue}`);
        });
      } else {
        console.log(`  ✅ No alignment issues detected`);
      }
      
      console.log(`  Dialog Dimensions: ${metrics.dialogDimensions?.width}px × ${metrics.dialogDimensions?.height}px`);
      console.log('');
    }
  });

  process.exit(0);
})();
