const https = require('https');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

let catalogueCache = null;
let cacheTime = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

const TMDB_CACHE_FILE = path.join(__dirname, 'tmdb_cache_v2.json');
let tmdbCache = {};

try {
  if (fs.existsSync(TMDB_CACHE_FILE)) {
    tmdbCache = JSON.parse(fs.readFileSync(TMDB_CACHE_FILE, 'utf8')) || {};
  }
} catch (e) {
  tmdbCache = {};
}

function saveTmdbCache() {
  try {
    fs.writeFileSync(TMDB_CACHE_FILE, JSON.stringify(tmdbCache, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save tmdb_cache_v2.json:', e.message);
  }
}

const STREAM_CACHE_FILE = path.join(__dirname, 'stream_cache.json');
let streamVerificationCache = {};

try {
  if (fs.existsSync(STREAM_CACHE_FILE)) {
    streamVerificationCache = JSON.parse(fs.readFileSync(STREAM_CACHE_FILE, 'utf8')) || {};
  }
} catch (e) {
  streamVerificationCache = {};
}

function saveStreamCache() {
  try {
    fs.writeFileSync(STREAM_CACHE_FILE, JSON.stringify(streamVerificationCache, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save stream_cache.json:', e.message);
  }
}

function safeDecodeURI(str) {
  if (!str) return '';
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
}

function generateStableId(inputStr) {
  return 'swahix-' + crypto.createHash('sha256').update(inputStr || '').digest('hex').slice(0, 12);
}

const SWAHILI_VJ_LIST = [
  "mark", "mack", "black", "mjukuu", "babu", "prabhas", "murphy",
  "hero", "baba d", "smart", "lufufu", "six fingers", "young money", "juma khan", "master"
];

function formatSwahiliVjName(rawVj) {
  if (!rawVj) return 'DJ Mark';
  let str = rawVj.trim().replace(/[-_]+/g, ' ');
  if (/^babu\s+dj\b/i.test(str)) return 'Babu DJ';
  if (/^(vj|dj)\b/i.test(str)) {
    str = str.replace(/^(vj|dj)\s*/i, 'DJ ');
  } else {
    str = 'DJ ' + str;
  }
  return str.split(' ').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '').join(' ').trim();
}

/**
 * Parse raw Swahix title string into clean title, year, VJ/translator name.
 */
function parseSwahixTitle(rawTitle) {
  if (!rawTitle) return { title: 'Untitled Swahili Movie', year: null, vj: 'DJ Mark' };

  let clean = safeDecodeURI(rawTitle).trim();

  // Extract DJ / Translator name
  let detectedVj = 'DJ Mark';
  const vjMatch = clean.match(/\b(by|dj|vj)\s+([a-z0-9_\s]+)/i);

  if (vjMatch) {
    const djCandidate = vjMatch[2].split(',')[0].trim();
    detectedVj = formatSwahiliVjName(djCandidate);
  } else {
    for (const v of SWAHILI_VJ_LIST) {
      if (new RegExp('\\b' + v + '\\b', 'i').test(clean)) {
        detectedVj = formatSwahiliVjName(v);
        break;
      }
    }
  }

  // Strip anything after "by" or long keyword noise
  clean = clean.split(/\bby\b/i)[0].trim();
  clean = clean.split(/\b(movie zilizotafsiriwa|zilizotafsiriwa|kiswahili)\b/i)[0].trim();

  // Strip brackets and extra whitespace
  clean = clean.replace(/\[.*?\]/g, ' ').replace(/\(.*?\)/g, ' ');
  clean = clean.replace(/\s+/g, ' ').trim();

  const formattedTitle = clean
    .split(' ')
    .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '')
    .join(' ')
    .trim();

  return {
    title: formattedTitle || 'Swahili Movie',
    vj: detectedVj
  };
}

function fetchHttpRequest(url, headers = {}) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const mod = parsed.protocol === 'https:' ? https : http;
      const req = mod.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          ...headers
        },
        timeout: 5000
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let loc = res.headers.location;
          if (!loc.startsWith('http')) loc = new URL(loc, url).href;
          return fetchHttpRequest(loc, headers).then(resolve);
        }
        let body = '';
        res.on('data', chunk => { if (body.length < 500000) body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      });
      req.on('error', err => resolve({ status: 500, error: err.message, body: '' }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 500, error: 'timeout', body: '' }); });
    } catch(e) {
      resolve({ status: 500, error: e.message, body: '' });
    }
  });
}

