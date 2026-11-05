const fs = require('fs');
try {
  if (fs.existsSync('.env')) {
    const lines = fs.readFileSync('.env', 'utf8').split('\n');
    lines.forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !process.env[match[1].trim()]) {
        process.env[match[1].trim()] = match[2].trim();
      }
    });
  }
} catch (e) {}
const express = require('express');
const path = require('path');
const https = require('https');
const http = require('http');
const { loadCountryCatalogue } = require('./src/countries/shared/country-loader');
const { getSupportedCountries } = require('./src/countries/registry');
const adminService = require('./src/services/admin-service');
const { getChart, findSongById, searchMusic, resolveMedia } = require('./src/services/music-service');
const subscriptionService = require('./src/services/subscription-service');

const app = express();

// Helper to extract user identity from headers, cookies, or query
function extractUserIdentifier(req) {
  let userIdentifier = req.headers['x-user-id'] || req.headers['x-auth-user'] || req.query.userId || req.query.identifier;
  if (!userIdentifier && req.headers.cookie) {
    const rawCookies = req.headers.cookie.split(';');
    for (const c of rawCookies) {
      const parts = c.trim().split('=');
      const cookieName = parts[0];
      if (cookieName === 'sanyuhub_auth_user' && parts[1]) {
        try {
          const cookieVal = parts.slice(1).join('=');
          const decoded = decodeURIComponent(cookieVal);
          const parsed = JSON.parse(decoded);
          userIdentifier = parsed.email || parsed.phone || parsed.username || parsed.id;
          break;
        } catch (e) {}
      }
    }
  }
  return userIdentifier ? String(userIdentifier).trim() : null;
}

// Strict backend subscription authorization middleware for protected content
function requireSubscription(req, res, next) {
  const userIdentifier = extractUserIdentifier(req);
  const access = subscriptionService.checkUserAccess(userIdentifier);

  if (access.hasAccess) {
    req.userAccess = access;
    return next();
  }

  // Not authorized: handle API vs Page requests
  const isApi = req.path.startsWith('/api/');
  if (isApi) {
    return res.status(403).json({
      success: false,
      error: 'SUBSCRIPTION_REQUIRED',
      reason: access.reason || 'Active subscription or free trial required.',
      status: access.status || 'inactive',
      trialEligible: access.trialEligible !== false
    });
  }

  // Page request: redirect to /payment with clear parameters and returnUrl
  const returnUrl = encodeURIComponent(req.originalUrl || req.path);
  let reasonMsg = 'An active subscription or free trial is required to view this content.';
  if (access.reason === 'SUBSCRIPTION_EXPIRED') {
    reasonMsg = 'Your subscription or free trial has expired. Please choose a package to continue.';
  } else if (access.reason === 'SUBSCRIPTION_REVOKED') {
    reasonMsg = 'Your subscription access has been revoked. Please contact support or purchase a new package.';
  }

  return res.redirect(`/payment?returnUrl=${returnUrl}&message=${encodeURIComponent(reasonMsg)}&status=${access.status || 'required'}`);
}


// Capture raw body for webhook verification while parsing JSON for all other routes
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

function proxyStream(targetUrl, req, res, defaultReferer = 'https://swahix.com/') {
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing stream URL parameter.' });
  }

  try {
    const parsed = new URL(targetUrl);
    const mod = parsed.protocol === 'https:' ? https : http;

    const clientHeaders = {
      'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
      'Accept': req.headers['accept'] || '*/*',
      'Referer': req.headers['referer'] || defaultReferer
    };

    if (req.headers['range']) {
      clientHeaders['Range'] = req.headers['range'];
    }

    const proxyReq = mod.get(targetUrl, { headers: clientHeaders }, (proxyRes) => {
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        return proxyStream(proxyRes.headers.location, req, res, defaultReferer);
      }

      res.status(proxyRes.statusCode);

      const passHeaders = ['content-type', 'content-length', 'accept-ranges', 'content-range', 'cache-control'];
      passHeaders.forEach(h => {
        if (proxyRes.headers[h]) {
          res.setHeader(h, proxyRes.headers[h]);
        }
      });

      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to proxy media stream.' });
      }
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(400).json({ error: 'Invalid URL formatting.' });
    }
  }
}

// Stream Proxy API Route for protected media URLs
app.get('/api/stream-proxy', requireSubscription, (req, res) => {
  proxyStream(req.query.url, req, res);
});

// In-memory indexing and fast lookup caches for fast playback & catalog retrieval
const movieLookupCache = new Map();
const seriesLookupCache = new Map();
const concertLookupCache = new Map();

