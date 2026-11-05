const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3098;
const BASE_URL = `http://localhost:${PORT}`;

(async () => {
  console.log('Running Mobile Layout and Horizontal Overflow Verification...');

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
    setTimeout(() => resolve(), 3000);
  });

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const viewports = [
    { name: 'Android Pixel 7 (412x915)', width: 412, height: 915 },
    { name: 'iPhone SE (375x667)', width: 375, height: 667 }
  ];

  const routes = [
    '/',
    '/live-tv/',
    '/movies',
    '/more',
    '/movie/1',
    '/watch/1',
    '/live-tv/watch/galaxy-tv',
    '/series',
    '/series/1',
    '/series/watch/1',
    '/about',
    '/settings'
  ];

  let overflowFailures = 0;

  for (const vp of viewports) {
    console.log(`\nTesting Viewport: ${vp.name}`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      extraHTTPHeaders: {
        'x-user-id': 'delostvoyage@gmail.com'
      }
    });

    const page = await context.newPage();
    await page.route('**/*.m3u8', route => route.fulfill({ status: 200, contentType: 'application/x-mpegURL', body: '#EXTM3U' }));

    for (const route of routes) {
      const url = `${BASE_URL}${route}`;
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
        await page.waitForTimeout(500);

        const overflow = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const docScrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const docClientWidth = docEl.clientWidth;
          return {
            scrollWidth: docScrollWidth,
            clientWidth: docClientWidth,
            hasOverflow: docScrollWidth > docClientWidth + 1 // allow 1px subpixel variance
          };
        });

        if (overflow.hasOverflow) {
          console.error(`  ✗ OVERFLOW DETECTED on ${route}: scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth}`);
          overflowFailures++;
        } else {
          console.log(`  ✓ PASSED ${route}: scrollWidth=${overflow.scrollWidth} <= clientWidth=${overflow.clientWidth}`);
        }
      } catch (err) {
        console.error(`  ✗ ERROR on ${route}: ${err.message}`);
        overflowFailures++;
      }
    }
    await context.close();
  }

  await browser.close();
  serverProcess.kill('SIGKILL');
  await new Promise(r => setTimeout(r, 500));

  if (overflowFailures > 0) {
    console.error(`\nFAILED: ${overflowFailures} route(s) failed mobile verification.`);
    process.exit(1);
  } else {
    console.log('\nALL MOBILE ROUTES PASSED VERIFICATION WITH ZERO HORIZONTAL OVERFLOW!');
    process.exit(0);
  }
})();
