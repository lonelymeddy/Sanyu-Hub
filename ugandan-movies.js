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

function safeDecodeURI(str) {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
}

function generateStableId(inputStr) {
  return crypto.createHash('sha256').update(inputStr || '').digest('hex').slice(0, 16);
}

const VJ_LIST = [
  "emmy", "uncle t", "jingo", "ice p", "ice-p", "junior", "mark", "arafa", "bonny",
  "freddy", "hak", "ham", "ivo", "jona", "jr", "kali", "mosco", "mukiibi",
  "neil", "nelly", "pius", "sahin", "shan", "sheild", "shield", "soul",
  "tonny", "ulio", "bmc", "sammy", "derek", "kevo", "barbie"
];

function formatVjName(rawVj) {
  if (!rawVj) return 'VJ Junior';
  let str = rawVj.trim().replace(/[-_]+/g, ' ');
  if (/^vj\b/i.test(str)) {
    str = str.replace(/^vj\s*/i, 'VJ ');
  } else {
    str = 'VJ ' + str;
  }
  return str.split(' ').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '').join(' ').trim();
}

function parseTitleAndMeta(rawName) {
  if (!rawName) return { title: 'Untitled Movie', year: null, vj: 'VJ Junior' };

  let clean = rawName.replace(/\.(mp4|mkv|avi|mov|flv|webm|m4v)$/i, '');
  // Remove leading numbers / timestamps like "1766643231935-"
  clean = clean.replace(/^\d{10,}[-_\s]*/, '');
  clean = clean.replace(/@[\w'._-]+/g, '').replace(/[._\-]+/g, ' ');

  // Extract VJ name
  let detectedVj = null;
  const vjMatch = clean.match(/\b(vj\s+[a-z0-9_-]+)/i);
  if (vjMatch) {
    detectedVj = formatVjName(vjMatch[1]);
  } else {
    for (const v of VJ_LIST) {
      if (new RegExp('\\b' + v + '\\b', 'i').test(clean)) {
        detectedVj = formatVjName(v);
        break;
      }
    }
  }

  // Match 4-digit year
  const yearMatch = clean.match(/\b(19\d\d|20\d\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : null;

  // Cleanup title noise
  if (year) clean = clean.replace(new RegExp('\\b' + year + '\\b', 'g'), '');
  clean = clean.replace(/\bby\s+vj\s+[a-z0-9_-]+\b/gi, '');
  clean = clean.replace(/\bVJ\s+[A-Za-z0-9_-]+\b/gi, '').replace(/\bVJ\b/gi, '');
  VJ_LIST.forEach(v => {
    clean = clean.replace(new RegExp('\\b' + v + '\\b', 'gi'), '');
  });
  clean = clean.replace(/\b(1080p|720p|4k|hd|web-dl|webrip|bluray|x264|x265|hevc)\b/gi, '');
  clean = clean.replace(/\b\d+$/g, ''); // trailing episode/part numbers
  clean = clean.replace(/\s+/g, ' ').trim();

  if (!clean || clean.length < 2) clean = rawName.replace(/\.[^.]+$/, '').replace(/[._\-]+/g, ' ').trim();

  const formattedTitle = clean
    .split(' ')
    .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '')
    .join(' ');

  return {
    title: formattedTitle || 'Ugandan Movie',
    year: year,
    vj: detectedVj || 'VJ Junior'
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
        timeout: 10000
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let loc = res.headers.location;
          if (!loc.startsWith('http')) loc = new URL(loc, url).href;
          return fetchHttpRequest(loc, headers).then(resolve);
        }
        let body = '';
        res.on('data', chunk => { if (body.length < 2000000) body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      });
      req.on('error', err => resolve({ status: 500, error: err.message, body: '' }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 500, error: 'timeout', body: '' }); });
    } catch(e) {
      resolve({ status: 500, error: e.message, body: '' });
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
  const tmdbKey = process.env.TMDB_API_KEY || '8265bd1679663a7ea12ac168da84d2e8';
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

async function enrichWithTmdb(title, year) {
  const cacheKey = `tmdb:${title.toLowerCase()}:${year || ''}`;
  if (tmdbCache[cacheKey]) {
    return tmdbCache[cacheKey];
  }

  const searchRes = await tmdbFetch('search/movie', { query: title, year: year || '' });
  if (searchRes && searchRes.results && searchRes.results.length > 0) {
    const candidate = searchRes.results[0];
    const sim = calculateSimilarity(title, candidate.title || candidate.original_title);
    if (sim >= 0.5 || searchRes.results.length === 1) {
      const details = await tmdbFetch(`movie/${candidate.id}`);
      const result = {
        tmdbId: candidate.id,
        posterUrl: candidate.poster_path ? `https://image.tmdb.org/t/p/w500${candidate.poster_path}` : null,
        backdropUrl: candidate.backdrop_path ? `https://image.tmdb.org/t/p/w1280${candidate.backdrop_path}` : null,
        overview: candidate.overview || (details ? details.overview : null),
        genres: details && details.genres ? details.genres.map(g => g.name) : ['Action', 'Drama'],
        rating: candidate.vote_average ? parseFloat(candidate.vote_average.toFixed(1)) : 7.5,
        year: candidate.release_date ? parseInt(candidate.release_date.slice(0, 4), 10) : year
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
    genres: ['Action', 'Luganda Translated'],
    rating: 8.0,
    year: year
  };
  tmdbCache[cacheKey] = fallback;
  saveTmdbCache();
  return fallback;
}

/**
 * Fetch movies from vjluga.com
 */
async function fetchVJLugaMovies() {
  const movies = [];
  try {
    const res = await fetchHttpRequest('https://vjluga.com/');
    if (res.status === 200 && res.body) {
      const html = res.body;

      const artworkMatches = Array.from(html.matchAll(/https:\/\/media\.vjluga\.com\/artwork\/([^"'\s]+)/g));
      const videoMatches = Array.from(html.matchAll(/https:\/\/media\.vjluga\.com\/videos\/([^"'\s\\]+)/g));

      videoMatches.forEach((vm, idx) => {
        let rawVideoUrl = 'https://media.vjluga.com/videos/' + vm[1].replace(/\\/g, '');
        rawVideoUrl = rawVideoUrl.replace(/\\.*$/, '').replace(/["'].*$/, '');

        const filename = safeDecodeURI(vm[1].replace(/\\.*$/, ''));
        const parsed = parseTitleAndMeta(filename);

        let posterUrl = null;
        if (artworkMatches[idx]) {
          posterUrl = 'https://media.vjluga.com/artwork/' + artworkMatches[idx][1].replace(/\\.*$/, '');
        }

        const id = generateStableId('vjluga:' + rawVideoUrl);

        movies.push({
          id,
          title: parsed.title,
          year: parsed.year,
          vj: parsed.vj,
          source: 'vjluga.com',
          mediaUrl: rawVideoUrl,
          posterUrl: posterUrl,
          quality: 'HD',
          format: 'MP4',
          category: 'Luganda Movie',
          filename: filename
        });
      });
    }
  } catch (err) {
    console.error('Error fetching VJLuga movies:', err.message);
  }
  return movies;
}

/**
 * Fetch movies from pearlplayug.com
 */
async function fetchPearlPlayMovies() {
  const movies = [];
  try {
    const res = await fetchHttpRequest('https://pearlplayug.com/');
    if (res.status === 200 && res.body) {
      const html = res.body;
      const s3Matches = Array.from(html.matchAll(/https?:\/\/[^\s"'<>]+\.amazonaws\.com\/[^\s"'<>]+\.mp4/gi));

      s3Matches.forEach(sm => {
        const url = sm[0];
        const filename = url.split('/').pop();
        const parsed = parseTitleAndMeta(safeDecodeURI(filename));
        const id = generateStableId('pearlplay:' + url);

        movies.push({
          id,
          title: parsed.title,
          year: parsed.year,
          vj: parsed.vj,
          source: 'pearlplayug.com',
          mediaUrl: url,
          posterUrl: null,
          quality: 'HD',
          format: 'MP4',
          category: 'Luganda Movie',
          filename: safeDecodeURI(filename)
        });
      });
    }
  } catch (err) {
    console.error('Error fetching PearlPlay movies:', err.message);
  }
  return movies;
}

/**
 * Fetch movies from nanamoviehub.com via WP REST API
 */
async function fetchNanaMovieHubMovies() {
  const movies = [];
  try {
    const res = await fetchHttpRequest('https://nanamoviehub.com/wp-json/wp/v2/posts?per_page=20&_embed=1');
    if (res.status === 200 && res.body) {
      const posts = JSON.parse(res.body);
      if (Array.isArray(posts)) {
        posts.forEach(p => {
          const rawTitle = p.title && p.title.rendered ? p.title.rendered : '';
          const parsed = parseTitleAndMeta(rawTitle);
          const featuredImg = p._embedded && p._embedded['wp:featuredmedia'] && p._embedded['wp:featuredmedia'][0]
            ? p._embedded['wp:featuredmedia'][0].source_url
            : null;

          const content = p.content ? p.content.rendered : '';
          const mediaMatch = content.match(/https?:\/\/[^\s"'<>]+\.(mp4|m3u8)[^\s"'>]*/gi);

          const id = generateStableId('nanamoviehub:' + p.id);

          movies.push({
            id,
            title: parsed.title,
            year: parsed.year,
            vj: parsed.vj,
            source: 'nanamoviehub.com',
            externalUrl: p.link,
            mediaUrl: mediaMatch ? mediaMatch[0] : null,
            posterUrl: featuredImg,
            quality: 'HD',
            format: mediaMatch && mediaMatch[0].includes('.m3u8') ? 'HLS' : 'MP4',
            category: 'Luganda Movie',
            filename: rawTitle
          });
        });
      }
    }
  } catch (err) {
    console.error('Error fetching NanaMovieHub movies:', err.message);
  }
  return movies;
}

/**
 * Main function to retrieve full Ugandan movie catalogue
 */
async function getUgandanMovieCatalogue(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && catalogueCache && (now - cacheTime < CACHE_TTL_MS)) {
    return catalogueCache;
  }

  console.log('Fetching fresh Ugandan movie catalogue from research sources...');
  const [vjluga, pearlplay, nanamovie] = await Promise.all([
    fetchVJLugaMovies(),
    fetchPearlPlayMovies(),
    fetchNanaMovieHubMovies()
  ]);

  const rawList = [...vjluga, ...pearlplay, ...nanamovie];

  // Deduplicate and enrich
  const movieMap = new Map();

  for (const m of rawList) {
    const dedupeKey = `${m.title.toLowerCase().trim()}:${m.vj.toLowerCase().trim()}`;
    if (!movieMap.has(dedupeKey)) {
      movieMap.set(dedupeKey, { ...m, sources: [m.source] });
    } else {
      const existing = movieMap.get(dedupeKey);
      if (!existing.mediaUrl && m.mediaUrl) {
        existing.mediaUrl = m.mediaUrl;
      }
      if (!existing.posterUrl && m.posterUrl) {
        existing.posterUrl = m.posterUrl;
      }
      if (!existing.sources.includes(m.source)) {
        existing.sources.push(m.source);
      }
    }
  }

  const catalogue = Array.from(movieMap.values());

  // Enrich with TMDB metadata where missing
  for (const m of catalogue) {
    const tmdbMeta = await enrichWithTmdb(m.title, m.year);
    if (!m.posterUrl && tmdbMeta.posterUrl) {
      m.posterUrl = tmdbMeta.posterUrl;
    }
    if (!m.backdropUrl && tmdbMeta.backdropUrl) {
      m.backdropUrl = tmdbMeta.backdropUrl;
    }
    m.overview = tmdbMeta.overview || `Watch ${m.title} translated into Luganda by ${m.vj}. Stream in HD on SanyuHub.`;
    m.genres = tmdbMeta.genres || ['Action', 'Drama'];
    m.rating = tmdbMeta.rating || 8.0;
    if (!m.year && tmdbMeta.year) m.year = tmdbMeta.year;
  }

  catalogueCache = catalogue;
  cacheTime = now;

  console.log(`Successfully compiled ${catalogue.length} Ugandan movies into new catalogue.`);
  return catalogueCache;
}

module.exports = {
  getUgandanMovieCatalogue,
  parseTitleAndMeta,
  formatVjName
};