async function refreshLookupIndex() {
  const supported = getSupportedCountries();
  for (const c of supported) {
    const [cMovies, cSeries, cConcerts] = await Promise.all([
      loadCountryCatalogue(c.code, 'movies').catch(() => ({ movies: [] })),
      loadCountryCatalogue(c.code, 'series').catch(() => ({ series: [] })),
      loadCountryCatalogue(c.code, 'concerts').catch(() => ({ concerts: [] }))
    ]);

    if (cMovies && cMovies.movies) {
      cMovies.movies.forEach(m => {
        if (m && m.id) movieLookupCache.set(m.id, m);
      });
    }
    if (cSeries && cSeries.series) {
      cSeries.series.forEach(s => {
        if (s && s.id) seriesLookupCache.set(s.id, s);
      });
    }
    if (cConcerts && cConcerts.concerts) {
      cConcerts.concerts.forEach(cn => {
        if (cn && cn.id) concertLookupCache.set(cn.id, cn);
        if (cn && cn.slug) concertLookupCache.set(cn.slug, cn);
      });
    }
  }
}

// Background warm-up at startup
setImmediate(() => {
  refreshLookupIndex().catch(err => {
    console.warn("Background catalogue warm-up warning:", err.message);
  });
});

// API Route for Live TV Channels
app.get('/api/live-tv/channels', requireSubscription, async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=60');
    const country = (req.query.country || 'ug').trim().toLowerCase();
    const catalogueData = await loadCountryCatalogue(country, 'tv');
    res.json({
      channels: catalogueData.tvChannels || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve TV channels.' });
  }
});

// API Route for Radio Stations
app.get('/api/radio', requireSubscription, async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=60');
    const country = (req.query.country || 'ug').trim().toLowerCase();
    const catalogueData = await loadCountryCatalogue(country, 'radio');
    res.json({
      stations: catalogueData.radioStations || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve radio stations.' });
  }
});

// API Routes for Music Discovery & Playback
app.get('/api/music/charts', requireSubscription, (req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=300');
    const chartKey = req.query.chart || 'uganda';
    const chartData = getChart(chartKey);
    res.json(chartData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve music charts.' });
  }
});

app.get('/api/music/search', requireSubscription, async (req, res) => {
  try {
    const query = req.query.q || req.query.query || '';
    const limit = parseInt(req.query.limit, 10) || 12;
    const results = await searchMusic(query, limit);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search worldwide music.' });
  }
});

app.get('/api/music/resolve', requireSubscription, async (req, res) => {
  try {
    const id = req.query.id || req.query.url;
    if (!id) {
      return res.status(400).json({ error: 'Missing music ID or media URL.' });
    }
    const resolved = await resolveMedia(id);
    res.json(resolved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve media sources: ' + err.message });
  }
});

app.get('/api/music/download', requireSubscription, async (req, res) => {
  try {
    const mediaUrl = req.query.url;
    const type = req.query.type || 'audio';
    const filename = req.query.filename || `sanyuhub_track.${type === 'video' ? 'mp4' : 'mp3'}`;

    if (!mediaUrl) {
      return res.status(400).json({ error: 'Missing media URL.' });
    }

    const parsed = new URL(mediaUrl);
    const mod = parsed.protocol === 'https:' ? https : http;

    const proxyReq = mod.get(mediaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SanyuHub/1.0',
        'Accept': '*/*'
      }
    }, (proxyRes) => {
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        return res.redirect(proxyRes.headers.location);
      }

      const contentType = type === 'video' ? 'video/mp4' : 'audio/mpeg';
      res.setHeader('Content-Type', proxyRes.headers['content-type'] || contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      if (proxyRes.headers['content-length']) {
        res.setHeader('Content-Length', proxyRes.headers['content-length']);
      }

      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream download file.' });
      }
    });

  } catch (err) {
    if (!res.headersSent) {
      res.status(400).json({ error: 'Invalid download request.' });
    }
  }
});

// ==========================================
// SUBSCRIPTION & PAYMENT REST API ENDPOINTS
// ==========================================

