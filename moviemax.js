const https = require('https');
const crypto = require('crypto');

// In-memory cache for catalogue
let catalogueCache = null;
let cacheTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// In-memory cache for TMDB poster lookups
const tmdbPosterCache = new Map();

const DEFAULT_FALLBACK_POSTER = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=80';

/**
 * Generate a stable ID for a movie based on its path.
 */
function generateStableId(pathStr) {
  return crypto.createHash('sha256').update(pathStr || '').digest('hex').slice(0, 16);
}

/**
 * Format raw VJ string into clean presentation name (e.g. "vj-emmy" -> "VJ Emmy")
 */
function formatVjName(vjRaw) {
  if (!vjRaw) return 'Unknown VJ';
  let str = vjRaw.trim().replace(/[-_]+/g, ' ');
  if (/^vj\b/i.test(str)) {
    str = str.replace(/^vj\s*/i, 'VJ ');
  } else {
    str = 'VJ ' + str;
  }
  return str.split(' ').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '').join(' ').trim();
}

/**
 * Known VJ names to strip from titles
 */
const VJ_NAMES_LIST = [
  "emmy", "uncle t", "uncle-t", "jingo", "ice p", "ice-p", "junior", "mark", "arafa", "bonny",
  "freddy", "hak", "ham", "ivo", "jona", "jr", "kali", "mosco", "mukiibi",
  "neil", "nelly", "pius", "sahin", "shan", "sheild", "shield", "soul",
  "tonny", "ulio"
];

/**
 * Normalize raw filename into clean Title and Year.
 */
