const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// Define Subscription Packages
const SUBSCRIPTION_PACKAGES = {
  'pkg-3day': {
    id: 'pkg-3day',
    name: '3-Day Package',
    priceUGX: 2000,
    durationDays: 3,
    streaming: true,
    royalStreaming: false,
    downloadsAllowed: false,
    weeklyAllowanceMB: 0,
    description: '3 days of unlimited streaming access. Offline downloads not available.',
    benefits: [
      'Unlimited streaming access',
      'Full movie & series catalogue',
      'Live TV & radio stations',
      'No offline downloads'
    ]
  },
  'pkg-7day': {
    id: 'pkg-7day',
    name: '7-Day Package',
    priceUGX: 6000,
    durationDays: 7,
    streaming: true,
    royalStreaming: false,
    downloadsAllowed: false,
    weeklyAllowanceMB: 0,
    description: '7 days of unlimited streaming access. Offline downloads not available.',
    benefits: [
      'Unlimited streaming access',
      'Full movie & series catalogue',
      'Live TV & radio stations',
      'No offline downloads'
    ]
  },
  'pkg-monthly': {
    id: 'pkg-monthly',
    name: 'Monthly Package',
    priceUGX: 12000,
    durationDays: 30,
    streaming: true,
    royalStreaming: false,
    downloadsAllowed: false,
    weeklyAllowanceMB: 0,
    description: '30 days of unlimited streaming access. Offline downloads not available.',
    benefits: [
      'Unlimited streaming access for 30 days',
      'Full movie & series catalogue',
      'Live TV & radio stations',
      'No offline downloads'
    ]
  },
  'pkg-royal': {
    id: 'pkg-royal',
    name: 'Royal Premium',
    priceUGX: 35000,
    durationDays: 30,
    streaming: true,
    royalStreaming: true,
    downloadsAllowed: true,
    weeklyAllowanceMB: 900,
    description: 'Premium streaming experience with Royal access and 4K downloads up to 900 MB weekly.',
    benefits: [
      'Royal Streaming access included',
      '4K downloads enabled',
      'Weekly download allowance: 900 MB',
      'Premium streaming experience',
      'Access to all Royal Premium-exclusive features'
    ]
  }
};