// Get all subscription packages
app.get('/api/subscriptions/packages', (req, res) => {
  try {
    const packages = subscriptionService.getPackages();
    const gatewayStatus = subscriptionService.getGatewayStatus();
    res.json({ success: true, packages, gatewayStatus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Activate 2-Day Free Trial
app.post('/api/subscriptions/trial/activate', (req, res) => {
  try {
    const { userIdentifier, email, phone, userId } = req.body;
    const identifier = userIdentifier || email || userId || phone;
    if (!identifier) {
      return res.status(400).json({ success: false, error: 'User identifier is required to claim trial' });
    }

    if (!subscriptionService.isTrialEligible(identifier)) {
      return res.status(400).json({
        success: false,
        error: 'TRIAL_ALREADY_USED',
        message: 'Free trial has already been claimed for this account or device.'
      });
    }

    const trial = subscriptionService.activateTrial({
      userId: identifier,
      userIdentifier: identifier,
      phone,
      email
    });

    res.json({ success: true, subscription: trial });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Check Trial Eligibility
app.get('/api/subscriptions/trial/eligibility', (req, res) => {
  try {
    const identifier = req.headers['x-user-id'] || req.query.userId || req.query.identifier || req.query.email;
    if (!identifier) {
      return res.json({ success: true, eligible: false, message: 'Missing user identifier' });
    }
    const eligible = subscriptionService.isTrialEligible(identifier);
    res.json({ success: true, eligible });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user's current subscription & download usage
app.get('/api/subscriptions/current', (req, res) => {
  try {
    const userIdentifier = extractUserIdentifier(req) || req.headers['x-user-id'] || req.query.userId || req.query.identifier;
    if (!userIdentifier) {
      return res.status(400).json({ success: false, error: 'User identifier is required' });
    }

    const sub = subscriptionService.getUserSubscription(userIdentifier);
    const access = subscriptionService.checkUserAccess(userIdentifier);
    let usage = null;
    if (sub && sub.packageId === 'pkg-royal') {
      usage = subscriptionService.getDownloadUsage(userIdentifier);
    }

    res.json({
      success: true,
      userIdentifier: userIdentifier,
      subscription: sub,
      access: access,
      downloadUsage: usage
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Synchronize session between client and authoritative backend database
app.get('/api/auth/session', (req, res) => {
  try {
    const userIdentifier = extractUserIdentifier(req);
    if (!userIdentifier) {
      return res.json({
        success: true,
        authenticated: false,
        hasAccess: false,
        user: null,
        subscription: null
      });
    }

    const access = subscriptionService.checkUserAccess(userIdentifier);
    const sub = subscriptionService.getUserSubscription(userIdentifier);

    return res.json({
      success: true,
      authenticated: true,
      userIdentifier: userIdentifier,
      hasAccess: access.hasAccess,
      access: access,
      subscription: sub || null,
      isAdmin: Boolean(access.isAdmin)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Gateway status endpoint
app.get('/api/payments/gateway-status', (req, res) => {
  try {
    const status = subscriptionService.getGatewayStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Initiate Mobile Money payment via Lworx Pay
app.post('/api/payments/momo/initiate', async (req, res) => {
  try {
    const { packageId, phone, userIdentifier, customEndpoint } = req.body;
    if (!packageId || !phone || !userIdentifier) {
      return res.status(400).json({ success: false, error: 'Missing required parameters: packageId, phone, userIdentifier' });
    }

    const result = await subscriptionService.initiateLworxPayment({
      packageId,
      phone,
      userIdentifier,
      customEndpoint
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Check status of a payment reference (with Lworx polling fallback)
app.get('/api/payments/status/:reference', async (req, res) => {
  try {
    const result = await subscriptionService.checkLworxStatus(req.params.reference);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Initiate Card Payment via Flutterwave
app.post('/api/payments/card/initiate', async (req, res) => {
  try {
    const { packageId, userIdentifier, email, name, phone, redirectUrl } = req.body;
    if (!packageId || !userIdentifier) {
      return res.status(400).json({ success: false, error: 'Missing packageId or userIdentifier' });
    }

    const result = await subscriptionService.initiateCardPayment({
      packageId,
      userIdentifier,
      email,
      name,
      phone,
      redirectUrl
    });

    if (!result.success && !result.configured) {
      return res.status(503).json(result);
    }

    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Official Lworx Pay Webhook (HMAC-SHA256 signature verification on raw body)
app.post('/api/payments/lworx/webhook', async (req, res) => {
  try {
    const signature = req.get('X-LworxPay-Signature') || req.get('x-lworxpay-signature');
    const rawBody = req.rawBody || JSON.stringify(req.body);

    const result = await subscriptionService.handleLworxWebhook(rawBody, signature);
    res.status(200).json({ received: true, ...result });
  } catch (err) {
    if (err.message && err.message.startsWith('INVALID_WEBHOOK_SIGNATURE')) {
      return res.status(401).json({ error: 'Signature verification failed' });
    }
    res.status(400).json({ error: err.message });
  }
});

// Official Flutterwave Card Webhook (verif-hash signature verification)
app.post('/api/payments/flutterwave/webhook', async (req, res) => {
  try {
    const signature = req.get('verif-hash');
    const result = await subscriptionService.handleFlutterwaveWebhook(req.body, signature);
    res.status(200).json({ received: true, ...result });
  } catch (err) {
    if (err.message === 'INVALID_FLUTTERWAVE_SIGNATURE') {
      return res.status(401).json({ error: 'Signature verification failed' });
    }
    res.status(400).json({ error: err.message });
  }
});

// Protected Media Download Endpoint (strictly enforcing Royal Premium and 900 MB weekly quota)
app.get('/api/media/download', async (req, res) => {
  try {
    const userIdentifier = req.headers['x-user-id'] || req.query.userId || req.query.identifier;
    const mediaId = req.query.id;
    const filename = req.query.filename || `sanyuhub_download_${Date.now()}.mp4`;

    if (!userIdentifier) {
      return res.status(401).json({ error: 'Authentication required to download media.' });
    }

    if (!mediaId) {
      return res.status(400).json({ error: 'Missing media ID parameter.' });
    }

    // Lookup movie/series
    let mediaItem = movieLookupCache.get(mediaId) || seriesLookupCache.get(mediaId);
    if (!mediaItem) {
      const supported = getSupportedCountries();
      for (const c of supported) {
        const cMovies = await loadCountryCatalogue(c.code, 'movies').catch(() => ({ movies: [] }));
        const found = (cMovies.movies || []).find(m => m.id === mediaId);
        if (found) {
          mediaItem = found;
          break;
        }
      }
    }

    if (!mediaItem || (!mediaItem.mediaUrl && !mediaItem.downloadUrl)) {
      return res.status(404).json({ error: 'Media file not found for download.' });
    }

    const downloadTargetUrl = mediaItem.downloadUrl || mediaItem.mediaUrl;

    // Head request to estimate content length for quota check
    let estimatedSize = 50 * 1024 * 1024; // Default 50MB estimate if header absent
    try {
      const parsedUrl = new URL(downloadTargetUrl);
      const mod = parsedUrl.protocol === 'https:' ? https : http;
      await new Promise((resolve) => {
        const headReq = mod.request(downloadTargetUrl, { method: 'HEAD', headers: { 'User-Agent': 'SanyuHub/1.0' } }, (headRes) => {
          if (headRes.headers['content-length']) {
            estimatedSize = parseInt(headRes.headers['content-length'], 10);
          }
          resolve();
        });
        headReq.on('error', () => resolve());
        headReq.setTimeout(4000, () => { headReq.destroy(); resolve(); });
        headReq.end();
      });
    } catch (e) {}

    // Enforce subscription tier and download quota
    const check = subscriptionService.validateDownloadRequest(userIdentifier, estimatedSize);
    if (!check.allowed) {
      return res.status(403).json({
        error: check.reason,
        code: check.code,
        usage: check.usage
      });
    }

    // Stream download through proxy and track byte consumption
    const parsed = new URL(downloadTargetUrl);
    const mod = parsed.protocol === 'https:' ? https : http;

    const proxyReq = mod.get(downloadTargetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SanyuHub/1.0',
        'Accept': '*/*'
      }
    }, (proxyRes) => {
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        return res.redirect(proxyRes.headers.location);
      }

      res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      if (proxyRes.headers['content-length']) {
        res.setHeader('Content-Length', proxyRes.headers['content-length']);
      }

      let downloadedBytes = 0;
      proxyRes.on('data', chunk => {
        downloadedBytes += chunk.length;
      });

      proxyRes.pipe(res);

      res.on('finish', () => {
        if (downloadedBytes > 0) {
          subscriptionService.recordDownloadCompletion(userIdentifier, mediaId, mediaItem.title || 'Movie', downloadedBytes);
        }
      });
    });

    proxyReq.on('error', () => {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream media download.' });
      }
    });

  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error during media download: ' + err.message });
    }
  }
});

// API Route for Movies Catalogue
app.get('/api/movies', requireSubscription, async (req, res) => {
  try {
    const country = (req.query.country || 'ug').trim().toLowerCase();
    res.setHeader('Cache-Control', 'public, max-age=60');

    const catalogueData = await loadCountryCatalogue(country, 'movies');
    const movies = catalogueData.movies || [];
    movies.forEach(m => { if (m && m.id) movieLookupCache.set(m.id, m); });

    // Extract query parameters
    const search = (req.query.search || '').trim().toLowerCase();
    const vjFilter = (req.query.vj || req.query.category || '').trim().toLowerCase();
    const genreFilter = (req.query.genre || '').trim().toLowerCase();
    const yearFilter = req.query.year ? parseInt(req.query.year, 10) : null;
    const sort = (req.query.sort || 'recently-added').trim().toLowerCase();

    // Extract unique VJs and Genres
    const vjSet = new Set();
    const genreSet = new Set();
    movies.forEach(m => {
      if (m.vj) vjSet.add(m.vj);
      if (m.genres && Array.isArray(m.genres)) {
        m.genres.forEach(g => genreSet.add(g));
      }
    });
    const vjs = Array.from(vjSet).sort();
    const genres = Array.from(genreSet).sort();

    // Filter catalogue
    let filtered = movies.filter(movie => {
      if (search) {
        const matchTitle = movie.title && movie.title.toLowerCase().includes(search);
        const matchVj = movie.vj && movie.vj.toLowerCase().includes(search);
        const matchOverview = movie.overview && movie.overview.toLowerCase().includes(search);
        if (!matchTitle && !matchVj && !matchOverview) return false;
      }

      if (vjFilter && vjFilter !== 'all') {
        const vjLower = (movie.vj || '').toLowerCase();
        if (!vjLower.includes(vjFilter)) return false;
      }

      if (genreFilter && genreFilter !== 'all') {
        const hasGenre = movie.genres && movie.genres.some(g => g.toLowerCase() === genreFilter);
        if (!hasGenre) return false;
      }

      if (yearFilter && movie.year !== yearFilter) {
        return false;
      }

      return true;
    });

    // Sorting
    if (sort === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'year') {
      filtered.sort((a, b) => (b.year || 0) - (a.year || 0));
    } else if (sort === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      // Default: recently-added
      filtered.reverse();
    }

    // Pagination
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 24;
    if (page < 1) page = 1;
    if (limit < 1) limit = 24;
    if (limit > 100) limit = 100;

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    if (page > totalPages && totalPages > 0) page = totalPages;

    const startIndex = (page - 1) * limit;
    const paginatedMovies = filtered.slice(startIndex, startIndex + limit);

    res.json({
      movies: paginatedMovies,
      page: page,
      limit: limit,
      total: total,
      totalPages: totalPages,
      vjs: vjs,
      genres: genres
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve movie catalogue.' });
  }
});

// Single movie detail API
app.get('/api/movies/:id', requireSubscription, async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=120');
    const movieId = req.params.id;

    if (movieLookupCache.has(movieId)) {
      return res.json(movieLookupCache.get(movieId));
    }

    const supported = getSupportedCountries();
    for (const c of supported) {
      const cData = await loadCountryCatalogue(c.code, 'movies');
      if (cData && cData.movies) {
        for (const m of cData.movies) {
          movieLookupCache.set(m.id, m);
          if (m.id === movieId) {
            return res.json(m);
          }
        }
      }
    }

    return res.status(404).json({ error: 'Movie not found' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve movie details.' });
  }
});

// API Route for Series Catalogue
app.get('/api/series', requireSubscription, async (req, res) => {
  try {
    const country = (req.query.country || 'ug').trim().toLowerCase();
    res.setHeader('Cache-Control', 'public, max-age=60');

    const catalogueData = await loadCountryCatalogue(country, 'series');
    const seriesList = catalogueData.series || [];
    seriesList.forEach(s => { if (s && s.id) seriesLookupCache.set(s.id, s); });

    const search = (req.query.search || '').trim().toLowerCase();
    const vjFilter = (req.query.vj || '').trim().toLowerCase();
    const genreFilter = (req.query.genre || '').trim().toLowerCase();
    const sort = (req.query.sort || 'popular').trim().toLowerCase();

    const genreSet = new Set();
    seriesList.forEach(s => {
      if (s.genres && Array.isArray(s.genres)) {
        s.genres.forEach(g => genreSet.add(g));
      }
    });
    const genres = Array.from(genreSet).sort();

    let filtered = seriesList.filter(s => {
      if (search) {
        const matchTitle = s.title && s.title.toLowerCase().includes(search);
        const matchVj = s.vj && s.vj.toLowerCase().includes(search);
        const matchOverview = s.overview && s.overview.toLowerCase().includes(search);
        if (!matchTitle && !matchVj && !matchOverview) return false;
      }

      if (vjFilter && vjFilter !== 'all') {
        const vjLower = (s.vj || '').toLowerCase();
        if (!vjLower.includes(vjFilter)) return false;
      }

      if (genreFilter && genreFilter !== 'all') {
        const hasGenre = s.genres && s.genres.some(g => g.toLowerCase() === genreFilter);
        if (!hasGenre) return false;
      }

      return true;
    });

    if (sort === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 24;
    if (page < 1) page = 1;
    if (limit < 1) limit = 24;
    if (limit > 100) limit = 100;

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    if (page > totalPages && totalPages > 0) page = totalPages;

    const startIndex = (page - 1) * limit;
    const paginatedSeries = filtered.slice(startIndex, startIndex + limit);

    res.json({
      series: paginatedSeries,
      page: page,
      limit: limit,
      total: total,
      totalPages: totalPages,
      genres: genres
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve series catalogue.' });
  }
});

// Single Series Detail API
app.get('/api/series/:id', requireSubscription, async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=120');
    const seriesId = req.params.id;

    if (seriesLookupCache.has(seriesId)) {
      return res.json(seriesLookupCache.get(seriesId));
    }

    const supported = getSupportedCountries();
    for (const c of supported) {
      const cData = await loadCountryCatalogue(c.code, 'series');
      if (cData && cData.series) {
        for (const s of cData.series) {
          seriesLookupCache.set(s.id, s);
          if (s.id === seriesId) {
            return res.json(s);
          }
        }
      }
    }

    return res.status(404).json({ error: 'Series not found' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve series details.' });
  }
});

// API Route for Concerts
app.get('/api/concerts', requireSubscription, async (req, res) => {
  try {
    const country = (req.query.country || 'ug').trim().toLowerCase();

    const catalogueData = await loadCountryCatalogue(country, 'concerts');
    const concerts = catalogueData.concerts || [];

    const search = (req.query.search || '').trim().toLowerCase();

    let filtered = concerts.filter(c => {
      if (search) {
        const matchTitle = c.title && c.title.toLowerCase().includes(search);
        const matchVenue = c.venue && c.venue.toLowerCase().includes(search);
        const matchDesc = c.description && c.description.toLowerCase().includes(search);
        const matchOrganizer = c.organizer && c.organizer.toLowerCase().includes(search);
        if (!matchTitle && !matchVenue && !matchDesc && !matchOrganizer) return false;
      }
      return true;
    });

    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 24;
    if (page < 1) page = 1;
    if (limit < 1) limit = 24;
    if (limit > 100) limit = 100;

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    if (page > totalPages && totalPages > 0) page = totalPages;

    const startIndex = (page - 1) * limit;
    const paginatedConcerts = filtered.slice(startIndex, startIndex + limit);

    res.json({
      concerts: paginatedConcerts,
      page: page,
      limit: limit,
      total: total,
      totalPages: totalPages
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve upcoming concerts.' });
  }
});

// Single concert detail API
app.get('/api/concerts/:id', requireSubscription, async (req, res) => {
  try {
    const supported = getSupportedCountries();
    let allConcerts = [];
    for (const c of supported) {
      const cData = await loadCountryCatalogue(c.code, 'concerts');
      if (cData && cData.concerts) {
        allConcerts.push(...cData.concerts);
      }
    }

    const concert = allConcerts.find(c => c.id === req.params.id || c.slug === req.params.id);
    if (!concert) {
      return res.status(404).json({ error: 'Concert not found' });
    }
    res.json(concert);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve concert details.' });
  }
});

// Dynamic Page Routes
app.get('/concert/:id', requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'concert.html'));
});

app.get('/movie/:id', requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'movie.html'));
});

app.get('/movie', requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'movies.html'));
});

app.get(['/movies', '/movies/'], requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'movies.html'));
});

app.get('/series/watch/:id', requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'series-watch.html'));
});

app.get('/series/:id', requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'series-detail.html'));
});

app.get(['/series', '/series/'], requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'series.html'));
});

app.get(['/more', '/more/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'more.html'));
});

app.get(['/music/watch/:id', '/music/watch/:id/'], requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'music-watch.html'));
});

app.get(['/music', '/music/'], requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'music.html'));
});

app.get(['/signup', '/signup/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get(['/login', '/login/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get(['/podcasts', '/podcasts/'], requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'podcasts.html'));
});

app.get(['/profile', '/profile/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'profile.html'));
});

app.get(['/admin', '/admin/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get(['/payment', '/payment/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'payment.html'));
});

app.get(['/live-tv', '/live-tv/'], requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'live-tv.html'));
});

app.get(['/trending', '/trending/'], requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'trending.html'));
});

app.get(['/popular', '/popular/'], requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'popular.html'));
});

