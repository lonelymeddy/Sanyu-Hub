const https = require('https');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

let catalogueCache = null;
let seriesCatalogueCache = null;
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
  return crypto.createHash('sha256').update(inputStr || '').digest('hex').slice(0, 16);
}

const VJ_LIST = [
  "emmy", "uncle t", "jingo", "ice p", "ice-p", "junior", "mark", "arafa", "bonny",
  "freddy", "hak", "ham", "ivo", "jona", "jr", "kali", "mosco", "mukiibi",
  "neil", "nelly", "pius", "sahin", "shan", "sheild", "shield", "soul",
  "tonny", "ulio", "bmc", "sammy", "derek", "kevo", "barbie", "shao"
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

/**
 * Parse raw file/post titles into clean title, year, VJ, and series/episode metadata.
 */
function parseTitleAndMeta(rawName) {
  if (!rawName) return { title: 'Untitled', year: null, vj: 'VJ Junior', isSeries: false, season: null, episode: null };

  let clean = safeDecodeURI(rawName);
  clean = clean.replace(/\.(mp4|mkv|avi|mov|flv|webm|m4v)$/i, '');
  // Remove leading timestamps or IDs like "1766643231935-"
  clean = clean.replace(/^\d{10,}[-_\s]*/, '');
  clean = clean.replace(/@[\w'._-]+/g, '').replace(/[._\-]+/g, ' ');

  // Extract VJ
  let detectedVj = null;
  const vjMatch = clean.match(/\b(vj\s+[a-z0-9_-]+)/i) || clean.match(/\bby\s+(vj\s+[a-z0-9_-]+)/i);
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

  // Detect Season and Episode
  let isSeries = false;
  let season = null;
  let episode = null;

  // Pattern 1: Season X Episode Y or S01E02 or S1 E2
  const sAndE = clean.match(/\b(?:Season|S)\s*(\d{1,2})\s*(?:Episode|E)\s*(\d{1,3})\b/i);
  if (sAndE) {
    isSeries = true;
    season = parseInt(sAndE[1], 10);
    episode = parseInt(sAndE[2], 10);
    clean = clean.replace(sAndE[0], ' ');
  } else {
    // Pattern 2: S01E02
    const seMatch = clean.match(/\bS(\d{1,2})\s*E(\d{1,3})\b/i);
    if (seMatch) {
      isSeries = true;
      season = parseInt(seMatch[1], 10);
      episode = parseInt(seMatch[2], 10);
      clean = clean.replace(seMatch[0], ' ');
    } else {
      // Pattern 3: Episode 12 or Ep 12
      const epMatch = clean.match(/\b(?:Episode|Ep)\s*(\d{1,3})\b/i);
      if (epMatch) {
        isSeries = true;
        season = 1;
        episode = parseInt(epMatch[1], 10);
        clean = clean.replace(epMatch[0], ' ');
      }
    }
  }

  // Extract Year (4-digit number between 1920 and 2029)
  const yearMatch = clean.match(/\b(19\d\d|20[0-2]\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : null;
  if (yearMatch) clean = clean.replace(yearMatch[0], ' ');

  // Strip Season X standalone text if remaining
  clean = clean.replace(/\bSeason\s*\d{1,2}\b/gi, ' ');

  // Strip brackets and parentheses content
  clean = clean.replace(/\[.*?\]/g, ' ').replace(/\(.*?\)/g, ' ');

  // Strip VJ names and leftover noise
  clean = clean.replace(/\bby\s+vj\s+[a-z0-9_-]+\b/gi, ' ');
  clean = clean.replace(/\bVJ\s+[A-Za-z0-9_-]+\b/gi, ' ').replace(/\bVJ\b/gi, ' ');
  VJ_LIST.forEach(v => {
    clean = clean.replace(new RegExp('\\b' + v + '\\b', 'gi'), ' ');
  });

  // Strip quality tags, site tags, and extra descriptors
  clean = clean.replace(/\b(1080p?|720p?|480p?|4k|hd|web-dl|webrip|bluray|x264|x265|hevc|pahe\.in|pahe|in|nf|action|adventure|drama|end|full movie luganda|movie luganda|luganda|vjluga\.com|vjluga)\b/gi, ' ');
  clean = clean.replace(/\bpart\s*\d+\b/gi, ' '); // remove part X for title normalization
  clean = clean.replace(/[-_]+\d*$/, ' '); // remove trailing dash numbers e.g. -1
  clean = clean.replace(/\s+\d+$/g, ' '); // remove trailing numbers
  clean = clean.replace(/\s+/g, ' ').trim();

  // If clean title became too short or empty, fallback
  if (!clean || clean.length < 2) {
    clean = rawName.replace(/\.[^.]+$/, '').replace(/[._\-]+/g, ' ').trim();
  }

  const formattedTitle = clean
    .split(' ')
    .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '')
    .join(' ')
    .trim();

  return {
    title: formattedTitle || 'Ugandan Media',
    year: year,
    vj: detectedVj || 'VJ Junior',
    isSeries: isSeries,
    season: season,
    episode: episode
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
 * Verify whether a media stream URL points to a playable, valid media asset using GET range request.
 */
function verifyStreamUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return Promise.resolve(false);
  }

  // Check cache first (cache valid for 24 hours)
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
                              url.includes('.m3u8') ||
                              url.includes('.mp4') ||
                              url.includes('.m4v');

          if (!contentType.includes('text/html')) {
            if (isVideoType) isValid = true;
          }
        }

        res.destroy(); // Destroy response stream

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

/**
 * Helper to verify multiple stream URLs concurrently in batches.
 */
async function verifyStreamsInBatches(items, batchSize = 15) {
  const verified = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(async (item) => {
      if (!item.mediaUrl) return null;
      const playable = await verifyStreamUrl(item.mediaUrl);
      return playable ? item : null;
    }));
    results.forEach(res => {
      if (res) verified.push(res);
    });
  }
  return verified;
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

async function enrichWithTmdb(title, year, isSeries = false) {
  const cacheKey = `tmdb:${isSeries ? 'tv' : 'movie'}:${title.toLowerCase().trim()}:${year || ''}`;
  if (tmdbCache[cacheKey]) {
    return tmdbCache[cacheKey];
  }

  const searchEndpoint = isSeries ? 'search/tv' : 'search/movie';
  const queryParams = isSeries ? { query: title, first_air_date_year: year || '' } : { query: title, year: year || '' };

  const searchRes = await tmdbFetch(searchEndpoint, queryParams);
  if (searchRes && searchRes.results && searchRes.results.length > 0) {
    const candidate = searchRes.results[0];
    const candidateTitle = candidate.title || candidate.name || candidate.original_title || candidate.original_name;
    const sim = calculateSimilarity(title, candidateTitle);

    if (sim >= 0.5 || searchRes.results.length === 1) {
      const details = await tmdbFetch(`${isSeries ? 'tv' : 'movie'}/${candidate.id}`);
      const releaseDate = candidate.release_date || candidate.first_air_date || '';
      const result = {
        tmdbId: candidate.id,
        posterUrl: candidate.poster_path ? `https://image.tmdb.org/t/p/w500${candidate.poster_path}` : null,
        backdropUrl: candidate.backdrop_path ? `https://image.tmdb.org/t/p/w1280${candidate.backdrop_path}` : null,
        overview: candidate.overview || (details ? details.overview : null),
        genres: details && details.genres ? details.genres.map(g => g.name) : (isSeries ? ['Drama', 'Series'] : ['Action', 'Drama']),
        rating: candidate.vote_average ? parseFloat(candidate.vote_average.toFixed(1)) : 7.5,
        year: releaseDate ? parseInt(releaseDate.slice(0, 4), 10) : year
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
    genres: isSeries ? ['Luganda Series', 'Drama'] : ['Action', 'Luganda Translated'],
    rating: 8.0,
    year: year
  };
  tmdbCache[cacheKey] = fallback;
  saveTmdbCache();
  return fallback;
}

/**
 * Fetch movies and episodes from vjluga.com
 */
async function fetchVJLugaMovies() {
  const items = [];
  try {
    const res = await fetchHttpRequest('https://vjluga.com/');
    if (res.status === 200 && res.body) {
      const html = res.body;

      // Extract self.__next_f payload chunks
      const chunks = [];
      const pushRegex = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g;
      let pm;
      while ((pm = pushRegex.exec(html)) !== null) {
        chunks.push(pm[1]);
      }
      const fullJsonStr = chunks.join('');

      const blockRegex = /\\"title\\":\\"([^\\"]+)\\"[\s\S]*?\\"artwork_url\\":\\"([^\\"]+)\\"[\s\S]*?\\"video_url\\":\\"([^\\"]+)\\"/g;
      let m;
      while ((m = blockRegex.exec(fullJsonStr)) !== null) {
        const rawTitle = m[1];
        const rawArtworkUrl = m[2];
        const rawVideoUrl = m[3];

        if (rawTitle && rawVideoUrl) {
          // Parse metadata from raw video URL filename first for better accuracy
          const videoFilename = rawVideoUrl.split('/').pop();
          const parsedFromFile = parseTitleAndMeta(safeDecodeURI(videoFilename));
          const parsedFromTitle = parseTitleAndMeta(rawTitle);

          // Use parsedFromFile title if valid, otherwise parsedFromTitle
          const title = (parsedFromFile.title && parsedFromFile.title !== 'Ugandan Media' && parsedFromFile.title !== 'Vjluga Com')
            ? parsedFromFile.title
            : parsedFromTitle.title;

          const isSeries = parsedFromFile.isSeries || parsedFromTitle.isSeries;
          const season = parsedFromFile.season || parsedFromTitle.season;
          const episode = parsedFromFile.episode || parsedFromTitle.episode;
          const vj = parsedFromFile.vj || parsedFromTitle.vj;
          const year = parsedFromFile.year || parsedFromTitle.year;

          let mediaUrl = rawVideoUrl.replace(/\\\\/g, '').replace(/\\/g, '');
          if (!mediaUrl.startsWith('http')) mediaUrl = 'https://media.vjluga.com/videos/' + mediaUrl;

          let posterUrl = rawArtworkUrl ? rawArtworkUrl.replace(/\\\\/g, '').replace(/\\/g, '') : null;
          if (posterUrl && !posterUrl.startsWith('http')) posterUrl = 'https://media.vjluga.com/artwork/' + posterUrl;

          const id = generateStableId('vjluga:' + mediaUrl);

          items.push({
            id,
            title: title,
            year: year,
            vj: vj,
            isSeries: isSeries,
            season: season,
            episode: episode,
            source: 'vjluga.com',
            mediaUrl: mediaUrl,
            posterUrl: posterUrl,
            quality: 'HD',
            format: mediaUrl.includes('.m3u8') ? 'HLS' : 'MP4',
            category: isSeries ? 'Luganda Series' : 'Luganda Movie',
            filename: rawTitle
          });
        }
      }
    }
  } catch (err) {
    console.error('Error fetching VJLuga items:', err.message);
  }
  return items;
}

/**
 * Fetch movies from pearlplayug.com
 */
async function fetchPearlPlayMovies() {
  const items = [];
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

        items.push({
          id,
          title: parsed.title,
          year: parsed.year,
          vj: parsed.vj,
          isSeries: parsed.isSeries,
          season: parsed.season,
          episode: parsed.episode,
          source: 'pearlplayug.com',
          mediaUrl: url,
          posterUrl: null,
          quality: 'HD',
          format: 'MP4',
          category: parsed.isSeries ? 'Luganda Series' : 'Luganda Movie',
          filename: safeDecodeURI(filename)
        });
      });
    }
  } catch (err) {
    console.error('Error fetching PearlPlay items:', err.message);
  }
  return items;
}

