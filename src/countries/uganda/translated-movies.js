/**
 * Uganda Translated Movies Module
 */

const { getMovies } = require('./movies');

async function getTranslatedMovies() {
  const allMovies = await getMovies();
  return allMovies.filter(m => m.vj || (m.genres && m.genres.includes('Luganda Translated')));
}

module.exports = {
  getTranslatedMovies
};
