/**
 * Kenya Movies Module
 * Integrates Swahix catalogue for Kenya / Swahili ecosystem.
 */

const { getSwahiliMovieCatalogue } = require('../../../swahili-movies');

async function getMovies() {
  const catalogue = await getSwahiliMovieCatalogue();
  return catalogue.map(m => ({
    ...m,
    country: 'ke',
    originalLanguage: m.originalLanguage || 'English',
    availableLanguages: m.availableLanguages || ['Swahili', 'English']
  }));
}

module.exports = {
  getMovies
};
