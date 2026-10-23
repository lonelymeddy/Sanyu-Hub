/**
 * Shared Type Definitions and Content Standards
 */

/**
 * @typedef {Object} CountryConfig
 * @property {string} code - 2-letter ISO country code (e.g. 'ug', 'ke')
 * @property {string} name - Display country name (e.g. 'Uganda', 'Kenya')
 * @property {string} flag - Country flag emoji
 * @property {boolean} ready - Readiness flag
 * @property {Object.<string, boolean>} categories - Supported category availability
 */

/**
 * @typedef {Object} MediaItem
 * @property {string} id - Unique stable ID
 * @property {string} title - Title
 * @property {string} [overview] - Description/synopsis
 * @property {string} [posterUrl] - Poster image URL
 * @property {string} [backdropUrl] - Backdrop image URL
 * @property {string} country - Associated country code ('ug', 'ke', etc)
 * @property {string} [category] - Media category
 * @property {string[]} [genres] - List of genres
 * @property {number} [year] - Release or production year
 * @property {number} [rating] - Vote average or rating
 * @property {string} [vj] - VJ or Narrator
 * @property {string} [originalLanguage] - Original audio language
 * @property {string[]} [availableLanguages] - Verified audio/subtitle languages
 * @property {string} [mediaUrl] - Verified direct stream URL (.mp4, .m3u8)
 * @property {string} [externalUrl] - Official authorized external viewing URL
 * @property {string} [source] - Research source identifier
 * @property {boolean} [verified] - Verification status
 */

module.exports = {};
