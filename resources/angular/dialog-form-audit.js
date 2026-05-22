const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const baseUrl = (process.env.FIREFLY_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const loginEmail = process.env.FIREFLY_EMAIL || process.env.PLAYWRIGHT_FIREFLY_EMAIL || '';
const loginPassword = process.env.FIREFLY_PASSWORD || process.env.PLAYWRIGHT_FIREFLY_PASSWORD || '';
const sessionCookie = process.env.FIREFLY_SESSION_COOKIE || '';
const headless = process.env.HEADLESS !== 'false';
const viewport = {
  width: Number(process.env.PLAYWRIGHT_VIEWPORT_WIDTH || 1440),
  height: Number(process.env.PLAYWRIGHT_VIEWPORT_HEIGHT || 1200),
};
const timestamp = new Date().toISOString().replace(/[.:]/g, '-');
const outputDir = path.join(__dirname, 'playwright-artifacts', `dialog-audit-${timestamp}`);

const dialogs = [
  {
    name: 'Account',
    route: '/accounts',
    navName: /accounts/i,
    buttonName: /new account/i,
    heading: 'Create New Account',
    screenshot: 'account-dialog.png',
  },
  {
    name: 'Transaction',
    route: '/transactions',
    navName: /transactions/i,
    buttonName: /new transaction/i,
    heading: 'Create New Transaction',
    screenshot: 'transaction-dialog.png',
  },
  {
    name: 'Budget',
    route: '/budgets',
    navName: /budgets/i,
    buttonName: /new budget/i,
    heading: 'Create New Budget',
    screenshot: 'budget-dialog.png',
  },
];

function round(value) {
  return Number(value.toFixed(2));
}

function boolLabel(value) {
  return value ? 'Yes' : 'No';
}

async function seedClientSession(context) {
  await context.addInitScript(() => {
    localStorage.setItem('firefly_token', 'session');
    localStorage.setItem(
      'firefly_user',
      JSON.stringify({
        id: '1',
        email: 'playwright@local.test',
        name: 'Playwright Audit',
        role: 'user',
      })
    );
  });

  if (!sessionCookie) {
    return;
  }

  await context.addCookies([
    {
      name: 'firefly_iii_session',
      value: sessionCookie,
      domain: new URL(baseUrl).hostname,
      path: '/',
      httpOnly: true,
      secure: baseUrl.startsWith('https://'),
      sameSite: 'Lax',
    },
  ]);
}

async function ensureAuthenticated(page) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});

  if (!page.url().includes('/login') && !(await page.getByRole('button', { name: /sign in/i }).isVisible().catch(() => false))) {
    return;
  }

  if (!loginEmail || !loginPassword) {
    throw new Error(
      'Authentication is required. Set FIREFLY_EMAIL and FIREFLY_PASSWORD before running this audit.'
    );
  }

  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel(/email address/i).fill(loginEmail);
  await page.getByLabel(/^password$/i).fill(loginPassword);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 30000 }),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);
}

async function navigateToSection(page, config) {
  if (!page.url().includes('/dashboard')) {
    await ensureAuthenticated(page);
  }

  if (page.url().includes(config.route)) {
    return;
  }

  const navLink = page.getByRole('link', { name: config.navName }).first();
  await navLink.waitFor({ state: 'visible', timeout: 30000 });
  await Promise.all([
    page.waitForURL((url) => url.pathname === config.route, { timeout: 30000 }),
    navLink.click(),
  ]);
  await page.waitForLoadState('networkidle').catch(() => {});
}