app.get(['/popular-series', '/popular-series/'], requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'popular-series.html'));
});

app.get(['/featured', '/featured/'], requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'featured.html'));
});

app.get(['/recently-added', '/recently-added/'], requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'recently-added.html'));
});

app.get(['/continue-watching', '/continue-watching/'], requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'continue-watching.html'));
});

app.get(['/payment/verify', '/payment/verify/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'payment-verify.html'));
});


app.get(['/saved', '/saved/'], requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'saved.html'));
});

app.get(['/downloaded', '/downloaded/'], requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'downloaded.html'));
});

app.get(['/settings', '/settings/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'settings.html'));
});

app.get(['/settings/country', '/settings/country/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'settings-country.html'));
});

app.get(['/settings/app-preferences', '/settings/app-preferences/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'settings-app.html'));
});

app.get(['/settings/customization', '/settings/customization/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'settings-customization.html'));
});

app.get(['/settings/other', '/settings/other/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'settings-other.html'));
});

app.get(['/about', '/about/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});

app.get(['/about/terms', '/about/terms/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'about-terms.html'));
});

app.get(['/about/help', '/about/help/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'about-help.html'));
});

app.get(['/about/privacy', '/about/privacy/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'about-privacy.html'));
});

app.get('/watch/:id', requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'watch.html'));
});

