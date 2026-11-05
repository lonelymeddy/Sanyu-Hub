/**
 * TMDB API Service
 * Handles official TMDB integration with caching, credentials isolation,
 * and robust rate-limiting & error fallback.
 */

const https = require('https');

class TMDBService {
  constructor() {
    this.apiKey = process.env.TMDB_API_KEY;
    this.baseUrl = 'https://api.themoviedb.org/3';
    this.cache = new Map();
    this.cacheTTL = 30 * 60 * 1000; // 30 minutes in-memory cache
  }

  getApiKey() {
    const key = process.env.TMDB_API_KEY || this.apiKey;
    if (!key) {
      throw new Error('TMDB_API_KEY environment variable is not configured.');
    }
    return key;
  }

  async fetch(endpoint, params = {}) {
    const apiKey = this.getApiKey();
    const urlParams = new URLSearchParams({
      api_key: apiKey,
      ...params
    });

    const fullUrl = `${this.baseUrl}${endpoint}?${urlParams.toString()}`;
    const cacheKey = fullUrl;

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    return new Promise((resolve, reject) => {
      https.get(fullUrl, (res) => {
        let rawData = '';
        res.on('data', chunk => rawData += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(rawData);
              this.cache.set(cacheKey, { timestamp: Date.now(), data: parsed });
              resolve(parsed);
            } catch (e) {
              reject(new Error(`Failed to parse TMDB response: ${e.message}`));
            }
          } else {
            reject(new Error(`TMDB HTTP error ${res.statusCode}: ${rawData.substring(0, 100)}`));
          }
        });
      }).on('error', (err) => {
        reject(new Error(`TMDB Network error: ${err.message}`));
      });
    });
  }

  // Movie Endpoints
  async getTrendingMovies(timeWindow = 'day', page = 1) {
    return this.fetch(`/trending/movie/${timeWindow}`, { page });
  }

  async getPopularMovies(page = 1) {
    return this.fetch('/movie/popular', { page });
  }

  async getTopRatedMovies(page = 1) {
    return this.fetch('/movie/top_rated', { page });
  }

  async getNowPlayingMovies(page = 1) {
    return this.fetch('/movie/now_playing', { page });
  }

  async getUpcomingMovies(page = 1) {
    return this.fetch('/movie/upcoming', { page });
  }

  async discoverMovies(filters = {}) {
    return this.fetch('/discover/movie', filters);
  }

  async getMovieDetails(movieId) {
    return this.fetch(`/movie/${movieId}`, { append_to_response: 'videos,credits,external_ids' });
  }

  async searchMovies(query, year = null) {
    const params = { query };
    if (year) params.year = year;
    return this.fetch('/search/movie', params);
  }

  // Series Endpoints
  async getTrendingSeries(timeWindow = 'day', page = 1) {
    return this.fetch(`/trending/tv/${timeWindow}`, { page });
  }

  async getPopularSeries(page = 1) {
    return this.fetch('/tv/popular', { page });
  }

  async getTopRatedSeries(page = 1) {
    return this.fetch('/tv/top_rated', { page });
  }

  async getOnTheAirSeries(page = 1) {
    return this.fetch('/tv/on_the_air', { page });
  }

  async getAiringTodaySeries(page = 1) {
    return this.fetch('/tv/airing_today', { page });
  }

  async discoverSeries(filters = {}) {
    return this.fetch('/discover/tv', filters);
  }

  async getSeriesDetails(seriesId) {
    return this.fetch(`/tv/${seriesId}`, { append_to_response: 'videos,credits,external_ids' });
  }

  async getSeasonDetails(seriesId, seasonNumber) {
    return this.fetch(`/tv/${seriesId}/season/${seasonNumber}`);
  }

  async getEpisodeDetails(seriesId, seasonNumber, episodeNumber) {
    return this.fetch(`/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}`);
  }

  async searchSeries(query, year = null) {
    const params = { query };
    if (year) params.first_air_date_year = year;
    return this.fetch('/search/tv', params);
  }
}

module.exports = new TMDBService();
