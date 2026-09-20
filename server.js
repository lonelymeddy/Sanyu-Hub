const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve all static assets and pages
app.use(express.static(__dirname, {
  extensions: ['html'],
  index: 'index.html'
}));

// Fallback route handler for clean URLs if express.static misses
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