app.get('/watch', requireSubscription, (req, res) => {
  res.redirect('/movies');
});

// Live TV EPG Endpoint
app.get('/api/live-tv/epg/:id', requireSubscription, async (req, res) => {
  const channelId = req.params.id;
  res.json({
    channelId: channelId,
    schedule: [],
    message: 'Programme schedule currently unavailable.'
  });
});

// Live TV Concurrent Viewer Count Endpoint
app.get('/api/live-tv/viewers/:id', requireSubscription, async (req, res) => {
  const channelId = req.params.id;
  res.json({
    channelId: channelId,
    viewers: null,
    message: 'Viewers unavailable'
  });
});

// Live TV Watch Routes
app.get(['/live-tv/watch/:id', '/live-tv/watch/:id/'], requireSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, 'live-tv', 'watch.html'));
});

app.get(['/live-tv/watch', '/live-tv/watch/'], requireSubscription, (req, res) => {
  res.redirect('/live-tv/');
});


// ==========================================
// ADMIN PANEL API ENDPOINTS
// ==========================================

function requireAdmin(req, res, next) {
  const role = req.headers['x-user-role'] || (req.session && req.session.user && req.session.user.role);
  if (role !== 'admin' && req.headers['x-admin-token'] !== 'super-admin-secret-2025') {
    return res.status(403).json({ success: false, error: 'Unauthorized: Admin privileges required' });
  }
  next();
}

