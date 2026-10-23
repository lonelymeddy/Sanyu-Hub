/**
 * Uganda TV Shows / Series Module
 */

const { getUgandanSeriesCatalogue } = require('../../../ugandan-movies');

async function getTvShows() {
  const catalogue = await getUgandanSeriesCatalogue();
  return catalogue.map(s => ({
    ...s,
    country: 'ug',
    originalLanguage: s.originalLanguage || 'English',
    availableLanguages: s.availableLanguages || ['Luganda']
  }));
}

module.exports = {
  getTvShows
};
