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
  console.log('\nRunning Updated Registration Page UI & Functional Integration Tests...\n');
  await startServer();

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    // 1. SCENARIO A: Default 3-Day Package Selection
    console.log('Testing Scenario A: Default 3-Day Package Selection...');
    await page.goto(`${baseUrl}/signup`);

    const summaryText = await page.textContent('#subSummaryCard');
    if (!summaryText.includes('3-Day Package — UGX 2,000') || !summaryText.includes('Downloads: Not available')) {
      throw new Error(`FAILED: Incorrect summary text: ${summaryText}`);
    }
    console.log('  ✓ Dynamic summary correctly displays 3-Day Package information (UGX 2,000, no downloads)');

    // 2. SCENARIO B: Royal Premium Selection & Card Payment Option
    console.log('\nTesting Scenario B: Royal Premium Selection...');
    await page.click('#subDropdownTrigger');
    const royalOption = page.locator('.sh-dropdown-item[data-plan="pkg-royal"]');
    await royalOption.click();

    const royalSummaryText = await page.textContent('#subSummaryCard');
    if (!royalSummaryText.includes('Royal Premium — UGX 35,000') || !royalSummaryText.includes('900 MB')) {
      throw new Error(`FAILED: Incorrect royal summary text: ${royalSummaryText}`);
    }
    console.log('  ✓ Dynamic summary correctly updates for Royal Premium (UGX 35,000, 900 MB weekly allowance)');

    // Select Card Payment Option
    await page.click('#paymentDropdownTrigger');
    const cardOption = page.locator('.sh-dropdown-item[data-sector="Card"]');
    await cardOption.click();

    const selectedNetworkTitleText = await page.textContent('#selectedNetworkTitle');
    if (!selectedNetworkTitleText.includes('Bank Card (Mastercard / Visa)')) {
      throw new Error(`FAILED: Card not selected: ${selectedNetworkTitleText}`);
    }
    console.log('  ✓ Bank Card (Mastercard / Visa) payment option selectable in dropdown');

    // Fill form and submit registration with Royal + Card
    await page.fill('#email', 'royaluser@example.com');
    await page.fill('#phone', '256700998877');
    await page.fill('#username', 'royaluser');
    await page.fill('#password', 'secret123');
    await page.fill('#confirmPassword', 'secret123');

    await page.click('#btnSignUpSubmit');

    const royalUserSession = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('sanyuhub_auth_user'));
    });

    if (!royalUserSession || royalUserSession.plan !== 'pkg-royal' || royalUserSession.paymentSector !== 'Card') {
      throw new Error(`FAILED: Invalid session for royal plan: ${JSON.stringify(royalUserSession)}`);
    }
    console.log('  ✓ Royal Premium registration successful with Card payment selected');

    // 3. SCENARIO C: 7-Day and Monthly Selection
    console.log('\nTesting Scenario C: Switching to 7-Day & Monthly...');
    await page.goto(`${baseUrl}/signup`);

    // 7-Day
    await page.click('#subDropdownTrigger');
    await page.locator('.sh-dropdown-item[data-plan="pkg-7day"]').click();
    let sumText = await page.textContent('#subSummaryCard');
    if (!sumText.includes('UGX 6,000') || !sumText.includes('7 days')) {
      throw new Error('FAILED: 7-Day package details mismatch');
    }
    console.log('  ✓ 7-Day package (UGX 6,000) selected and summary updated');

    // Monthly
    await page.click('#subDropdownTrigger');
    await page.locator('.sh-dropdown-item[data-plan="pkg-monthly"]').click();
    sumText = await page.textContent('#subSummaryCard');
    if (!sumText.includes('UGX 12,000') || !sumText.includes('30 days')) {
      throw new Error('FAILED: Monthly package details mismatch');
    }
    console.log('  ✓ Monthly package (UGX 12,000) selected and summary updated');

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
