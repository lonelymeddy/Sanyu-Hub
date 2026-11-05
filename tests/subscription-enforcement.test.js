/**
 * SanyuHub Subscription Enforcement & Payment Verification Test Suite
 *
 * Verifies all 14 required scenarios:
 * 1. Newly registered eligible user receives 48-hour free trial
 * 2. Trial expires after exactly 48 hours
 * 3. Expired trial cannot access content
 * 4. User without a trial or paid subscription cannot access content
 * 5. Unpaid user cannot access protected pages through direct URLs
 * 6. Pending payment does not grant access
 * 7. Failed payment does not grant access
 * 8. Successful verified payment activates correct package
 * 9. Expired paid subscription loses access
 * 10. Royal Premium subscriber receives only benefits of purchased package
 * 11. Unauthorized user cannot bypass restrictions through media APIs or download endpoints
 * 12. Payment verification redirects work correctly
 * 13. Users can return to originally requested page after successful payment (returnUrl)
 * 14. Administrators retain authorized access
 */

const assert = require('assert');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const subscriptionService = require('../src/services/subscription-service');

const TEST_PORT = 3108;
const BASE_URL = `http://localhost:${TEST_PORT}`;

function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });

    req.on('error', err => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

(async () => {
  console.log('Starting SanyuHub Subscription & Payment Verification Test Suite...\n');

  const serverProcess = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: String(TEST_PORT) },
    stdio: 'ignore'
  });

  // Give server time to initialize
  await new Promise(r => setTimeout(r, 2500));

  let passedScenarios = 0;
  const totalScenarios = 14;

  try {
    // SCENARIO 1: Newly registered eligible user receives a 48-hour free trial
    console.log('Testing Scenario 1: Eligible user receives 48-hour free trial...');
    const user1 = `newuser_${Date.now()}@test.com`;
    assert.strictEqual(subscriptionService.isTrialEligible(user1), true, 'New user must be eligible');
    const trial1 = subscriptionService.activateTrial({ userIdentifier: user1 });
    assert.strictEqual(trial1.packageId, 'pkg-trial');
    assert.strictEqual(trial1.isTrial, true);
    assert.strictEqual(trial1.streamingAllowed, true);
    assert.strictEqual(trial1.downloadsAllowed, false);
    assert.strictEqual(trial1.royalStreaming, false);
    const expectedExpiryTime = new Date(trial1.activatedAt).getTime() + 48 * 60 * 60 * 1000;
    const actualExpiryTime = new Date(trial1.expiresAt).getTime();
    assert.ok(Math.abs(expectedExpiryTime - actualExpiryTime) < 2000, 'Trial must expire in exactly 48h');
    // Cannot claim a second time
    assert.strictEqual(subscriptionService.isTrialEligible(user1), false, 'User cannot claim trial twice');
    console.log('  ✓ Scenario 1 PASSED: 48h trial activated once per eligible user');
    passedScenarios++;

    // SCENARIO 2: The trial expires after exactly 48 hours
    console.log('Testing Scenario 2: Trial expiration calculation...');
    const diffHours = (new Date(trial1.expiresAt).getTime() - new Date(trial1.activatedAt).getTime()) / (1000 * 60 * 60);
    assert.strictEqual(diffHours, 48, 'Duration must equal exactly 48 hours');
    console.log('  ✓ Scenario 2 PASSED: Duration is exactly 48 hours');
    passedScenarios++;

    // SCENARIO 3: An expired trial cannot access content
    console.log('Testing Scenario 3: Expired trial access blocked...');
    const userExpiredTrial = `expiredtrial_${Date.now()}@test.com`;
    subscriptionService.activateTrial({ userIdentifier: userExpiredTrial });
    // Manually backdate trial expiry in database file
    const fs = require('fs');
    const subFilePath = path.join(__dirname, '../data/subscriptions.json');
    const subsData = JSON.parse(fs.readFileSync(subFilePath, 'utf8'));
    const idxExp = subsData.findIndex(s => s.userIdentifier === userExpiredTrial);
    if (idxExp !== -1) {
      subsData[idxExp].expiresAt = new Date(Date.now() - 10000).toISOString();
      fs.writeFileSync(subFilePath, JSON.stringify(subsData, null, 2), 'utf8');
    }

    // Re-check access
    const checkExp = subscriptionService.checkUserAccess(userExpiredTrial);
    assert.strictEqual(checkExp.hasAccess, false, 'Expired trial must have no access');
    assert.strictEqual(checkExp.reason, 'SUBSCRIPTION_EXPIRED');
    console.log('  ✓ Scenario 3 PASSED: Expired trial access immediately blocked');
    passedScenarios++;

    // SCENARIO 4: A user without a trial or paid subscription cannot access content
    console.log('Testing Scenario 4: User without subscription cannot access content...');
    const userNoSub = `nosub_${Date.now()}@test.com`;
    const checkNoSub = subscriptionService.checkUserAccess(userNoSub);
    assert.strictEqual(checkNoSub.hasAccess, false);
    assert.strictEqual(checkNoSub.reason, 'NO_SUBSCRIPTION');
    console.log('  ✓ Scenario 4 PASSED: User without subscription blocked');
    passedScenarios++;

    // SCENARIO 5: An unpaid user cannot access protected pages through direct URLs
    console.log('Testing Scenario 5: Direct URL access blocked with 302 redirect to payment...');
    const resMovie = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/movies',
      method: 'GET'
    });
    assert.strictEqual(resMovie.statusCode, 302);
    assert.ok(resMovie.headers.location.startsWith('/payment?returnUrl='), 'Must redirect to payment with returnUrl');
    console.log('  ✓ Scenario 5 PASSED: Direct page URL redirects to /payment');
    passedScenarios++;

    // SCENARIO 6: A pending payment does not grant access
    console.log('Testing Scenario 6: Pending payment does not grant access...');
    const userPending = `pending_${Date.now()}@test.com`;
    const txPending = subscriptionService.createTransaction({
      userId: userPending,
      userIdentifier: userPending,
      packageId: 'pkg-3day',
      amountUGX: 2000,
      paymentMethod: 'mtn',
      provider: 'lworx',
      phone: '0770000000',
      txRef: 'REF-PENDING-' + Date.now()
    });
    assert.strictEqual(txPending.status, 'pending');
    const checkPendingAccess = subscriptionService.checkUserAccess(userPending);
    assert.strictEqual(checkPendingAccess.hasAccess, false, 'Pending payment must not grant access');
    console.log('  ✓ Scenario 6 PASSED: Pending payment does not grant access');
    passedScenarios++;

    // SCENARIO 7: A failed payment does not grant access
    console.log('Testing Scenario 7: Failed payment does not grant access...');
    const userFailed = `failed_${Date.now()}@test.com`;
    const txFailed = subscriptionService.createTransaction({
      userId: userFailed,
      userIdentifier: userFailed,
      packageId: 'pkg-3day',
      amountUGX: 2000,
      paymentMethod: 'mtn',
      provider: 'lworx',
      phone: '0770000000',
      txRef: 'REF-FAILED-' + Date.now()
    });
    subscriptionService.updateTransaction(txFailed.txRef, { status: 'failed' });
    const checkFailedAccess = subscriptionService.checkUserAccess(userFailed);
    assert.strictEqual(checkFailedAccess.hasAccess, false, 'Failed payment must not grant access');
    console.log('  ✓ Scenario 7 PASSED: Failed payment does not grant access');
    passedScenarios++;

    // SCENARIO 8: A successful verified payment activates the correct package
    console.log('Testing Scenario 8: Successful verified payment activates correct package...');
    const userPaid = `paid_${Date.now()}@test.com`;
    const txPaid = subscriptionService.createTransaction({
      userId: userPaid,
      userIdentifier: userPaid,
      packageId: 'pkg-7day',
      amountUGX: 6000,
      paymentMethod: 'mtn',
      provider: 'lworx',
      phone: '0771234567',
      txRef: 'REF-PAID-' + Date.now()
    });
    subscriptionService.updateTransaction(txPaid.txRef, { status: 'completed' });
    const activatedSub = subscriptionService.activateSubscription({
      userId: userPaid,
      userIdentifier: userPaid,
      packageId: 'pkg-7day',
      paymentMethod: 'mtn',
      provider: 'lworx',
      reference: txPaid.txRef,
      amountUGX: 6000
    });
    assert.strictEqual(activatedSub.packageId, 'pkg-7day');
    assert.strictEqual(activatedSub.status, 'active');
    const checkPaid = subscriptionService.checkUserAccess(userPaid);
    assert.strictEqual(checkPaid.hasAccess, true);
    assert.strictEqual(checkPaid.packageId, 'pkg-7day');
    console.log('  ✓ Scenario 8 PASSED: Verified payment activates package correctly');
    passedScenarios++;

    // SCENARIO 9: An expired paid subscription loses access
    console.log('Testing Scenario 9: Expired paid subscription loses access immediately...');
    const userExpPaid = `exppaid_${Date.now()}@test.com`;
    subscriptionService.activateSubscription({
      userId: userExpPaid,
      userIdentifier: userExpPaid,
      packageId: 'pkg-3day',
      paymentMethod: 'mtn',
      provider: 'lworx',
      reference: 'EXP-' + Date.now(),
      amountUGX: 2000
    });
    // Manually expire subscription in database file
    const subsPaid = JSON.parse(fs.readFileSync(subFilePath, 'utf8'));
    const idxPaidExp = subsPaid.findIndex(s => s.userIdentifier === userExpPaid);
    if (idxPaidExp !== -1) {
      subsPaid[idxPaidExp].expiresAt = new Date(Date.now() - 5000).toISOString();
      fs.writeFileSync(subFilePath, JSON.stringify(subsPaid, null, 2), 'utf8');
    }
    const checkExpPaid = subscriptionService.checkUserAccess(userExpPaid);
    assert.strictEqual(checkExpPaid.hasAccess, false);
    assert.strictEqual(checkExpPaid.reason, 'SUBSCRIPTION_EXPIRED');
    console.log('  ✓ Scenario 9 PASSED: Expired paid subscription loses access immediately');
    passedScenarios++;

    // SCENARIO 10: A Royal Premium subscriber receives only the benefits of their purchased package
    console.log('Testing Scenario 10: Royal Premium subscriber benefits...');
    const userRoyal = `royal_${Date.now()}@test.com`;
    subscriptionService.activateSubscription({
      userId: userRoyal,
      userIdentifier: userRoyal,
      packageId: 'pkg-royal',
      paymentMethod: 'card',
      provider: 'flutterwave',
      reference: 'ROYAL-' + Date.now(),
      amountUGX: 35000
    });
    const checkRoyal = subscriptionService.checkUserAccess(userRoyal);
    assert.strictEqual(checkRoyal.hasAccess, true);
    assert.strictEqual(checkRoyal.royalStreaming, true);
    assert.strictEqual(checkRoyal.downloadsAllowed, true);

    // Verify non-royal subscriber has no royal or download benefits
    const checkRegular = subscriptionService.checkUserAccess(userPaid);
    assert.strictEqual(checkRegular.royalStreaming, false);
    assert.strictEqual(checkRegular.downloadsAllowed, false);
    console.log('  ✓ Scenario 10 PASSED: Royal benefits strictly isolated to Royal tier');
    passedScenarios++;

    // SCENARIO 11: Unauthorized user cannot bypass restrictions through media APIs or download endpoints
    console.log('Testing Scenario 11: Media APIs & download endpoints blocked for unauthorized users...');
    const apiRes = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/stream-proxy?url=https://example.com/stream.m3u8',
      method: 'GET'
    });
    assert.strictEqual(apiRes.statusCode, 403, 'Media stream proxy must return 403');
    const dlRes = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/media/download?id=123',
      method: 'GET'
    });
    assert.strictEqual(dlRes.statusCode, 401, 'Download endpoint must return 401 without auth');
    console.log('  ✓ Scenario 11 PASSED: Protected media APIs strictly secured');
    passedScenarios++;

    // SCENARIO 12: Payment verification redirects work correctly
    console.log('Testing Scenario 12: Payment verification redirect page (/payment/verify)...');
    const verifyPageRes = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/payment/verify?ref=TEST-REF-123',
      method: 'GET'
    });
    assert.strictEqual(verifyPageRes.statusCode, 200);
    assert.ok(verifyPageRes.body.includes('Payment Verification'));
    console.log('  ✓ Scenario 12 PASSED: Payment verification page accessible and functional');
    passedScenarios++;

    // SCENARIO 13: Users can return to their originally requested page after payment (returnUrl)
    console.log('Testing Scenario 13: ReturnUrl preserved through payment flow...');
    const directRes = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/watch/movie-123',
      method: 'GET'
    });
    assert.strictEqual(directRes.statusCode, 302);
    assert.ok(directRes.headers.location.includes('returnUrl=%2Fwatch%2Fmovie-123'));
    console.log('  ✓ Scenario 13 PASSED: ReturnUrl properly constructed and preserved');
    passedScenarios++;

    // SCENARIO 14: Administrators retain authorized access
    console.log('Testing Scenario 14: Administrator privileges and bypass...');
    const adminCheck = subscriptionService.checkUserAccess('delostvoyage@gmail.com');
    assert.strictEqual(adminCheck.hasAccess, true);
    assert.strictEqual(adminCheck.isAdmin, true);
    assert.strictEqual(adminCheck.streamingAllowed, true);

    const adminPageRes = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/movies',
      method: 'GET',
      headers: { 'x-user-id': 'delostvoyage@gmail.com' }
    });
    assert.strictEqual(adminPageRes.statusCode, 200, 'Admin can access protected page directly');
    console.log('  ✓ Scenario 14 PASSED: Administrators retain full authorized access');
    passedScenarios++;

    console.log('\n======================================================');
    console.log(`ALL ${passedScenarios}/${totalScenarios} SUBSCRIPTION & PAYMENT SCENARIOS PASSED!`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('\nTEST SUITE FAILED:', err);
    process.exitCode = 1;
  } finally {
    serverProcess.kill('SIGKILL');
  }
})();