async function openDialog(page, config) {
  await ensureAuthenticated(page);
  await navigateToSection(page, config);

  const button = page.getByRole('button', { name: config.buttonName }).first();
  await button.waitFor({ state: 'visible', timeout: 30000 });
  await button.click();
  await page.waitForTimeout(500);

  const heading = page.getByRole('heading', { name: config.heading }).last();
  await heading.waitFor({ state: 'visible', timeout: 30000 });

  const wrapper = page.locator('.dialog-wrapper').last();
  await wrapper.waitFor({ state: 'visible', timeout: 30000 });

  return {
    heading,
    wrapper,
    formContent: wrapper.locator('.form-content').first(),
    fields: wrapper.locator('.mat-mdc-form-field'),
    materialSurface: page.locator('.cdk-overlay-pane .mat-mdc-dialog-surface').last(),
    backdrop: page.locator('.cdk-overlay-backdrop').last(),
  };
}

async function collectMetrics(page, locators) {
  const wrapperBox = await locators.wrapper.boundingBox();
  const contentBox = await locators.formContent.boundingBox();

  if (!wrapperBox || !contentBox) {
    throw new Error('Dialog metrics could not be captured.');
  }

  const fieldBoxes = await locators.fields.evaluateAll((elements) =>
    elements
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      })
  );

  const materialInfo = await page.evaluate(() => {
    const surface = document.querySelector('.cdk-overlay-pane .mat-mdc-dialog-surface:last-of-type');
    const backdrop = document.querySelector('.cdk-overlay-backdrop');
    const style = surface ? window.getComputedStyle(surface) : null;

    return {
      hasMaterialSurface: Boolean(surface),
      hasBackdrop: Boolean(backdrop),
      borderRadius: style ? style.borderRadius : null,
      boxShadow: style ? style.boxShadow : null,
      backgroundColor: style ? style.backgroundColor : null,
    };
  });

  const viewportCenterX = viewport.width / 2;
  const viewportCenterY = viewport.height / 2;
  const dialogCenterX = wrapperBox.x + wrapperBox.width / 2;
  const dialogCenterY = wrapperBox.y + wrapperBox.height / 2;
  const centerOffsetX = dialogCenterX - viewportCenterX;
  const centerOffsetY = dialogCenterY - viewportCenterY;
  const centered = Math.abs(centerOffsetX) <= Math.max(24, viewport.width * 0.03)
    && Math.abs(centerOffsetY) <= Math.max(36, viewport.height * 0.04);

  const widths = fieldBoxes.map((field) => field.width);
  const lefts = fieldBoxes.map((field) => field.left);
  const rights = fieldBoxes.map((field) => field.right);
  const averageFieldWidth = widths.length ? widths.reduce((sum, value) => sum + value, 0) / widths.length : 0;
  const minFieldWidth = widths.length ? Math.min(...widths) : 0;
  const maxFieldWidth = widths.length ? Math.max(...widths) : 0;
  const fieldWidthRatio = contentBox.width ? averageFieldWidth / contentBox.width : 0;
  const minFieldWidthRatio = contentBox.width ? minFieldWidth / contentBox.width : 0;
  const alignedLeftVariance = lefts.length ? Math.max(...lefts) - Math.min(...lefts) : 0;
  const alignedRightVariance = rights.length ? Math.max(...rights) - Math.min(...rights) : 0;
  const fieldsAligned = alignedLeftVariance <= 8 && alignedRightVariance <= 8;
  const fullWidthFields = minFieldWidthRatio >= 0.88;

  let topWhitespace = 0;
  let bottomWhitespace = 0;
  let maxGap = 0;

  if (fieldBoxes.length) {
    topWhitespace = fieldBoxes[0].top - contentBox.y;
    bottomWhitespace = contentBox.y + contentBox.height - fieldBoxes[fieldBoxes.length - 1].bottom;
    for (let index = 1; index < fieldBoxes.length; index += 1) {
      const gap = fieldBoxes[index].top - fieldBoxes[index - 1].bottom;
      if (gap > maxGap) {
        maxGap = gap;
      }
    }
  }

  const excessiveWhitespace = topWhitespace > 48 || bottomWhitespace > 72 || maxGap > 40;
  const issues = [];

  if (!centered) {
    issues.push('Dialog is offset from the viewport center.');
  }
  if (!fieldsAligned) {
    issues.push('Form fields do not share a consistent left/right alignment.');
  }
  if (!fullWidthFields) {
    issues.push('One or more form fields are not using the full dialog content width.');
  }
  if (excessiveWhitespace) {
    issues.push('Whitespace inside the form content exceeds the expected Material spacing.');
  }
  if (!materialInfo.hasMaterialSurface || !materialInfo.hasBackdrop) {
    issues.push('Material dialog shell/backdrop was not detected as expected.');
  }

  return {
    centered,
    fieldsAligned: fieldsAligned && fullWidthFields,
    layoutIssues: issues,
    metrics: {
      viewport,
      dialog: {
        left: round(wrapperBox.x),
        top: round(wrapperBox.y),
        width: round(wrapperBox.width),
        height: round(wrapperBox.height),
        centerOffsetX: round(centerOffsetX),
        centerOffsetY: round(centerOffsetY),
      },
      form: {
        fieldCount: fieldBoxes.length,
        averageFieldWidth: round(averageFieldWidth),
        minFieldWidth: round(minFieldWidth),
        maxFieldWidth: round(maxFieldWidth),
        averageFieldWidthRatio: round(fieldWidthRatio),
        minFieldWidthRatio: round(minFieldWidthRatio),
        leftVariance: round(alignedLeftVariance),
        rightVariance: round(alignedRightVariance),
      },
      spacing: {
        topWhitespace: round(topWhitespace),
        bottomWhitespace: round(bottomWhitespace),
        maxVerticalGap: round(maxGap),
      },
      materialAppearance: materialInfo,
    },
  };
}

