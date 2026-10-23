/**
 * Kenya TV Shows / Series Module
 * Verified Kenyan TV series, dramas, comedies, and reality shows.
 */

const KENYA_TV_SHOWS = [
  {
    id: "ke-series-crime-and-justice",
    title: "Crime and Justice",
    overview: "A police procedural drama following detectives Silas and Makena investigating high-profile criminal cases in Nairobi.",
    posterUrl: null,
    country: "ke",
    genres: ["Crime", "Drama", "Kenyan Series"],
    year: 2021,
    rating: 8.4,
    vj: "Swahili & English",
    originalLanguage: "English & Swahili",
    availableLanguages: ["Swahili", "English"],
    totalSeasons: 2,
    totalEpisodes: 18,
    episodes: [
      { id: "ke-cj-s1e1", title: "Nairobi Underground", season: 1, episode: 1, vj: "Swahili & English", format: "MP4", externalUrl: "https://citizentv.co.ke" }
    ],
    externalUrl: "https://swahilimovies.com/browse?type=series",
    source: "swahilimovies.com",
    verified: true
  },
  {
    id: "ke-series-country-queen",
    title: "Country Queen",
    overview: "An ambitious Nairobi event planner returns to her rural village and finds herself fighting a corrupt mining conglomerate.",
    posterUrl: null,
    country: "ke",
    genres: ["Drama", "Kenyan Series"],
    year: 2022,
    rating: 8.6,
    vj: "Swahili & English",
    originalLanguage: "Swahili & English",
    availableLanguages: ["Swahili", "English Subtitles"],
    totalSeasons: 1,
    totalEpisodes: 6,
    episodes: [
      { id: "ke-cq-s1e1", title: "Homecoming", season: 1, episode: 1, vj: "Swahili", format: "MP4", externalUrl: "https://netswahili.com/" }
    ],
    externalUrl: "https://netswahili.com/",
    source: "netswahili.com",
    verified: true
  },
  {
    id: "ke-series-single-kiasi",
    title: "Single Kiasi",
    overview: "Follows three female friends in Nairobi navigating modern dating, marriage challenges, career, and independence.",
    posterUrl: null,
    country: "ke",
    genres: ["Comedy", "Drama", "Kenyan Series"],
    year: 2022,
    rating: 8.0,
    vj: "Swahili & English",
    originalLanguage: "English & Swahili",
    availableLanguages: ["Swahili", "English"],
    totalSeasons: 2,
    totalEpisodes: 26,
    episodes: [
      { id: "ke-sk-s1e1", title: "Modern Love", season: 1, episode: 1, vj: "Swahili & English", format: "MP4", externalUrl: "https://swahix.com/shows" }
    ],
    externalUrl: "https://swahix.com/shows",
    source: "swahix.com",
    verified: true
  },
  {
    id: "ke-series-selina",
    title: "Selina",
    overview: "An intelligent young woman is forced to work as a maid in an upper-class Nairobi home, setting off a story of passion and conflict.",
    posterUrl: null,
    country: "ke",
    genres: ["Telenovela", "Drama", "Swahili Series"],
    year: 2018,
    rating: 8.7,
    vj: "Swahili Audio",
    originalLanguage: "Swahili",
    availableLanguages: ["Swahili"],
    totalSeasons: 5,
    totalEpisodes: 100,
    episodes: [
      { id: "ke-sel-s1e1", title: "The Arrival", season: 1, episode: 1, vj: "Swahili Audio", format: "MP4", externalUrl: "https://absalomfamily.com/category/season-zilizotafsiriwa/" }
    ],
    externalUrl: "https://absalomfamily.com/category/season-zilizotafsiriwa/",
    source: "absalomfamily.com",
    verified: true
  }
];

async function getTvShows() {
  return KENYA_TV_SHOWS;
}

module.exports = {
  getTvShows,
  KENYA_TV_SHOWS
};
