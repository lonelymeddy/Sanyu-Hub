const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const PORT = 3099;
const BASE_URL = `http://localhost:${PORT}`;
const BASELINES_DIR = path.join(__dirname, 'baselines');

if (!fs.existsSync(BASELINES_DIR)) {
  fs.mkdirSync(BASELINES_DIR, { recursive: true });
}

(async () => {
  console.log('Starting Visual Baseline Capture and Verification...');

  // Spawn server on custom PORT
  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: PORT.toString() }
  });

  // Wait for server ready
  await new Promise((resolve, reject) => {
    serverProcess.stdout.on('data', (data) => {
      if (data.toString().includes('SanyuHub web service running')) {
        resolve();
      }
    });
    serverProcess.stderr.on('data', (data) => {
      console.error('Server err:', data.toString());
    });
    setTimeout(() => resolve(), 3000);
  });

  console.log(`Test server process ready on port ${PORT}`);

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  // Block external network streams/m3u8 from hanging page load
  await page.route('**/*.m3u8', route => route.fulfill({ status: 200, contentType: 'application/x-mpegURL', body: '#EXTM3U' }));

  const targets = [
    { name: 'live-tv-player-desktop.png', url: `${BASE_URL}/live-tv/watch/galaxy-tv`, selector: '#liveTvPlayerSection' },
    { name: 'movie-player-desktop.png', url: `${BASE_URL}/watch/1`, selector: '#playerWrapper' },
    { name: 'series-player-desktop.png', url: `${BASE_URL}/series/watch/1`, selector: '#seriesPlayerWrapper' }
  ];

  for (const target of targets) {
    console.log(`Navigating to ${target.url}...`);
    try {
      await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 8000 });
      await page.waitForTimeout(1000);

      const screenshotPath = path.join(BASELINES_DIR, target.name);
      const element = await page.$(target.selector) || await page.$('body');

      await element.screenshot({ path: screenshotPath });
      console.log(`  ✓ Visual Baseline captured: ${target.name}`);
    } catch (err) {
      console.error(`  ✗ Failed capturing baseline for ${target.name}: ${err.message}`);
    }
  }

  await browser.close();
  serverProcess.kill();
  console.log('Visual baseline processing complete.');
  process.exit(0);
})();