function normalizeTitleAndYear(filename) {
  if (!filename) return { title: 'Untitled Movie', year: null };

  let base = filename.replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v)$/i, '');

  let cleaned = base;

  // Remove handle tags (@...) before replacing delimiters
  cleaned = cleaned.replace(/@[\w'._-]+/gi, '');
  cleaned = cleaned.replace(/@\S+/g, '');

  // Replace delimiters with spaces first so word boundaries work reliably
  cleaned = cleaned.replace(/[._\-]+/g, ' ');

  // Match 4-digit year on cleaned space-separated string
  const yearMatch = cleaned.match(/\b(19\d\d|20\d\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : null;

  // Remove phone numbers and social tags
  cleaned = cleaned.replace(/\(?\b07\d{2}[-\s]?\d{6}\b\)?/g, '');
  cleaned = cleaned.replace(/\b(0703592655|0787845863|0766009748)\b/g, '');

  // Remove promotional noise
  cleaned = cleaned.replace(/FOR SOFTCOPY|\bCOMPLEX\b|\bFLIMZ\b|\bJOKOLERA\b|\bCENTRE\b|\bKITI\b|\bENT\b|\bBURN\b/gi, '');

  // Remove quality & codec tags
  cleaned = cleaned.replace(/\b(1080p|720p|2160p|4k|hd|fullhd|web-dl|webrip|bluray|brrip|x264|x265|hevc|h264|h265|aac|ac3|hdr|extended|proper|remastered)\b/gi, '');

  // Remove year if present to avoid doubling in title
  if (year) {
    cleaned = cleaned.replace(new RegExp('\\b' + year + '\\b', 'g'), '');
  }

  // Remove VJ prefixes/suffixes and names
  cleaned = cleaned.replace(/\bVJ\b/gi, '');
  VJ_NAMES_LIST.forEach(vjName => {
    cleaned = cleaned.replace(new RegExp('\\b' + vjName + '\\b', 'gi'), '');
  });
  cleaned = cleaned.replace(/\bJR\b/gi, '');

  // Remove empty brackets/parentheses or solitary punctuation
  cleaned = cleaned.replace(/\(\s*\)/g, '').replace(/\[\s*\]/g, '');

  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Fallback if cleaned is empty
  if (!cleaned || cleaned.length < 2) {
    cleaned = base.replace(/\.(mkv|mp4|avi|mov)$/i, '').replace(/[._\-]+/g, ' ').trim();
  }

  // Formatting case
  const formattedTitle = cleaned
    .split(' ')
    .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
    .join(' ');

  return { title: formattedTitle, year };
}

/**
 * Extract quality badge string
 */
function extractQuality(filename) {
  if (!filename) return 'HD';
  if (/2160p|4k/i.test(filename)) return '4K';
  if (/1080p/i.test(filename)) return '1080p';
  if (/720p/i.test(filename)) return '720p';
  return 'HD';
}

/**
 * Extract format extension
 */
function extractFormat(filename) {
  if (!filename) return 'mp4';
  const match = filename.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : 'mp4';
}

/**
 * Fetch TMDB poster if TMDB_API_KEY is available
 */
function fetchTmdbPoster(title, year) {
  return new Promise((resolve) => {
    const tmdbKey = process.env.TMDB_API_KEY;
    if (!tmdbKey || !title) {
      return resolve(null);
    }

    const cacheKey = `${title}_${year || ''}`.toLowerCase();
    if (tmdbPosterCache.has(cacheKey)) {
      return resolve(tmdbPosterCache.get(cacheKey));
    }

    const queryParams = new URLSearchParams({
      api_key: tmdbKey,
      query: title
    });
    if (year) queryParams.append('year', year);

    const options = {
      hostname: 'api.themoviedb.org',
      path: `/3/search/movie?${queryParams.toString()}`,
      method: 'GET',
      headers: { 'User-Agent': 'SanyuHub-Server/1.0' },
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = '';
      if (res.statusCode !== 200) {
        tmdbPosterCache.set(cacheKey, null);
        return resolve(null);
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.results && parsed.results.length > 0) {
            const firstMatch = parsed.results[0];
            if (firstMatch.poster_path) {
              const posterUrl = `https://image.tmdb.org/t/p/w500${firstMatch.poster_path}`;
              tmdbPosterCache.set(cacheKey, posterUrl);
              return resolve(posterUrl);
            }
          }
        } catch (e) {}
        tmdbPosterCache.set(cacheKey, null);
        resolve(null);
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.end();
  });
}

/**
 * Normalize single MovieMax record into standard SanyuHub movie object.
 */
function normalizeMovie(m) {
  const stableId = generateStableId(m.path || m.url || m.name);
  const { title, year } = normalizeTitleAndYear(m.name);
  const vj = formatVjName(m.folder || m.category);
  const quality = extractQuality(m.name);
  const format = extractFormat(m.name);

  return {
    id: stableId,
    title: title,
    year: year,
    filename: m.name || '',
    mediaUrl: m.url || '',
    posterUrl: m.poster || m.thumbnail || DEFAULT_FALLBACK_POSTER,
    backdropUrl: null,
    tmdbId: null,
    quality: quality,
    size: m.size || 0,
    format: format,
    category: m.category || m.folder || 'Luganda',
    vj: vj,
    dateAdded: m.uploadedAt || new Date().toISOString()
  };
}

/**
 * Fetch raw movies from MovieMax upstream API.
 */
function fetchFromMovieMax() {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.MOVIEMAX_API_KEY;
    if (!apiKey) {
      return reject(new Error('MOVIEMAX_API_KEY environment variable is not configured.'));
    }

    const options = {
      hostname: 'moviemax-worker.piustechdevoff.workers.dev',
      path: '/movies',
      method: 'GET',
      headers: {
        'X-Auth-Key': apiKey,
        'User-Agent': 'SanyuHub-Server/1.0'
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      if (res.statusCode !== 200) {
        return reject(new Error(`MovieMax upstream error (HTTP status ${res.statusCode})`));
      }

      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && Array.isArray(parsed.movies)) {
            resolve(parsed.movies);
          } else {
            reject(new Error('Invalid response structure from MovieMax upstream.'));
          }
        } catch (err) {
          reject(new Error('Failed to parse response from MovieMax upstream.'));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('MovieMax upstream request timed out.'));
    });

    req.on('error', (err) => {
      reject(new Error('Network error reaching MovieMax upstream.'));
    });

    req.end();
  });
}

/**
 * Main public getter for normalized catalogue with server-side caching.
 */
async function getCatalogue(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && catalogueCache && (now - cacheTime < CACHE_TTL_MS)) {
    return catalogueCache;
  }

  try {
    const rawMovies = await fetchFromMovieMax();
    const normalized = rawMovies.map(normalizeMovie);
    catalogueCache = normalized;
    cacheTime = now;
    return catalogueCache;
  } catch (err) {
    if (catalogueCache) {
      // If error occurs but cache exists, return stale cache gracefully
      return catalogueCache;
    }
    throw err;
  }
}

module.exports = {
  getCatalogue,
  normalizeMovie,
  fetchTmdbPoster,
  DEFAULT_FALLBACK_POSTER
};
