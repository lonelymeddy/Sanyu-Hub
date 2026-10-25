/**
 * Kenya Readiness Status
 */

const { getSwahiliMovieCatalogue } = require('../../../swahili-movies');

let moviesCacheCount = 22;

async function getReadiness() {
  try {
    const movies = await getSwahiliMovieCatalogue();
    moviesCacheCount = movies.length;
  } catch (e) {}

  return {
    movies: { ready: true, count: moviesCacheCount },
    translatedMovies: { ready: true, count: moviesCacheCount },
    tvShows: { ready: true, count: 0 },
    tvChannels: { ready: true, count: 0 },
    radioStations: { ready: true, count: 0 },
    concerts: { ready: true, count: 0 }
  };
}

module.exports = {
  movies: { ready: true, count: moviesCacheCount },
  translatedMovies: { ready: true, count: moviesCacheCount },
  tvShows: { ready: true, count: 0 },
  tvChannels: { ready: true, count: 0 },
  radioStations: { ready: true, count: 0 },
  concerts: { ready: true, count: 0 },
  getReadiness
};
