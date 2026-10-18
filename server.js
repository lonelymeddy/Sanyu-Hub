const express = require('express');
const path = require('path');
const { getCatalogue, getSeriesCatalogue } = require('./moviemax');

const app = express();
const PORT = process.env.PORT || 3000;

// API Route for Movies Catalogue
app.get('/api/movies', async (req, res) => {
  try {
    const catalogue = await getCatalogue();

    // Extract query params
    const search = (req.query.search || '').trim().toLowerCase();
    const vjFilter = (req.query.vj || req.query.category || '').trim().toLowerCase();
    const genreFilter = (req.query.genre || '').trim().toLowerCase();
    const yearFilter = req.query.year ? parseInt(req.query.year, 10) : null;
    const qualityFilter = (req.query.quality || '').trim().toLowerCase();
    const sort = (req.query.sort || 'recently-added').trim().toLowerCase();

    // Extract unique VJs and Genres available across full catalogue
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
        const matchFile = movie.filename && movie.filename.toLowerCase().includes(search);
        const matchVj = movie.vj && movie.vj.toLowerCase().includes(search);
        const matchOverview = movie.overview && movie.overview.toLowerCase().includes(search);
        if (!matchTitle && !matchFile && !matchVj && !matchOverview) return false;
      }

      if (vjFilter && vjFilter !== 'all') {
        const vjLower = (movie.vj || '').toLowerCase();
        const catLower = (movie.category || '').toLowerCase();
        if (!vjLower.includes(vjFilter) && !catLower.includes(vjFilter)) return false;
      }

      if (genreFilter && genreFilter !== 'all') {
        const hasGenre = movie.genres && movie.genres.some(g => g.toLowerCase() === genreFilter);
        const catMatch = (movie.category || '').toLowerCase().includes(genreFilter);
        if (!hasGenre && !catMatch) return false;
      }

      if (yearFilter && movie.year !== yearFilter) {
        return false;
      }

      if (qualityFilter && qualityFilter !== 'all') {
        if ((movie.quality || '').toLowerCase() !== qualityFilter) return false;
      }

      return true;
    });

    // Sorting
    if (sort === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'year') {
      filtered.sort((a, b) => (b.year || 0) - (a.year || 0));
    } else if (sort === 'popularity') {
      filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else if (sort === 'rating') {
      filtered.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));
    } else {
      // Default: recently-added
      filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
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
    res.status(500).json({
      error: 'Failed to retrieve movie catalogue.'
    });
  }
});

// API Route for Series Catalogue
app.get('/api/series', async (req, res) => {
  try {
    const seriesList = await getSeriesCatalogue();

    const search = (req.query.search || '').trim().toLowerCase();
    const vjFilter = (req.query.vj || req.query.category || '').trim().toLowerCase();
    const genreFilter = (req.query.genre || '').trim().toLowerCase();
    const yearFilter = req.query.year ? parseInt(req.query.year, 10) : null;
    const sort = (req.query.sort || 'popular').trim().toLowerCase();

    // Extract unique genres across series
    const genreSet = new Set();
    seriesList.forEach(s => {
      if (s.genres && Array.isArray(s.genres)) {
        s.genres.forEach(g => genreSet.add(g));
      }
    });
    const genres = Array.from(genreSet).sort();

    let filtered = seriesList.filter(series => {
      if (search) {
        const matchTitle = series.title && series.title.toLowerCase().includes(search);
        const matchVj = series.vj && series.vj.toLowerCase().includes(search);
        const matchOverview = series.overview && series.overview.toLowerCase().includes(search);
        if (!matchTitle && !matchVj && !matchOverview) return false;
      }

      if (vjFilter && vjFilter !== 'all') {
        const vjLower = (series.vj || '').toLowerCase();
        const catLower = (series.category || '').toLowerCase();
        if (!vjLower.includes(vjFilter) && !catLower.includes(vjFilter)) return false;
      }

      if (genreFilter && genreFilter !== 'all') {
        const hasGenre = series.genres && series.genres.some(g => g.toLowerCase() === genreFilter);
        const catMatch = (series.category || '').toLowerCase().includes(genreFilter);
        if (!hasGenre && !catMatch) return false;
      }

      if (yearFilter && series.year !== yearFilter) {
        return false;
      }

      return true;
    });

    // Sorting
    if (sort === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'year') {
      filtered.sort((a, b) => (b.year || 0) - (a.year || 0));
    } else if (sort === 'episodes') {
      filtered.sort((a, b) => b.totalEpisodes - a.totalEpisodes);
    } else if (sort === 'rating') {
      filtered.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));
    } else {
      // Default: popular
      filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
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
app.get('/api/series/:id', async (req, res) => {
  try {
    const seriesList = await getSeriesCatalogue();
    const series = seriesList.find(s => s.id === req.params.id);
    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }
    res.json(series);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve series detail' });
  }
});

// Single movie detail API
app.get('/api/movies/:id', async (req, res) => {
  try {
    const catalogue = await getCatalogue();
    const movie = catalogue.find(m => m.id === req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve movie detail' });
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
