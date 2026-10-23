/**
 * Uganda Country Module Entry
 */

const config = require('./config');
const readiness = require('./readiness');
const sources = require('./sources');
const movies = require('./movies');
const translatedMovies = require('./translated-movies');
const tvShows = require('./tv-shows');
const tvChannels = require('./tv-channels');
const radioStations = require('./radio-stations');
const concerts = require('./concerts');
const search = require('./search');
const utils = require('./utils');

module.exports = {
  config,
  readiness,
  sources,
  movies,
  translatedMovies,
  tvShows,
  tvChannels,
  radioStations,
  concerts,
  search,
  utils
};
