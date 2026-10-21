const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('Running Video Player Structural & Design Safeguard Tests...\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ PASSED: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAILED: ${name}`);
    console.error(`    ${err.message}`);
  }
}

// TEST 1: Check required HTML structure in live-tv/watch.html
runTest('live-tv/watch.html contains required player DOM IDs and controls', () => {
  const html = fs.readFileSync(path.join(__dirname, '../live-tv/watch.html'), 'utf8');
  assert.ok(html.includes('id="liveTvPlayerSection"'), 'Missing liveTvPlayerSection');
  assert.ok(html.includes('id="liveVideoWrapper"'), 'Missing liveVideoWrapper');
  assert.ok(html.includes('id="liveVideoPlayer"'), 'Missing liveVideoPlayer');
  assert.ok(html.includes('id="liveCentralPlayBtn"'), 'Missing liveCentralPlayBtn');
  assert.ok(html.includes('id="liveUnmuteBanner"'), 'Missing liveUnmuteBanner');
  assert.ok(html.includes('id="liveLoadingOverlay"'), 'Missing liveLoadingOverlay');
  assert.ok(html.includes('id="liveErrorOverlay"'), 'Missing liveErrorOverlay');
  assert.ok(html.includes('id="liveControlsBar"'), 'Missing liveControlsBar');
  assert.ok(html.includes('id="ctrlRewindBtn"'), 'Missing ctrlRewindBtn');
  assert.ok(html.includes('id="ctrlPlayPauseBtn"'), 'Missing ctrlPlayPauseBtn');
  assert.ok(html.includes('id="ctrlForwardBtn"'), 'Missing ctrlForwardBtn');
  assert.ok(html.includes('id="ctrlProgressContainer"'), 'Missing ctrlProgressContainer');
  assert.ok(html.includes('id="ctrlMuteBtn"'), 'Missing ctrlMuteBtn');
  assert.ok(html.includes('id="ctrlVolumeSlider"'), 'Missing ctrlVolumeSlider');
  assert.ok(html.includes('id="ctrlSettingsBtn"'), 'Missing ctrlSettingsBtn');
  assert.ok(html.includes('id="ctrlFullscreenBtn"'), 'Missing ctrlFullscreenBtn');
  assert.ok(html.includes('id="ctrlSettingsMenu"'), 'Missing ctrlSettingsMenu');
});

// TEST 2: Check required HTML structure in watch.html
runTest('watch.html contains required movie player DOM elements', () => {
  const html = fs.readFileSync(path.join(__dirname, '../watch.html'), 'utf8');
  assert.ok(html.includes('id="playerWrapper"'), 'Missing playerWrapper');
  assert.ok(html.includes('id="moviePlayer"'), 'Missing moviePlayer');
  assert.ok(html.includes('id="movieCentralPlayBtn"'), 'Missing movieCentralPlayBtn');
  assert.ok(html.includes('id="movieControlsBar"'), 'Missing movieControlsBar');
  assert.ok(html.includes('id="movieCtrlSettingsMenu"'), 'Missing movieCtrlSettingsMenu');
});

// TEST 3: Check required HTML structure in series-watch.html
runTest('series-watch.html contains required series player DOM elements', () => {
  const html = fs.readFileSync(path.join(__dirname, '../series-watch.html'), 'utf8');
  assert.ok(html.includes('id="seriesPlayerWrapper"'), 'Missing seriesPlayerWrapper');
  assert.ok(html.includes('id="seriesEpisodePlayer"'), 'Missing seriesEpisodePlayer');
  assert.ok(html.includes('id="seriesCentralPlayBtn"'), 'Missing seriesCentralPlayBtn');
  assert.ok(html.includes('id="seriesControlsBar"'), 'Missing seriesControlsBar');
  assert.ok(html.includes('id="seriesCtrlSettingsMenu"'), 'Missing seriesCtrlSettingsMenu');
});

// TEST 4: Check CSS rules in css/style.css
runTest('css/style.css contains critical player design rules', () => {
  const css = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');
  assert.ok(css.includes('.live-video-wrapper'), 'Missing .live-video-wrapper rule');
  assert.ok(css.includes('.live-central-play-btn'), 'Missing .live-central-play-btn rule');
  assert.ok(css.includes('.live-controls-bar'), 'Missing .live-controls-bar rule');
  assert.ok(css.includes('.player-settings-menu'), 'Missing .player-settings-menu rule');
  assert.ok(css.includes('aspect-ratio: 16/9;'), 'Missing 16/9 aspect ratio in CSS');
  assert.ok(css.includes('background: #e50914;'), 'Missing progress fill color #e50914');
  assert.ok(css.includes('background: #f4c400;'), 'Missing accent color #f4c400');
});

// TEST 5: Check player controller in js/app.js
runTest('js/app.js contains attachCustomPlayerController declaration', () => {
  const js = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  assert.ok(js.includes('function attachCustomPlayerController(config)'), 'Missing attachCustomPlayerController function declaration');
});

console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed.\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