app.get('/api/admin/users', requireAdmin, (req, res) => {
  try {
    const users = adminService.getAllUsers();
    const subs = subscriptionService.getAllSubscriptions();
    const augmentedUsers = users.map(u => {
      const sub = subs.find(s => s.userId === u.id || s.userId === u.email || s.userIdentifier === u.email);
      let usage = null;
      if (sub && sub.packageId === 'pkg-royal') {
        usage = subscriptionService.getDownloadUsage(u.email || u.id);
      }
      return {
        ...u,
        subscription: sub || null,
        downloadUsage: usage
      };
    });
    res.json({ success: true, users: augmentedUsers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/subscriptions', requireAdmin, (req, res) => {
  try {
    const subscriptions = subscriptionService.getAllSubscriptions();
    const transactions = subscriptionService.getAllTransactions();
    const auditLogs = subscriptionService.getAuditLogs(100);
    res.json({ success: true, subscriptions, transactions, auditLogs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/subscriptions/manual-verify', requireAdmin, (req, res) => {
  try {
    const { identifier, packageId, paymentMethod, reference, durationDays, notes } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, error: 'User identifier is required' });
    }

    const pkgId = packageId || (durationDays === 3 ? 'pkg-3day' : (durationDays === 7 ? 'pkg-7day' : 'pkg-monthly'));
    const ref = reference || `ADMIN-MANUAL-${Date.now()}`;
    const method = paymentMethod || 'MTN';

    const sub = subscriptionService.activateSubscription({
      userId: identifier,
      userIdentifier: identifier,
      packageId: pkgId,
      paymentMethod: method,
      provider: 'admin-manual',
      reference: ref
    });

    subscriptionService.addAuditLog('ADMIN_MANUAL_VERIFY', `Admin manually verified & activated ${pkgId} for ${identifier}`, {
      identifier,
      packageId: pkgId,
      reference: ref,
      notes
    });

    res.json({ success: true, subscription: sub, message: 'Account verified and subscription activated successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/:id/validate', requireAdmin, (req, res) => {
  try {
    const { status } = req.body;
    const updated = adminService.updateValidationStatus(req.params.id, status);
    res.json({ success: true, user: updated, message: `Account validation set to ${status}` });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/:id/verify', requireAdmin, (req, res) => {
  try {
    const { isVerified } = req.body;
    const updated = adminService.setVerificationStatus(req.params.id, isVerified);
    res.json({ success: true, user: updated, message: isVerified ? 'Account verified' : 'Account unverified' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  try {
    const deleted = adminService.deleteUser(req.params.id);
    res.json({ success: true, user: deleted, message: 'Account permanently deleted' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/:id/promote', requireAdmin, (req, res) => {
  try {
    const { role } = req.body;
    const updated = adminService.promoteUser(req.params.id, role);
    res.json({ success: true, user: updated, message: `User promoted to ${role}` });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/broadcasts', requireAdmin, (req, res) => {
  try {
    const { title, message, targetGroup, requestId } = req.body;
    const result = adminService.createBroadcast({ title, message, targetGroup, requestId });
    res.json({ success: true, broadcast: result.broadcast, duplicate: result.duplicate, message: result.duplicate ? 'Duplicate broadcast ignored' : 'Broadcast sent successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/broadcasts', requireAdmin, (req, res) => {
  try {
    const broadcasts = adminService.getAllBroadcasts();
    res.json({ success: true, broadcasts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/notifications', (req, res) => {
  try {
    const role = req.headers['x-user-role'] || 'user';
    const userId = req.headers['x-user-id'] || 'anon';
    const notifications = adminService.getUserNotifications(userId, role);
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// Mount TMDB & Discovery Endpoints
const tmdbService = require('./src/services/tmdb-service');
const streamRegistry = require('./src/services/stream-registry');
const matchingService = require('./src/services/matching-service');

app.get('/api/discover/reconciliation', requireSubscription, (req, res) => {
  res.json(streamRegistry.getReconciliation());
});

app.get('/api/discover/trending', requireSubscription, async (req, res) => {
  try {
    const timeWindow = req.query.timeWindow === 'week' ? 'week' : 'day';
    const type = req.query.type === 'tv' ? 'tv' : 'movie';
    const page = parseInt(req.query.page, 10) || 1;

    let data;
    if (type === 'tv') {
      data = await tmdbService.getTrendingSeries(timeWindow, page);
    } else {
      data = await tmdbService.getTrendingMovies(timeWindow, page);
    }

    const enriched = matchingService.enrichTMDBList(data.results || [], type);
    res.json({
      page: data.page,
      total_pages: data.total_pages,
      total_results: data.total_results,
      results: enriched
    });
  } catch (err) {
    console.error('Error fetching trending:', err.message);
    res.status(500).json({ error: 'Failed to fetch trending data.' });
  }
});

app.get('/api/discover/popular', requireSubscription, async (req, res) => {
  try {
    const type = req.query.type === 'tv' ? 'tv' : 'movie';
    const page = parseInt(req.query.page, 10) || 1;

    let data;
    if (type === 'tv') {
      data = await tmdbService.getPopularSeries(page);
    } else {
      data = await tmdbService.getPopularMovies(page);
    }

    const enriched = matchingService.enrichTMDBList(data.results || [], type);
    res.json({
      page: data.page,
      total_pages: data.total_pages,
      total_results: data.total_results,
      results: enriched
    });
  } catch (err) {
    console.error('Error fetching popular:', err.message);
    res.status(500).json({ error: 'Failed to fetch popular data.' });
  }
});

app.get('/api/discover/top-rated', requireSubscription, async (req, res) => {
  try {
    const type = req.query.type === 'tv' ? 'tv' : 'movie';
    const page = parseInt(req.query.page, 10) || 1;

    let data;
    if (type === 'tv') {
      data = await tmdbService.getTopRatedSeries(page);
    } else {
      data = await tmdbService.getTopRatedMovies(page);
    }

    const enriched = matchingService.enrichTMDBList(data.results || [], type);
    res.json({
      page: data.page,
      total_pages: data.total_pages,
      total_results: data.total_results,
      results: enriched
    });
  } catch (err) {
    console.error('Error fetching top-rated:', err.message);
    res.status(500).json({ error: 'Failed to fetch top-rated data.' });
  }
});

app.get('/api/discover/now-playing', requireSubscription, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const data = await tmdbService.getNowPlayingMovies(page);
    const enriched = matchingService.enrichTMDBList(data.results || [], 'movie');
    res.json({ ...data, results: enriched });
  } catch (err) {
    console.error('Error fetching now playing:', err.message);
    res.status(500).json({ error: 'Failed to fetch now playing data.' });
  }
});

app.get('/api/discover/upcoming', requireSubscription, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const data = await tmdbService.getUpcomingMovies(page);
    const enriched = matchingService.enrichTMDBList(data.results || [], 'movie');
    res.json({ ...data, results: enriched });
  } catch (err) {
    console.error('Error fetching upcoming:', err.message);
    res.status(500).json({ error: 'Failed to fetch upcoming data.' });
  }
});

app.get('/api/discover/on-the-air', requireSubscription, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const data = await tmdbService.getOnTheAirSeries(page);
    const enriched = matchingService.enrichTMDBList(data.results || [], 'tv');
    res.json({ ...data, results: enriched });
  } catch (err) {
    console.error('Error fetching on the air series:', err.message);
    res.status(500).json({ error: 'Failed to fetch on the air series.' });
  }
});

app.get('/api/discover/airing-today', requireSubscription, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const data = await tmdbService.getAiringTodaySeries(page);
    const enriched = matchingService.enrichTMDBList(data.results || [], 'tv');
    res.json({ ...data, results: enriched });
  } catch (err) {
    console.error('Error fetching airing today series:', err.message);
    res.status(500).json({ error: 'Failed to fetch airing today series.' });
  }
});

app.get('/api/discover/search', requireSubscription, async (req, res) => {
  try {
    const query = req.query.query || '';
    const type = req.query.type === 'tv' ? 'tv' : 'movie';
    const year = req.query.year || null;
    let data;
    if (type === 'tv') {
      data = await tmdbService.searchSeries(query, year);
    } else {
      data = await tmdbService.searchMovies(query, year);
    }
    const enriched = matchingService.enrichTMDBList(data.results || [], type);
    res.json({ ...data, results: enriched });
  } catch (err) {
    console.error('Error in discover search:', err.message);
    res.status(500).json({ error: 'Failed to search discover.' });
  }
});

app.get('/api/discover/tv/:id/season/:season/episode/:episode', requireSubscription, async (req, res) => {
  try {
    const { id, season, episode } = req.params;
    const data = await tmdbService.getEpisodeDetails(id, season, episode);
    res.json(data);
  } catch (err) {
    console.error('Error fetching episode details:', err.message);
    res.status(500).json({ error: 'Failed to fetch episode details.' });
  }
});

app.get('/api/discover/tv/:id/season/:season', requireSubscription, async (req, res) => {
  try {
    const { id, season } = req.params;
    const data = await tmdbService.getSeasonDetails(id, season);
    res.json(data);
  } catch (err) {
    console.error('Error fetching season details:', err.message);
    res.status(500).json({ error: 'Failed to fetch season details.' });
  }
});

app.get('/api/discover/details', requireSubscription, async (req, res) => {
  try {
    const id = req.query.id;
    const type = req.query.type === 'tv' ? 'tv' : 'movie';
    if (!id) return res.status(400).json({ error: 'Missing id parameter' });

    let details;
    if (type === 'tv') {
      details = await tmdbService.getSeriesDetails(id);
    } else {
      details = await tmdbService.getMovieDetails(id);
    }
    const matchResult = matchingService.matchTitleToStreams(details, type);
    res.json({
      ...details,
      has_playable_stream: matchResult.matched,
      matched_stream: matchResult.matched ? matchResult.best_match : null,
      match_confidence: matchResult.confidence_level
    });
  } catch (err) {
    console.error('Error fetching details:', err.message);
    res.status(500).json({ error: 'Failed to fetch details.' });
  }
});


// Serve all static assets and pages
app.use(express.static(__dirname, {
  extensions: ['html'],
  index: 'index.html'
}));

// Fallback route handler for clean URLs
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  const reqPath = req.path.endsWith('/') ? req.path.slice(0, -1) : req.path;
  const filePath = path.join(__dirname, `${reqPath}.html`);

  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).sendFile(path.join(__dirname, 'index.html'));
    }
  });
});

app.listen(PORT, () => {
  console.log(`SanyuHub web service running on port ${PORT}`);
});
