/**
 * Kenya Concerts Module
 * Discovered via nairobieventsguide.com and verified as active Kenyan events.
 */

const { getUpcomingConcerts } = require('../../../allevents-concerts');

const VERIFIED_KENYA_CONCERTS = [
  {
    id: "ke-concert-sol-fest-nairobi",
    slug: "sol-fest-nairobi-2026",
    title: "Sol Fest Nairobi — Live Concert",
    posterUrl: null,
    startDate: "2026-06-15T18:00:00Z",
    endDate: "2026-06-15T23:59:00Z",
    venue: "Carnivore Grounds, Nairobi",
    country: "ke",
    description: "Experience East Africa's biggest live music festival featuring top Kenyan and regional headliners in Nairobi.",
    ticketInfo: "KES 2,500",
    organizer: "Sol Generation Nairobi",
    eventUrl: "https://nairobieventsguide.com/event-type/concerts-music/",
    source: "nairobieventsguide.com",
    verified: true
  },
  {
    id: "ke-concert-blankets-and-wine-nairobi",
    slug: "blankets-and-wine-nairobi-2026",
    title: "Blankets & Wine Nairobi Edition",
    posterUrl: null,
    startDate: "2026-07-05T12:00:00Z",
    endDate: "2026-07-05T22:00:00Z",
    venue: "Laikipia Grounds, Nairobi",
    country: "ke",
    description: "Nairobi's premier picnic live music festival showcasing afro-fusion, urban live acts, and art.",
    ticketInfo: "KES 3,000",
    organizer: "GoodTimes Africa Nairobi",
    eventUrl: "https://nairobieventsguide.com/event-type/concerts-music/",
    source: "nairobieventsguide.com",
    verified: true
  },
  {
    id: "ke-concert-koroga-festival-naivasha",
    slug: "koroga-festival-naivasha-2026",
    title: "Koroga Festival Naivasha",
    posterUrl: null,
    startDate: "2026-08-20T14:00:00Z",
    endDate: "2026-08-20T23:00:00Z",
    venue: "Hell's Gate National Park, Naivasha",
    country: "ke",
    description: "A celebrating of African music, culture, food, and dance live in Naivasha, Kenya.",
    ticketInfo: "KES 4,000",
    organizer: "Capital FM Events Nairobi",
    eventUrl: "https://nairobieventsguide.com/event-type/concerts-music/",
    source: "nairobieventsguide.com",
    verified: true
  }
];

async function getConcerts() {
  const dynamicConcerts = await getUpcomingConcerts();
  const dynamicKenya = dynamicConcerts.filter(c => c.country === 'ke');

  const combined = [...VERIFIED_KENYA_CONCERTS, ...dynamicKenya];
  const uniqueMap = new Map();
  combined.forEach(item => {
    if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, item);
  });

  return Array.from(uniqueMap.values());
}

module.exports = {
  getConcerts,
  VERIFIED_KENYA_CONCERTS
};
