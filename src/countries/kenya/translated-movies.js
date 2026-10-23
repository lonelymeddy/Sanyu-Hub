/**
 * Kenya Translated Movies Module
 * Contains verified Swahili dubbed/translated movies with recorded audio language and translation metadata.
 */

const { getMovies } = require('./movies');

async function getTranslatedMovies() {
  const allMovies = await getMovies();
  return allMovies.filter(m =>
    (m.availableLanguages && m.availableLanguages.some(l => l.toLowerCase().includes('swahili'))) ||
    (m.vj && m.vj.toLowerCase().includes('dj'))
  );
}

module.exports = {
  getTranslatedMovies
};
