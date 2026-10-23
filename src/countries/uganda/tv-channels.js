/**
 * Uganda TV Channels Module
 */

const UGANDA_TV_CHANNELS = [
  {
    id: "ntv-uganda",
    name: "NTV Uganda",
    category: "news",
    categoryLabel: "News & General",
    logo: "/images/ntv-logo.jpg",
    streamType: "hls",
    streamUrl: "https://ams-2629.antmedia.cloud/LiveApp/streams/abul2026.m3u8",
    embedUrl: "https://ams-2629.antmedia.cloud/LiveApp/play.html?id=abul2026",
    meta: "Official Live Broadcast • HD • News & Shows",
    description: "NTV Uganda brings you live breaking news, current affairs, talk shows, and top Ugandan entertainment.",
    country: "ug",
    verified: true
  },
  {
    id: "spark-tv",
    name: "Spark TV",
    category: "entertainment",
    categoryLabel: "Entertainment & Lifestyle",
    logo: "/images/spark-logo.png",
    streamType: "hls",
    streamUrl: "https://ams-2629.antmedia.cloud/LiveApp/streams/spark2026.m3u8",
    embedUrl: "https://ams-2629.antmedia.cloud/LiveApp/play.html?id=spark2026",
    meta: "Official Live Broadcast • HD • Movies & Lifestyle",
    description: "Spark TV Uganda is your home for celebrity gossip, music, local drama series, and women lifestyle programming.",
    country: "ug",
    verified: true
  },
  {
    id: "bukedde-1",
    name: "Bukedde 1",
    category: "news",
    categoryLabel: "Luganda & News",
    logo: "/images/bukedde1-logo.png",
    streamType: "hls",
    streamUrl: "https://stream.hydeinnovations.com:443/bukedde1flussonic/index.m3u8",
    embedUrl: "https://www.bukedde.co.ug/tv/4",
    meta: "Official Live Broadcast • HD • Luganda News & Shows",
    description: "Bukedde 1 TV delivers top Luganda news, live events, traditional culture, and family entertainment across Uganda.",
    country: "ug",
    verified: true
  },
  {
    id: "bukedde-2",
    name: "Bukedde 2",
    category: "entertainment",
    categoryLabel: "Music & Sports",
    logo: "/images/bukedde2-logo.jpg",
    streamType: "hls",
    streamUrl: "https://stream.hydeinnovations.com:443/bukedde2flussonic/index.m3u8",
    embedUrl: "https://www.bukedde.co.ug/tv/5",
    meta: "Official Live Broadcast • HD • Music & Sports",
    description: "Bukedde 2 offers vibrant Luganda music programming, sports coverage, and youth entertainment.",
    country: "ug",
    verified: true
  },
  {
    id: "tv-west",
    name: "TV West",
    category: "news",
    categoryLabel: "Western Region & News",
    logo: "/images/tvwest-logo.jpg",
    streamType: "hls",
    streamUrl: "https://stream.hydeinnovations.com:443/tvwest-flussonic/index.m3u8",
    embedUrl: "https://www.bukedde.co.ug/tv/6",
    meta: "Official Live Broadcast • HD • Runyankole & News",
    description: "TV West is the leading television station for Western Uganda, broadcasting local news, culture, and entertainment in Runyankole.",
    country: "ug",
    verified: true
  },
  {
    id: "wan-luo-tv",
    aliases: ["wan-luo"],
    name: "Wan Luo TV",
    category: "entertainment",
    categoryLabel: "Luo Culture & Shows",
    logo: "/images/wanluo-logo.jpg",
    streamType: "hls",
    streamUrl: "https://stream.hydeinnovations.com:443/luotv-flussonic/index.m3u8",
    embedUrl: "https://www.bukedde.co.ug/tv",
    meta: "Official Live Broadcast • HD • Luo Language & Shows",
    description: "Wan Luo TV is the premier Luo-language television channel broadcasting cultural programming, music, and news for Northern Uganda.",
    country: "ug",
    verified: true
  },
  {
    id: "bbs-terefayina",
    name: "BBS Terefayina",
    category: "news",
    categoryLabel: "Buganda & Cultural News",
    logo: "/images/bbs-logo.jpg",
    streamType: "hls",
    streamUrl: "https://bbstv.ug/hls/ch01/index.m3u8",
    embedUrl: "https://bbstv.ug/live/",
    meta: "Official Live Broadcast • HD • Buganda & News",
    description: "BBS Terefayina brings you live news, culture, entertainment, and current affairs from Buganda Kingdom and across Uganda.",
    country: "ug",
    verified: true
  },
  {
    id: "galaxy-tv",
    name: "Galaxy TV",
    category: "entertainment",
    categoryLabel: "Music, Movies & Gossip",
    logo: "/images/galaxytv-logo.png",
    streamType: "hls",
    streamUrl: "https://livestream.galaxytv.ug/jikonkone/playlist.m3u8",
    embedUrl: "https://galaxytv.ug/home",
    meta: "Official Live Broadcast • HD • Jikonkone",
    description: "Galaxy TV is Uganda's funkiest television station featuring the best music, movies, celebrity news, and entertainment.",
    country: "ug",
    verified: true
  },
  {
    id: "kbs-tv",
    aliases: ["kbs-tv-uganda", "kbs"],
    name: "KBS TV Uganda",
    category: "news",
    categoryLabel: "News, Shows & Family",
    logo: "/images/kbstv-logo.png",
    streamType: "hls",
    streamUrl: "https://www.kbstv.co.ug/live/abr/master.m3u8",
    embedUrl: "https://www.kbstv.co.ug/",
    meta: "Official Live Broadcast • HD • Maaso ku Lutimbe",
    description: "KBS TV Uganda (Maaso ku Lutimbe) brings you live news, top entertainment, local talk shows, movies, and family programming.",
    country: "ug",
    verified: true
  },
  {
    id: "base2-tv",
    aliases: ["base2"],
    name: "Base2 TV",
    category: "entertainment",
    categoryLabel: "Luganda Entertainment & Movies",
    logo: "/images/base2tv-logo.png",
    streamType: "hls",
    streamUrl: "https://base2tv.ug/live/stream.m3u8",
    embedUrl: "https://base2tv.ug/",
    meta: "Official Live Broadcast • HD • Telefwunkeni",
    description: "Base2 TV (Telefwunkeni) delivers vibrant Luganda entertainment, translated blockbuster movies, youth shows, and local music.",
    country: "ug",
    verified: true
  }
];

async function getTvChannels() {
  return UGANDA_TV_CHANNELS;
}

module.exports = {
  getTvChannels,
  UGANDA_TV_CHANNELS
};
