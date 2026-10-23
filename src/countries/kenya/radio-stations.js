/**
 * Kenya Radio Stations Module
 * Discovered via kenyaliveradio.co.ke and kenyamoja.com/radio.
 * Tested direct audio streams for playback in SanyuHub radio player.
 */

const KENYA_RADIO_STATIONS = [
  {
    id: "capital-fm-kenya",
    aliases: ["capitalfm", "capital-fm"],
    name: "Capital FM Kenya",
    type: "radio",
    isRadio: true,
    category: "radio",
    categoryLabel: "98.4 FM • Kenya's Best Music",
    logo: "/images/ntvkenya-logo.png",
    streamType: "audio",
    streamUrl: "https://capitalfm.streamguys1.com/capitalfm",
    embedUrl: "https://www.capitalfm.co.ke",
    externalUrl: "https://kenyaliveradio.co.ke/capital-fm-live",
    meta: "Official Live Broadcast • 98.4 FM Kenya",
    description: "Capital FM Kenya is Kenya's premier radio station broadcasting top urban hits, news, and entertainment.",
    country: "ke",
    source: "kenyaliveradio.co.ke",
    verified: true
  },
  {
    id: "radio-citizen-kenya",
    aliases: ["radiocitizen"],
    name: "Radio Citizen",
    type: "radio",
    isRadio: true,
    category: "radio",
    categoryLabel: "106.7 FM • Kenya News & Music",
    logo: "/images/citizentv-logo.png",
    streamType: "audio",
    streamUrl: "https://stream.zeno.fm/4e48a1c9703vv",
    embedUrl: "https://radiocitizen.co.ke",
    externalUrl: "https://www.kenyamoja.com/radio/radio-citizen",
    meta: "Official Live Broadcast • 106.7 FM Kenya",
    description: "Radio Citizen is Kenya's most listened to Swahili radio station for news, music, and talk shows.",
    country: "ke",
    source: "kenyamoja.com",
    verified: true
  },
  {
    id: "classic-105-kenya",
    aliases: ["classic105"],
    name: "Classic 105",
    type: "radio",
    isRadio: true,
    category: "radio",
    categoryLabel: "105.2 FM • Good Times & Great Hits",
    logo: "/images/k24tv-logo.png",
    streamType: "audio",
    streamUrl: "https://stream.zeno.fm/f3wvbb1v38quv",
    embedUrl: "https://classic105.com",
    externalUrl: "https://kenyaliveradio.co.ke/classic-105-live",
    meta: "Official Live Broadcast • 105.2 FM Kenya",
    description: "Classic 105 Kenya features soul classics, morning talk shows, and great hits.",
    country: "ke",
    source: "kenyaliveradio.co.ke",
    verified: true
  },
  {
    id: "kiss-100-kenya",
    aliases: ["kiss100"],
    name: "Kiss 100 Kenya",
    type: "radio",
    isRadio: true,
    category: "radio",
    categoryLabel: "100.0 FM • Kenya's No.1 Hit Station",
    logo: "/images/ntvkenya-logo.png",
    streamType: "audio",
    streamUrl: "https://stream.zeno.fm/91eb81v38quv",
    embedUrl: "https://kiss100.co.ke",
    externalUrl: "https://kenyaliveradio.co.ke/kiss-100-live",
    meta: "Official Live Broadcast • 100.0 FM Kenya",
    description: "Kiss 100 Kenya is Nairobi's leading youth hit music radio station.",
    country: "ke",
    source: "kenyaliveradio.co.ke",
    verified: true
  }
];

async function getRadioStations() {
  return KENYA_RADIO_STATIONS;
}

module.exports = {
  getRadioStations,
  KENYA_RADIO_STATIONS
};
