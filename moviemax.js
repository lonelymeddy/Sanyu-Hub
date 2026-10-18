const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// In-memory cache for catalogue
let catalogueCache = null;
let cacheTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Disk cache for TMDB artwork mappings keyed by MovieMax ID
const CACHE_FILE_PATH = path.join(__dirname, 'tmdb_cache.json');
let tmdbArtworkCache = {};

try {
  if (fs.existsSync(CACHE_FILE_PATH)) {
    const rawData = fs.readFileSync(CACHE_FILE_PATH, 'utf8');
    tmdbArtworkCache = JSON.parse(rawData) || {};
  }
} catch (e) {
  tmdbArtworkCache = {};
}

function saveArtworkCache() {
  try {
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(tmdbArtworkCache, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save tmdb_cache.json:', e.message);
  }
}

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
 * Known VJ names and common suffixes/tags to strip from titles
 */
const VJ_NAMES_LIST = [
  "emmy", "uncle t", "uncle-t", "jingo", "ice p", "ice-p", "junior", "mark", "arafa", "bonny",
  "freddy", "hak", "ham", "ivo", "jona", "jr", "kali", "mosco", "mukiibi",
  "neil", "nelly", "pius", "sahin", "shan", "sheild", "shield", "soul",
  "tonny", "ulio", "bmc", "sammy", "derek"
];

/**
 * Normalize raw filename into clean Title, Year, Content Type and Episode details.
 */
function normalizeTitleAndMetadata(filename) {
  if (!filename) {
    return {
      title: 'Untitled',
      year: null,
      contentType: 'movie',
      episodeInfo: null
    };
  }

  let base = filename.replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v)$/i, '');
  let cleaned = base;

  // Remove handle tags (@...)
  cleaned = cleaned.replace(/@[\w'._-]+/gi, '');
  cleaned = cleaned.replace(/@\S+/g, '');

  // Replace delimiters with spaces
  cleaned = cleaned.replace(/[._\-]+/g, ' ');

  // Match 4-digit year
  const yearMatch = cleaned.match(/\b(19\d\d|20\d\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : null;

  // Episode / Season detection
  let episodeInfo = null;
  let contentType = 'movie';

  // Check explicit season/episode e.g. S01E13 or S1 E13
  const sEPattern = /\bS(\d+)\s*E(\d+)\b/i;
  const sEMatch = cleaned.match(sEPattern);

  if (sEMatch) {
    episodeInfo = { season: parseInt(sEMatch[1], 10), episode: parseInt(sEMatch[2], 10) };
    contentType = 'episode';
    cleaned = cleaned.replace(/\bS\d+\s*E\d+\b/gi, '');
  } else {
    // Check Episode / Ep / Part / Pt e.g. Episode 13 or Ep 13 or Pt 2
    const epPattern = /\b(Episode|Ep|Part|Pt)\s*(\d+)\b/i;
    const epMatch = cleaned.match(epPattern);

    if (epMatch) {
      episodeInfo = { episode: parseInt(epMatch[2], 10) };
      contentType = 'episode';
      cleaned = cleaned.replace(/\b(Episode|Ep|Part|Pt)\s*\d+\b/gi, '');
    } else {
      // Check for standalone numbers in series filenames, e.g. "Reborn Rich 13 Bmc" -> "Reborn Rich", ep 13
      const numMatch = cleaned.match(/^(.*?)\s+(\d{1,3})\b(.*)$/);
      if (numMatch) {
        const titlePrefix = numMatch[1].trim();
        const numVal = parseInt(numMatch[2], 10);
        const suffix = numMatch[3].trim();

        // If the number is not equal to the release year and title prefix is substantial
        if ((!year || numVal !== year) && titlePrefix.length >= 2) {
          episodeInfo = { episode: numVal };
          contentType = 'episode';
          cleaned = `${titlePrefix} ${suffix}`;
        }
      }
    }
  }

  // Remove phone numbers and social tags
  cleaned = cleaned.replace(/\(?\b07\d{2}[-\s]?\d{6}\b\)?/g, '');
  cleaned = cleaned.replace(/\b(0703592655|0787845863|0766009748)\b/g, '');

  // Remove promotional noise
  cleaned = cleaned.replace(/FOR SOFTCOPY|\bCOMPLEX\b|\bFLIMZ\b|\bJOKOLERA\b|\bCENTRE\b|\bKITI\b|\bENT\b|\bBURN\b/gi, '');

  // Remove quality & codec tags
  cleaned = cleaned.replace(/\b(1080p|720p|2160p|4k|hd|fullhd|web-dl|webrip|bluray|brrip|x264|x265|hevc|h264|h265|aac|ac3|hdr|extended|proper|remastered)\b/gi, '');

  // Remove year if present
  if (year) {
    cleaned = cleaned.replace(new RegExp('\\b' + year + '\\b', 'g'), '');
  }

  // Remove VJ prefixes and VJ name tokens (e.g. VJ EMMY, VJ ICE P, VJ BARBIE)
  cleaned = cleaned.replace(/\bVJ\s+[A-Za-z0-9_-]+(?:\s+[A-Za-z0-9_-]+)?\b/gi, '');
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

  // Formatting title case
  const formattedTitle = cleaned
    .split(' ')
    .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
    .join(' ');

  return {
    title: formattedTitle,
    year: year,
    contentType: contentType,
    episodeInfo: episodeInfo
  };
}

function normalizeTitleAndYear(filename) {
  const meta = normalizeTitleAndMetadata(filename);
  return { title: meta.title, year: meta.year };
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
 * String similarity algorithm (Sørensen–Dice coefficient on bigrams)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  const pairs1 = [];
  for (let i = 0; i < s1.length - 1; i++) pairs1.push(s1.slice(i, i + 2));
  const pairs2 = [];
  for (let i = 0; i < s2.length - 1; i++) pairs2.push(s2.slice(i, i + 2));

  if (pairs1.length === 0 || pairs2.length === 0) return 0;

  let intersection = 0;
  const p2Copy = [...pairs2];
  for (const p1 of pairs1) {
    const idx = p2Copy.indexOf(p1);
    if (idx !== -1) {
      intersection++;
      p2Copy.splice(idx, 1);
    }
  }
  return (2.0 * intersection) / (pairs1.length + pairs2.length);
}

/**
 * Generic HTTPS JSON fetcher for TMDB API
 */
function tmdbFetch(endpoint, queryParams = {}) {
  return new Promise((resolve) => {
    const tmdbKey = process.env.TMDB_API_KEY || '8265bd1679663a7ea12ac168da84d2e8';
    const params = new URLSearchParams({ api_key: tmdbKey, ...queryParams });
    const options = {
      hostname: 'api.themoviedb.org',
      path: `/3/${endpoint}?${params.toString()}`,
      method: 'GET',
      headers: { 'User-Agent': 'SanyuHub-Server/1.0' },
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = '';
      if (res.statusCode !== 200) {
        return resolve(null);
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.end();
  });
}

/**
 * Resolve TMDB Artwork Mapping independently for a MovieMax record
 */
async function resolveTmdbArtwork(parsedMeta) {
  const title = parsedMeta.title;
  const year = parsedMeta.year;
  const contentType = parsedMeta.contentType;
  const epInfo = parsedMeta.episodeInfo;

  const noMatchResult = {
    matchStatus: 'no_match',
    matchConfidence: 0,
    mediaType: null,
    tmdbId: null,
    posterPath: null,
    backdropPath: null,
    posterUrl: null,
    backdropUrl: null
  };

  if (!title || title.length < 2) {
    return noMatchResult;
  }

  const isEpisodeOrTv = contentType === 'episode' || contentType === 'tv';
  let searchResult = null;
  let mediaType = isEpisodeOrTv ? 'tv' : 'movie';

  // Perform search based on content type signal
  if (isEpisodeOrTv) {
    searchResult = await tmdbFetch('search/tv', { query: title, first_air_date_year: year || '' });
    if (!searchResult || !searchResult.results || searchResult.results.length === 0) {
      searchResult = await tmdbFetch('search/movie', { query: title, year: year || '' });
      if (searchResult && searchResult.results && searchResult.results.length > 0) {
        mediaType = 'movie';
      }
    }
  } else {
    searchResult = await tmdbFetch('search/movie', { query: title, year: year || '' });
    if (!searchResult || !searchResult.results || searchResult.results.length === 0) {
      searchResult = await tmdbFetch('search/tv', { query: title, first_air_date_year: year || '' });
      if (searchResult && searchResult.results && searchResult.results.length > 0) {
        mediaType = 'tv';
      }
    }
  }

  if (!searchResult || !searchResult.results || searchResult.results.length === 0) {
    return noMatchResult;
  }

  // Validate best candidate using title similarity and year signal
  const candidates = searchResult.results;
  let bestMatch = null;
  let bestConfidence = 0;

  for (const item of candidates) {
    const tmdbTitle = item.title || item.name || item.original_title || item.original_name;
    const sim = calculateSimilarity(title, tmdbTitle);

    let yearBonus = 0;
    const releaseDate = item.release_date || item.first_air_date;
    if (year && releaseDate) {
      const matchYear = parseInt(releaseDate.slice(0, 4), 10);
      if (matchYear === year) yearBonus = 0.15;
    }

    const confidence = Math.min(1.0, sim + yearBonus);
    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestMatch = item;
    }
  }

  // Reject low confidence matches (< 0.45)
  if (!bestMatch || bestConfidence < 0.45) {
    return { ...noMatchResult, matchConfidence: parseFloat(bestConfidence.toFixed(2)) };
  }

  let posterPath = bestMatch.poster_path;
  let backdropPath = bestMatch.backdrop_path;
  let status = (mediaType === 'tv' && contentType === 'episode') ? 'episode_parent_matched' : 'matched';

  // Fetch full details from TMDB (overview, genres, cast, runtime, etc.)
  const detailedInfo = await tmdbFetch(`${mediaType}/${bestMatch.id}`, { append_to_response: 'credits' });

  let overview = bestMatch.overview || (detailedInfo ? detailedInfo.overview : null);
  let voteAverage = bestMatch.vote_average || (detailedInfo ? detailedInfo.vote_average : null);
  let popularity = bestMatch.popularity || (detailedInfo ? detailedInfo.popularity : null);
  let genres = detailedInfo && detailedInfo.genres ? detailedInfo.genres.map(g => g.name) : [];
  let cast = detailedInfo && detailedInfo.credits && detailedInfo.credits.cast ? detailedInfo.credits.cast.slice(0, 5).map(c => c.name) : [];
  let runtime = detailedInfo ? (detailedInfo.runtime || (detailedInfo.episode_run_time ? detailedInfo.episode_run_time[0] : null)) : null;
  let originalLanguage = bestMatch.original_language || (detailedInfo ? detailedInfo.original_language : null);
  let releaseDate = bestMatch.release_date || bestMatch.first_air_date || (detailedInfo ? (detailedInfo.release_date || detailedInfo.first_air_date) : null);
  let numberOfSeasons = detailedInfo ? detailedInfo.number_of_seasons : null;
  let numberOfEpisodes = detailedInfo ? detailedInfo.number_of_episodes : null;

  // Check if episode specific still image is available
  if (mediaType === 'tv' && epInfo && epInfo.episode) {
    const seasonNum = epInfo.season || 1;
    const epDetail = await tmdbFetch(`tv/${bestMatch.id}/season/${seasonNum}/episode/${epInfo.episode}`);
    if (epDetail && epDetail.still_path) {
      backdropPath = epDetail.still_path;
    }
  }

  const posterUrl = posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null;
  const backdropUrl = backdropPath ? `https://image.tmdb.org/t/p/w1280${backdropPath}` : null;

  return {
    matchStatus: status,
    matchConfidence: parseFloat(bestConfidence.toFixed(2)),
    mediaType: mediaType,
    tmdbId: bestMatch.id,
    posterPath: posterPath,
    backdropPath: backdropPath,
    posterUrl: posterUrl,
    backdropUrl: backdropUrl,
    overview: overview,
    voteAverage: voteAverage ? parseFloat(voteAverage.toFixed(1)) : null,
    popularity: popularity ? parseFloat(popularity.toFixed(1)) : null,
    genres: genres,
    cast: cast,
    runtime: runtime,
    originalLanguage: originalLanguage,
    releaseDate: releaseDate,
    numberOfSeasons: numberOfSeasons,
    numberOfEpisodes: numberOfEpisodes
  };
}

/**
 * Normalize single MovieMax record into standard SanyuHub movie object.
 */
function normalizeMovie(m) {
  const stableId = generateStableId(m.path || m.url || m.name);
  const parsedMeta = normalizeTitleAndMetadata(m.name);
  const vj = formatVjName(m.folder || m.category);
  const quality = extractQuality(m.name);
  const format = extractFormat(m.name);

  // Check if we have artwork mapping in cache
  const cachedArtwork = tmdbArtworkCache[`artwork:moviemax:${stableId}`] || null;

  let posterUrl = null;
  let backdropUrl = null;
  let tmdbMeta = null;
  let overview = null;
  let genres = [];
  let cast = [];
  let voteAverage = null;
  let popularity = null;
  let runtime = null;
  let originalLanguage = null;

  if (cachedArtwork) {
    posterUrl = cachedArtwork.posterUrl;
    backdropUrl = cachedArtwork.backdropUrl;
    overview = cachedArtwork.overview || null;
    genres = cachedArtwork.genres || [];
    cast = cachedArtwork.cast || [];
    voteAverage = cachedArtwork.voteAverage || null;
    popularity = cachedArtwork.popularity || null;
    runtime = cachedArtwork.runtime || null;
    originalLanguage = cachedArtwork.originalLanguage || null;

    tmdbMeta = {
      mediaType: cachedArtwork.mediaType,
      id: cachedArtwork.tmdbId,
      posterPath: cachedArtwork.posterPath,
      backdropPath: cachedArtwork.backdropPath,
      matchStatus: cachedArtwork.matchStatus,
      matchConfidence: cachedArtwork.matchConfidence
    };
  } else if (m.poster || m.thumbnail) {
    posterUrl = m.poster || m.thumbnail;
  }

  return {
    id: stableId,
    title: parsedMeta.title,
    contentType: parsedMeta.contentType,
    episodeInfo: parsedMeta.episodeInfo,
    year: parsedMeta.year,
    filename: m.name || '',
    mediaUrl: m.url || '',
    posterUrl: posterUrl,
    backdropUrl: backdropUrl,
    overview: overview,
    genres: genres,
    cast: cast,
    voteAverage: voteAverage,
    popularity: popularity,
    runtime: runtime,
    originalLanguage: originalLanguage,
    tmdb: tmdbMeta,
    tmdbId: tmdbMeta ? tmdbMeta.id : null,
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
 * Asynchronously sync artwork for all records in background
 */
let isSyncing = false;
async function syncCatalogueArtwork(rawMovies) {
  if (isSyncing) return;
  isSyncing = true;
  let newMatchesCount = 0;

  try {
    for (const m of rawMovies) {
      const stableId = generateStableId(m.path || m.url || m.name);
      const cacheKey = `artwork:moviemax:${stableId}`;

      if (!tmdbArtworkCache[cacheKey]) {
        const parsedMeta = normalizeTitleAndMetadata(m.name);
        const artwork = await resolveTmdbArtwork(parsedMeta);
        tmdbArtworkCache[cacheKey] = {
          moviemaxId: stableId,
          title: m.name || '',
          cleanTitle: parsedMeta.title,
          contentType: parsedMeta.contentType,
          ...artwork
        };
        newMatchesCount++;
        if (newMatchesCount % 10 === 0) {
          saveArtworkCache();
        }
      }
    }
    if (newMatchesCount > 0) {
      saveArtworkCache();
    }
  } catch (err) {
    console.error('Error during background artwork sync:', err.message);
  } finally {
    isSyncing = false;
  }
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

    // Background async resolution of missing artwork
    syncCatalogueArtwork(rawMovies).catch(() => {});

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

/**
 * Group catalogue episode items into structured Series objects with seasons and episode lists.
 */
async function getSeriesCatalogue(forceRefresh = false) {
  const catalogue = await getCatalogue(forceRefresh);

  // Filter episode and series items
  const seriesItems = catalogue.filter(item => item.contentType === 'episode' || item.contentType === 'tv');

  const seriesMap = new Map();

  seriesItems.forEach(item => {
    // Generate normalized series key based on title
    const seriesTitle = item.title;
    const seriesKey = seriesTitle.toLowerCase().trim();

    if (!seriesMap.has(seriesKey)) {
      seriesMap.set(seriesKey, {
        id: crypto.createHash('sha256').update(seriesKey).digest('hex').slice(0, 16),
        title: seriesTitle,
        year: item.year,
        vj: item.vj,
        posterUrl: item.posterUrl,
        backdropUrl: item.backdropUrl,
        overview: item.overview,
        genres: item.genres || [],
        cast: item.cast || [],
        voteAverage: item.voteAverage,
        popularity: item.popularity,
        tmdbId: item.tmdbId,
        quality: item.quality,
        category: item.category,
        episodes: [],
        seasonsMap: new Map()
      });
    }

    const series = seriesMap.get(seriesKey);

    // Keep best artwork / overview if missing initially
    if (!series.posterUrl && item.posterUrl) series.posterUrl = item.posterUrl;
    if (!series.backdropUrl && item.backdropUrl) series.backdropUrl = item.backdropUrl;
    if (!series.overview && item.overview) series.overview = item.overview;
    if ((!series.genres || series.genres.length === 0) && item.genres) series.genres = item.genres;
    if ((!series.cast || series.cast.length === 0) && item.cast) series.cast = item.cast;
    if (!series.voteAverage && item.voteAverage) series.voteAverage = item.voteAverage;

    const epSeason = (item.episodeInfo && item.episodeInfo.season) ? item.episodeInfo.season : 1;
    const epNumber = (item.episodeInfo && item.episodeInfo.episode) ? item.episodeInfo.episode : (series.episodes.length + 1);

    const episodeObj = {
      id: item.id,
      title: item.title,
      filename: item.filename,
      season: epSeason,
      episode: epNumber,
      mediaUrl: item.mediaUrl,
      quality: item.quality,
      format: item.format,
      vj: item.vj,
      dateAdded: item.dateAdded,
      posterUrl: item.posterUrl || series.posterUrl,
      backdropUrl: item.backdropUrl || series.backdropUrl
    };

    series.episodes.push(episodeObj);

    if (!series.seasonsMap.has(epSeason)) {
      series.seasonsMap.set(epSeason, []);
    }
    series.seasonsMap.get(epSeason).push(episodeObj);
  });

  // Convert seriesMap to array and format seasons
  const seriesList = Array.from(seriesMap.values()).map(s => {
    const seasons = Array.from(s.seasonsMap.entries()).map(([seasonNum, eps]) => {
      // Sort episodes by episode number
      eps.sort((a, b) => a.episode - b.episode);
      return {
        seasonNumber: seasonNum,
        name: `Season ${seasonNum}`,
        episodeCount: eps.length,
        episodes: eps
      };
    });

    seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
    s.episodes.sort((a, b) => {
      if (a.season !== b.season) return a.season - b.season;
      return a.episode - b.episode;
    });

    return {
      id: s.id,
      title: s.title,
      year: s.year,
      vj: s.vj,
      posterUrl: s.posterUrl,
      backdropUrl: s.backdropUrl,
      overview: s.overview,
      genres: s.genres,
      cast: s.cast,
      voteAverage: s.voteAverage,
      popularity: s.popularity,
      tmdbId: s.tmdbId,
      quality: s.quality,
      category: s.category,
      totalSeasons: seasons.length,
      totalEpisodes: s.episodes.length,
      seasons: seasons,
      episodes: s.episodes
    };
  });

  return seriesList;
}

module.exports = {
  getCatalogue,
  getSeriesCatalogue,
  normalizeMovie,
  resolveTmdbArtwork,
  normalizeTitleAndMetadata,
  saveArtworkCache,
  tmdbArtworkCache
};
