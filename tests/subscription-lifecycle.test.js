// Comprehensive End-to-End Test Suite for Subscription & Payment Lifecycle
process.env.LWORX_API_KEY = process.env.LWORX_API_KEY || 'test_lworx_key_mock';
process.env.LWORX_WEBHOOK_SECRET = process.env.LWORX_WEBHOOK_SECRET || 'test_lworx_secret_key_2025';
process.env.FLW_SECRET_KEY = 'FLWSECK_TEST-sandboxmockkey-X';
process.env.FLW_PUBLIC_KEY = 'FLWPUBK_TEST-sandboxmockkey-X';
process.env.FLW_SECRET_HASH = 'test_flw_secret_hash_2025';

const assert = require('assert');
const crypto = require('crypto');
const http = require('http');
const subscriptionService = require('../src/services/subscription-service');

async function runTests() {
  console.log('=== STARTING COMPLETE SUBSCRIPTION SYSTEM TESTS ===\n');

  // 1. Verify Packages
  console.log('1. Testing Subscription Packages Specification...');
  const packages = subscriptionService.getPackages();
  assert.strictEqual(packages.length, 4, 'Should have exactly 4 packages');

  const p3 = subscriptionService.getPackageById('pkg-3day');
  assert.strictEqual(p3.priceUGX, 2000);
  assert.strictEqual(p3.durationDays, 3);
  assert.strictEqual(p3.downloadsAllowed, false);

  const p7 = subscriptionService.getPackageById('pkg-7day');
  assert.strictEqual(p7.priceUGX, 6000);
  assert.strictEqual(p7.durationDays, 7);
  assert.strictEqual(p7.downloadsAllowed, false);

  const pM = subscriptionService.getPackageById('pkg-monthly');
  assert.strictEqual(pM.priceUGX, 12000);
  assert.strictEqual(pM.durationDays, 30);
  assert.strictEqual(pM.downloadsAllowed, false);

  const pR = subscriptionService.getPackageById('pkg-royal');
  assert.strictEqual(pR.priceUGX, 35000);
  assert.strictEqual(pR.durationDays, 30);
  assert.strictEqual(pR.downloadsAllowed, true);
  assert.strictEqual(pR.weeklyAllowanceMB, 900);
  console.log('  ✓ All 4 packages conform strictly to specification.');

  // 2. Test Transaction Deduplication and Amount Validation
  console.log('\n2. Testing Transaction Creation & Amount Validation...');
  const uniqueRef = 'TEST-REF-' + Date.now();
  const tx = subscriptionService.createTransaction({
    userId: 'test_user_01',
    userIdentifier: 'test_user_01@example.com',
    packageId: 'pkg-3day',
    amountUGX: 2000,
    paymentMethod: 'mtn',
    provider: 'lworx',
    phone: '0770000000',
    txRef: uniqueRef
  });
  assert.strictEqual(tx.txRef, uniqueRef);
  assert.strictEqual(tx.status, 'pending');

  // Attempt duplicate reference
  let dupThrew = false;
  try {
    subscriptionService.createTransaction({
      userId: 'test_user_01',
      userIdentifier: 'test_user_01@example.com',
      packageId: 'pkg-3day',
      amountUGX: 2000,
      paymentMethod: 'mtn',
      provider: 'lworx',
      phone: '0770000000',
      txRef: uniqueRef
    });
  } catch (err) {
    dupThrew = true;
    assert(err.message.includes('DUPLICATE_REFERENCE'));
  }
  assert(dupThrew, 'Duplicate transaction reference must be rejected');

  // Attempt amount manipulation
  let manipThrew = false;
  try {
    subscriptionService.createTransaction({
      userId: 'test_user_01',
      userIdentifier: 'test_user_01@example.com',
      packageId: 'pkg-royal',
      amountUGX: 1000, // Should be 35000
      paymentMethod: 'mtn',
      provider: 'lworx',
      phone: '0770000000',
      txRef: 'MANIP-' + Date.now()
    });
  } catch (err) {
    manipThrew = true;
    assert(err.message.includes('Amount mismatch'));
  }
  assert(manipThrew, 'Amount manipulation must be rejected');
  console.log('  ✓ Deduplication and amount mismatch protection verified.');

  // 3. Test Lworx Webhook Signature Verification & Processing
  console.log('\n3. Testing Lworx Pay Webhook Verification & Activation...');
  const lworxRef = 'LW-TEST-' + Date.now();
  subscriptionService.createTransaction({
    userId: 'momo_customer',
    userIdentifier: 'momo_customer@example.com',
    packageId: 'pkg-monthly',
    amountUGX: 12000,
    paymentMethod: 'mtn',
    provider: 'lworx',
    phone: '256770000001',
    txRef: lworxRef
  });

  const validPayload = JSON.stringify({
    event: 'payment.success',
    timestamp: new Date().toISOString(),
    data: {
      transaction_id: 'LWTX-' + Date.now(),
      reference: lworxRef,
      amount: 12000,
      status: 'completed',
      provider: 'mtn',
      phone: '256770000001'
    }
  });

  const validSig = crypto.createHmac('sha256', process.env.LWORX_WEBHOOK_SECRET).update(validPayload).digest('hex');

  // Test invalid signature rejection
  let sigThrew = false;
  try {
    await subscriptionService.handleLworxWebhook(validPayload, 'invalid_signature_hex');
  } catch (err) {
    sigThrew = true;
  }
  assert(sigThrew, 'Invalid signature must be rejected');

  // Test valid signature execution
  const webhookResult = await subscriptionService.handleLworxWebhook(validPayload, validSig);
  assert.strictEqual(webhookResult.status, 'completed');
  assert.strictEqual(webhookResult.subscription.packageId, 'pkg-monthly');
  assert.strictEqual(webhookResult.subscription.downloadsAllowed, false);

  // Test duplicate webhook idempotence
  const duplicateResult = await subscriptionService.handleLworxWebhook(validPayload, validSig);
  assert.strictEqual(duplicateResult.status, 'already_completed', 'Duplicate webhook must not re-process');
  console.log('  ✓ Lworx Webhook HMAC signature verification and idempotence verified.');

  // 4. Test Royal Premium Activation & Download Restrictions
  console.log('\n4. Testing Royal Premium 4K Downloads & Tier Enforcement...');
  const royalUser = 'royal_vip_user@example.com';
  const royalSub = subscriptionService.activateSubscription({
    userId: royalUser,
    userIdentifier: royalUser,
    packageId: 'pkg-royal',
    paymentMethod: 'card',
    provider: 'flutterwave',
    reference: 'FLW-ROYAL-' + Date.now(),
    amountUGX: 35000
  });

  assert.strictEqual(royalSub.packageId, 'pkg-royal');
  assert.strictEqual(royalSub.downloadsAllowed, true);
  assert.strictEqual(royalSub.weeklyAllowanceMB, 900);

  // Check streaming user (monthly) download rejection
  const monthlyCheck = subscriptionService.validateDownloadRequest('momo_customer@example.com', 10 * 1024 * 1024);
  assert.strictEqual(monthlyCheck.allowed, false);
  assert.strictEqual(monthlyCheck.code, 'TIER_UPGRADE_REQUIRED');
  console.log('  ✓ Download rejection on streaming-only tiers verified (TIER_UPGRADE_REQUIRED).');

  // Check Royal user download allowance
  const royalCheck1 = subscriptionService.validateDownloadRequest(royalUser, 100 * 1024 * 1024); // 100MB
  assert.strictEqual(royalCheck1.allowed, true);

  // Consume 850 MB
  subscriptionService.recordDownloadCompletion(royalUser, 'mov-4k-1', 'Movie 4K', 850 * 1024 * 1024);
  const usageAfter = subscriptionService.getDownloadUsage(royalUser);
  assert.strictEqual(usageAfter.usedMB, 850);
  assert.strictEqual(usageAfter.remainingMB, 50);

  // Attempt to download 60 MB (exceeds remaining 50 MB)
  const royalExceed = subscriptionService.validateDownloadRequest(royalUser, 60 * 1024 * 1024);
  assert.strictEqual(royalExceed.allowed, false);
  assert.strictEqual(royalExceed.code, 'QUOTA_EXCEEDED');
  console.log('  ✓ Royal Premium 900 MB weekly allowance enforcement verified.');

  // 5. Test Flutterwave Signature Verification
  console.log('\n5. Testing Flutterwave Signature Verification...');
  const flwSigValid = subscriptionService.verifyFlutterwaveWebhookSignature(process.env.FLW_SECRET_HASH);
  assert.strictEqual(flwSigValid, true);
  const flwSigInvalid = subscriptionService.verifyFlutterwaveWebhookSignature('wrong_hash');
  assert.strictEqual(flwSigInvalid, false);
  console.log('  ✓ Flutterwave secret hash verification verified.');

  // 6. Test Expiration Revocation
  console.log('\n6. Testing Subscription Expiration Policy...');
  const expUser = 'expired_user@example.com';
  const activatedSub = subscriptionService.activateSubscription({
    userId: expUser,
    userIdentifier: expUser,
    packageId: 'pkg-3day',
    paymentMethod: 'mtn',
    provider: 'lworx',
    reference: 'EXP-' + Date.now(),
    amountUGX: 2000
  });

  // Manually backdate expiration
  const subscriptions = require('../data/subscriptions.json');
  const sIdx = subscriptions.findIndex(s => s.userId === expUser);
  subscriptions[sIdx].expiresAt = new Date(Date.now() - 1000).toISOString();
  require('fs').writeFileSync(require('path').join(__dirname, '../data/subscriptions.json'), JSON.stringify(subscriptions, null, 2));

  const expiredResult = subscriptionService.getUserSubscription(expUser);
  assert.strictEqual(expiredResult.isExpired, true);
  assert.strictEqual(expiredResult.status, 'expired');
  assert.strictEqual(expiredResult.streamingAllowed, false);
  assert.strictEqual(expiredResult.downloadsAllowed, false);
  console.log('  ✓ Expired subscriptions automatically revoke access.');

  console.log('\n======================================================');
  console.log('ALL SUBSCRIPTION & PAYMENT UNIT TESTS PASSED (6/6)');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