async function closeDialog(page) {
  const closeButton = page.locator('.dialog-wrapper .close-btn').last();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
    await page.locator('.dialog-wrapper').waitFor({ state: 'hidden', timeout: 30000 });
    return;
  }

  await page.keyboard.press('Escape');
  await page.locator('.dialog-wrapper').waitFor({ state: 'hidden', timeout: 30000 });
}

function printSummary(results, reportPath) {
  console.log(`Dialog audit report saved to ${reportPath}`);
  for (const result of results) {
    console.log(`\n${result.name}`);
    console.log(`  Centered: ${boolLabel(result.centered)}`);
    console.log(`  Fields aligned/full width: ${boolLabel(result.fieldsAligned)}`);
    console.log(
      `  Metrics: offsetX=${result.metrics.dialog.centerOffsetX}px, offsetY=${result.metrics.dialog.centerOffsetY}px, fieldWidthRatio=${result.metrics.form.averageFieldWidthRatio}, minFieldWidthRatio=${result.metrics.form.minFieldWidthRatio}, topWhitespace=${result.metrics.spacing.topWhitespace}px, bottomWhitespace=${result.metrics.spacing.bottomWhitespace}px, maxGap=${result.metrics.spacing.maxVerticalGap}px`
    );
    console.log(`  Screenshot: ${result.screenshot}`);
    console.log(`  Layout issues: ${result.layoutIssues.length ? result.layoutIssues.join(' ') : 'None detected.'}`);
  }
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({ viewport });
  await seedClientSession(context);
  const page = await context.newPage();
  const results = [];

  try {
    for (const dialog of dialogs) {
      const locators = await openDialog(page, dialog);
      const screenshotPath = path.join(outputDir, dialog.screenshot);
      await locators.wrapper.screenshot({ path: screenshotPath });
      const report = await collectMetrics(page, locators);
      results.push({
        name: dialog.name,
        route: `${baseUrl}${dialog.route}`,
        screenshot: screenshotPath,
        ...report,
      });
      await closeDialog(page);
    }

    const reportPath = path.join(outputDir, 'dialog-layout-report.json');
    fs.writeFileSync(reportPath, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
    printSummary(results, reportPath);
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  console.error(`Dialog audit failed: ${error.message}`);
  process.exitCode = 1;
});
