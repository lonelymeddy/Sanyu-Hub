/**
 * Uganda Movies Module
 */

const { getUgandanMovieCatalogue } = require('../../../ugandan-movies');

async function getMovies() {
  const catalogue = await getUgandanMovieCatalogue();
  return catalogue.map(m => ({
    ...m,
    country: 'ug',
    originalLanguage: m.originalLanguage || 'English',
    availableLanguages: m.availableLanguages || ['Luganda']
  }));
}

module.exports = {
  getMovies
};