/**
 * Verify whether a stream URL points to a valid video file using Range request with Referer header.
 */
function verifyStreamUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return Promise.resolve(false);
  }

  const cached = streamVerificationCache[url];
  const now = Date.now();
  if (cached && (now - cached.timestamp < 24 * 60 * 60 * 1000)) {
    return Promise.resolve(cached.isValid);
  }

  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const mod = parsed.protocol === 'https:' ? https : http;
      const req = mod.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://swahix.com/',
          'Accept': '*/*',
          'Range': 'bytes=0-100'
        },
        timeout: 6000
      }, (res) => {
        let isValid = false;
        if (res.statusCode === 200 || res.statusCode === 206) {
          const contentType = (res.headers['content-type'] || '').toLowerCase();
          const isVideoType = contentType.includes('video') ||
                              contentType.includes('mpegurl') ||
                              contentType.includes('m3u8') ||
                              contentType.includes('octet-stream') ||
                              contentType.includes('mp4') ||
                              url.includes('.mp4');

          if (!contentType.includes('text/html') && isVideoType) {
            isValid = true;
          }
        }

        res.destroy();

        streamVerificationCache[url] = { isValid, timestamp: now };
        saveStreamCache();
        resolve(isValid);
      });

      req.on('error', () => {
        streamVerificationCache[url] = { isValid: false, timestamp: now };
        saveStreamCache();
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        streamVerificationCache[url] = { isValid: false, timestamp: now };
        saveStreamCache();
        resolve(false);
      });
    } catch(e) {
      streamVerificationCache[url] = { isValid: false, timestamp: now };
      saveStreamCache();
      resolve(false);
    }
  });
}

function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;
  return 0;
}

async function tmdbFetch(endpoint, queryParams = {}) {
  const tmdbKey = process.env.TMDB_API_KEY;
  if (!tmdbKey) return null;
  const params = new URLSearchParams({ api_key: tmdbKey, ...queryParams });
  const url = `https://api.themoviedb.org/3/${endpoint}?${params.toString()}`;
  const res = await fetchHttpRequest(url);
  if (res.status === 200 && res.body) {
    try {
      return JSON.parse(res.body);
    } catch(e) {}
  }
  return null;
}

async function enrichWithTmdb(title, year = null) {
  const cacheKey = `tmdb:swahili:${title.toLowerCase().trim()}:${year || ''}`;
  if (tmdbCache[cacheKey]) {
    return tmdbCache[cacheKey];
  }

  const queryParams = { query: title };
  if (year) queryParams.year = year;

  const searchRes = await tmdbFetch('search/movie', queryParams);
  if (searchRes && searchRes.results && searchRes.results.length > 0) {
    const candidate = searchRes.results[0];
    const candidateTitle = candidate.title || candidate.original_title;
    const sim = calculateSimilarity(title, candidateTitle);

    if (sim >= 0.5 || searchRes.results.length === 1) {
      const details = await tmdbFetch(`movie/${candidate.id}`);
      const releaseDate = candidate.release_date || '';
      const result = {
        tmdbId: candidate.id,
        posterUrl: candidate.poster_path ? `https://image.tmdb.org/t/p/w500${candidate.poster_path}` : null,
        backdropUrl: candidate.backdrop_path ? `https://image.tmdb.org/t/p/w1280${candidate.backdrop_path}` : null,
        overview: candidate.overview || (details ? details.overview : null),
        genres: details && details.genres ? details.genres.map(g => g.name) : ['Action', 'Swahili Dubbed'],
        rating: candidate.vote_average ? parseFloat(candidate.vote_average.toFixed(1)) : 7.8,
        year: releaseDate ? parseInt(releaseDate.slice(0, 4), 10) : year || 2023
      };
      tmdbCache[cacheKey] = result;
      saveTmdbCache();
      return result;
    }
  }

  const fallback = {
    tmdbId: null,
    posterUrl: null,
    backdropUrl: null,
    overview: null,
    genres: ['Action', 'Swahili Dubbed'],
    rating: 7.5,
    year: year || 2023
  };
  tmdbCache[cacheKey] = fallback;
  saveTmdbCache();
  return fallback;
}

