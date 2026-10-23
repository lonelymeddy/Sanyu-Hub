/**
 * Uganda Concerts Module
 */

const { getUpcomingConcerts } = require('../../../allevents-concerts');

async function getConcerts() {
  const allConcerts = await getUpcomingConcerts();
  return allConcerts.filter(c => !c.country || c.country === 'ug');
}

module.exports = {
  getConcerts
};
