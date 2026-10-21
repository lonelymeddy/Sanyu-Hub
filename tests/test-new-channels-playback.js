const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3097;
const BASE_URL = `http://localhost:${PORT}`;

const channelsToTest = [
  { id: 'cartoon-network', name: 'Cartoon Network', logo: '/images/cartoon-network-logo.png' },
  { id: 'baby-shark-tv', name: 'Baby Shark TV', logo: '/images/baby-shark-logo.png' },
  { id: 'pbs-kids-pacific', name: 'PBS Kids Pacific', logo: '/images/pbs-kids-pacific-logo.png' },
  { id: 'telemundo', name: 'Telemundo', logo: '/images/telemundo-logo.png' }
];

(async () => {
  console.log('Starting San YuHub Live TV New Channels Playback Verification...');

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

  console.log(`Test server running on port ${PORT}`);

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let allPassed = true;

  for (const ch of channelsToTest) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const watchUrl = `${BASE_URL}/live-tv/watch/${ch.id}`;

    console.log(`\nTesting Channel: ${ch.name} (${ch.id}) at ${watchUrl}`);

    try {
      await page.goto(watchUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(1000);

      // Verify Channel Info rendering
      const nameText = await page.textContent('#activeChannelName');
      console.log(`  ✓ DOM Channel Name: "${nameText.trim()}"`);
      if (!nameText.includes(ch.name)) {
        throw new Error(`Expected channel name "${ch.name}", got "${nameText}"`);
      }

      const logoSrc = await page.getAttribute('#activeChannelLogo', 'src');
      console.log(`  ✓ DOM Channel Logo src: "${logoSrc}"`);
      if (!logoSrc.includes(ch.logo)) {
        throw new Error(`Expected logo src "${ch.logo}", got "${logoSrc}"`);
      }

      // Check Video Playback in San YuHub Player
      console.log('  Waiting for HLS playback initialization...');
      let isPlaying = false;
      let finalStats = null;

      for (let attempt = 0; attempt < 12; attempt++) {
        await page.waitForTimeout(1000);
        const stats = await page.evaluate(() => {
          const video = document.getElementById('liveVideoPlayer');
          if (!video) return null;
          return {
            currentTime: video.currentTime,
            duration: video.duration,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            paused: video.paused,
            buffered: video.buffered.length > 0 ? video.buffered.end(0) : 0,
            readyState: video.readyState
          };
        });

        if (stats) {
          finalStats = stats;
          if (stats.currentTime > 0.5 && stats.videoWidth > 0 && stats.videoHeight > 0) {
            isPlaying = true;
            break;
          }
        }
      }

      if (isPlaying && finalStats) {
        console.log(`  ✓ PLAYBACK SUCCESSFUL!`);
        console.log(`    Time: ${finalStats.currentTime.toFixed(2)}s | Resolution: ${finalStats.videoWidth}x${finalStats.videoHeight} | Buffered: ${finalStats.buffered.toFixed(2)}s | ReadyState: ${finalStats.readyState}`);
      } else {
        console.error(`  ✗ PLAYBACK FAILED: Stats=${JSON.stringify(finalStats)}`);
        allPassed = false;
      }

    } catch (err) {
      console.error(`  ✗ ERROR testing ${ch.name}: ${err.message}`);
      allPassed = false;
    } finally {
      await context.close();
    }
  }

  await browser.close();
  serverProcess.kill();

  if (allPassed) {
    console.log('\n========================================');
    console.log('ALL 4 CHANNELS PASSED PLAYBACK VERIFICATION IN SAN YUHUB PLAYER!');
    console.log('========================================\n');
    process.exit(0);
  } else {
    console.error('\nPlayback verification failed for one or more channels.');
    process.exit(1);
  }
})();
