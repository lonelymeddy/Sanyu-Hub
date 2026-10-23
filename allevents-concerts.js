const fs = require('fs');
const path = require('path');

let concertCache = {
  timestamp: 0,
  data: []
};

const CACHE_TTL = 3600 * 1000; // 1 hour TTL

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

async function scrapeAllEvents() {
  try {
    const pagesToScrape = ['https://www.allevents.ug/', 'https://www.allevents.ug/events'];
    const eventUrls = new Set();

    for (const pageUrl of pagesToScrape) {
      try {
        const res = await fetch(pageUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SanyuHub/1.0' }
        });
        if (!res.ok) continue;
        const html = await res.text();
        const matches = html.matchAll(/href=[\"'](\/events\/[a-zA-Z0-9\-_]+|https:\/\/www\.allevents\.ug\/events\/[a-zA-Z0-9\-_]+)[\"']/g);
        for (const m of matches) {
          let u = m[1];
          if (u.startsWith('/')) u = 'https://www.allevents.ug' + u;
          u = u.replace(/\/$/, '');
          if (u !== 'https://www.allevents.ug/events') {
            eventUrls.add(u);
          }
        }
      } catch (e) {
        console.error(`Failed to fetch page ${pageUrl}:`, e.message);
      }
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const concerts = [];

    for (const url of eventUrls) {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SanyuHub/1.0' }
        });
        if (!res.ok) continue;
        const html = await res.text();
        const jsonLdMatch = html.match(/<script type=\"application\/ld\+json\">(.*?)<\/script>/s);
        if (!jsonLdMatch) continue;

        let data;
        try {
          data = JSON.parse(jsonLdMatch[1]);
        } catch (e) {
          continue;
        }

        if (data['@type'] !== 'Event') continue;

        const startDateStr = data.startDate;
        const endDateStr = data.endDate || startDateStr;
        const eventDate = new Date(endDateStr || startDateStr);

        // Exclude past events
        if (eventDate < todayStart) {
          continue;
        }

        let posterUrl = Array.isArray(data.image) ? data.image[0] : data.image;
        if (!posterUrl) {
          const ogImg = html.match(/<meta [^>]*property=[\"']og:image[\"'][^>]*content=[\"']([^\"']+)[\"']/i) ||
                        html.match(/<meta [^>]*content=[\"']([^\"']+)[\"'][^>]*property=[\"']og:image[\"']/i);
          if (ogImg) posterUrl = ogImg[1];
        }

        let description = '';
        const ogDesc = html.match(/<meta [^>]*property=[\"']og:description[\"'][^>]*content=[\"']([^\"']+)[\"']/i) ||
                       html.match(/<meta [^>]*content=[\"']([^\"']+)[\"'][^>]*property=[\"']og:description[\"']/i);
        if (ogDesc) {
          description = decodeHtmlEntities(ogDesc[1]);
        }

        const venue = data.location ? (data.location.name || 'Uganda') : 'Uganda';

        let ticketInfo = 'Tickets Available';
        if (data.offers && data.offers.price) {
          const priceVal = String(data.offers.price);
          if (priceVal.toLowerCase().includes('free')) {
            ticketInfo = 'Free Entrance';
          } else if (!isNaN(Number(priceVal))) {
            ticketInfo = 'UGX ' + Number(priceVal).toLocaleString('en-US');
          } else {
            ticketInfo = priceVal;
          }
        }

        const venueStr = decodeHtmlEntities(venue.trim());
        const venueLower = venueStr.toLowerCase();
        const descLower = description.toLowerCase();
        const nameLower = data.name.toLowerCase();

        let countryCode = 'ug';
        if (
          venueLower.includes('kenya') || venueLower.includes('nairobi') || venueLower.includes('mombasa') ||
          venueLower.includes('nakuru') || venueLower.includes('kisumu') || venueLower.includes('eldoret') ||
          venueLower.includes('thika') || venueLower.includes('kilifi') || venueLower.includes('naivasha') ||
          descLower.includes('nairobi, kenya') || nameLower.includes('nairobi')
        ) {
          countryCode = 'ke';
        }

        const slug = url.split('/events/')[1].replace(/\/$/, '');
        const concert = {
          id: 'allevents-' + slug,
          slug: slug,
          title: decodeHtmlEntities(data.name.trim()),
          posterUrl: posterUrl || '',
          startDate: startDateStr,
          endDate: endDateStr,
          venue: venueStr,
          country: countryCode,
          description: description,
          ticketInfo: ticketInfo,
          organizer: data.organizer ? decodeHtmlEntities(data.organizer.name) : 'All Events Kampala',
          eventUrl: data.url || url
        };

        concerts.push(concert);
      } catch (err) {
        console.error(`Error fetching event details for ${url}:`, err.message);
      }
    }

    // Sort upcoming events by startDate ascending
    concerts.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (concerts.length > 0) {
      concertCache = {
        timestamp: Date.now(),
        data: concerts
      };
    }

    return concerts;
  } catch (err) {
    console.error('Scrape error:', err.message);
    return concertCache.data;
  }
}

async function getUpcomingConcerts() {
  const isExpired = (Date.now() - concertCache.timestamp) > CACHE_TTL;

  if (concertCache.data.length === 0) {
    await scrapeAllEvents();
  } else if (isExpired) {
    // Revalidate in background
    scrapeAllEvents().catch(err => console.error('Background refresh failed:', err.message));
  }

  return concertCache.data;
}

module.exports = {
  getUpcomingConcerts
};
