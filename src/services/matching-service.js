/**
 * TMDB-to-Stream Matching Service
 * Provides high-precision confidence-based matching between TMDB titles and
 * existing SanyuHub verified streams.
 */

const streamRegistry = require('./stream-registry');
const tmdbService = require('./tmdb-service');

class MatchingService {
  constructor() {
    this.cache = new Map();
  }

  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    if (s1 === s2) return 1.0;

    const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 1));
    const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 1));
    if (words1.size === 0 || words2.size === 0) return 0;

    let intersection = 0;
    for (const w of words1) {
      if (words2.has(w)) intersection++;
    }

    const jaccard = (2 * intersection) / (words1.size + words2.size);
    return jaccard;
  }

  matchTitleToStreams(tmdbItem, mediaType = 'movie') {
    const rawTitle = tmdbItem.title || tmdbItem.name || tmdbItem.original_title || tmdbItem.original_name;
    const releaseDate = tmdbItem.release_date || tmdbItem.first_air_date;
    const tmdbYear = releaseDate ? parseInt(releaseDate.substring(0, 4), 10) : null;
    const normTitle = streamRegistry.normalizeTitle(rawTitle);

    // 1. Direct exact normalized title match
    const candidateStreams = streamRegistry.findByNormalizedTitle(normTitle);
    if (candidateStreams.length > 0) {
      // Check year compatibility
      const verified = candidateStreams.map(s => {
        let confidence = 0.95;
        if (tmdbYear && s.year) {
          confidence = Math.abs(tmdbYear - s.year) <= 1 ? 0.99 : 0.85;
        }
        return {
          stream: s,
          confidence,
          match_type: 'exact_normalized'
        };
      });
      return {
        matched: true,
        confidence_level: 'HIGH',
        best_match: verified[0].stream,
        candidates: verified
      };
    }

    // 2. Fuzzy search across stream registry
    const allStreams = streamRegistry.getAllStreams();
    let bestCandidate = null;
    let highestScore = 0;

    for (const s of allStreams) {
      const score = this.calculateSimilarity(normTitle, s.normalized_title);
      if (score > highestScore) {
        highestScore = score;
        bestCandidate = s;
      }
    }

    if (highestScore >= 0.85) {
      return {
        matched: true,
        confidence_level: 'HIGH',
        best_match: bestCandidate,
        candidates: [{ stream: bestCandidate, confidence: highestScore, match_type: 'fuzzy_high' }]
      };
    } else if (highestScore >= 0.70) {
      // Moderate confidence: flagged as uncertain, DO NOT auto-link
      return {
        matched: false,
        uncertain: true,
        confidence_level: 'MEDIUM',
        potential_match: bestCandidate,
        score: highestScore,
        match_type: 'fuzzy_uncertain'
      };
    }

    // Unmatched
    return {
      matched: false,
      uncertain: false,
      confidence_level: 'LOW',
      score: highestScore,
      best_match: null,
      candidates: []
    };
  }

  enrichTMDBList(tmdbResults, mediaType = 'movie') {
    return tmdbResults.map((item, idx) => {
      const matchResult = this.matchTitleToStreams(item, mediaType);
      return {
        ...item,
        rank: idx + 1,
        media_type: item.media_type || mediaType,
        has_playable_stream: matchResult.matched,
        matched_stream: matchResult.matched ? {
          id: matchResult.best_match.id,
          source: matchResult.best_match.source,
          vj: matchResult.best_match.vj,
          container: matchResult.best_match.container,
          requires_headers: matchResult.best_match.requires_headers,
          confidence: matchResult.confidence_level
        } : null
      };
    });
  }
}

module.exports = new MatchingService();