/**
 * Fetch movies from nanamoviehub.com via WP REST API
 */
async function fetchNanaMovieHubMovies() {
  const items = [];
  try {
    const res = await fetchHttpRequest('https://nanamoviehub.com/wp-json/wp/v2/posts?per_page=20&_embed=1');
    if (res.status === 200 && res.body) {
      let posts = [];
      try {
        posts = JSON.parse(res.body);
      } catch (e) {
        posts = [];
      }
      if (Array.isArray(posts)) {
        posts.forEach(p => {
          const rawTitle = p.title && p.title.rendered ? p.title.rendered : '';
          const parsed = parseTitleAndMeta(rawTitle);
          const featuredImg = p._embedded && p._embedded['wp:featuredmedia'] && p._embedded['wp:featuredmedia'][0]
            ? p._embedded['wp:featuredmedia'][0].source_url
            : null;

          const content = p.content ? p.content.rendered : '';
          const mediaMatch = content.match(/https?:\/\/[^\s"'<>]+\.(mp4|m3u8)[^\s"'>]*/gi);

          const mediaUrl = mediaMatch ? mediaMatch[0] : null;
          const id = generateStableId('nanamoviehub:' + p.id);

          items.push({
            id,
            title: parsed.title,
            year: parsed.year,
            vj: parsed.vj,
            isSeries: parsed.isSeries,
            season: parsed.season,
            episode: parsed.episode,
            source: 'nanamoviehub.com',
            externalUrl: p.link,
            mediaUrl: mediaUrl,
            posterUrl: featuredImg,
            quality: 'HD',
            format: mediaUrl && mediaUrl.includes('.m3u8') ? 'HLS' : 'MP4',
            category: parsed.isSeries ? 'Luganda Series' : 'Luganda Movie',
            filename: rawTitle
          });
        });
      }
    }
  } catch (err) {
    console.error('Error fetching NanaMovieHub items:', err.message);
  }
  return items;
}

/**
 * Build and return the full verified movie catalogue and series catalogue.
 */
let isBuildingCatalogue = false;

async function buildCatalogues(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && catalogueCache && seriesCatalogueCache && (now - cacheTime < CACHE_TTL_MS)) {
    return { movies: catalogueCache, series: seriesCatalogueCache };
  }

  if (catalogueCache && seriesCatalogueCache) {
    if (!isBuildingCatalogue) {
      isBuildingCatalogue = true;
      setImmediate(async () => {
        try {
          await runBuildCatalogues();
        } catch (e) {
          console.error("Background catalogue build error:", e.message);
        } finally {
          isBuildingCatalogue = false;
        }
      });
    }
    return { movies: catalogueCache, series: seriesCatalogueCache };
  }

  return await runBuildCatalogues();
}

async function runBuildCatalogues() {
  const now = Date.now();

  console.log('Fetching fresh Ugandan catalogue from sources...');
  const [vjluga, pearlplay, nanamovie] = await Promise.all([
    fetchVJLugaMovies(),
    fetchPearlPlayMovies(),
    fetchNanaMovieHubMovies()
  ]);

  const rawList = [...vjluga, ...pearlplay, ...nanamovie];

  // 1. Filter out items with no mediaUrl or unverified streams concurrently
  console.log(`Ingested ${rawList.length} raw items from sources. Verifying stream playability...`);
  const verifiedList = await verifyStreamsInBatches(rawList, 15);
  console.log(`Stream verification complete: ${verifiedList.length} verified playable items.`);

  // 2. Separate Movies vs Series Episodes and Deduplicate
  const movieMap = new Map();
  const seriesEpisodesMap = new Map();

  for (const item of verifiedList) {
    if (item.isSeries || /\b(s\d+e\d+|episode|season|ep)\b/i.test(item.filename)) {
      // Series Episode
      const epKey = `${item.title.toLowerCase().trim()}:${item.season || 1}:${item.episode || 1}:${item.vj.toLowerCase().trim()}`;
      if (!seriesEpisodesMap.has(epKey)) {
        seriesEpisodesMap.set(epKey, item);
      }
    } else {
      // Movie
      const movieKey = `${item.title.toLowerCase().trim()}:${item.vj.toLowerCase().trim()}`;
      if (!movieMap.has(movieKey)) {
        movieMap.set(movieKey, { ...item, sources: [item.source] });
      } else {
        const existing = movieMap.get(movieKey);
        if (!existing.posterUrl && item.posterUrl) {
          existing.posterUrl = item.posterUrl;
        }
        if (!existing.sources.includes(item.source)) {
          existing.sources.push(item.source);
        }
      }
    }
  }

  // 3. Process Movies with TMDB
  const movieCatalogue = Array.from(movieMap.values());
  for (const m of movieCatalogue) {
    const tmdbMeta = await enrichWithTmdb(m.title, m.year, false);
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

  // 4. Process Series and group episodes into parent series
  const seriesEpisodes = Array.from(seriesEpisodesMap.values());
  const seriesGroupMap = new Map();

  for (const ep of seriesEpisodes) {
    const seriesTitle = ep.title;
    const seriesKey = seriesTitle.toLowerCase().trim();

    if (!seriesGroupMap.has(seriesKey)) {
      seriesGroupMap.set(seriesKey, {
        id: generateStableId('series:' + seriesKey),
        title: seriesTitle,
        vj: ep.vj,
        year: ep.year,
        posterUrl: ep.posterUrl,
        backdropUrl: null,
        quality: ep.quality || 'HD',
        format: ep.format || 'MP4',
        category: 'Luganda Series',
        episodes: [ep]
      });
    } else {
      const parent = seriesGroupMap.get(seriesKey);
      parent.episodes.push(ep);
      if (!parent.posterUrl && ep.posterUrl) {
        parent.posterUrl = ep.posterUrl;
      }
    }
  }

  const seriesCatalogue = Array.from(seriesGroupMap.values());

  for (const s of seriesCatalogue) {
    // Sort episodes by season then episode number
    s.episodes.sort((a, b) => {
      if ((a.season || 1) !== (b.season || 1)) return (a.season || 1) - (b.season || 1);
      return (a.episode || 1) - (b.episode || 1);
    });

    const tmdbMeta = await enrichWithTmdb(s.title, s.year, true);
    if (!s.posterUrl && tmdbMeta.posterUrl) {
      s.posterUrl = tmdbMeta.posterUrl;
    }
    s.backdropUrl = tmdbMeta.backdropUrl || null;
    s.overview = tmdbMeta.overview || `Watch full seasons of ${s.title} translated into Luganda by ${s.vj} on SanyuHub.`;
    s.genres = tmdbMeta.genres || ['Luganda Series', 'Drama'];
    s.rating = tmdbMeta.rating || 8.0;
    if (!s.year && tmdbMeta.year) s.year = tmdbMeta.year;

    // Group into seasons structure for series detail page
    const seasonsMap = new Map();
    s.episodes.forEach(ep => {
      const sNum = ep.season || 1;
      if (!seasonsMap.has(sNum)) {
        seasonsMap.set(sNum, {
          seasonNumber: sNum,
          name: `Season ${sNum}`,
          episodeCount: 0,
          episodes: []
        });
      }
      const seasonObj = seasonsMap.get(sNum);
      seasonObj.episodes.push(ep);
      seasonObj.episodeCount++;
    });

    s.seasons = Array.from(seasonsMap.values()).sort((a, b) => a.seasonNumber - b.seasonNumber);
    s.totalSeasons = s.seasons.length;
    s.totalEpisodes = s.episodes.length;
  }

  catalogueCache = movieCatalogue;
  seriesCatalogueCache = seriesCatalogue;
  cacheTime = now;

  console.log(`Catalogue build complete. Verified Movies: ${movieCatalogue.length}, Verified Series: ${seriesCatalogue.length}.`);
  return { movies: catalogueCache, series: seriesCatalogueCache };
}

async function getUgandanMovieCatalogue(forceRefresh = false) {
  const cats = await buildCatalogues(forceRefresh);
  return cats.movies;
}

async function getUgandanSeriesCatalogue(forceRefresh = false) {
  const cats = await buildCatalogues(forceRefresh);
  return cats.series;
}

module.exports = {
  getUgandanMovieCatalogue,
  getUgandanSeriesCatalogue,
  parseTitleAndMeta,
  formatVjName,
  verifyStreamUrl
};
