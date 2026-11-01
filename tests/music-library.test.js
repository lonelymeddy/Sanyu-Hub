const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');
const assert = require('assert');

const PORT = 3096;
const BASE_URL = `http://localhost:${PORT}`;

(async () => {
  console.log('Starting SanyuHub Music Library & Watch Page Automated Tests...\n');

  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: PORT.toString() }
  });

  await new Promise((resolve) => {
    serverProcess.stdout.on('data', (data) => {
      if (data.toString().includes('SanyuHub web service running')) {
        resolve();
      }
    });
    setTimeout(resolve, 3000);
  });

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  async function createAuthPage(context) {
    const page = await context.newPage();
    await page.addInitScript(() => {
      const future = new Date(Date.now() + 86400000 * 30).toISOString();
      localStorage.setItem('sanyuhub_auth_user', JSON.stringify({
        id: 'user_test_music',
        email: 'musictest@sanyuhub.com',
        phone: '256700000000',
        plan: 'monthly',
        subscriptionExpiry: future,
        createdAt: new Date().toISOString()
      }));
    });
    return page;
  }

  let totalTests = 0;
  let passedTests = 0;

  async function test(name, fn) {
    totalTests++;
    try {
      await fn();
      console.log(`  ✓ PASSED: ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  ✗ FAILED: ${name}`);
      console.error(`    ${err.message}`);
    }
  }

  try {
    // 1. API Charts Verification
    await test('API: /api/music/charts returns 10 verified songs per chart', async () => {
      const page = await browser.newPage();
      for (const chart of ['uganda', 'africa', 'global']) {
        const resp = await page.goto(`${BASE_URL}/api/music/charts?chart=${chart}`);
        assert.strictEqual(resp.status(), 200);
        const data = await resp.json();
        assert.ok(data.songs && data.songs.length === 10, `Expected 10 songs for ${chart}, got ${data.songs?.length}`);
        assert.ok(data.category.toLowerCase().includes(chart));
      }
      await page.close();
    });

    // 2. API Search Verification
    await test('API: /api/music/search returns genuine worldwide music results', async () => {
      const page = await browser.newPage();
      const resp = await page.goto(`${BASE_URL}/api/music/search?q=Burna%20Boy&limit=5`);
      assert.strictEqual(resp.status(), 200);
      const data = await resp.json();
      assert.ok(Array.isArray(data.results));
      assert.ok(data.results.length > 0, 'Expected at least 1 search result');
      await page.close();
    });

    // 3. API Resolve Verification
    await test('API: /api/music/resolve returns playable streams and download URLs', async () => {
      const page = await browser.newPage();
      const resp = await page.goto(`${BASE_URL}/api/music/resolve?id=ug-1`);
      assert.strictEqual(resp.status(), 200);
      const data = await resp.json();
      assert.strictEqual(data.title, 'Sitya Loss');
      assert.strictEqual(data.artist, 'Eddy Kenzo');
      assert.ok(data.hasVideo, 'Track should have video');
      assert.ok(data.hasAudio, 'Track should have audio');
      assert.ok(data.videoUrl && data.videoUrl.startsWith('http'), 'videoUrl valid');
      assert.ok(data.audioUrl && data.audioUrl.startsWith('http'), 'audioUrl valid');
      await page.close();
    });

    // 4. Music Library Layout Order Verification
    await test('Music Library: Exact layout order (Nav -> Search -> Selectors -> Results)', async () => {
      const context = await browser.newContext();
      const page = await createAuthPage(context);
      await page.goto(`${BASE_URL}/music`, { waitUntil: 'networkidle' });

      const elementsOrder = await page.evaluate(() => {
        const nav = document.getElementById('libraryCategorySelector');
        const search = document.getElementById('musicSearchInput');
        const selectors = document.getElementById('musicChartSelectors');
        const results = document.getElementById('musicResultsList');

        return {
          navFound: !!nav,
          searchFound: !!search,
          selectorsFound: !!selectors,
          resultsFound: !!results,
          isSearchBeforeSelectors: !!(search && selectors && (search.compareDocumentPosition(selectors) & 4)),
          isSelectorsBeforeResults: !!(selectors && results && (selectors.compareDocumentPosition(results) & 4))
        };
      });

      assert.ok(elementsOrder.navFound, 'Missing nav');
      assert.ok(elementsOrder.searchFound, 'Missing search input');
      assert.ok(elementsOrder.selectorsFound, 'Missing selectors');
      assert.ok(elementsOrder.resultsFound, 'Missing results container');
      assert.ok(elementsOrder.isSearchBeforeSelectors, 'Search must precede selectors');
      assert.ok(elementsOrder.isSelectorsBeforeResults, 'Selectors must precede results');

      // Check two grid card style: movie-card cards inside card-grid
      const isCardGrid = await page.locator('#musicResultsList.card-grid').count();
      assert.strictEqual(isCardGrid, 1, 'musicResultsList must have card-grid class');
      const rowItemCount = await page.locator('.music-song-row').count();
      assert.strictEqual(rowItemCount, 10, 'Expected 10 song rows for default chart');
      const firstRowArt = await page.locator('.music-song-row img.music-song-artwork').first().count();
      const firstRowTitle = await page.locator('.music-song-row .music-song-title').first().count();
      const firstRowCard = await page.locator('.music-song-row.movie-card').first().count();
      assert.strictEqual(firstRowArt, 1, 'Artwork must exist in card');
      assert.strictEqual(firstRowTitle, 1, 'Title must exist in card');
      assert.strictEqual(firstRowCard, 1, 'Item must be a movie-card');

      await page.close();
    });

    // 5. Chart Switching Interaction
    await test('Music Library: Switching charts updates song list without reload', async () => {
      const context = await browser.newContext();
      const page = await createAuthPage(context);
      await page.goto(`${BASE_URL}/music`, { waitUntil: 'networkidle' });

      // Click Africa pill
      await page.click('#pillAfrica');
      await page.waitForTimeout(600);

      const firstTitle = await page.locator('.music-song-row .music-song-title').first().textContent();
      assert.strictEqual(firstTitle.trim(), 'Last Last', 'Top 1 Africa song must be Last Last');

      // Click Global pill
      await page.click('#pillGlobal');
      await page.waitForTimeout(600);

      const globalTitle = await page.locator('.music-song-row .music-song-title').first().textContent();
      assert.strictEqual(globalTitle.trim(), 'Cruel Summer', 'Top 1 Global song must be Cruel Summer');

      await page.close();
    });

    // 6. Worldwide Search Interaction
    await test('Music Library: Worldwide search returns matching songs', async () => {
      const context = await browser.newContext();
      const page = await createAuthPage(context);
      await page.goto(`${BASE_URL}/music`, { waitUntil: 'networkidle' });

      await page.fill('#musicSearchInput', 'Burna Boy');
      await page.waitForTimeout(2500);

      const rowsCount = await page.locator('.music-song-row').count();
      assert.ok(rowsCount > 0, 'Expected search results for Burna Boy');

      await page.close();
    });

    // 7. Song Tap to Music Watch Page
    await test('Music Library: Tapping song row navigates to dedicated Music Watch page', async () => {
      const context = await browser.newContext();
      const page = await createAuthPage(context);
      await page.goto(`${BASE_URL}/music`, { waitUntil: 'networkidle' });

      await page.locator('.music-song-row').first().click();
      await page.waitForURL(/\/music\/watch\//);

      const title = await page.locator('#musicWatchTitle').textContent();
      assert.ok(title.includes('Sitya Loss'), 'Watch page loaded Sitya Loss');

      // Verify locked video player DOM structure is intact
      const playerWrapper = await page.locator('#musicPlayerWrapper').count();
      const videoPlayer = await page.locator('#musicVideoPlayer').count();
      const centralPlayBtn = await page.locator('#musicCentralPlayBtn').count();
      const controlsBar = await page.locator('#musicControlsBar').count();
      assert.strictEqual(playerWrapper, 1);
      assert.strictEqual(videoPlayer, 1);
      assert.strictEqual(centralPlayBtn, 1);
      assert.strictEqual(controlsBar, 1);

      // Verify Video/Audio mode buttons & Download buttons
      assert.strictEqual(await page.locator('#btnModeVideo').count(), 1);
      assert.strictEqual(await page.locator('#btnModeAudio').count(), 1);
      assert.strictEqual(await page.locator('#btnDownloadVideo').count(), 1);
      assert.strictEqual(await page.locator('#btnDownloadAudio').count(), 1);

      await page.close();
    });

    // 8. Mobile Responsiveness & Zero Horizontal Overflow
    await test('Mobile Responsiveness: Android (412x915) & iPhone SE (375x667) zero overflow', async () => {
      const viewports = [
        { name: 'Android Pixel 7', width: 412, height: 915 },
        { name: 'iPhone SE', width: 375, height: 667 }
      ];

      for (const vp of viewports) {
        const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        const page = await createAuthPage(context);

        for (const url of [`${BASE_URL}/music`, `${BASE_URL}/music/watch/ug-1`]) {
          await page.goto(url, { waitUntil: 'networkidle' });
          const overflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
          });
          assert.ok(overflow, `Overflow detected on ${url} at ${vp.name}`);
        }
        await context.close();
      }
    });

    // 9. Homepage Hot Music Section View More
    await test('Homepage: Hot Music section shows 2 music items and View More links to /music', async () => {
      const context = await browser.newContext();
      const page = await createAuthPage(context);
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#section-hot-music');
      await page.waitForTimeout(1000);

      const musicSec = await page.locator('#section-hot-music').count();
      assert.strictEqual(musicSec, 1, 'Hot Music section present');

      const cardCount = await page.locator('#homeMusicGrid .movie-card').count();
      assert.strictEqual(cardCount, 2, 'Exactly 2 music cards on homepage');

      const viewMoreHref = await page.locator('#section-hot-music .view-more').getAttribute('href');
      assert.strictEqual(viewMoreHref, '/music', 'View More must link to /music');

      await page.close();
    });

  } finally {
    await browser.close();
    serverProcess.kill('SIGKILL');
  }

  console.log(`\nMusic Library Test Summary: ${passedTests}/${totalTests} tests passed.\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
})();
