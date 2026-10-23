/**
 * Country Isolation & Modular Architecture Automated Tests
 */

const assert = require('assert');
const { loadCountryCatalogue } = require('../src/countries/shared/country-loader');
const { getCountryModule, isCountrySupported } = require('../src/countries/registry');

console.log('Running Country Isolation & Modular Architecture Tests...\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      console.log(`  ✓ PASSED: ${name}`);
      passedTests++;
    })
    .catch((err) => {
      console.error(`  ✗ FAILED: ${name}`);
      console.error(`    ${err.message}`);
    });
}

async function runAll() {
  await runTest('Country registry correctly resolves supported countries', () => {
    assert.strictEqual(isCountrySupported('ug'), true);
    assert.strictEqual(isCountrySupported('ke'), true);
    assert.strictEqual(isCountrySupported('tz'), false);

    const ugMod = getCountryModule('ug');
    assert.ok(ugMod, 'Uganda module must exist');
    assert.strictEqual(ugMod.config.code, 'ug');

    const keMod = getCountryModule('ke');
    assert.ok(keMod, 'Kenya module must exist');
    assert.strictEqual(keMod.config.code, 'ke');
  });

  await runTest('Kenya loader returns Kenya catalogue only (No Uganda fallback)', async () => {
    const keCatalogue = await loadCountryCatalogue('ke');
    assert.strictEqual(keCatalogue.config.code, 'ke');
    assert.ok(keCatalogue.movies.length > 0, 'Kenya should have verified movies');

    // Verify all returned movies belong strictly to Kenya ('ke')
    keCatalogue.movies.forEach(m => {
      assert.strictEqual(m.country, 'ke', `Movie ${m.title} must have country='ke'`);
    });

    // Verify Kenya concerts belong strictly to Kenya ('ke')
    keCatalogue.concerts.forEach(c => {
      assert.strictEqual(c.country, 'ke', `Concert ${c.title} must have country='ke'`);
    });
  });

  await runTest('Uganda loader returns Uganda catalogue only', async () => {
    const ugCatalogue = await loadCountryCatalogue('ug');
    assert.strictEqual(ugCatalogue.config.code, 'ug');
    assert.ok(ugCatalogue.movies.length > 0, 'Uganda should have verified movies');

    ugCatalogue.movies.forEach(m => {
      assert.strictEqual(m.country, 'ug', `Movie ${m.title} must have country='ug'`);
    });
  });

  await runTest('Search in Kenya module does not return Uganda-only content', async () => {
    const keMod = getCountryModule('ke');
    const results = await keMod.search.searchKenyaContent('vj junior');
    // VJ Junior is Uganda-specific, should return 0 results in Kenya search
    assert.strictEqual(results.length, 0, 'Kenya search must not return Uganda Luganda VJ content');
  });

  await runTest('Unready country loader returns clean empty catalogue without fallback', async () => {
    const tzCatalogue = await loadCountryCatalogue('tz');
    assert.strictEqual(tzCatalogue.config.code, 'tz');
    assert.strictEqual(tzCatalogue.movies.length, 0);
    assert.strictEqual(tzCatalogue.series.length, 0);
    assert.strictEqual(tzCatalogue.concerts.length, 0);
  });

  console.log(`\nCountry Isolation Test Summary: ${passedTests}/${totalTests} tests passed.\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAll();
