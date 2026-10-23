/**
 * Uganda Radio Stations Module
 */

const UGANDA_RADIO_STATIONS = [
  {
    id: "dembe-fm",
    aliases: ["dembefm", "dembe"],
    name: "Dembe FM",
    type: "radio",
    isRadio: true,
    category: "radio",
    categoryLabel: "90.4 FM • Luganda Music & Shows",
    logo: "/images/dembefm-logo.jpg",
    streamType: "audio",
    streamUrl: "http://radio.dembefm.ug:8000/stream",
    embedUrl: "https://dembefm.ug",
    meta: "Official Live Broadcast • 90.4 FM",
    description: "Dembe FM is Uganda's premier Luganda music and entertainment radio station.",
    country: "ug",
    verified: true
  },
  {
    id: "galaxy-fm",
    aliases: ["galaxyfm", "zzina"],
    name: "Galaxy FM",
    type: "radio",
    isRadio: true,
    category: "radio",
    categoryLabel: "100.2 FM • Zzina",
    logo: "/images/galaxyfm-logo.png",
    streamType: "audio",
    streamUrl: "https://stream.zeno.fm/ahtmyttw5mftv",
    embedUrl: "https://www.galaxyfm.co.ug/radio/",
    meta: "Official Live Broadcast • 100.2 FM Zzina",
    description: "Galaxy FM 100.2 Zzina is Uganda's leading youth urban music station.",
    country: "ug",
    verified: true
  },
  {
    id: "bukedde-fm",
    aliases: ["bukeddefm"],
    name: "Bukedde FM",
    type: "radio",
    isRadio: true,
    category: "radio",
    categoryLabel: "100.5 FM • Luganda News & Shows",
    logo: "https://newvision-media.s3.amazonaws.com/cms/491c5aed-a6d9-412c-85cf-fe4e090e2510.png",
    streamType: "audio",
    streamUrl: "https://stream.hydeinnovations.com:2020/stream/bukeddefm/stream",
    embedUrl: "https://www.bukedde.co.ug/radiolist",
    meta: "Official Live Broadcast • 100.5 FM",
    description: "Bukedde FM is Uganda's top Luganda radio station for news, talk shows, and local music.",
    country: "ug",
    verified: true
  },
  {
    id: "xfm",
    aliases: ["xfm-948"],
    name: "XFM 94.8",
    type: "radio",
    isRadio: true,
    category: "radio",
    categoryLabel: "94.8 FM • Top 40 Hits",
    logo: "https://newvision-media.s3.amazonaws.com/cms/cb5df600-7c65-49d3-95c4-2af6616eefc0.png",
    streamType: "audio",
    streamUrl: "https://stream.hydeinnovations.com:2020/stream/xfm/stream",
    embedUrl: "https://www.bukedde.co.ug/radiolist",
    meta: "Official Live Broadcast • 94.8 FM",
    description: "XFM 94.8 is a Top 40 hit music radio station based in Kampala, Uganda.",
    country: "ug",
    verified: true
  },
  {
    id: "radio-west",
    aliases: ["radiowest"],
    name: "Radio West",
    type: "radio",
    isRadio: true,
    category: "radio",
    categoryLabel: "100.2 FM • Western Region",
    logo: "https://newvision-media.s3.amazonaws.com/cms/64332ddd-eecd-47ce-899f-e7ebcff5a5a6.png",
    streamType: "audio",
    streamUrl: "https://stream.hydeinnovations.com:2020/stream/radiowest/stream",
    embedUrl: "https://www.bukedde.co.ug/radiolist",
    meta: "Official Live Broadcast • 100.2 FM",
    description: "Radio West is the leading radio station in Western Uganda.",
    country: "ug",
    verified: true
  }
];

async function getRadioStations() {
  return UGANDA_RADIO_STATIONS;
}

module.exports = {
  getRadioStations,
  UGANDA_RADIO_STATIONS
};
