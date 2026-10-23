/**
 * Source Validation Module
 */

const https = require('https');
const http = require('http');

function verifyStreamUrl(url, timeoutMs = 5000) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const mod = parsed.protocol === 'https:' ? https : http;
      const req = mod.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SanyuHub/1.0',
          'Accept': '*/*',
          'Range': 'bytes=0-100'
        },
        timeout: timeoutMs
      }, (res) => {
        let isValid = false;
        if (res.statusCode === 200 || res.statusCode === 206) {
          const contentType = (res.headers['content-type'] || '').toLowerCase();
          const isVideoAudio = contentType.includes('video') ||
                               contentType.includes('audio') ||
                               contentType.includes('mpegurl') ||
                               contentType.includes('m3u8') ||
                               contentType.includes('octet-stream') ||
                               contentType.includes('mp4');

          if (!contentType.includes('text/html') || isVideoAudio) {
            isValid = true;
          }
        }
        res.destroy();
        resolve(isValid);
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    } catch (e) {
      resolve(false);
    }
  });
}

module.exports = {
  verifyStreamUrl
};
