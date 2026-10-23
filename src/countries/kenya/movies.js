/**
 * Kenya Movies Module
 * Verified movie titles available for Kenyan audiences from research sources.
 */

const KENYA_MOVIES = [
  {
    id: "ke-movie-moraa",
    title: "Moraa",
    overview: "A gripping modern Kenyan urban drama exploring secrets, family loyalty, and ambition in Nairobi.",
    posterUrl: null,
    backdropUrl: null,
    country: "ke",
    genres: ["Drama", "Kenyan Cinema"],
    year: 2023,
    rating: 8.2,
    vj: "Swahili Audio",
    originalLanguage: "Swahili",
    availableLanguages: ["Swahili", "English Subtitles"],
    externalUrl: "https://swahilimovies.com/browse?type=movie",
    source: "swahilimovies.com",
    verified: true
  },
  {
    id: "ke-movie-subira",
    title: "Subira",
    overview: "A determined young woman in Lamu dreams of swimming in the open ocean, defying traditional constraints.",
    posterUrl: null,
    country: "ke",
    genres: ["Drama", "Kenyan Cinema"],
    year: 2018,
    rating: 8.5,
    vj: "Swahili Audio",
    originalLanguage: "Swahili",
    availableLanguages: ["Swahili", "English Subtitles"],
    externalUrl: "https://netswahili.com/",
    source: "netswahili.com",
    verified: true
  },
  {
    id: "ke-movie-kati-kati",
    title: "Kati Kati",
    overview: "A young woman with no memory of her life arrives at a mysterious wilderness resort where spirits await transition.",
    posterUrl: null,
    country: "ke",
    genres: ["Mystery", "Drama", "Kenyan Cinema"],
    year: 2016,
    rating: 7.9,
    vj: "Swahili & English",
    originalLanguage: "Swahili",
    availableLanguages: ["Swahili", "English Subtitles"],
    externalUrl: "https://swahix.com/movies",
    source: "swahix.com",
    verified: true
  },
  {
    id: "ke-movie-super-senorita",
    title: "Super Senorita",
    overview: "A high-octane Swahili dubbed action blockbuster hit featuring complete Swahili audio translation.",
    posterUrl: null,
    country: "ke",
    genres: ["Action", "Swahili Translated"],
    year: 2022,
    rating: 8.1,
    vj: "DJ Mack",
    originalLanguage: "Hindi",
    availableLanguages: ["Swahili Audio Dub"],
    externalUrl: "https://absalomfamily.com/category/single-movie/",
    source: "absalomfamily.com",
    verified: true
  },
  {
    id: "ke-movie-disconnect",
    title: "Disconnect",
    overview: "A romantic comedy following a group of Nairobi best friends navigating the chaotic dating scene in Kenya's capital.",
    posterUrl: null,
    country: "ke",
    genres: ["Comedy", "Romance", "Kenyan Cinema"],
    year: 2018,
    rating: 7.6,
    vj: "Swahili & English",
    originalLanguage: "English & Swahili",
    availableLanguages: ["English", "Swahili"],
    externalUrl: "https://swahilimovies.com/browse?type=movie",
    source: "swahilimovies.com",
    verified: true
  },
  {
    id: "ke-movie-mission-to-rescue",
    title: "Mission to Rescue",
    overview: "Kenyan military special forces execute a daring rescue operation along the Kenya-Somalia border.",
    posterUrl: null,
    country: "ke",
    genres: ["Action", "Thriller", "Kenyan Cinema"],
    year: 2021,
    rating: 8.3,
    vj: "Swahili & English",
    originalLanguage: "Swahili",
    availableLanguages: ["Swahili", "English Subtitles"],
    externalUrl: "https://netswahili.com/",
    source: "netswahili.com",
    verified: true
  }
];

async function getMovies() {
  return KENYA_MOVIES;
}

module.exports = {
  getMovies,
  KENYA_MOVIES
};
