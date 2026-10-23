/**
 * Content Validator Module
 * Rejects malformed entries, missing metadata, or invalid URLs.
 */

function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

function validateMediaItem(item) {
  if (!item || typeof item !== 'object') return false;
  if (!item.id || !item.title || !item.country) return false;

  const hasMediaUrl = isValidUrl(item.mediaUrl);
  const hasExternalUrl = isValidUrl(item.externalUrl);

  // Must have either a valid direct stream URL or an authorized external destination
  if (!hasMediaUrl && !hasExternalUrl) return false;

  return true;
}

function validateConcertItem(item) {
  if (!item || typeof item !== 'object') return false;
  if (!item.id || !item.title || !item.country || !item.venue) return false;
  if (!isValidUrl(item.eventUrl)) return false;
  return true;
}

function validateChannelItem(item) {
  if (!item || typeof item !== 'object') return false;
  if (!item.id || !item.name) return false;

  const hasStreamUrl = isValidUrl(item.streamUrl);
  const hasEmbedUrl = isValidUrl(item.embedUrl);

  if (!hasStreamUrl && !hasEmbedUrl) return false;
  return true;
}

module.exports = {
  isValidUrl,
  validateMediaItem,
  validateConcertItem,
  validateChannelItem
};
