const express = require('express');
const path = require('path');
const { getCatalogue } = require('./moviemax');

const app = express();
const PORT = process.env.PORT || 3000;

// API Route for Movies Catalogue
app.get('/api/movies', async (req, res) => {
  try {
    const catalogue = await getCatalogue();

    // Extract query params
    const search = (req.query.search || '').trim().toLowerCase();
    const vjFilter = (req.query.vj || req.query.category || '').trim().toLowerCase();
    const yearFilter = req.query.year ? parseInt(req.query.year, 10) : null;
    const qualityFilter = (req.query.quality || '').trim().toLowerCase();
    const sort = (req.query.sort || 'recently-added').trim().toLowerCase();

    // Extract unique VJs available across full catalogue
    const vjSet = new Set();
    catalogue.forEach(m => {
      if (m.vj) vjSet.add(m.vj);
    });
    const vjs = Array.from(vjSet).sort();

    // Filter catalogue
    let filtered = catalogue.filter(movie => {
      if (search) {
        const matchTitle = movie.title && movie.title.toLowerCase().includes(search);
        const matchFile = movie.filename && movie.filename.toLowerCase().includes(search);
        const matchVj = movie.vj && movie.vj.toLowerCase().includes(search);
        if (!matchTitle && !matchFile && !matchVj) return false;
      }

      if (vjFilter && vjFilter !== 'all') {
        const vjLower = (movie.vj || '').toLowerCase();
        const catLower = (movie.category || '').toLowerCase();
        if (!vjLower.includes(vjFilter) && !catLower.includes(vjFilter)) return false;
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
      vjs: vjs
    });

  } catch (err) {
    res.status(500).json({
      error: 'Failed to retrieve movie catalogue.'
    });
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

app.get('/watch/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'watch.html'));
});

app.get('/watch', (req, res) => {
  res.redirect('/movies');
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