const DATA_DIR = path.join(__dirname, '../../data');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');
const DOWNLOADS_FILE = path.join(DATA_DIR, 'downloads.json');
const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'audit_logs.json');

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
  if (!fs.existsSync(TRANSACTIONS_FILE)) {
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
  if (!fs.existsSync(DOWNLOADS_FILE)) {
    fs.writeFileSync(DOWNLOADS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
  if (!fs.existsSync(AUDIT_LOGS_FILE)) {
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

function readJson(file, defaultVal = []) {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return defaultVal;
  }
}

function writeJson(file, data) {
  ensureDataFiles();
  const tempPath = `${file}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, file);
}

class SubscriptionService {
  constructor() {
    ensureDataFiles();
  }

  // --- PACKAGE MANAGEMENT ---
  getPackages() {
    return Object.values(SUBSCRIPTION_PACKAGES);
  }

  getPackageById(packageId) {
    return SUBSCRIPTION_PACKAGES[packageId] || null;
  }

  // --- GATEWAY CONFIGURATION & OPERATIONAL STATUS ---
  getGatewayStatus() {
    const lworxApiKey = process.env.LWORX_API_KEY;
    const flwSecretKey = process.env.FLW_SECRET_KEY;
    const flwPublicKey = process.env.FLW_PUBLIC_KEY;

    return {
      lworx: {
        configured: Boolean(lworxApiKey),
        supportedNetworks: ['MTN', 'Airtel']
      },
      cards: {
        configured: Boolean(flwSecretKey && flwPublicKey),
        supportedCards: ['Mastercard', 'Visa'],
        publicKey: flwPublicKey ? `${flwPublicKey.substring(0, 10)}...` : null
      }
    };
  }

  // Normalize phone to Ugandan format (07... or 2567...)
  normalizePhone(phone) {
    if (!phone) return '';
    let clean = String(phone).replace(/[^\d]/g, '');
    if (clean.startsWith('0') && clean.length === 10) {
      return clean;
    }
    if (clean.startsWith('256') && clean.length === 12) {
      return clean;
    }
    if (clean.length === 9 && clean.startsWith('7')) {
      return `0${clean}`;
    }
    return clean;
  }

  detectNetwork(phone) {
    const p = this.normalizePhone(phone);
    // MTN: 077, 078, 076 or 25677, 25678, 25676
    // Airtel: 070, 075, 074 or 25670, 25675, 25674
    const prefix = p.startsWith('256') ? p.substring(3, 5) : p.substring(1, 3);
    if (['77', '78', '76'].includes(prefix)) {
      return 'MTN';
    }
    if (['70', '75', '74'].includes(prefix)) {
      return 'Airtel';
    }
    return null;
  }

  // --- TRANSACTION CREATION & TRACKING ---
  createTransaction({ userId, userIdentifier, packageId, amountUGX, paymentMethod, provider, phone, txRef }) {
    const pkg = this.getPackageById(packageId);
    if (!pkg) {
      throw new Error(`Invalid package ID: ${packageId}`);
    }

    if (Number(amountUGX) !== pkg.priceUGX) {
      throw new Error(`Amount mismatch: Expected UGX ${pkg.priceUGX}, got UGX ${amountUGX}`);
    }

    const transactions = readJson(TRANSACTIONS_FILE);
    const existing = transactions.find(t => t.txRef === txRef);
    if (existing) {
      throw new Error(`DUPLICATE_REFERENCE: Reference ${txRef} has already been used`);
    }

    const tx = {
      id: 'tx-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex'),
      txRef,
      userId: userId || userIdentifier,
      userIdentifier: userIdentifier || userId,
      packageId,
      packageName: pkg.name,
      amountUGX: pkg.priceUGX,
      currency: 'UGX',
      paymentMethod, // 'mtn', 'airtel', 'card'
      provider,      // 'lworx', 'flutterwave'
      phone: phone ? this.normalizePhone(phone) : null,
      status: 'pending',
      providerTransactionId: null,
      providerMessage: null,
      rawResponse: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    transactions.unshift(tx);
    writeJson(TRANSACTIONS_FILE, transactions);
    this.addAuditLog('TRANSACTION_CREATED', `Created transaction ${txRef} for ${pkg.name} (${pkg.priceUGX} UGX)`, { txRef, userId: tx.userId });
    return tx;
  }

  getTransactionByRef(txRef) {
    const transactions = readJson(TRANSACTIONS_FILE);
    return transactions.find(t => t.txRef === txRef) || null;
  }

  updateTransaction(txRef, updates) {
    const transactions = readJson(TRANSACTIONS_FILE);
    const index = transactions.findIndex(t => t.txRef === txRef);
    if (index === -1) {
      throw new Error(`Transaction ${txRef} not found`);
    }

    transactions[index] = {
      ...transactions[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    writeJson(TRANSACTIONS_FILE, transactions);
    return transactions[index];
  }

  // --- LWORX PAY INITIATION & VERIFICATION ---
  async initiateLworxPayment({ packageId, phone, userIdentifier, customEndpoint = null }) {
    const pkg = this.getPackageById(packageId);
    if (!pkg) {
      throw new Error(`Invalid package ID: ${packageId}`);
    }

    const normPhone = this.normalizePhone(phone);
    if (!normPhone || normPhone.length < 10) {
      throw new Error('Enter a valid 10-digit phone number starting with 07 or 2567.');
    }

    const txRef = 'SANYU-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const network = this.detectNetwork(normPhone) || 'MTN';

    const tx = this.createTransaction({
      userId: userIdentifier,
      userIdentifier: userIdentifier,
      packageId,
      amountUGX: pkg.priceUGX,
      paymentMethod: network.toLowerCase(),
      provider: 'lworx',
      phone: normPhone,
      txRef
    });

    const apiKey = process.env.LWORX_API_KEY;
    const callbackUrl = process.env.LWORX_CALLBACK_URL || `${process.env.APP_BASE_URL || 'https://sanyuhub.com'}/api/payments/lworx/webhook`;
    const webhookSecret = process.env.LWORX_WEBHOOK_SECRET;

    // Allowed endpoints: /collect-stanbic, /collect-relworx, /collect
    const endpointPath = customEndpoint || process.env.LWORX_COLLECT_ENDPOINT || '/collect-stanbic';

    if (!apiKey) {
      // In test mode without live credentials, keep status pending and provide clear message
      this.updateTransaction(txRef, {
        providerMessage: 'Lworx API Key not configured in server environment. Payment pending simulation mode.'
      });
      return {
        success: true,
        reference: txRef,
        status: 'pending',
        package: pkg,
        phone: normPhone,
        network,
        instructions: `Please approve the mobile money prompt sent to ${normPhone} with your PIN for UGX ${pkg.priceUGX.toLocaleString()}.`,
        requiresRealCredentials: true
      };
    }

    // Call live Lworx API
    const postData = JSON.stringify({
      amount: pkg.priceUGX,
      phone: normPhone,
      reference: txRef,
      callback_url: callbackUrl,
      ...(webhookSecret ? { webhook_secret: webhookSecret } : {})
    });

    try {
      const resp = await this.httpRequest({
        hostname: 'www.lworx-pay.com',
        path: `/api/v1${endpointPath}`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, postData);

      const parsed = JSON.parse(resp);
      if (parsed.success) {
        this.updateTransaction(txRef, {
          providerTransactionId: parsed.data?.transaction_id,
          providerMessage: parsed.message,
          rawResponse: parsed
        });

        return {
          success: true,
          reference: txRef,
          status: 'pending',
          transactionId: parsed.data?.transaction_id,
          package: pkg,
          phone: normPhone,
          network,
          instructions: parsed.message || `Approve the prompt on your phone to pay UGX ${pkg.priceUGX.toLocaleString()}.`
        };
      } else {
        this.updateTransaction(txRef, {
          status: 'failed',
          providerMessage: parsed.error?.message,
          rawResponse: parsed
        });
        throw new Error(parsed.error?.message || 'Lworx Pay rejected the payment request.');
      }
    } catch (err) {
      this.updateTransaction(txRef, {
        status: 'failed',
        providerMessage: err.message
      });
      throw err;
    }
  }

  verifyLworxWebhookSignature(rawBody, signatureHeader) {
    const secret = process.env.LWORX_WEBHOOK_SECRET;
    if (!secret) return true; // If no secret configured, signature check skipped in sandbox
    if (!signatureHeader) return false;

    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const sent = signatureHeader.trim();

    if (expected.length !== sent.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(sent, 'utf8'));
  }

  async handleLworxWebhook(rawBody, signatureHeader) {
    if (!this.verifyLworxWebhookSignature(rawBody, signatureHeader)) {
      throw new Error('INVALID_WEBHOOK_SIGNATURE: X-LworxPay-Signature mismatch');
    }

    let payload;
    try {
      payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf8'));
    } catch (e) {
      throw new Error('INVALID_JSON_BODY');
    }

    const event = payload.event;
    const data = payload.data || {};
    const ref = data.reference || data.merchant_reference;

    if (!ref) {
      throw new Error('MISSING_REFERENCE_IN_PAYLOAD');
    }

    const tx = this.getTransactionByRef(ref);
    if (!tx) {
      this.addAuditLog('ORPHAN_WEBHOOK', `Received webhook for unknown reference ${ref}`, payload);
      return { handled: false, message: 'Transaction not found locally' };
    }

    if (tx.status === 'completed') {
      return { handled: true, status: 'already_completed', message: 'Transaction already successfully processed' };
    }

    if (event === 'payment.success') {
      const paidAmount = Number(data.amount);
      if (paidAmount !== tx.amountUGX) {
        this.updateTransaction(ref, {
          status: 'failed',
          providerMessage: `Amount mismatch: expected ${tx.amountUGX}, got ${paidAmount}`,
          rawResponse: payload
        });
        throw new Error('AMOUNT_MISMATCH');
      }

      this.updateTransaction(ref, {
        status: 'completed',
        providerTransactionId: data.transaction_id || tx.providerTransactionId,
        providerMessage: 'Payment confirmed via webhook',
        rawResponse: payload
      });

      const sub = this.activateSubscription({
        userId: tx.userId,
        userIdentifier: tx.userIdentifier,
        packageId: tx.packageId,
        paymentMethod: tx.paymentMethod || 'momo',
        provider: 'lworx',
        reference: ref,
        amountUGX: tx.amountUGX
      });

      return { handled: true, status: 'completed', subscription: sub };
    } else if (event === 'payment.failed') {
      this.updateTransaction(ref, {
        status: 'failed',
        providerMessage: data.status || 'Payment failed',
        rawResponse: payload
      });
      return { handled: true, status: 'failed' };
    } else {
      // Pending or other events
      return { handled: true, status: 'acknowledged' };
    }
  }

  async checkLworxStatus(reference) {
    const tx = this.getTransactionByRef(reference);
    if (!tx) {
      throw new Error(`Transaction ${reference} not found`);
    }

    if (tx.status === 'completed') {
      return { status: 'completed', transaction: tx };
    }

    const apiKey = process.env.LWORX_API_KEY;
    if (!apiKey) {
      return { status: tx.status, transaction: tx };
    }

    try {
      const resp = await this.httpRequest({
        hostname: 'www.lworx-pay.com',
        path: `/api/v1/status?reference=${encodeURIComponent(reference)}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      const parsed = JSON.parse(resp);
      if (parsed.success && parsed.data) {
        const pStatus = parsed.data.status; // pending, completed, failed, cancelled, refunded
        if (pStatus === 'completed' && tx.status !== 'completed') {
          if (Number(parsed.data.amount) === tx.amountUGX) {
            this.updateTransaction(reference, {
              status: 'completed',
              providerTransactionId: parsed.data.transaction_id,
              rawResponse: parsed
            });

            this.activateSubscription({
              userId: tx.userId,
              userIdentifier: tx.userIdentifier,
              packageId: tx.packageId,
              paymentMethod: tx.paymentMethod || 'momo',
              provider: 'lworx',
              reference: reference,
              amountUGX: tx.amountUGX
            });
          }
        } else if (['failed', 'cancelled'].includes(pStatus)) {
          this.updateTransaction(reference, {
            status: 'failed',
            rawResponse: parsed
          });
        }

        return { status: pStatus, transaction: this.getTransactionByRef(reference) };
      }
    } catch (err) {
      console.warn('Lworx status polling error:', err.message);
    }

    return { status: tx.status, transaction: tx };
  }

  // --- CARD PAYMENTS (FLUTTERWAVE) ---
  async initiateCardPayment({ packageId, userIdentifier, email, name, phone, redirectUrl }) {
    const pkg = this.getPackageById(packageId);
    if (!pkg) {
      throw new Error(`Invalid package ID: ${packageId}`);
    }

    const flwSecretKey = process.env.FLW_SECRET_KEY;
    const txRef = 'SANYU-CARD-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const tx = this.createTransaction({
      userId: userIdentifier,
      userIdentifier: userIdentifier,
      packageId,
      amountUGX: pkg.priceUGX,
      paymentMethod: 'card',
      provider: 'flutterwave',
      phone: phone ? this.normalizePhone(phone) : null,
      txRef
    });

    if (!flwSecretKey) {
      return {
        success: false,
        configured: false,
        error: 'Mastercard & Visa card processing gateway is not configured with merchant keys.'
      };
    }

    const payload = JSON.stringify({
      tx_ref: txRef,
      amount: pkg.priceUGX,
      currency: 'UGX',
      redirect_url: redirectUrl || `${process.env.APP_BASE_URL || 'https://sanyuhub.com'}/payment?ref=${txRef}`,
      payment_options: 'card',
      customer: {
        email: email || `${userIdentifier}@sanyuhub.com`,
        phone_number: phone || '256700000000',
        name: name || userIdentifier
      },
      customizations: {
        title: 'SanyuHub Subscription',
        description: `${pkg.name} — UGX ${pkg.priceUGX.toLocaleString()}`,
        logo: 'https://sanyuhub.com/images/sanyuhub-logo.png'
      }
    });

    try {
      const resp = await this.httpRequest({
        hostname: 'api.flutterwave.com',
        path: '/v3/payments',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${flwSecretKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, payload);

      const parsed = JSON.parse(resp);
      if (parsed.status === 'success' && parsed.data?.link) {
        this.updateTransaction(txRef, {
          rawResponse: parsed
        });

        return {
          success: true,
          configured: true,
          reference: txRef,
          checkoutUrl: parsed.data.link,
          package: pkg
        };
      } else {
        throw new Error(parsed.message || 'Flutterwave payment initiation failed');
      }
    } catch (err) {
      this.updateTransaction(txRef, {
        status: 'failed',
        providerMessage: err.message
      });
      throw err;
    }
  }

  verifyFlutterwaveWebhookSignature(signatureHeader) {
    const secretHash = process.env.FLW_SECRET_HASH;
    if (!secretHash) return true;
    if (!signatureHeader) return false;

    if (secretHash.length !== signatureHeader.length) return false;
    return crypto.timingSafeEqual(Buffer.from(secretHash, 'utf8'), Buffer.from(signatureHeader, 'utf8'));
  }

  async handleFlutterwaveWebhook(payload, signatureHeader) {
    if (!this.verifyFlutterwaveWebhookSignature(signatureHeader)) {
      throw new Error('INVALID_FLUTTERWAVE_SIGNATURE');
    }

    const data = payload.data || {};
    const ref = data.tx_ref;
    if (!ref) {
      throw new Error('MISSING_TX_REF');
    }

    const tx = this.getTransactionByRef(ref);
    if (!tx) {
      this.addAuditLog('ORPHAN_FLW_WEBHOOK', `Flutterwave webhook for unknown ref ${ref}`, payload);
      return { handled: false, message: 'Transaction not found locally' };
    }

    if (tx.status === 'completed') {
      return { handled: true, status: 'already_completed' };
    }

    // Verify transaction server-side
    const verified = await this.verifyFlutterwaveTransactionServerSide(data.id, ref);
    if (verified && verified.status === 'successful') {
      const sub = this.activateSubscription({
        userId: tx.userId,
        userIdentifier: tx.userIdentifier,
        packageId: tx.packageId,
        paymentMethod: 'card',
        provider: 'flutterwave',
        reference: ref,
        amountUGX: tx.amountUGX
      });
      return { handled: true, status: 'completed', subscription: sub };
    } else {
      this.updateTransaction(ref, {
        status: 'failed',
        providerMessage: 'Verification failed or payment unsuccessful',
        rawResponse: payload
      });
      return { handled: true, status: 'failed' };
    }
  }

  async verifyFlutterwaveTransactionServerSide(transactionId, expectedRef) {
    const flwSecretKey = process.env.FLW_SECRET_KEY;
    if (!flwSecretKey) {
      throw new Error('FLW_SECRET_KEY not configured');
    }

    const resp = await this.httpRequest({
      hostname: 'api.flutterwave.com',
      path: `/v3/transactions/${encodeURIComponent(transactionId)}/verify`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${flwSecretKey}`
      }
    });

    const parsed = JSON.parse(resp);
    if (parsed.status !== 'success' || !parsed.data) {
      return null;
    }

    const d = parsed.data;
    const tx = this.getTransactionByRef(expectedRef);
    if (!tx) return null;

    if (d.tx_ref === expectedRef && d.status === 'successful' && d.currency === 'UGX' && Number(d.amount) >= tx.amountUGX) {
      this.updateTransaction(expectedRef, {
        status: 'completed',
        providerTransactionId: String(d.id),
        rawResponse: parsed
      });
      return d;
    }

    return null;
  }

  // --- SUBSCRIPTION ACTIVATION & EXPIRATION ---
  activateSubscription({ userId, userIdentifier, packageId, paymentMethod, provider, reference, amountUGX }) {
    const pkg = this.getPackageById(packageId);
    if (!pkg) {
      throw new Error(`Invalid package ID ${packageId}`);
    }

    const subscriptions = readJson(SUBSCRIPTIONS_FILE);
    const idKey = userIdentifier || userId;

    // Check existing subscription
    const existingIndex = subscriptions.findIndex(s => s.userId === idKey || s.userIdentifier === idKey);

    const now = new Date();
    let startTime = now;
    let expiresAt;

    if (existingIndex !== -1 && new Date(subscriptions[existingIndex].expiresAt).getTime() > now.getTime()) {
      // Existing active subscription: extend seamlessly from current expiration
      const currentExpiry = new Date(subscriptions[existingIndex].expiresAt);
      expiresAt = new Date(currentExpiry.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000).toISOString();
      startTime = currentExpiry;
    } else {
      expiresAt = new Date(now.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000).toISOString();
    }

    const newSubRecord = {
      id: 'sub-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex'),
      userId: idKey,
      userIdentifier: idKey,
      packageId: pkg.id,
      packageName: pkg.name,
      amountUGX: amountUGX || pkg.priceUGX,
      paymentMethod,
      provider,
      transactionReference: reference,
      status: 'active',
      streamingAllowed: true,
      royalStreaming: pkg.royalStreaming,
      downloadsAllowed: pkg.downloadsAllowed,
      weeklyAllowanceMB: pkg.weeklyAllowanceMB,
      activatedAt: now.toISOString(),
      startedAt: startTime.toISOString(),
      expiresAt: expiresAt,
      updatedAt: now.toISOString()
    };

    if (existingIndex !== -1) {
      subscriptions[existingIndex] = newSubRecord;
    } else {
      subscriptions.unshift(newSubRecord);
    }
    writeJson(SUBSCRIPTIONS_FILE, subscriptions);

    // Initialize or reset weekly download quota for Royal Premium
    if (pkg.downloadsAllowed) {
      this.initRoyalDownloadQuota(idKey);
    }

    this.addAuditLog('SUBSCRIPTION_ACTIVATED', `Activated ${pkg.name} for ${idKey} via ${provider} (${reference})`, {
      userId: idKey,
      packageId: pkg.id,
      expiresAt
    });

    return newSubRecord;
  }

  getUserSubscription(userIdentifier) {
    if (!userIdentifier) return null;
    const subscriptions = readJson(SUBSCRIPTIONS_FILE);
    const sub = subscriptions.find(s => s.userId === userIdentifier || s.userIdentifier === userIdentifier);

    if (!sub) return null;

    const isExpired = new Date(sub.expiresAt).getTime() < Date.now();
    const activeSub = {
      ...sub,
      status: isExpired ? 'expired' : 'active',
      isExpired
    };

    if (isExpired) {
      activeSub.streamingAllowed = false;
      activeSub.royalStreaming = false;
      activeSub.downloadsAllowed = false;
    }

    return activeSub;
  }

  getAllSubscriptions() {
    const subscriptions = readJson(SUBSCRIPTIONS_FILE);
    const now = Date.now();
    return subscriptions.map(s => {
      const isExpired = new Date(s.expiresAt).getTime() < now;
      return {
        ...s,
        status: isExpired ? 'expired' : 'active',
        isExpired
      };
    });
  }

  getAllTransactions() {
    return readJson(TRANSACTIONS_FILE);
  }

  // --- ROYAL PREMIUM 4K DOWNLOAD TRACKING & QUOTA (900 MB Weekly) ---
  initRoyalDownloadQuota(userIdentifier) {
    const downloads = readJson(DOWNLOADS_FILE);
    const index = downloads.findIndex(d => d.userIdentifier === userIdentifier);
    const record = {
      userIdentifier,
      weekWindowStart: new Date().toISOString(),
      totalAllowanceMB: 900,
      totalAllowanceBytes: 900 * 1024 * 1024,
      usedBytes: 0,
      completedDownloads: []
    };

    if (index !== -1) {
      downloads[index] = record;
    } else {
      downloads.push(record);
    }
    writeJson(DOWNLOADS_FILE, downloads);
    return record;
  }

  getDownloadUsage(userIdentifier) {
    const downloads = readJson(DOWNLOADS_FILE);
    let record = downloads.find(d => d.userIdentifier === userIdentifier);
    const totalBytes = 900 * 1024 * 1024;

    if (!record) {
      record = {
        userIdentifier,
        weekWindowStart: new Date().toISOString(),
        totalAllowanceMB: 900,
        totalAllowanceBytes: totalBytes,
        usedBytes: 0,
        completedDownloads: []
      };
    } else {
      // Check 7-day rolling reset policy
      const windowStart = new Date(record.weekWindowStart).getTime();
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - windowStart >= SEVEN_DAYS_MS) {
        record.weekWindowStart = new Date().toISOString();
        record.usedBytes = 0;
        record.completedDownloads = [];
        this.addAuditLog('QUOTA_RESET', `Weekly 900 MB download quota reset for ${userIdentifier}`, { userIdentifier });
        const idx = downloads.findIndex(d => d.userIdentifier === userIdentifier);
        if (idx !== -1) downloads[idx] = record;
        writeJson(DOWNLOADS_FILE, downloads);
      }
    }

    const remainingBytes = Math.max(0, totalBytes - record.usedBytes);
    const remainingMB = Number((remainingBytes / (1024 * 1024)).toFixed(2));
    const usedMB = Number((record.usedBytes / (1024 * 1024)).toFixed(2));

    return {
      userIdentifier,
      totalAllowanceMB: 900,
      totalAllowanceBytes: totalBytes,
      usedBytes: record.usedBytes,
      usedMB,
      remainingBytes,
      remainingMB,
      weekWindowStart: record.weekWindowStart,
      nextResetDate: new Date(new Date(record.weekWindowStart).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  validateDownloadRequest(userIdentifier, requestedFileSizeBytes = 0) {
    const sub = this.getUserSubscription(userIdentifier);
    if (!sub || sub.status !== 'active') {
      return { allowed: false, reason: 'Active subscription required for downloads.', code: 'SUBSCRIPTION_REQUIRED' };
    }

    if (!sub.downloadsAllowed || sub.packageId !== 'pkg-royal') {
      return {
        allowed: false,
        reason: 'Downloads are exclusively available on the Royal Premium tier (UGX 35,000/month). Your current package is streaming-only.',
        code: 'TIER_UPGRADE_REQUIRED'
      };
    }

    const usage = this.getDownloadUsage(userIdentifier);
    if (requestedFileSizeBytes > 0 && (usage.usedBytes + requestedFileSizeBytes > usage.totalAllowanceBytes)) {
      return {
        allowed: false,
        reason: `Download exceeds weekly allowance. Remaining: ${usage.remainingMB} MB, Requested: ${(requestedFileSizeBytes / (1024 * 1024)).toFixed(1)} MB.`,
        code: 'QUOTA_EXCEEDED',
        usage
      };
    }

    return { allowed: true, usage, subscription: sub };
  }

  recordDownloadCompletion(userIdentifier, mediaId, mediaTitle, bytesTransferred) {
    if (!bytesTransferred || bytesTransferred <= 0) return;
    const downloads = readJson(DOWNLOADS_FILE);
    let index = downloads.findIndex(d => d.userIdentifier === userIdentifier);

    if (index === -1) {
      this.initRoyalDownloadQuota(userIdentifier);
      index = downloads.findIndex(d => d.userIdentifier === userIdentifier);
    }

    downloads[index].usedBytes = (downloads[index].usedBytes || 0) + bytesTransferred;
    downloads[index].completedDownloads = downloads[index].completedDownloads || [];
    downloads[index].completedDownloads.push({
      mediaId,
      mediaTitle,
      bytes: bytesTransferred,
      downloadedAt: new Date().toISOString()
    });

    writeJson(DOWNLOADS_FILE, downloads);
    this.addAuditLog('DOWNLOAD_COMPLETED', `${userIdentifier} downloaded ${mediaTitle} (${(bytesTransferred / (1024 * 1024)).toFixed(2)} MB)`, {
      userIdentifier,
      mediaId,
      bytesTransferred
    });
  }

  // --- AUDIT LOGGING ---
  addAuditLog(action, description, details = {}) {
    ensureDataFiles();
    const logs = readJson(AUDIT_LOGS_FILE);
    const entry = {
      id: 'log-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'),
      action,
      description,
      details,
      timestamp: new Date().toISOString()
    };
    logs.unshift(entry);
    // Keep last 1,000 logs
    if (logs.length > 1000) logs.length = 1000;
    writeJson(AUDIT_LOGS_FILE, logs);
    return entry;
  }

  getAuditLogs(limit = 100) {
    const logs = readJson(AUDIT_LOGS_FILE);
    return logs.slice(0, limit);
  }

  // Helper for HTTPS calls
  httpRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', err => reject(err));
      req.setTimeout(15000, () => {
        req.destroy(new Error('Gateway request timed out'));
      });

      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  }
}

module.exports = new SubscriptionService();
module.exports.SUBSCRIPTION_PACKAGES = SUBSCRIPTION_PACKAGES;
