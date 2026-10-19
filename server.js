const express = require('express');
const path = require('path');
const { getUgandanMovieCatalogue, getUgandanSeriesCatalogue } = require('./ugandan-movies');

const app = express();
const PORT = process.env.PORT || 3000;

// API Route for Movies Catalogue
app.get('/api/movies', async (req, res) => {
  try {
    const catalogue = await getUgandanMovieCatalogue();

    // Extract query parameters
    const search = (req.query.search || '').trim().toLowerCase();
    const vjFilter = (req.query.vj || req.query.category || '').trim().toLowerCase();
    const genreFilter = (req.query.genre || '').trim().toLowerCase();
    const yearFilter = req.query.year ? parseInt(req.query.year, 10) : null;
    const sort = (req.query.sort || 'recently-added').trim().toLowerCase();

    // Extract unique VJs and Genres
    const vjSet = new Set();
    const genreSet = new Set();
    catalogue.forEach(m => {
      if (m.vj) vjSet.add(m.vj);
      if (m.genres && Array.isArray(m.genres)) {
        m.genres.forEach(g => genreSet.add(g));
      }
    });
    const vjs = Array.from(vjSet).sort();
    const genres = Array.from(genreSet).sort();

    // Filter catalogue
    let filtered = catalogue.filter(movie => {
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
    res.status(500).json({ error: 'Failed to retrieve Ugandan movie catalogue.' });
  }
});

// Single movie detail API
app.get('/api/movies/:id', async (req, res) => {
  try {
    const catalogue = await getUgandanMovieCatalogue();
    const movie = catalogue.find(m => m.id === req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve movie details.' });
  }
});

// API Route for Series Catalogue
app.get('/api/series', async (req, res) => {
  try {
    const seriesCatalogue = await getUgandanSeriesCatalogue();

    const search = (req.query.search || '').trim().toLowerCase();
    const vjFilter = (req.query.vj || '').trim().toLowerCase();
    const genreFilter = (req.query.genre || '').trim().toLowerCase();
    const sort = (req.query.sort || 'popular').trim().toLowerCase();

    const genreSet = new Set();
    seriesCatalogue.forEach(s => {
      if (s.genres && Array.isArray(s.genres)) {
        s.genres.forEach(g => genreSet.add(g));
      }
    });
    const genres = Array.from(genreSet).sort();

    let filtered = seriesCatalogue.filter(s => {
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
    res.status(500).json({ error: 'Failed to retrieve Ugandan series catalogue.' });
  }
});

// Single Series Detail API
app.get('/api/series/:id', async (req, res) => {
  try {
    const seriesCatalogue = await getUgandanSeriesCatalogue();
    const series = seriesCatalogue.find(s => s.id === req.params.id);
    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }
    res.json(series);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve series details.' });
  }
});

// Dynamic Page Routes
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

app.get('/watch/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'watch.html'));
});

app.get('/watch', (req, res) => {
  res.redirect('/movies');
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
  console.log(`SanyuHub web service running on port ${PORT}`);
});
