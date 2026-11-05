const fs = require('fs');
try {
  if (fs.existsSync('.env')) {
    const lines = fs.readFileSync('.env', 'utf8').split('\n');
    lines.forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !process.env[match[1].trim()]) {
        process.env[match[1].trim()] = match[2].trim();
      }
    });
  }
} catch (e) {}

const assert = require('assert');
const tmdbService = require('../src/services/tmdb-service');
const streamRegistry = require('../src/services/stream-registry');
const matchingService = require('../src/services/matching-service');

async function runTests() {
  console.log('=== STARTING TMDB PHASE 1 VERIFICATION TESTS ===\n');

  // Test 1: Stream Registry Reconciliation
  console.log('1. Testing Stream Registry and Reconciliation of 1,214 streams...');
  const reconciliation = streamRegistry.getReconciliation();
  assert(reconciliation, 'Reconciliation object must exist');
  assert.strictEqual(reconciliation.total_active_playable, 1214, 'Total active playable must be 1214');
  assert.strictEqual(reconciliation.by_source.movietuneug, 923, 'MovieTune UG must have 923 streams');
  assert.strictEqual(reconciliation.by_source.lugandatranslated_total, 286, 'Luganda total must be 286 streams');
  assert.strictEqual(reconciliation.by_source.lugandatranslated_cloudflare_r2, 252, 'Cloudflare R2 must have 252 streams');
  assert.strictEqual(reconciliation.by_source.lugandatranslated_secondary_hosts, 34, 'Secondary hosts must have 34 streams');
  assert.strictEqual(reconciliation.by_source.swahix, 5, 'Swahix must have 5 streams');
  assert.strictEqual(reconciliation.reconciliation_explanation.core_high_reliability_streams, 1180, 'Core high-reliability subset must be 1180');
  assert.strictEqual(reconciliation.reconciliation_explanation.secondary_verified_streams, 34, 'Secondary streams must be 34');
  assert.strictEqual(reconciliation.reconciliation_explanation.sum_total_verified_streams, 1214, 'Sum total must be exactly 1214');
  console.log('   ✓ Stream reconciliation test PASSED');

  // Test 2: Movie Trending Connectivity
  console.log('2. Testing TMDB Movie Trending API connectivity...');
  const movieTrending = await tmdbService.getTrendingMovies('day');
  assert(movieTrending && Array.isArray(movieTrending.results), 'Movie trending results array must exist');
  assert(movieTrending.results.length > 0, 'Must return at least 1 movie trending item');
  const firstMovie = movieTrending.results[0];
  assert(firstMovie.id, 'First trending movie must have an ID');
  assert(firstMovie.title || firstMovie.original_title, 'First trending movie must have a title');
  console.log(`   ✓ Retrieved ${movieTrending.results.length} trending movies. Top #1: "${firstMovie.title || firstMovie.original_title}" (ID: ${firstMovie.id})`);

  // Test 3: Series Trending Connectivity
  console.log('3. Testing TMDB Series Trending API connectivity...');
  const tvTrending = await tmdbService.getTrendingSeries('day');
  assert(tvTrending && Array.isArray(tvTrending.results), 'Series trending results array must exist');
  assert(tvTrending.results.length > 0, 'Must return at least 1 series trending item');
  const firstTv = tvTrending.results[0];
  assert(firstTv.id, 'First trending TV show must have an ID');
  assert(firstTv.name || firstTv.original_name, 'First trending TV show must have a name');
  console.log(`   ✓ Retrieved ${tvTrending.results.length} trending series. Top #1: "${firstTv.name || firstTv.original_name}" (ID: ${firstTv.id})`);

  // Test 4: Series Hierarchy Endpoints (Season & Episode)
  console.log('4. Testing TMDB Series Hierarchy (Seasons & Episodes)...');
  const seasonData = await tmdbService.getSeasonDetails(1399, 1); // Game of Thrones S1
  assert(seasonData && seasonData.season_number === 1, 'Season number must be 1');
  assert(Array.isArray(seasonData.episodes) && seasonData.episodes.length > 0, 'Episodes array must exist');

  const episodeData = await tmdbService.getEpisodeDetails(1399, 1, 1); // S01E01
  assert.strictEqual(episodeData.episode_number, 1, 'Episode number must be 1');
  assert.strictEqual(episodeData.name, 'Winter Is Coming', 'Episode name must match');
  console.log(`   ✓ Season 1 has ${seasonData.episodes.length} episodes. S01E01: "${episodeData.name}"`);

  // Test 5: Confidence-Based Stream Matching
  console.log('5. Testing Confidence-Based Matching Logic...');
  const highMatch = matchingService.matchTitleToStreams({ title: 'Free Guy', release_date: '2021-08-11' });
  assert.strictEqual(highMatch.matched, true, 'Free Guy must be matched');
  assert.strictEqual(highMatch.confidence_level, 'HIGH', 'Free Guy match must have HIGH confidence');
  assert(highMatch.best_match.url.includes('free-guy'), 'Must resolve to correct URL');

  const lowMatch = matchingService.matchTitleToStreams({ title: 'Completely Inexistent Movie XYZ 2099' });
  assert.strictEqual(lowMatch.matched, false, 'Inexistent movie must not match');
  assert.strictEqual(lowMatch.confidence_level, 'LOW', 'Inexistent movie must have LOW confidence');
  console.log('   ✓ Confidence-based matching correctly accepted high confidence and rejected nonexistent stream');

  // Test 6: Genuine Trending Rank Preservation & Dual-Mode Tagging
  console.log('6. Testing Genuine Trending Rank Preservation & Stream Flagging...');
  const mockTrendingList = [
    { id: 991, title: 'Avatar: Fire and Ash', release_date: '2025-12-19' },
    { id: 992, title: 'Free Guy', release_date: '2021-08-11' },
    { id: 993, title: 'The Brutalist', release_date: '2024-12-20' }
  ];

  const enriched = matchingService.enrichTMDBList(mockTrendingList, 'movie');
  assert.strictEqual(enriched[0].rank, 1, 'Rank 1 preserved');
  assert.strictEqual(enriched[0].has_playable_stream, false, 'Avatar has no local stream -> false');
  assert.strictEqual(enriched[1].rank, 2, 'Rank 2 preserved');
  assert.strictEqual(enriched[1].has_playable_stream, true, 'Free Guy has local stream -> true');
  assert.strictEqual(enriched[2].rank, 3, 'Rank 3 preserved');
  assert.strictEqual(enriched[2].has_playable_stream, false, 'The Brutalist has no local stream -> false');
  console.log('   ✓ Genuine ranking order strictly preserved and dual-mode flags properly populated');

  console.log('\n=== ALL TMDB PHASE 1 VERIFICATION TESTS PASSED SUCCESSFULLY ===');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
