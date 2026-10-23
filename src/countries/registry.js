/**
 * Country Registry Module
 * Maps ISO country codes to their dedicated independent country modules.
 */

const ugandaModule = require('./uganda');
const kenyaModule = require('./kenya');

const REGISTRY = {
  ug: ugandaModule,
  ke: kenyaModule
};

function getCountryModule(countryCode) {
  const code = (countryCode || 'ug').trim().toLowerCase();
  return REGISTRY[code] || null;
}

function isCountrySupported(countryCode) {
  const code = (countryCode || '').trim().toLowerCase();
  return Boolean(REGISTRY[code]);
}

function getSupportedCountries() {
  return Object.keys(REGISTRY).map(code => ({
    code,
    config: REGISTRY[code].config
  }));
}

module.exports = {
  getCountryModule,
  isCountrySupported,
  getSupportedCountries
};
