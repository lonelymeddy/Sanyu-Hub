const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3096;
const BASE_URL = `http://localhost:${PORT}`;

(async () => {
  console.log('Running Profile, Admin Panel & Payment Instructions Integration Tests...');

  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: PORT.toString() }
  });

  await new Promise((resolve) => {
    serverProcess.stdout.on('data', (d) => {
      if (d.toString().includes('SanyuHub web service running')) {
        resolve();
      }
    });
    setTimeout(resolve, 2500);
  });

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let hasError = false;

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Test Regular User Profile & Sign Out
    console.log('Testing Regular User Profile & Sign Out...');
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('sanyuhub_auth_user', JSON.stringify({
        email: 'regularuser@example.com',
        phone: '256770000000',
        username: 'RegularUser',
        isAdmin: false,
        paymentSector: 'MTN',
        plan: 'trial',
        isTrial: true,
        subscriptionExpiry: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      }));
    });

    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded' });
    const profileUser = await page.$eval('#profileUsername', el => el.textContent);
    if (!profileUser.includes('RegularUser')) {
      throw new Error(`Profile username expected RegularUser but got ${profileUser}`);
    }

    // Admin section should NOT be visible for regular user
    const adminSectionHidden = await page.$eval('#adminProfileSection', el => el.style.display);
    if (adminSectionHidden !== 'none') {
      throw new Error(`Expected adminProfileSection to be hidden for regular user, got display: ${adminSectionHidden}`);
    }
    console.log('  ✓ Regular user profile loaded and admin section properly hidden');

    // Test Sign Out button
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await page.click('#btnSignOut');
    await page.waitForTimeout(500);

    const afterLogoutUser = await page.evaluate(() => localStorage.getItem('sanyuhub_auth_user'));
    if (afterLogoutUser !== null) {
      throw new Error(`Expected auth storage to be cleared after logout, but found: ${afterLogoutUser}`);
    }
    if (!page.url().includes('/login')) {
      throw new Error(`Expected redirect to /login after logout, but current URL is ${page.url()}`);
    }
    console.log('  ✓ Sign out properly clears auth session and redirects to /login');

    // 2. Test Payment Instructions Page & Renewal flow
    console.log('Testing Payment Page and Profile Renewal Flow...');
    // Set user back
    await page.evaluate(() => {
      localStorage.setItem('sanyuhub_auth_user', JSON.stringify({
        email: 'regularuser@example.com',
        phone: '256770000000',
        username: 'RegularUser',
        isAdmin: false,
        paymentSector: 'MTN',
        plan: 'monthly',
        isTrial: false,
        subscriptionExpiry: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      }));
    });

    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded' });
    await page.click('#openRenewModalBtn');
    await page.waitForSelector('#renewalModal.active');
    await page.click('#confirmRenewBtn');
    await page.waitForTimeout(500);

    if (!page.url().includes('/payment')) {
      throw new Error(`Expected click renew to direct to /payment, got ${page.url()}`);
    }

    // Verify payment instructions content
    const adminDisplay = await page.$eval('#adminPhoneNumberDisplay', el => el.textContent);
    if (!adminDisplay.includes('256702662846')) {
      throw new Error(`Expected payment page to display admin phone 256702662846, got ${adminDisplay}`);
    }

    const callLink = await page.$eval('#btnCallAdmin', el => el.getAttribute('href'));
    if (callLink !== 'tel:256702662846') {
      throw new Error(`Expected call button href to be tel:256702662846, got ${callLink}`);
    }

    const whatsappLink = await page.$eval('#btnWhatsappAdmin', el => el.getAttribute('href'));
    if (!whatsappLink.includes('256702662846')) {
      throw new Error(`Expected whatsapp button href to include 256702662846, got ${whatsappLink}`);
    }
    console.log('  ✓ Payment page correctly displays admin contact 256702662846 and call/whatsapp links');

    // 3. Test Admin Access Control & Overview Panel
    console.log('Testing Admin Access Control & Admin Overview...');
    // Non-admin attempting to view /admin
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    const accessDeniedVisible = await page.$eval('#accessDenied', el => el.style.display);
    if (accessDeniedVisible === 'none') {
      throw new Error('Expected access denied to be visible for non-admin on /admin');
    }
    console.log('  ✓ Non-admin is blocked from admin panel with Access Restricted message');

    // Set logged-in user as Admin: delostvoyage@gmail.com (256702662846)
    await page.evaluate(() => {
      localStorage.setItem('sanyuhub_auth_user', JSON.stringify({
        email: 'delostvoyage@gmail.com',
        phone: '256702662846',
        username: 'AdminDelost',
        isAdmin: true,
        paymentSector: 'MTN',
        plan: 'monthly',
        isTrial: false,
        subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }));
    });

    // Profile check for Admin
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded' });
    const adminBadgeText = await page.$eval('#subTypeBadge', el => el.textContent);
    if (!adminBadgeText.includes('ADMINISTRATOR')) {
      throw new Error(`Expected profile badge to be ADMINISTRATOR, got ${adminBadgeText}`);
    }
    const adminSectionDisplay = await page.$eval('#adminProfileSection', el => el.style.display);
    if (adminSectionDisplay === 'none') {
      throw new Error('Expected adminProfileSection to be displayed for admin user');
    }
    console.log('  ✓ Profile displays ADMINISTRATOR badge and admin panel navigation for admin user');

    // More page check for Admin
    await page.goto(`${BASE_URL}/more`, { waitUntil: 'domcontentloaded' });
    const moreAdminVisible = await page.$eval('#moreAdminLink', el => el.style.display);
    if (moreAdminVisible === 'none') {
      throw new Error('Expected moreAdminLink to be visible in /more for admin user');
    }
    console.log('  ✓ More page shows Admin Panel shortcut card for admin');

    // Admin Dashboard check
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    const adminContentDisplay = await page.$eval('#adminContent', el => el.style.display);
    if (adminContentDisplay === 'none') {
      throw new Error('Expected adminContent to be displayed on /admin for admin');
    }

    // Verify user manually
    await page.fill('#verifyUserIdentifier', 'testcustomer@gmail.com');
    await page.selectOption('#verifyDurationDays', '30');
    await page.selectOption('#verifyPaymentMethod', 'MTN');
    await page.fill('#verifyTxId', 'TXN99887766');

    await page.click('#btnVerifySubmit');
    await page.waitForTimeout(500);

    const verifiedContent = await page.$eval('#verifiedTableBody', el => el.textContent);
    if (!verifiedContent.includes('testcustomer@gmail.com') || !verifiedContent.includes('MTN MoMo')) {
      throw new Error(`Expected verified table to contain testcustomer@gmail.com, got: ${verifiedContent}`);
    }
    console.log('  ✓ Admin manual account verification works and updates verified accounts log');

  } catch (err) {
    console.error('Test Failed:', err);
    hasError = true;
  } finally {
    await browser.close();
    serverProcess.kill('SIGKILL');
  }

  if (hasError) {
    process.exit(1);
  } else {
    console.log('\n========================================');
    console.log('ALL PROFILE, ADMIN & PAYMENT TESTS PASSED!');
    console.log('========================================\n');
    process.exit(0);
  }
})();
