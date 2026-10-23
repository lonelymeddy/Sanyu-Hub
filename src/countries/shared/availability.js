/**
 * Availability and Readiness Helper Module
 */

function getCategoryReadiness(countryConfig, category) {
  if (!countryConfig || !countryConfig.ready) return false;
  return Boolean(countryConfig.categories && countryConfig.categories[category]);
}

function filterByAvailability(items = []) {
  return items.filter(item => item && item.available !== false && item.verified !== false);
}

module.exports = {
  getCategoryReadiness,
  filterByAvailability
};
