/**
 * Centralized Country Loader Module
 * Loads country-specific modules based on user selection without cross-country leaks.
 */

const { getCountryModule } = require('../registry');

async function loadCountryCatalogue(countryCode, category = 'all') {
  const code = (countryCode || 'ug').trim().toLowerCase();
  const module = getCountryModule(code);

  if (!module) {
    return {
      config: { code, name: code.toUpperCase(), ready: false, categories: {} },
      movies: [],
      series: [],
      tvChannels: [],
      radioStations: [],
      concerts: []
    };
  }

  const config = module.config;
  const readiness = module.readiness;

  // Check country readiness
  if (!config || !config.ready) {
    return {
      config,
      readiness,
      movies: [],
      series: [],
      tvChannels: [],
      radioStations: [],
      concerts: []
    };
  }

  const result = {
    config,
    readiness,
    movies: [],
    series: [],
    tvChannels: [],
    radioStations: [],
    concerts: []
  };

  if (category === 'all' || category === 'movies' || category === 'translated-movies') {
    if (config.categories.movies) {
      result.movies = await module.movies.getMovies();
      result.translatedMovies = await module.translatedMovies.getTranslatedMovies();
    }
  }

  if (category === 'all' || category === 'series' || category === 'tv-shows') {
    if (config.categories.series) {
      result.series = await module.tvShows.getTvShows();
    }
  }

  if (category === 'all' || category === 'tv' || category === 'tv-channels') {
    if (config.categories.tv) {
      result.tvChannels = await module.tvChannels.getTvChannels();
    }
  }

  if (category === 'all' || category === 'radio' || category === 'radio-stations') {
    if (config.categories.radio) {
      result.radioStations = await module.radioStations.getRadioStations();
    }
  }

  if (category === 'all' || category === 'concerts') {
    if (config.categories.concerts) {
      result.concerts = await module.concerts.getConcerts();
    }
  }

  return result;
}

module.exports = {
  loadCountryCatalogue
};