/**
 * Load local discovery discovery catalog as guaranteed fallback baseline
 */
function getDiscoveryFallback() {
  try {
    const discoveryFile = path.join(__dirname, 'docs', 'server-discovery', 'swahili', 'swahix', 'movies.json');
    if (fs.existsSync(discoveryFile)) {
      const raw = JSON.parse(fs.readFileSync(discoveryFile, 'utf8'));
      return raw.map(m => {
        const parsed = parseSwahixTitle(m.full_title);
        return {
          id: m.id,
          swahixId: m.swahix_id,
          title: parsed.title,
          originalTitle: parsed.title,
          translatedTitle: `${parsed.title} (${parsed.vj})`,
          vj: parsed.vj,
          source: 'swahix.com',
          detailUrl: m.detail_url,
          watchUrl: m.watch_url,
          posterUrl: m.poster_url,
          description: m.description,
          mediaUrl: m.media_url,
          isPlayable: m.is_playable,
          isPremium: m.is_premium
        };
      });
    }
  } catch (e) {
    console.error('Failed to load discovery fallback:', e.message);
  }
  return [];
}

/**
 * Build and return the Swahili movie catalogue.
 */
async function buildSwahiliCatalogue() {
  const now = Date.now();
  if (catalogueCache && (now - cacheTime < CACHE_TTL_MS)) {
    return catalogueCache;
  }

  const rawList = getDiscoveryFallback();
  const catalogue = [];

  for (const item of rawList) {
    const parsed = parseSwahixTitle(item.title || item.originalTitle);

    // Stream playability verification
    let mediaUrl = null;
    let isPlayable = false;

    if (item.mediaUrl) {
      isPlayable = await verifyStreamUrl(item.mediaUrl);
      if (isPlayable) {
        // Wrap with stream proxy endpoint for seamless playback in browser video element
        mediaUrl = `/api/stream-proxy?url=${encodeURIComponent(item.mediaUrl)}`;
      }
    }

    const tmdbMeta = await enrichWithTmdb(parsed.title, item.year);

    const movieRecord = {
      id: item.id || generateStableId(item.detailUrl || item.title),
      title: parsed.title,
      originalTitle: parsed.title,
      translatedTitle: `${parsed.title} (${parsed.vj})`,
      vj: parsed.vj,
      country: 'ke',
      originalLanguage: 'English',
      availableLanguages: ['Swahili', 'English'],
      audioTrack: 'Swahili Dubbed',
      hasSwahiliDubbing: true,
      hasSwahiliSubtitles: false,
      year: tmdbMeta.year || item.year || 2023,
      posterUrl: item.posterUrl || tmdbMeta.posterUrl,
      backdropUrl: tmdbMeta.backdropUrl,
      overview: tmdbMeta.overview || item.description || `Watch ${parsed.title} translated into Swahili by ${parsed.vj}. Stream in HD on SanyuHub.`,
      genres: tmdbMeta.genres.includes('Swahili Dubbed') ? tmdbMeta.genres : [...tmdbMeta.genres, 'Swahili Dubbed'],
      rating: tmdbMeta.rating || 7.8,
      category: 'Swahili Movie',
      quality: 'HD',
      format: 'MP4',
      source: 'swahix.com',
      sourceUrl: item.detailUrl,
      mediaUrl: mediaUrl,
      isPlayable: isPlayable,
      isPremium: item.isPremium || false
    };

    catalogue.push(movieRecord);
  }

  catalogueCache = catalogue;
  cacheTime = now;
  return catalogue;
}

async function getSwahiliMovieCatalogue() {
  return await buildSwahiliCatalogue();
}

module.exports = {
  getSwahiliMovieCatalogue,
  parseSwahixTitle,
  verifyStreamUrl
};
