const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadCountryCatalogue } = require('../src/countries/shared/country-loader');
const { getSwahiliMovieCatalogue } = require('../swahili-movies');

async function runSwahixIntegrationTests() {
  console.log('\nRunning Swahix Integration & Swahili Ecosystem Tests...\n');

  // Test 1: Direct swahili-movies module loader
  const swahiliMovies = await getSwahiliMovieCatalogue();
  assert.strictEqual(Array.isArray(swahiliMovies), true, 'Swahili catalogue must return an array');
  assert.strictEqual(swahiliMovies.length >= 20, true, `Swahili catalogue should contain at least 20 items (found ${swahiliMovies.length})`);
  console.log(`  ✓ PASSED: Direct Swahili catalogue loader returned ${swahiliMovies.length} movies`);

  // Test 2: Country Loader for Kenya ('ke')
  const keCatalogue = await loadCountryCatalogue('ke', 'movies');
  assert.strictEqual(Array.isArray(keCatalogue.movies), true, 'Kenya catalogue must return movies array');
  assert.strictEqual(keCatalogue.movies.length, swahiliMovies.length, 'Kenya catalogue count should match Swahili catalogue');
  console.log(`  ✓ PASSED: Kenya country module ('ke') successfully loads Swahix movies (${keCatalogue.movies.length})`);

  // Test 3: Translator Metadata Verification
  const sampleMovie = keCatalogue.movies.find(m => m.vj && m.hasSwahiliDubbing);
  assert.notStrictEqual(sampleMovie, undefined, 'Must find a movie with VJ translator metadata and Swahili dubbing flag');
  assert.strictEqual(sampleMovie.country, 'ke', 'Movie country must be "ke"');
  assert.strictEqual(sampleMovie.audioTrack, 'Swahili Dubbed', 'Audio track must be "Swahili Dubbed"');
  assert.strictEqual(sampleMovie.hasSwahiliDubbing, true, 'hasSwahiliDubbing must be true');
  assert.strictEqual(sampleMovie.availableLanguages.includes('Swahili'), true, 'availableLanguages must include Swahili');
  assert.ok(sampleMovie.translatedTitle.includes(sampleMovie.vj), 'translatedTitle must reference translator/VJ name');
  console.log(`  ✓ PASSED: Translator & dubbing metadata verified for "${sampleMovie.title}" (${sampleMovie.vj})`);

  // Test 4: Playable Stream Verification
  const playableMovie = keCatalogue.movies.find(m => m.isPlayable && m.mediaUrl);
  assert.notStrictEqual(playableMovie, undefined, 'Must find at least one verified playable movie');
  assert.ok(playableMovie.mediaUrl.includes('/api/stream-proxy?url='), 'Playable stream URL must route through /api/stream-proxy');
  console.log(`  ✓ PASSED: Verified playable stream proxy URL format for "${playableMovie.title}"`);

  // Test 5: Country Isolation - Uganda ('ug') vs Kenya ('ke')
  const ugCatalogue = await loadCountryCatalogue('ug', 'movies');
  const keMovieIds = new Set(keCatalogue.movies.map(m => m.id));
  const ugMovieIds = new Set(ugCatalogue.movies.map(m => m.id));

  let crossBleedCount = 0;
  for (const id of keMovieIds) {
    if (ugMovieIds.has(id)) crossBleedCount++;
  }
  assert.strictEqual(crossBleedCount, 0, 'Zero Kenya movie IDs should appear in Uganda catalogue');
  console.log('  ✓ PASSED: Strict country isolation verified (Zero cross-country catalog bleed between Kenya & Uganda)');

  // Test 6: Server Discovery Documentation Check
  const discoveryIndexFile = path.join(__dirname, '..', 'docs', 'server-discovery', 'swahili', 'index.json');
  const swahixIndexFile = path.join(__dirname, '..', 'docs', 'server-discovery', 'swahili', 'swahix', 'index.json');
  assert.strictEqual(fs.existsSync(discoveryIndexFile), true, 'docs/server-discovery/swahili/index.json must exist');
  assert.strictEqual(fs.existsSync(swahixIndexFile), true, 'docs/server-discovery/swahili/swahix/index.json must exist');

  const discoveryIndex = JSON.parse(fs.readFileSync(discoveryIndexFile, 'utf8'));
  assert.strictEqual(discoveryIndex.language, 'Swahili');
  assert.strictEqual(discoveryIndex.summary.total_movies_discovered >= 20, true);
  console.log('  ✓ PASSED: Server discovery documentation verified\n');

  console.log('All Swahix Integration & Ecosystem Tests Passed Successfully!\n');
}

runSwahixIntegrationTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
