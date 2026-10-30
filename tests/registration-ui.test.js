const { chromium } = require('playwright');
const express = require('express');
const path = require('path');
const http = require('http');

let server;
let baseUrl;
const PORT = 3098;

function startServer() {
  return new Promise((resolve) => {
    const app = express();
    app.use(express.static(path.join(__dirname, '..')));

    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'signup.html'));
    });

    server = http.createServer(app);
    server.listen(PORT, () => {
      baseUrl = `http://localhost:${PORT}`;
      console.log(`Registration test server running at ${baseUrl}`);
      resolve();
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
}

async function runTests() {
  console.log('\nRunning Registration Page UI & Functional Integration Tests...\n');
  await startServer();

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    // 1. SCENARIO A: Default Free Trial Selection
    console.log('Testing Scenario A: Default Free Trial Selection...');
    await page.goto(`${baseUrl}/signup`);

    const paymentSectionVisibleInitially = await page.isVisible('#paymentSectorSection');
    if (paymentSectionVisibleInitially) {
      throw new Error('FAILED: Payment network section should be hidden when Free Trial is selected!');
    }
    console.log('  ✓ Payment network selector is hidden on initial load (Free Trial active)');

    const summaryText = await page.textContent('#subSummaryCard');
    if (!summaryText.includes('2 Days Free Trial — FREE') || !summaryText.includes('No payment required today')) {
      throw new Error(`FAILED: Incorrect summary text: ${summaryText}`);
    }
    console.log('  ✓ Dynamic summary correctly displays 2 Days Free Trial information');

    // Fill form and register with Free Trial
    await page.fill('#email', 'testtrial@example.com');
    await page.fill('#phone', '256700112233');
    await page.fill('#username', 'testtrialuser');
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'password123');

    await page.click('#btnSignUpSubmit');

    const trialUserSession = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('sanyuhub_auth_user'));
    });

    if (!trialUserSession || !trialUserSession.isTrial || trialUserSession.plan !== 'trial') {
      throw new Error(`FAILED: Invalid session for free trial: ${JSON.stringify(trialUserSession)}`);
    }
    console.log('  ✓ Free trial user registration successful without payment required');

    // 2. SCENARIO B: Monthly Plan Selection & Payment Network Selection
    console.log('\nTesting Scenario B: Monthly Plan Selection...');
    await page.goto(`${baseUrl}/signup`);

    // Click subscription dropdown trigger
    await page.click('#subDropdownTrigger');
    const monthlyOption = page.locator('.sh-dropdown-item[data-plan="monthly"]');
    await monthlyOption.click();

    const paymentSectionVisibleMonthly = await page.isVisible('#paymentSectorSection');
    if (!paymentSectionVisibleMonthly) {
      throw new Error('FAILED: Payment network section should be visible when Monthly Plan is selected!');
    }
    console.log('  ✓ Payment network selector appears dynamically when Monthly Plan is selected');

    const monthlySummaryText = await page.textContent('#subSummaryCard');
    if (!monthlySummaryText.includes('Monthly Subscription — 12,000 UGX') || !monthlySummaryText.includes('30 days of unlimited access')) {
      throw new Error(`FAILED: Incorrect monthly summary text: ${monthlySummaryText}`);
    }
    console.log('  ✓ Dynamic summary correctly updates for Monthly Subscription');

    // Open payment network dropdown and select Airtel Money
    await page.click('#paymentDropdownTrigger');
    const airtelOption = page.locator('.sh-dropdown-item[data-sector="Airtel"]');
    await airtelOption.click();

    const selectedNetworkTitleText = await page.textContent('#selectedNetworkTitle');
    if (!selectedNetworkTitleText.includes('Airtel Money')) {
      throw new Error(`FAILED: Airtel Money not selected: ${selectedNetworkTitleText}`);
    }
    console.log('  ✓ Airtel Money payment network selection updated trigger UI');

    // Fill form and submit monthly registration
    await page.fill('#email', 'testmonthly@example.com');
    await page.fill('#phone', '256700998877');
    await page.fill('#username', 'testmonthlyuser');
    await page.fill('#password', 'secret123');
    await page.fill('#confirmPassword', 'secret123');

    await page.click('#btnSignUpSubmit');

    const monthlyUserSession = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('sanyuhub_auth_user'));
    });

    if (!monthlyUserSession || monthlyUserSession.isTrial !== false || monthlyUserSession.plan !== 'monthly' || monthlyUserSession.paymentSector !== 'Airtel') {
      throw new Error(`FAILED: Invalid session for monthly plan: ${JSON.stringify(monthlyUserSession)}`);
    }
    console.log('  ✓ Monthly subscription registration successful with Airtel Money selected');

    // 3. SCENARIO C: Dynamic Switching between Monthly and Free Trial
    console.log('\nTesting Scenario C: Switching Plans...');
    await page.goto(`${baseUrl}/signup`);

    // Switch to Monthly Plan
    await page.click('#subDropdownTrigger');
    await page.locator('.sh-dropdown-item[data-plan="monthly"]').click();
    if (!(await page.isVisible('#paymentSectorSection'))) {
      throw new Error('FAILED: Payment section should be visible for Monthly Plan');
    }

    // Switch back to Free Trial
    await page.click('#subDropdownTrigger');
    await page.locator('.sh-dropdown-item[data-plan="trial"]').click();

    if (await page.isVisible('#paymentSectorSection')) {
      throw new Error('FAILED: Payment section should be hidden after switching back to Free Trial!');
    }
    console.log('  ✓ Switching back to Free Trial correctly hides payment network selector');

    // 4. SCENARIO D: Validation Errors
    console.log('\nTesting Scenario D: Form Validation Errors...');
    await page.goto(`${baseUrl}/signup`);

    // Missing fields
    await page.click('#btnSignUpSubmit');
    let errorMsgText = await page.textContent('#errorMsg');
    if (!errorMsgText.includes('Please fill in all required fields')) {
      throw new Error(`FAILED: Expected required fields error, got: ${errorMsgText}`);
    }
    console.log('  ✓ Missing fields validation works');

    // Short password
    await page.fill('#email', 'val@example.com');
    await page.fill('#phone', '256700111222');
    await page.fill('#username', 'valuser');
    await page.fill('#password', '12345');
    await page.fill('#confirmPassword', '12345');
    await page.click('#btnSignUpSubmit');

    errorMsgText = await page.textContent('#errorMsg');
    if (!errorMsgText.includes('Password must be at least 6 characters')) {
      throw new Error(`FAILED: Expected short password error, got: ${errorMsgText}`);
    }
    console.log('  ✓ Short password validation works');

    // Password mismatch
    await page.fill('#password', '123456');
    await page.fill('#confirmPassword', '654321');
    await page.click('#btnSignUpSubmit');

    errorMsgText = await page.textContent('#errorMsg');
    if (!errorMsgText.includes('Passwords do not match')) {
      throw new Error(`FAILED: Expected password mismatch error, got: ${errorMsgText}`);
    }
    console.log('  ✓ Password mismatch validation works');

    // 5. MOBILE RESPONSIVENESS & OVERFLOW VERIFICATION
    console.log('\nTesting Mobile Responsiveness (iPhone SE 375x667 & Android 412x915)...');
    for (const viewport of [{ width: 375, height: 667 }, { width: 412, height: 915 }]) {
      const mobContext = await browser.newContext({ viewport });
      const mobPage = await mobContext.newPage();
      await mobPage.goto(`${baseUrl}/signup`);

      const hasOverflow = await mobPage.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasOverflow) {
        throw new Error(`FAILED: Horizontal overflow detected on viewport ${viewport.width}x${viewport.height}`);
      }
      console.log(`  ✓ Mobile Viewport ${viewport.width}x${viewport.height}: Zero horizontal overflow`);
      await mobContext.close();
    }

    console.log('\n========================================');
    console.log('ALL REGISTRATION TESTS PASSED SUCCESSFULLY!');
    console.log('========================================\n');

  } catch (err) {
    console.error('\nTEST FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
    await stopServer();
  }
}

runTests();
