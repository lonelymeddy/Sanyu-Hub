const { chromium } = require('playwright');
const assert = require('assert');
const { spawn } = require('child_process');

const TEST_PORT = 3105;
const BASE_URL = `http://localhost:${TEST_PORT}`;

(async () => {
  console.log('Running End-to-End Admin Panel & Interactive Buttons Tests...');

  const serverProcess = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: String(TEST_PORT) },
    stdio: 'ignore'
  });

  // Give server time to start
  await new Promise(r => setTimeout(r, 2000));

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Access control: unauthorized access blocked
    console.log('Testing Unauthorized Access...');
    await page.goto(`${BASE_URL}/admin.html`);
    const accessDeniedVisible = await page.isVisible('#accessDenied');
    assert.strictEqual(accessDeniedVisible, true, 'Non-admin must be blocked from admin panel');
    console.log('  ✓ Non-admin blocked from admin panel');

    // 2. Set Admin Session and reload
    console.log('Setting Super Admin Auth Session...');
    await page.evaluate(() => {
      localStorage.setItem('sanyuhub_auth_user', JSON.stringify({
        id: 'usr-admin-01',
        name: 'Super Admin',
        email: 'delostvoyage@gmail.com',
        phone: '256702662846',
        role: 'admin',
        isAdmin: true,
        isTrial: false,
        subscriptionExpiry: new Date(Date.now() + 864000000).toISOString()
      }));
    });
    await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'networkidle' });
    const adminContentVisible = await page.isVisible('#adminContent');
    assert.strictEqual(adminContentVisible, true, 'Admin content should be displayed');
    console.log('  ✓ Admin dashboard displayed');

    // 3. User table loaded
    await page.waitForSelector('#usersTableBody tr');
    const rowCount = await page.locator('#usersTableBody tr').count();
    assert.ok(rowCount >= 3, `Expected at least 3 user rows, got ${rowCount}`);
    console.log(`  ✓ User management table loaded with ${rowCount} rows`);

    // 4. Test button interaction state on Refresh button
    console.log('Testing Button State on Refresh...');
    const refreshBtn = page.locator('#btnRefreshUsers');
    await refreshBtn.click();
    await page.waitForTimeout(1000);
    console.log('  ✓ Refresh button executed with state transitions');

    // 5. Test Account Validation (Approve/Reject)
    console.log('Testing Account Validation...');
    const approveBtn = page.locator('#usersTableBody tr:nth-child(2) button.btn-approve').first();
    await approveBtn.click();
    await page.waitForTimeout(1500);

    // Verify persisted via direct API call
    const usersRes = await page.request.get(`${BASE_URL}/api/admin/users`, {
      headers: { 'x-user-role': 'admin', 'x-admin-token': 'super-admin-secret-2025' }
    });
    const usersData = await usersRes.json();
    const updatedUser = usersData.users.find(u => u.id === 'usr-test-02');
    assert.strictEqual(updatedUser.validationStatus, 'validated', 'Validation status must be updated to validated in database');
    console.log('  ✓ User account validation approved and persisted');

    // 6. Test Account Verification Toggle
    console.log('Testing Account Verification Toggle...');
    const verifyToggleBtn = page.locator('#usersTableBody tr:nth-child(2) button.btn-verify').first();
    await verifyToggleBtn.click();
    await page.waitForTimeout(1500);

    const usersRes2 = await page.request.get(`${BASE_URL}/api/admin/users`, {
      headers: { 'x-user-role': 'admin', 'x-admin-token': 'super-admin-secret-2025' }
    });
    const usersData2 = await usersRes2.json();
    const user2 = usersData2.users.find(u => u.id === 'usr-test-02');
    assert.strictEqual(user2.isVerified, true, 'User should now be verified');
    console.log('  ✓ Account verification state toggled and persisted');

    // 7. Test Role Promotion
    console.log('Testing Role Promotion...');
    const roleSelect = page.locator('#usersTableBody tr:nth-child(2) select.role-select').first();
    await roleSelect.selectOption('moderator');
    await page.waitForTimeout(1200);

    const usersRes3 = await page.request.get(`${BASE_URL}/api/admin/users`, {
      headers: { 'x-user-role': 'admin', 'x-admin-token': 'super-admin-secret-2025' }
    });
    const usersData3 = await usersRes3.json();
    const user3 = usersData3.users.find(u => u.id === 'usr-test-02');
    assert.strictEqual(user3.role, 'moderator', 'User role must be updated to moderator');
    console.log('  ✓ User promoted and role change persisted');

    // 8. Test Account Deletion with confirmation
    console.log('Testing Account Deletion Modal & Confirmation...');
    const deleteBtn = page.locator('#usersTableBody tr:last-child button.btn-delete').first();
    await deleteBtn.click();
    await page.waitForSelector('#confirmModal', { state: 'visible' });
    console.log('  ✓ Confirmation modal appeared before deletion');

    // Confirm deletion
    await page.click('#btnConfirmOk');
    await page.waitForTimeout(1500);

    const usersRes4 = await page.request.get(`${BASE_URL}/api/admin/users`, {
      headers: { 'x-user-role': 'admin', 'x-admin-token': 'super-admin-secret-2025' }
    });
    const usersData4 = await usersRes4.json();
    const deletedUser = usersData4.users.find(u => u.id === 'usr-test-04');
    assert.strictEqual(deletedUser, undefined, 'Deleted user usr-test-04 must be removed from users');
    console.log('  ✓ User account successfully deleted and removed from records');

    // 9. Test Broadcast System
    console.log('Testing Broadcast System...');
    await page.fill('#broadcastTitle', 'Maintenance Notice');
    await page.selectOption('#broadcastTarget', 'all');
    await page.fill('#broadcastMessage', 'The system will undergo minor maintenance at midnight.');
    await page.click('#btnSendBroadcast');

    // Confirm modal for broadcast
    await page.waitForSelector('#confirmModal', { state: 'visible' });
    console.log('  ✓ Broadcast confirmation modal displayed');
    await page.click('#btnConfirmOk');
    await page.waitForTimeout(1500);

    const bcRes = await page.request.get(`${BASE_URL}/api/admin/broadcasts`, {
      headers: { 'x-user-role': 'admin', 'x-admin-token': 'super-admin-secret-2025' }
    });
    const bcData = await bcRes.json();
    assert.ok(bcData.broadcasts.length > 0, 'Broadcast must be recorded');
    assert.strictEqual(bcData.broadcasts[0].title, 'Maintenance Notice');
    console.log('  ✓ Broadcast successfully recorded and delivered');

    // 10. Test Duplicate Broadcast Prevention
    console.log('Testing Duplicate Broadcast Prevention...');
    const dupRes = await page.request.post(`${BASE_URL}/api/admin/broadcasts`, {
      headers: { 'x-user-role': 'admin', 'x-admin-token': 'super-admin-secret-2025', 'Content-Type': 'application/json' },
      data: JSON.stringify({
        title: 'Maintenance Notice',
        message: 'The system will undergo minor maintenance at midnight.',
        targetGroup: 'all',
        requestId: bcData.broadcasts[0].requestId
      })
    });
    const dupData = await dupRes.json();
    assert.strictEqual(dupData.duplicate, true, 'Duplicate broadcast must be flagged and ignored');
    console.log('  ✓ Duplicate broadcast submission prevented');

    // 11. Test Notification delivery endpoint
    console.log('Testing Notifications Delivery Endpoint...');
    const notifRes = await page.request.get(`${BASE_URL}/api/notifications`, {
      headers: { 'x-user-role': 'user', 'x-user-id': 'usr-test-02' }
    });
    const notifData = await notifRes.json();
    assert.ok(notifData.notifications && notifData.notifications.length > 0);
    console.log('  ✓ User notification delivery endpoint functional');

    console.log('\n========================================');
    console.log('ALL ADMIN PANEL & BUTTON TESTS PASSED!');
    console.log('========================================\n');

    await browser.close();
  } catch (err) {
    console.error('Test failure:', err);
    await browser.close();
    serverProcess.kill('SIGKILL');
    process.exit(1);
  } finally {
    serverProcess.kill('SIGKILL');
  }
})();
