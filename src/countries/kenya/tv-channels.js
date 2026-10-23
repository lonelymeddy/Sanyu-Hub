/**
 * Kenya TV Channels Module
 * Discovered via kenyamoja.com/tv, theonlinekenyan.com/tv, and livetvke.com.
 * Tested and verified streams/destinations for Kenya.
 */

const KENYA_TV_CHANNELS = [
  {
    id: "ktn-news-kenya",
    aliases: ["ktn-news", "ktn"],
    name: "KTN News Kenya",
    category: "news",
    categoryLabel: "24/7 Kenyan News & Current Affairs",
    logo: "/images/ntvkenya-logo.png",
    streamType: "hls",
    streamUrl: "https://stream.hydeinnovations.com:443/ktnnews/index.m3u8",
    embedUrl: "https://www.standardmedia.co.ke/ktnnews",
    externalUrl: "https://www.kenyamoja.com/tv/ktn-live",
    meta: "Official Live Broadcast • HD • Kenyan News & Current Affairs",
    description: "KTN News Kenya is Kenya's leading 24-hour news channel delivering breaking news, political discourse, and live events.",
    country: "ke",
    source: "kenyamoja.com",
    verified: true
  },
  {
    id: "ntv-kenya",
    aliases: ["ntvkenya"],
    name: "NTV Kenya",
    category: "news",
    categoryLabel: "Kenyan News, Shows & Documentaries",
    logo: "/images/ntvkenya-logo.png",
    streamType: "hls",
    streamUrl: "https://ams-2629.antmedia.cloud/LiveApp/streams/ntvkenya2026.m3u8",
    embedUrl: "https://ntvkenya.co.ke",
    externalUrl: "https://www.theonlinekenyan.com/tv",
    meta: "Official Live Broadcast • HD • Kenyan Entertainment & News",
    description: "NTV Kenya delivers premier Kenyan broadcast television, investigatives, comedy series, live news, and current affairs.",
    country: "ke",
    source: "theonlinekenyan.com",
    verified: true
  },
  {
    id: "citizen-tv-kenya",
    aliases: ["citizentv", "citizen-tv"],
    name: "Citizen TV Kenya",
    category: "entertainment",
    categoryLabel: "Kenyan Drama, News & Entertainment",
    logo: "/images/citizentv-logo.png",
    streamType: "hls",
    streamUrl: "https://stream.hydeinnovations.com:443/citizentv/index.m3u8",
    embedUrl: "https://citizentv.co.ke",
    externalUrl: "https://livetvke.com/",
    meta: "Official Live Broadcast • HD • Top Kenyan TV Station",
    description: "Citizen TV is Kenya's most watched television station featuring hit local shows, Swahili drama series, and live news.",
    country: "ke",
    source: "livetvke.com",
    verified: true
  },
  {
    id: "k24-tv-kenya",
    aliases: ["k24", "k24tv"],
    name: "K24 TV Kenya",
    category: "news",
    categoryLabel: "Kenyan News & Sports",
    logo: "/images/k24tv-logo.png",
    streamType: "hls",
    streamUrl: "https://stream.hydeinnovations.com:443/k24tv/index.m3u8",
    embedUrl: "https://www.k24tv.co.ug",
    externalUrl: "https://www.kenyamoja.com/tv/k24-live",
    meta: "Official Live Broadcast • HD • News & Entertainment",
    description: "K24 TV brings breaking Kenyan news, live football coverage, lifestyle shows, and local entertainment.",
    country: "ke",
    source: "kenyamoja.com",
    verified: true
  },
  {
    id: "kbc-tv-kenya",
    aliases: ["kbc", "kbctv"],
    name: "KBC Channel 1 Kenya",
    category: "news",
    categoryLabel: "National Public Broadcaster",
    logo: "/images/ntvkenya-logo.png",
    streamType: "hls",
    streamUrl: "https://stream.hydeinnovations.com:443/kbctv/index.m3u8",
    embedUrl: "https://www.kbc.co.ke/",
    externalUrl: "https://www.kenyamoja.com/tv/kbc-live",
    meta: "Official Live Broadcast • HD • National Broadcaster",
    description: "KBC Channel 1 is Kenya's national public broadcaster offering culture, education, news, and official national events.",
    country: "ke",
    source: "kenyamoja.com",
    verified: true
  }
];

async function getTvChannels() {
  return KENYA_TV_CHANNELS;
}

module.exports = {
  getTvChannels,
  KENYA_TV_CHANNELS
};
