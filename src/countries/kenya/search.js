/**
 * Kenya Search Module
 */

async function searchKenyaContent(query) {
  const cleanQuery = (query || '').trim().toLowerCase();
  if (!cleanQuery) return [];

  const moviesMod = require('./movies');
  const tvShowsMod = require('./tv-shows');
  const tvChanMod = require('./tv-channels');
  const radioMod = require('./radio-stations');
  const concertsMod = require('./concerts');

  const [movies, series, tvs, radios, concerts] = await Promise.all([
    moviesMod.getMovies(),
    tvShowsMod.getTvShows(),
    tvChanMod.getTvChannels(),
    radioMod.getRadioStations(),
    concertsMod.getConcerts()
  ]);

  const results = [];

  movies.forEach(m => {
    if (m.title.toLowerCase().includes(cleanQuery) || (m.vj && m.vj.toLowerCase().includes(cleanQuery))) {
      results.push({ ...m, contentType: 'Movie' });
    }
  });

  series.forEach(s => {
    if (s.title.toLowerCase().includes(cleanQuery) || (s.vj && s.vj.toLowerCase().includes(cleanQuery))) {
      results.push({ ...s, contentType: 'Series' });
    }
  });

  tvs.forEach(ch => {
    if (ch.name.toLowerCase().includes(cleanQuery)) {
      results.push({ ...ch, contentType: 'Live TV' });
    }
  });

  radios.forEach(r => {
    if (r.name.toLowerCase().includes(cleanQuery)) {
      results.push({ ...r, contentType: 'Radio Station' });
    }
  });

  concerts.forEach(c => {
    if (c.title.toLowerCase().includes(cleanQuery) || c.venue.toLowerCase().includes(cleanQuery)) {
      results.push({ ...c, contentType: 'Concert' });
    }
  });

  return results;
}

module.exports = {
  searchKenyaContent
};
