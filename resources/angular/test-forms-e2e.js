const { chromium } = require('playwright');

const baseUrl = 'http://localhost:8080';
const email = process.env.FIREFLY_EMAIL || 'demo@example.com';
const password = process.env.FIREFLY_PASSWORD || 'demo1234';
const viewport = { width: 1440, height: 1200 };

const testResults = [];

async function test(name, fn) {
  try {
    await fn();
    testResults.push({ test: name, status: 'PASS' });
    console.log(`✅ ${name}`);
  } catch (error) {
    testResults.push({ test: name, status: 'FAIL', error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport });

  try {
    // Login
    console.log('🔐 Logging in...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill(password);
    await Promise.all([
      page.waitForURL('**/dashboard'),
      page.getByRole('button', { name: /sign in/i }).click(),
    ]);
    await page.waitForLoadState('networkidle');
    console.log('✅ Logged in\n');

    // Test 1: Create Account
    await test('Create Account - Dialog Opens', async () => {
      await page.goto(`${baseUrl}/accounts`);
      await page.getByRole('button', { name: /new account/i }).click();
      await page.waitForSelector('.dialog-wrapper', { timeout: 5000 });
    });

    await test('Create Account - Form Fields Present', async () => {
      const fields = await page.locator('mat-form-field').count();
      if (fields < 3) throw new Error(`Expected 3+ form fields, found ${fields}`);
    });

    await test('Create Account - Submit Form', async () => {
      await page.getByLabel('Account Type').click();
      await page.getByRole('option', { name: 'Asset' }).click();
      await page.getByLabel('Account Name').fill('Test Checking Account');
      await page.getByRole('button', { name: /create account/i }).click();
      await page.waitForSelector('.dialog-wrapper', { state: 'hidden', timeout: 10000 });
    });

    await test('Create Account - Data Saved', async () => {
      await page.waitForLoadState('networkidle');
      const accountText = await page.getByText('Test Checking Account').isVisible();
      if (!accountText) throw new Error('Account not visible in list');
    });

    // Test 2: Create Transaction
    await test('Create Transaction - Dialog Opens', async () => {
      await page.goto(`${baseUrl}/transactions`);
      await page.getByRole('button', { name: /new transaction/i }).click();
      await page.waitForSelector('.dialog-wrapper', { timeout: 5000 });
    });

    await test('Create Transaction - Form Fields Present', async () => {
      const fields = await page.locator('mat-form-field').count();
      if (fields < 4) throw new Error(`Expected 4+ form fields, found ${fields}`);
    });

    await test('Create Transaction - Submit Form', async () => {
      await page.getByLabel(/description/i).fill('Test Transaction');
      await page.getByLabel(/amount/i).fill('50.00');
      await page.getByRole('button', { name: /create/i }).click();
      await page.waitForSelector('.dialog-wrapper', { state: 'hidden', timeout: 10000 });
    });

    await test('Create Transaction - Data Saved', async () => {
      await page.waitForLoadState('networkidle');
      const txnText = await page.getByText('Test Transaction').isVisible();
      if (!txnText) throw new Error('Transaction not visible in list');
    });

    // Test 3: Create Budget
    await test('Create Budget - Dialog Opens', async () => {
      await page.goto(`${baseUrl}/budgets`);
      await page.getByRole('button', { name: /new budget/i }).click();
      await page.waitForSelector('.dialog-wrapper', { timeout: 5000 });
    });

    await test('Create Budget - Form Fields Present', async () => {
      const fields = await page.locator('mat-form-field').count();
      if (fields < 3) throw new Error(`Expected 3+ form fields, found ${fields}`);
    });

    await test('Create Budget - Submit Form', async () => {
      await page.getByLabel(/name/i).fill('Test Budget');
      await page.getByLabel(/amount/i).fill('1000.00');
      await page.getByRole('button', { name: /create/i }).click();
      await page.waitForSelector('.dialog-wrapper', { state: 'hidden', timeout: 10000 });
    });

    await test('Create Budget - Data Saved', async () => {
      await page.waitForLoadState('networkidle');
      const budgetText = await page.getByText('Test Budget').isVisible();
      if (!budgetText) throw new Error('Budget not visible in list');
    });

    // Test 4: Dialog Alignment
    await test('Account Dialog - Centered on Screen', async () => {
      await page.goto(`${baseUrl}/accounts`);
      await page.getByRole('button', { name: /new account/i }).click();
      await page.waitForSelector('.dialog-wrapper');
      
      const wrapper = page.locator('.dialog-wrapper');
      const box = await wrapper.boundingBox();
      const centerX = box.x + box.width / 2;
      const expectedCenter = viewport.width / 2;
      const offset = Math.abs(centerX - expectedCenter);
      
      if (offset > 50) throw new Error(`Dialog centered at ${centerX}, expected ~${expectedCenter}`);
    });

    await test('Form Fields - Full Width', async () => {
      const field = page.locator('mat-form-field').first();
      const fieldBox = await field.boundingBox();
      const container = page.locator('.form-content').first();
      const containerBox = await container.boundingBox();
      
      const fieldWidth = fieldBox.width;
      const containerWidth = containerBox.width;
      const ratio = fieldWidth / containerWidth;
      
      if (ratio < 0.80) throw new Error(`Field width ratio ${ratio.toFixed(2)} too low`);
    });

  } finally {
    await browser.close();
  }

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(60));
  
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  
  testResults.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${r.test}`);
    if (r.error) console.log(`   Error: ${r.error}`);
  });
  
  console.log('='.repeat(60));
  console.log(`PASSED: ${passed}/${testResults.length}`);
  console.log(`FAILED: ${failed}/${testResults.length}`);
  console.log('='.repeat(60));
  
  process.exit(failed > 0 ? 1 : 0);
})();
