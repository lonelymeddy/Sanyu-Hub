const express = require('express');
const path = require('path');
const https = require('https');
const http = require('http');
const { loadCountryCatalogue } = require('./src/countries/shared/country-loader');
const { getSupportedCountries } = require('./src/countries/registry');

const app = express();
const PORT = process.env.PORT || 3000;

// Generic Media Stream Proxy Helper
function proxyStream(targetUrl, req, res, defaultReferer) {
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(400).json({ error: 'Missing or invalid target media URL parameter.' });
  }

  try {
    const parsed = new URL(targetUrl);
    const clientHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*'
    };

    if (defaultReferer) {
      clientHeaders['Referer'] = defaultReferer;
    } else if (parsed.hostname.includes('swahix.com')) {
      clientHeaders['Referer'] = 'https://swahix.com/';
    }

    if (req.headers.range) {
      clientHeaders['Range'] = req.headers.range;
    }

    const mod = parsed.protocol === 'https:' ? https : http;
    const proxyReq = mod.get(targetUrl, { headers: clientHeaders }, (proxyRes) => {
      // Follow redirects internally
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
app.get('/api/stream-proxy', (req, res) => {
  proxyStream(req.query.url, req, res);
});

// Stream Proxy Endpoints for Movies
app.get('/api/stream/movie/:id', async (req, res) => {
  try {
    const supported = getSupportedCountries();
    let allMovies = [];
    for (const c of supported) {
      const cData = await loadCountryCatalogue(c.code, 'movies');
      if (cData && cData.movies) {
        allMovies.push(...cData.movies);
      }
    }
    const movie = allMovies.find(m => m.id === req.params.id);
    if (!movie || !movie.mediaUrl) {
      return res.status(404).json({ error: 'Movie stream not found.' });
    }
    proxyStream(movie.mediaUrl, req, res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to process movie stream request.' });
  }
});

// Stream Proxy Endpoints for Series
app.get('/api/stream/series/:id', async (req, res) => {
  try {
    const supported = getSupportedCountries();
    let allSeries = [];
    for (const c of supported) {
      const cData = await loadCountryCatalogue(c.code, 'series');
      if (cData && cData.series) {
        allSeries.push(...cData.series);
      }
    }
    let targetEp = null;
    for (const s of allSeries) {
      if (s.episodes) {
        const ep = s.episodes.find(e => e.id === req.params.id);
        if (ep) {
          targetEp = ep;
          break;
        }
      }
    }
    if (!targetEp || !targetEp.mediaUrl) {
      return res.status(404).json({ error: 'Series episode stream not found.' });
    }
    proxyStream(targetEp.mediaUrl, req, res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to process series episode stream request.' });
  }
});

// Stream Proxy Endpoints for Live TV Channels
app.get('/api/stream/tv/:id', async (req, res) => {
  try {
    const supported = getSupportedCountries();
    let allChannels = [];
    for (const c of supported) {
      const cData = await loadCountryCatalogue(c.code, 'tv');
      if (cData && cData.tvChannels) {
        allChannels.push(...cData.tvChannels);
      }
    }
    const channel = allChannels.find(ch => ch.id === req.params.id);
    if (!channel || !channel.streamUrl) {
      return res.status(404).json({ error: 'Live TV channel stream not found.' });
    }
    proxyStream(channel.streamUrl, req, res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to process TV channel stream request.' });
  }
});

// Stream Proxy Endpoints for Radio
app.get('/api/stream/radio/:id', async (req, res) => {
  try {
    const supported = getSupportedCountries();
    let allRadio = [];
    for (const c of supported) {
      const cData = await loadCountryCatalogue(c.code, 'radio');
      if (cData && cData.radioStations) {
        allRadio.push(...cData.radioStations);
      }
    }
    const station = allRadio.find(st => st.id === req.params.id);
    if (!station || !station.streamUrl) {
      return res.status(404).json({ error: 'Radio station stream not found.' });
    }
    proxyStream(station.streamUrl, req, res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to process radio stream request.' });
  }
});

// Helper to sanitize items and hide direct media URLs from API consumers
function sanitizeMovieItem(movie, host) {
  const clone = { ...movie };
  clone.streamUrl = `${host}/api/stream/movie/${movie.id}`;
  clone.embedUrl = `${host}/embed?type=movie&id=${movie.id}`;
  delete clone.mediaUrl;
  delete clone.externalUrl;
  delete clone.source;
  return clone;
}

function sanitizeSeriesItem(series, host) {
  const clone = { ...series };
  clone.embedUrl = `${host}/embed?type=series&id=${series.id}`;
  if (clone.episodes && Array.isArray(clone.episodes)) {
    clone.episodes = clone.episodes.map(ep => {
      const epClone = { ...ep };
      epClone.streamUrl = `${host}/api/stream/series/${ep.id}`;
      epClone.embedUrl = `${host}/embed?type=series&id=${ep.id}`;
      delete epClone.mediaUrl;
      delete epClone.externalUrl;
      delete epClone.source;
      return epClone;
    });
  }
  return clone;
}

function sanitizeTvItem(channel, host) {
  const clone = { ...channel };
  clone.streamUrl = `${host}/api/stream/tv/${channel.id}`;
  clone.embedUrl = `${host}/embed?type=tv&id=${channel.id}`;
  return clone;
}

function sanitizeRadioItem(station, host) {
  const clone = { ...station };
  clone.streamUrl = `${host}/api/stream/radio/${station.id}`;
  clone.embedUrl = `${host}/embed?type=radio&id=${station.id}`;
  return clone;
}

// API Route for Live TV Channels
app.get('/api/live-tv/channels', async (req, res) => {
  try {
    const host = `${req.protocol}://${req.get('host')}`;
    const country = (req.query.country || 'ug').trim().toLowerCase();
    const catalogueData = await loadCountryCatalogue(country, 'tv');
    const sanitized = (catalogueData.tvChannels || []).map(ch => sanitizeTvItem(ch, host));
    res.json({
      channels: sanitized
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve TV channels.' });
  }
});

// API Route for Radio Stations
app.get('/api/radio', async (req, res) => {
  try {
    const host = `${req.protocol}://${req.get('host')}`;
    const country = (req.query.country || 'ug').trim().toLowerCase();
    const catalogueData = await loadCountryCatalogue(country, 'radio');
    const sanitized = (catalogueData.radioStations || []).map(st => sanitizeRadioItem(st, host));
    res.json({
      stations: sanitized
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve radio stations.' });
  }
});

// API Route for Movies Catalogue
app.get('/api/movies', async (req, res) => {
  try {
    const host = `${req.protocol}://${req.get('host')}`;
    const country = (req.query.country || 'ug').trim().toLowerCase();

    const catalogueData = await loadCountryCatalogue(country, 'movies');
    const movies = catalogueData.movies || [];

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
    const paginatedMovies = filtered.slice(startIndex, startIndex + limit).map(m => sanitizeMovieItem(m, host));

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
app.get('/api/movies/:id', async (req, res) => {
  try {
    const host = `${req.protocol}://${req.get('host')}`;
    const supported = getSupportedCountries();
    let allMovies = [];
    for (const c of supported) {
      const cData = await loadCountryCatalogue(c.code, 'movies');
      if (cData && cData.movies) {
        allMovies.push(...cData.movies);
      }
    }

    const movie = allMovies.find(m => m.id === req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json(sanitizeMovieItem(movie, host));
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve movie details.' });
  }
});

// API Route for Series Catalogue
app.get('/api/series', async (req, res) => {
  try {
    const host = `${req.protocol}://${req.get('host')}`;
    const country = (req.query.country || 'ug').trim().toLowerCase();

    const catalogueData = await loadCountryCatalogue(country, 'series');
    const seriesList = catalogueData.series || [];

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
    const paginatedSeries = filtered.slice(startIndex, startIndex + limit).map(s => sanitizeSeriesItem(s, host));

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
app.get('/api/series/:id', async (req, res) => {
  try {
    const host = `${req.protocol}://${req.get('host')}`;
    const supported = getSupportedCountries();
    let allSeries = [];
    for (const c of supported) {
      const cData = await loadCountryCatalogue(c.code, 'series');
      if (cData && cData.series) {
        allSeries.push(...cData.series);
      }
    }

    const series = allSeries.find(s => s.id === req.params.id);
    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }
    res.json(sanitizeSeriesItem(series, host));
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve series details.' });
  }
});

// API Route for Concerts
app.get('/api/concerts', async (req, res) => {
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
app.get('/api/concerts/:id', async (req, res) => {
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

// Embeddable Video Player Route
app.get('/embed', (req, res) => {
  res.sendFile(path.join(__dirname, 'embed.html'));
});

// Dynamic Page Routes
app.get('/concert/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'concert.html'));
});

app.get('/movie/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'movie.html'));
});

app.get('/movie', (req, res) => {
  res.sendFile(path.join(__dirname, 'movies.html'));
});

app.get('/series/watch/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'series-watch.html'));
});

app.get('/series/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'series-detail.html'));
});

app.get('/series', (req, res) => {
  res.sendFile(path.join(__dirname, 'series.html'));
});

app.get(['/more', '/more/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'more.html'));
});

app.get(['/music', '/music/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'music.html'));
});

app.get(['/podcasts', '/podcasts/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'podcasts.html'));
});

app.get(['/profile', '/profile/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'profile.html'));
});

app.get(['/saved', '/saved/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'saved.html'));
});

app.get(['/downloaded', '/downloaded/'], (req, res) => {
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

app.get('/watch/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'watch.html'));
});

app.get('/watch', (req, res) => {
  res.redirect('/movies');
});

// Live TV EPG Endpoint
app.get('/api/live-tv/epg/:id', async (req, res) => {
  const channelId = req.params.id;
  res.json({
    channelId: channelId,
    schedule: [],
    message: 'Programme schedule currently unavailable.'
  });
});

// Live TV Concurrent Viewer Count Endpoint
app.get('/api/live-tv/viewers/:id', async (req, res) => {
  const channelId = req.params.id;
  res.json({
    channelId: channelId,
    viewers: null,
    message: 'Viewers unavailable'
  });
});

// Live TV Watch Routes
app.get(['/live-tv/watch/:id', '/live-tv/watch/:id/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'live-tv', 'watch.html'));
});

app.get(['/live-tv/watch', '/live-tv/watch/'], (req, res) => {
  res.redirect('/live-tv/');
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
  console.log(`Meddy API web service running on port ${PORT}`);
});
