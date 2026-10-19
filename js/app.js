/* NAVBAR + SIDEBAR SCROLL BEHAVIOR */

const navbar = document.getElementById("navbar");
const sidebar = document.getElementById("sidebar");

let lastScrollY = window.scrollY;
let scrollTimer = null;
let scrollTicking = false;

function showNavigation(){
    if (navbar) navbar.classList.remove("nav-hidden");
    if(sidebar && sidebar.classList.contains("active")){
        sidebar.classList.add("active");
    }
}

function hideNavigation(){
    if(sidebar && !sidebar.classList.contains("active")){
        if (navbar) navbar.classList.add("nav-hidden");
    } else if (navbar) {
        navbar.classList.remove("nav-hidden");
    }
}

function handleNavigationScroll(){
    const currentScrollY = window.scrollY;
    if(currentScrollY <= 5){
        showNavigation();
    } else if(currentScrollY > lastScrollY){
        hideNavigation();
    } else if(currentScrollY < lastScrollY){
        showNavigation();
    }
    lastScrollY = currentScrollY;

    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function(){
        showNavigation();
    },180);
    scrollTicking = false;
}

window.addEventListener("scroll",function(){
    if(!scrollTicking){
        window.requestAnimationFrame(handleNavigationScroll);
        scrollTicking = true;
    }
},{passive:true});

window.addEventListener("touchend",function(){
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function(){
        showNavigation();
    },180);
},{passive:true});

window.addEventListener("wheel",function(){
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function(){
        showNavigation();
    },180);
},{passive:true});

window.addEventListener("keydown",function(event){
    if(
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "PageDown" ||
        event.key === "PageUp" ||
        event.key === "Home" ||
        event.key === "End" ||
        event.key === " "
    ){
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function(){
            showNavigation();
        },180);
    }
},{passive:true});

/* SIDEBAR & MENU CONTROLS */
const menuButton = document.getElementById("menuButton");
const sidebarOverlay = document.getElementById("sidebarOverlay");

function openSidebar(){
    if (sidebar) sidebar.classList.add("active");
    if (sidebarOverlay) sidebarOverlay.classList.add("active");
    if (menuButton) {
        menuButton.classList.add("active");
        menuButton.setAttribute("aria-expanded","true");
    }
    if (navbar) navbar.classList.remove("nav-hidden");
}

function closeSidebar(){
    if (sidebar) sidebar.classList.remove("active");
    if (sidebarOverlay) sidebarOverlay.classList.remove("active");
    if (menuButton) {
        menuButton.classList.remove("active");
        menuButton.setAttribute("aria-expanded","false");
    }
    document.querySelectorAll(".sidebar-submenu").forEach(function(menu){
        menu.classList.remove("open");
    });
    document.querySelectorAll(".has-submenu").forEach(function(item){
        item.classList.remove("expanded");
    });
}

if (menuButton) {
    menuButton.addEventListener("click",function(){
        if(sidebar && sidebar.classList.contains("active")){
            closeSidebar();
        }else{
            openSidebar();
        }
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click",function(){
        closeSidebar();
    });
}

document.addEventListener("keydown",function(event){
    if(event.key === "Escape"){
        closeSidebar();
    }
});

document.querySelectorAll(".has-submenu").forEach(function(link){
    link.addEventListener("click",function(event){
        event.preventDefault();
        const submenu = link.nextElementSibling;
        if(!submenu) return;
        const isOpen = submenu.classList.contains("open");

        document.querySelectorAll(".sidebar-submenu").forEach(function(menu){
            if(menu !== submenu) menu.classList.remove("open");
        });
        document.querySelectorAll(".has-submenu").forEach(function(item){
            if(item !== link) item.classList.remove("expanded");
        });

        if(isOpen){
            submenu.classList.remove("open");
            link.classList.remove("expanded");
        }else{
            submenu.classList.add("open");
            link.classList.add("expanded");
        }
    });
});

document.querySelectorAll(".sidebar-link:not(.has-submenu)").forEach(function(link){
    link.addEventListener("click",function(){
        document.querySelectorAll(".sidebar-link").forEach(function(item){
            item.classList.remove("active");
        });
        link.classList.add("active");
        closeSidebar();
    });
});

document.querySelectorAll(".sidebar-submenu a").forEach(function(link){
    link.addEventListener("click",function(){
        closeSidebar();
    });
});

/* HERO BUTTONS */
const exploreBtn = document.getElementById("exploreButton");
if (exploreBtn) {
    exploreBtn.addEventListener("click",function(){
        const target = document.getElementById("movies") || document.getElementById("popular-movies");
        if (target) {
            target.scrollIntoView({ behavior:"smooth" });
        } else {
            window.location.href = "/movies";
        }
    });
}

const categoriesBtn = document.getElementById("categoriesButton");
if (categoriesBtn) {
    categoriesBtn.addEventListener("click",function(){
        const target = document.getElementById("categories");
        if (target) {
            target.scrollIntoView({ behavior:"smooth" });
        }
    });
}

/* SEARCH BUTTON NAVIGATION */
document.querySelectorAll(".search-button").forEach(function(button){
    button.addEventListener("click",function(){
        const movieSearchInput = document.getElementById("movieSearchInput");
        if (movieSearchInput) {
            movieSearchInput.focus();
            movieSearchInput.scrollIntoView({ behavior: "smooth" });
        } else {
            window.location.href = "/movies";
        }
    });
});

/* CARD RENDER HELPERS */
function renderPosterContent(posterDiv, movie) {
    if (movie.posterUrl) {
        const img = document.createElement("img");
        img.src = movie.posterUrl;
        img.alt = movie.title || "Movie Poster";
        img.loading = "lazy";
        img.onerror = function() {
            posterDiv.innerHTML = "";
            renderPosterUnavailableFallback(posterDiv, movie);
        };
        posterDiv.appendChild(img);
    } else {
        renderPosterUnavailableFallback(posterDiv, movie);
    }
}

function renderPosterUnavailableFallback(posterDiv, movie) {
    const fallback = document.createElement("div");
    fallback.className = "poster-unavailable-fallback";

    const icon = document.createElement("div");
    icon.className = "poster-unavailable-icon";
    icon.innerHTML = "&#127916;"; // Movie slate icon

    const text = document.createElement("div");
    text.className = "poster-unavailable-text";
    text.textContent = movie.title || "Untitled";

    const sub = document.createElement("div");
    sub.className = "poster-unavailable-sub";
    sub.textContent = "Poster Unavailable";

    fallback.appendChild(icon);
    fallback.appendChild(text);
    fallback.appendChild(sub);

    posterDiv.appendChild(fallback);
}

function createMovieCard(movie) {
    const card = document.createElement("article");
    card.className = "movie-card";
    card.setAttribute("data-id", movie.id);
    card.style.cursor = "pointer";

    const posterDiv = document.createElement("div");
    posterDiv.className = "poster";

    renderPosterContent(posterDiv, movie);

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = movie.quality || "HD";
    posterDiv.appendChild(badge);

    const titleDiv = document.createElement("div");
    titleDiv.className = "card-title";
    titleDiv.title = movie.title || "Untitled";
    titleDiv.textContent = movie.title || "Untitled";

    const metaDiv = document.createElement("div");
    metaDiv.className = "card-meta";
    const metaText = `${movie.vj || 'Luganda'}${movie.year ? ' • ' + movie.year : ''}`;
    metaDiv.textContent = metaText;

    card.appendChild(posterDiv);
    card.appendChild(titleDiv);
    card.appendChild(metaDiv);

    card.addEventListener("click", () => {
        window.location.href = `/movie/${movie.id}`;
    });

    return card;
}

function createSeriesCard(series) {
    const card = document.createElement("article");
    card.className = "movie-card";
    card.setAttribute("data-id", series.id);
    card.style.cursor = "pointer";

    const posterDiv = document.createElement("div");
    posterDiv.className = "poster";

    renderPosterContent(posterDiv, series);

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = `${series.totalEpisodes || 1} EP`;
    posterDiv.appendChild(badge);

    const titleDiv = document.createElement("div");
    titleDiv.className = "card-title";
    titleDiv.title = series.title || "Untitled Series";
    titleDiv.textContent = series.title || "Untitled Series";

    const metaDiv = document.createElement("div");
    metaDiv.className = "card-meta";
    const metaText = `${series.vj || 'Luganda'} • ${series.totalSeasons || 1} Season${(series.totalSeasons || 1) > 1 ? 's' : ''}`;
    metaDiv.textContent = metaText;

    card.appendChild(posterDiv);
    card.appendChild(titleDiv);
    card.appendChild(metaDiv);

    card.addEventListener("click", () => {
        window.location.href = `/series/${series.id}`;
    });

    return card;
}

function createTrendingCard(movie, rank) {
    const card = document.createElement("article");
    card.className = "movie-card trending-card";
    card.setAttribute("data-id", movie.id);
    card.style.cursor = "pointer";

    const posterDiv = document.createElement("div");
    posterDiv.className = "poster";

    renderPosterContent(posterDiv, movie);

    const rankSpan = document.createElement("span");
    rankSpan.className = "trending-number";
    rankSpan.textContent = rank;
    posterDiv.appendChild(rankSpan);

    const titleDiv = document.createElement("div");
    titleDiv.className = "card-title";
    titleDiv.title = movie.title || "Untitled";
    titleDiv.textContent = movie.title || "Untitled";

    const metaDiv = document.createElement("div");
    metaDiv.className = "card-meta";
    metaDiv.textContent = `${movie.vj || 'Luganda'}${movie.year ? ' • ' + movie.year : ''}`;

    card.appendChild(posterDiv);
    card.appendChild(titleDiv);
    card.appendChild(metaDiv);

    card.addEventListener("click", () => {
        window.location.href = `/movie/${movie.id}`;
    });

    return card;
}

/* LIVE TV INTEGRATION */

const LIVE_TV_CHANNELS = [
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
        description: "NTV Uganda brings you live breaking news, current affairs, talk shows, and top Ugandan entertainment."
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
        description: "Spark TV Uganda is your home for celebrity gossip, music, local drama series, and women lifestyle programming."
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
        description: "Bukedde 1 TV delivers top Luganda news, live events, traditional culture, and family entertainment across Uganda."
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
        description: "Bukedde 2 offers vibrant Luganda music programming, sports coverage, and youth entertainment."
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
        description: "TV West is the leading television station for Western Uganda, broadcasting local news, culture, and entertainment in Runyankole."
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
        description: "Wan Luo TV is the premier Luo-language television channel broadcasting cultural programming, music, and news for Northern Uganda."
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
        description: "BBS Terefayina brings you live news, culture, entertainment, and current affairs from Buganda Kingdom and across Uganda."
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
        description: "Galaxy TV is Uganda's funkiest television station featuring the best music, movies, celebrity news, and entertainment."
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
        description: "KBS TV Uganda (Maaso ku Lutimbe) brings you live news, top entertainment, local talk shows, movies, and family programming."
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
        description: "Base2 TV (Telefwunkeni) delivers vibrant Luganda entertainment, translated blockbuster movies, youth shows, and local music."
    },
    {
        id: "trace-mziki",
        aliases: ["tracemziki"],
        name: "Trace Mziki",
        category: "entertainment",
        categoryLabel: "East African Music & Culture",
        logo: "/images/tracemziki-logo.png",
        streamType: "hls",
        streamUrl: "https://channels.trace.plus/Traceprod/MZIKI_hd/index.m3u8",
        embedUrl: "https://bx-tv.com/watch/trace-mziki-893902",
        meta: "Official Live Broadcast • HD • We Love East African Music",
        description: "Trace Mziki is the ultimate music channel dedicated to East African music, featuring hit video countdowns, artist showcases, and urban culture."
    }
];

let currentHlsInstance = null;
let currentActiveChannel = null;

function findChannelById(id) {
    if (!id) return null;
    const cleanId = id.trim().toLowerCase();
    return LIVE_TV_CHANNELS.find(ch =>
        ch.id.toLowerCase() === cleanId ||
        (ch.aliases && ch.aliases.some(a => a.toLowerCase() === cleanId))
    );
}

function createChannelCard(ch, isCurrent = false) {
    const card = document.createElement("article");
    card.className = "channel-card" + (isCurrent ? " active" : "");
    card.setAttribute("data-channel-id", ch.id);
    card.style.cursor = "pointer";

    card.innerHTML = `
        <div class="channel-thumb">
            <img src="${ch.logo}" alt="${ch.name}">
            <span class="logo-live-badge"><span class="live-dot"></span> LIVE</span>
        </div>
        <div class="channel-info">
            <span class="channel-name">${ch.name}</span>
        </div>
        <div class="channel-action">
            <button class="btn-watch">${isCurrent ? 'Now Playing' : 'Watch Live'}</button>
        </div>
    `;

    card.addEventListener("click", () => {
        window.location.href = `/live-tv/watch/${ch.id}/`;
    });

    return card;
}

/* LIVE TV CATALOGUE PAGE */
function initLiveTvCatalogue() {
    const cardGrid = document.getElementById("channelCardGrid");
    const videoPlayer = document.getElementById("liveVideoPlayer");

    // Only run on catalogue page where cardGrid exists and no video player is present
    if (!cardGrid || videoPlayer) return;

    function renderCards(filter = "all") {
        cardGrid.innerHTML = "";
        const filtered = LIVE_TV_CHANNELS.filter(ch => filter === "all" || ch.category === filter);

        filtered.forEach(ch => {
            cardGrid.appendChild(createChannelCard(ch, false));
        });
    }

    const categoryFiltersContainer = document.getElementById("channelCategoryFilters");
    if (categoryFiltersContainer) {
        categoryFiltersContainer.querySelectorAll(".category").forEach(btn => {
            btn.addEventListener("click", () => {
                categoryFiltersContainer.querySelectorAll(".category").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                const filter = btn.getAttribute("data-filter") || "all";
                renderCards(filter);
            });
        });
    }

    renderCards("all");
}

/* Helper: Calculate current East Africa Time (EAT = UTC+3) */
function getEATTime() {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 3));
}

/* LIVE TV WATCH PAGE */
function initLiveTvWatchPage() {
    const videoPlayer = document.getElementById("liveVideoPlayer");
    if (!videoPlayer) return; // Only run on watch page

    const loadingOverlay = document.getElementById("liveLoadingOverlay");
    const errorOverlay = document.getElementById("liveErrorOverlay");
    const errorMsg = document.getElementById("liveErrorMsg");
    const retryBtn = document.getElementById("liveRetryBtn");

    const centralPlayBtn = document.getElementById("liveCentralPlayBtn");
    const unmuteBanner = document.getElementById("liveUnmuteBanner");

    const activeLogo = document.getElementById("activeChannelLogo");
    const activeName = document.getElementById("activeChannelName");
    const activeCategory = document.getElementById("activeChannelCategory");

    // Controls & Overlay Elements
    const ctrlRewindBtn = document.getElementById("ctrlRewindBtn");
    const ctrlPlayPauseBtn = document.getElementById("ctrlPlayPauseBtn");
    const ctrlForwardBtn = document.getElementById("ctrlForwardBtn");
    const ctrlMuteBtn = document.getElementById("ctrlMuteBtn");
    const ctrlVolumeSlider = document.getElementById("ctrlVolumeSlider");
    const ctrlTimeDisplay = document.getElementById("ctrlTimeDisplay");
    const ctrlProgressContainer = document.getElementById("ctrlProgressContainer");
    const ctrlProgressFill = document.getElementById("ctrlProgressFill");
    const ctrlProgressThumb = document.getElementById("ctrlProgressThumb");
    const liveStreamStatus = document.getElementById("liveStreamStatus");
    const liveEdgeBtn = document.getElementById("liveEdgeBtn");

    const ctrlSettingsBtn = document.getElementById("ctrlSettingsBtn");
    const ctrlSettingsMenu = document.getElementById("ctrlSettingsMenu");
    const settingsCloseBtn = document.getElementById("settingsCloseBtn");
    const ctrlFullscreenBtn = document.getElementById("ctrlFullscreenBtn");

    const speedSettingsGroup = document.getElementById("speedSettingsGroup");
    const qualitySettingsGroup = document.getElementById("qualitySettingsGroup");
    const audioSettingsGroup = document.getElementById("audioSettingsGroup");
    const subtitleSettingsGroup = document.getElementById("subtitleSettingsGroup");
    const ctrlQualitySelect = document.getElementById("ctrlQualitySelect");
    const ctrlAudioSelect = document.getElementById("ctrlAudioSelect");
    const ctrlSubtitleSelect = document.getElementById("ctrlSubtitleSelect");
    const ctrlPipBtn = document.getElementById("ctrlPipBtn");

    const videoWrapper = document.getElementById("liveVideoWrapper");
    const controlsBar = document.getElementById("liveControlsBar");

    const playerSection = document.getElementById("liveTvPlayerSection");
    const notFoundSection = document.getElementById("channelNotFoundSection");
    const otherChannelsGrid = document.getElementById("otherChannelsGrid");

    const tabBtnEPG = document.getElementById("tabBtnEPG");
    const tabBtnInfo = document.getElementById("tabBtnInfo");
    const tabContentEPG = document.getElementById("tabContentEPG");
    const tabContentInfo = document.getElementById("tabContentInfo");

    let controlsTimeout = null;
    let isSeekingScrubbing = false;
    let isSeekableStream = false;
    let hasPlaybackStarted = false;

    // Helper: format seconds to M:SS or H:MM:SS
    function formatTime(seconds) {
        if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) {
            return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        }
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    // Route Parsing
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    let channelId = null;

    if (pathParts.length >= 3 && pathParts[0] === "live-tv" && pathParts[1] === "watch") {
        channelId = pathParts[2];
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        channelId = urlParams.get("channel");
    }

    const channel = findChannelById(channelId);

    // Invalid Channel Handler
    if (!channel) {
        if (playerSection) playerSection.style.display = "none";
        if (notFoundSection) notFoundSection.style.display = "block";
        document.title = "Channel Not Found — Live TV — SanyuHub";

        if (otherChannelsGrid) {
            otherChannelsGrid.innerHTML = "";
            LIVE_TV_CHANNELS.forEach(ch => {
                otherChannelsGrid.appendChild(createChannelCard(ch, false));
            });
        }
        return;
    }

    // Set Channel Page Metadata & Header Info
    document.title = `${channel.name} — Live TV — SanyuHub`;
    currentActiveChannel = channel;

    if (activeLogo) activeLogo.src = channel.logo;
    if (activeName) activeName.textContent = channel.name;
    if (activeCategory) activeCategory.textContent = channel.categoryLabel || "General Broadcast";

    // Render Other Channels
    if (otherChannelsGrid) {
        otherChannelsGrid.innerHTML = "";
        LIVE_TV_CHANNELS.forEach(ch => {
            const isCurrent = (ch.id === channel.id);
            otherChannelsGrid.appendChild(createChannelCard(ch, isCurrent));
        });
    }

    // Tab Switching Handlers (EPG & Info)
    function setupTabs() {
        if (!tabBtnEPG || !tabBtnInfo) return;

        tabBtnEPG.addEventListener("click", () => {
            tabBtnEPG.classList.add("active");
            tabBtnEPG.setAttribute("aria-selected", "true");
            tabBtnInfo.classList.remove("active");
            tabBtnInfo.setAttribute("aria-selected", "false");

            if (tabContentEPG) tabContentEPG.style.display = "block";
            if (tabContentInfo) tabContentInfo.style.display = "none";
        });

        tabBtnInfo.addEventListener("click", () => {
            tabBtnInfo.classList.add("active");
            tabBtnInfo.setAttribute("aria-selected", "true");
            tabBtnEPG.classList.remove("active");
            tabBtnEPG.setAttribute("aria-selected", "false");

            if (tabContentInfo) tabContentInfo.style.display = "block";
            if (tabContentEPG) tabContentEPG.style.display = "none";
        });

        renderEPGContent(channel);
        renderInfoContent(channel);
    }

    async function renderEPGContent(targetChannel) {
        const container = document.getElementById("epgContainer");
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state" style="padding: 30px; text-align: center;">
                <div class="spinner" style="margin: 0 auto 12px;"></div>
                <p style="color: #a0a0a0;">Fetching programme schedule for ${targetChannel.name}...</p>
            </div>
        `;

        try {
            const res = await fetch(`/api/live-tv/epg/${targetChannel.id}`);
            if (!res.ok) throw new Error("HTTP " + res.status);
            const data = await res.json();

            const schedule = data.schedule || [];

            if (schedule.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="padding: 40px 20px; text-align: center; color: #a0a0a0;">
                        <svg viewBox="0 0 24 24" style="width: 48px; height: 48px; fill: #555; margin-bottom: 12px;"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
                        <h4 style="color: #fff; font-size: 16px; margin-bottom: 6px;">Schedule Unavailable</h4>
                        <p style="font-size: 14px;">Programme schedule currently unavailable for ${targetChannel.name}.</p>
                    </div>
                `;
                return;
            }

            const nowEAT = getEATTime();
            const currentMins = nowEAT.getHours() * 60 + nowEAT.getMinutes();

            let html = `<div class="epg-schedule-header">
                <h3><span class="live-dot"></span> Today's Broadcast Schedule (East Africa Time)</h3>
            </div><div class="epg-list">`;

            schedule.forEach(item => {
                const parseMins = (t) => {
                    const p = t.split(":");
                    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
                };
                const startMins = parseMins(item.start);
                const endMins = parseMins(item.end);
                const isNowAiring = (currentMins >= startMins && currentMins < endMins);

                html += `
                    <div class="epg-item ${isNowAiring ? 'now-airing' : ''}">
                        <div class="epg-time-box">
                            <span class="epg-time">${item.start} - ${item.end}</span>
                            ${isNowAiring ? '<span class="now-badge"><span class="live-dot"></span> NOW AIRING</span>' : ''}
                        </div>
                        <div class="epg-info-box">
                            <div class="epg-title">${item.title}</div>
                            <div class="epg-desc">${item.desc}</div>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
            container.innerHTML = html;

        } catch (err) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 40px 20px; text-align: center; color: #a0a0a0;">
                    <svg viewBox="0 0 24 24" style="width: 48px; height: 48px; fill: #555; margin-bottom: 12px;"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
                    <h4 style="color: #fff; font-size: 16px; margin-bottom: 6px;">Schedule Unavailable</h4>
                    <p style="font-size: 14px;">Programme schedule currently unavailable for ${targetChannel.name}.</p>
                </div>
            `;
        }
    }

    function renderInfoContent(targetChannel) {
        const container = document.getElementById("infoCardContainer");
        if (!container) return;

        container.innerHTML = `
            <div class="info-grid">
                <div class="info-main">
                    <h2>About ${targetChannel.name}</h2>
                    <p class="info-desc">${targetChannel.description || 'Live television broadcast station.'}</p>
                </div>
                <div class="info-meta-table">
                    <div class="info-meta-row">
                        <span class="info-meta-label">Channel Name:</span>
                        <span class="info-meta-val">${targetChannel.name}</span>
                    </div>
                    <div class="info-meta-row">
                        <span class="info-meta-label">Category:</span>
                        <span class="info-meta-val">${targetChannel.categoryLabel || 'General Broadcast'}</span>
                    </div>
                    <div class="info-meta-row">
                        <span class="info-meta-label">Stream Type:</span>
                        <span class="info-meta-val">HLS Live Stream (HD 1080p)</span>
                    </div>
                    <div class="info-meta-row">
                        <span class="info-meta-label">Language:</span>
                        <span class="info-meta-val">${targetChannel.category === 'news' ? 'English & Luganda' : 'Luganda & Regional'}</span>
                    </div>
                    <div class="info-meta-row">
                        <span class="info-meta-label">Broadcast Region:</span>
                        <span class="info-meta-val">Uganda & Global Online</span>
                    </div>
                </div>
            </div>
        `;
    }

    setupTabs();

    function stopCurrentPlayback() {
        hasPlaybackStarted = false;
        if (currentHlsInstance) {
            currentHlsInstance.destroy();
            currentHlsInstance = null;
        }

        if (videoPlayer) {
            videoPlayer.pause();
            videoPlayer.removeAttribute("src");
            videoPlayer.load();
        }

        if (unmuteBanner) unmuteBanner.style.display = "none";

        if (ctrlQualitySelect) ctrlQualitySelect.innerHTML = '<option value="-1">Auto Quality</option>';
        if (ctrlAudioSelect) ctrlAudioSelect.innerHTML = '<option value="-1">Default Audio</option>';
        if (ctrlSubtitleSelect) ctrlSubtitleSelect.innerHTML = '<option value="-1">Off</option>';

        if (speedSettingsGroup) speedSettingsGroup.style.display = "none";
        if (qualitySettingsGroup) qualitySettingsGroup.style.display = "none";
        if (audioSettingsGroup) audioSettingsGroup.style.display = "none";
        if (subtitleSettingsGroup) subtitleSettingsGroup.style.display = "none";

        if (ctrlSettingsMenu) ctrlSettingsMenu.style.display = "none";
    }

    function showLoadingSpinner(isInitial = false) {
        if (errorOverlay) errorOverlay.style.display = "none";
        if (loadingOverlay) {
            loadingOverlay.style.display = "flex";
            const loadingText = document.getElementById("liveLoadingText");
            if (loadingText) {
                loadingText.style.display = (isInitial || !hasPlaybackStarted) ? "block" : "none";
            }
        }
    }

    function hideLoadingSpinner() {
        if (loadingOverlay) loadingOverlay.style.display = "none";
    }

    function showPlaybackError(logDetails) {
        if (logDetails) {
            console.error("Playback error details:", logDetails);
        }
        hideLoadingSpinner();
        if (errorOverlay) {
            errorOverlay.style.display = "flex";
        }
    }

    function updatePlayPauseBtnUI(isPlaying) {
        if (ctrlPlayPauseBtn) {
            const iconPlay = ctrlPlayPauseBtn.querySelector(".icon-play");
            const iconPause = ctrlPlayPauseBtn.querySelector(".icon-pause");
            if (iconPlay && iconPause) {
                iconPlay.style.display = isPlaying ? "none" : "block";
                iconPause.style.display = isPlaying ? "block" : "none";
            }
        }
        if (centralPlayBtn) {
            // Show central play button ONLY when paused or not playing
            centralPlayBtn.style.display = isPlaying ? "none" : "flex";
            const playIcon = centralPlayBtn.querySelector(".play-icon");
            const pauseIcon = centralPlayBtn.querySelector(".pause-icon");
            if (playIcon && pauseIcon) {
                playIcon.style.display = isPlaying ? "none" : "block";
                pauseIcon.style.display = isPlaying ? "block" : "none";
            }
        }
    }

    function updateMuteBtnUI(isMuted, volume) {
        if (ctrlMuteBtn) {
            const iconHigh = ctrlMuteBtn.querySelector(".icon-vol-high");
            const iconMute = ctrlMuteBtn.querySelector(".icon-vol-mute");
            if (iconHigh && iconMute) {
                iconHigh.style.display = (isMuted || volume === 0) ? "none" : "block";
                iconMute.style.display = (isMuted || volume === 0) ? "block" : "none";
            }
        }
        if (ctrlVolumeSlider && typeof volume === "number") {
            ctrlVolumeSlider.value = isMuted ? 0 : volume;
        }
    }

    function updateSeekCapabilities() {
        let seekableStart = 0;
        let seekableEnd = 0;
        let duration = videoPlayer.duration;

        if (videoPlayer.seekable && videoPlayer.seekable.length > 0) {
            seekableStart = videoPlayer.seekable.start(0);
            seekableEnd = videoPlayer.seekable.end(videoPlayer.seekable.length - 1);
        }

        const seekRange = seekableEnd - seekableStart;
        const hasFiniteDuration = isFinite(duration) && duration > 0;
        const hasDvrWindow = seekRange > 15 && !hasFiniteDuration;

        isSeekableStream = hasFiniteDuration || hasDvrWindow;

        // Show / Hide Rewind & Forward buttons based on stream capability
        if (ctrlRewindBtn) ctrlRewindBtn.style.display = isSeekableStream ? "flex" : "none";
        if (ctrlForwardBtn) ctrlForwardBtn.style.display = isSeekableStream ? "flex" : "none";

        // Show / Hide Playback Speed option based on seekability
        if (speedSettingsGroup) speedSettingsGroup.style.display = isSeekableStream ? "flex" : "none";

        if (hasFiniteDuration) {
            // VOD Content
            if (ctrlProgressContainer) ctrlProgressContainer.style.display = "flex";
            if (ctrlTimeDisplay) ctrlTimeDisplay.style.display = "inline";
            if (liveStreamStatus) liveStreamStatus.style.display = "none";
        } else if (hasDvrWindow) {
            // Live Stream with DVR Window
            if (ctrlProgressContainer) ctrlProgressContainer.style.display = "flex";
            if (ctrlTimeDisplay) ctrlTimeDisplay.style.display = "inline";
            if (liveStreamStatus) liveStreamStatus.style.display = "none";
        } else {
            // Standard Live Stream without DVR
            if (ctrlProgressContainer) ctrlProgressContainer.style.display = "none";
            if (ctrlTimeDisplay) ctrlTimeDisplay.style.display = "none";
            if (liveStreamStatus) liveStreamStatus.style.display = "flex";
        }

        updateTimeProgressUI();
    }

    function updateTimeProgressUI() {
        if (isSeekingScrubbing) return;

        let currentTime = videoPlayer.currentTime;
        let duration = videoPlayer.duration;

        let seekableStart = 0;
        let seekableEnd = 0;
        if (videoPlayer.seekable && videoPlayer.seekable.length > 0) {
            seekableStart = videoPlayer.seekable.start(0);
            seekableEnd = videoPlayer.seekable.end(videoPlayer.seekable.length - 1);
        }

        const seekRange = seekableEnd - seekableStart;
        const hasFiniteDuration = isFinite(duration) && duration > 0;

        if (hasFiniteDuration) {
            const percent = Math.min(100, Math.max(0, (currentTime / duration) * 100));
            if (ctrlProgressFill) ctrlProgressFill.style.width = `${percent}%`;
            if (ctrlProgressThumb) ctrlProgressThumb.style.left = `${percent}%`;
            if (ctrlTimeDisplay) {
                ctrlTimeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
            }
        } else if (seekRange > 15) {
            const currentPosition = currentTime - seekableStart;
            const percent = Math.min(100, Math.max(0, (currentPosition / seekRange) * 100));
            if (ctrlProgressFill) ctrlProgressFill.style.width = `${percent}%`;
            if (ctrlProgressThumb) ctrlProgressThumb.style.left = `${percent}%`;
            if (ctrlTimeDisplay) {
                const lagFromLive = Math.round(seekableEnd - currentTime);
                if (lagFromLive <= 5) {
                    ctrlTimeDisplay.textContent = "LIVE";
                } else {
                    ctrlTimeDisplay.textContent = `-${formatTime(lagFromLive)}`;
                }
            }
        } else {
            if (liveEdgeBtn) {
                liveEdgeBtn.classList.add("on-live-edge");
            }
        }
    }

    function seekToPercentage(percentage) {
        if (!isSeekableStream) return;

        let duration = videoPlayer.duration;
        let seekableStart = 0;
        let seekableEnd = 0;
        if (videoPlayer.seekable && videoPlayer.seekable.length > 0) {
            seekableStart = videoPlayer.seekable.start(0);
            seekableEnd = videoPlayer.seekable.end(videoPlayer.seekable.length - 1);
        }

        const seekRange = seekableEnd - seekableStart;
        const hasFiniteDuration = isFinite(duration) && duration > 0;

        if (hasFiniteDuration) {
            const targetTime = (percentage / 100) * duration;
            videoPlayer.currentTime = Math.min(duration, Math.max(0, targetTime));
        } else if (seekRange > 15) {
            const targetTime = seekableStart + (percentage / 100) * seekRange;
            videoPlayer.currentTime = Math.min(seekableEnd - 1, Math.max(seekableStart, targetTime));
        }
    }

    function handleScrub(e) {
        if (!isSeekableStream || !ctrlProgressContainer) return;

        const rect = ctrlProgressContainer.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const offsetX = Math.min(rect.width, Math.max(0, clientX - rect.left));
        const percentage = (offsetX / rect.width) * 100;

        if (ctrlProgressFill) ctrlProgressFill.style.width = `${percentage}%`;
        if (ctrlProgressThumb) ctrlProgressThumb.style.left = `${percentage}%`;

        seekToPercentage(percentage);
    }

    function loadChannelStream(targetChannel) {
        stopCurrentPlayback();

        showLoadingSpinner(true);

        const streamUrl = targetChannel.streamUrl;
        videoPlayer.style.display = "block";

        // Native HLS support (Safari / iOS)
        if (videoPlayer.canPlayType("application/vnd.apple.mpegurl")) {
            videoPlayer.src = streamUrl;

            videoPlayer.play().then(() => {
                hasPlaybackStarted = true;
                hideLoadingSpinner();
                updatePlayPauseBtnUI(true);
            }).catch(err => {
                console.warn("Autoplay rejected, attempting muted play...", err);
                videoPlayer.muted = true;
                updateMuteBtnUI(true, 0);
                if (unmuteBanner) unmuteBanner.style.display = "inline-flex";

                videoPlayer.play().then(() => {
                    hasPlaybackStarted = true;
                    hideLoadingSpinner();
                    updatePlayPauseBtnUI(true);
                }).catch(e => {
                    console.warn("Muted autoplay rejected, waiting for user gesture.", e);
                    hideLoadingSpinner();
                    updatePlayPauseBtnUI(false);
                });
            });

        // HLS.js support (Chrome, Firefox, Edge, Android)
        } else if (window.Hls && Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            });

            currentHlsInstance = hls;
            hls.loadSource(streamUrl);
            hls.attachMedia(videoPlayer);

            hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                // Quality options
                if (ctrlQualitySelect && data.levels && data.levels.length > 1) {
                    ctrlQualitySelect.innerHTML = '<option value="-1">Auto Quality</option>';
                    data.levels.forEach((level, index) => {
                        const opt = document.createElement("option");
                        opt.value = index;
                        opt.textContent = level.height ? `${level.height}p` : `Level ${index + 1}`;
                        ctrlQualitySelect.appendChild(opt);
                    });
                    if (qualitySettingsGroup) qualitySettingsGroup.style.display = "flex";
                } else if (qualitySettingsGroup) {
                    qualitySettingsGroup.style.display = "none";
                }

                // Audio track options
                if (ctrlAudioSelect && hls.audioTracks && hls.audioTracks.length > 1) {
                    ctrlAudioSelect.innerHTML = '';
                    hls.audioTracks.forEach((track, idx) => {
                        const opt = document.createElement("option");
                        opt.value = idx;
                        opt.textContent = track.name || `Audio Track ${idx + 1}`;
                        ctrlAudioSelect.appendChild(opt);
                    });
                    if (audioSettingsGroup) audioSettingsGroup.style.display = "flex";
                } else if (audioSettingsGroup) {
                    audioSettingsGroup.style.display = "none";
                }

                // Subtitle track options
                if (ctrlSubtitleSelect && hls.subtitleTracks && hls.subtitleTracks.length > 0) {
                    ctrlSubtitleSelect.innerHTML = '<option value="-1">Off</option>';
                    hls.subtitleTracks.forEach((track, idx) => {
                        const opt = document.createElement("option");
                        opt.value = idx;
                        opt.textContent = track.name || `Subtitles ${idx + 1}`;
                        ctrlSubtitleSelect.appendChild(opt);
                    });
                    if (subtitleSettingsGroup) subtitleSettingsGroup.style.display = "flex";
                } else if (subtitleSettingsGroup) {
                    subtitleSettingsGroup.style.display = "none";
                }

                // Autoplay attempt
                videoPlayer.play().then(() => {
                    hasPlaybackStarted = true;
                    hideLoadingSpinner();
                    updatePlayPauseBtnUI(true);
                }).catch(err => {
                    console.warn("Autoplay rejected, attempting muted play...", err);
                    videoPlayer.muted = true;
                    updateMuteBtnUI(true, 0);
                    if (unmuteBanner) unmuteBanner.style.display = "inline-flex";

                    videoPlayer.play().then(() => {
                        hasPlaybackStarted = true;
                        hideLoadingSpinner();
                        updatePlayPauseBtnUI(true);
                    }).catch(e => {
                        console.warn("Muted autoplay rejected, waiting for user gesture.", e);
                        hideLoadingSpinner();
                        updatePlayPauseBtnUI(false);
                    });
                });
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    console.error("Fatal HLS error encountered:", data.type, data.details);
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log("Attempting network recovery...");
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log("Attempting media recovery...");
                            hls.recoverMediaError();
                            break;
                        default:
                            showPlaybackError(data.type + " - " + data.details);
                            break;
                    }
                }
            });

        } else {
            showPlaybackError("HLS not supported on browser");
        }
    }

    // Unmute Banner Click
    if (unmuteBanner) {
        unmuteBanner.addEventListener("click", () => {
            videoPlayer.muted = false;
            unmuteBanner.style.display = "none";
            updateMuteBtnUI(false, videoPlayer.volume);
        });
    }

    // Central Play Button Click
    if (centralPlayBtn) {
        centralPlayBtn.addEventListener("click", () => {
            if (videoPlayer.paused) {
                videoPlayer.play().catch(e => console.error("Play error:", e));
            } else {
                videoPlayer.pause();
            }
        });
    }

    // Video Player Event Listeners
    videoPlayer.addEventListener("playing", () => {
        hasPlaybackStarted = true;
        hideLoadingSpinner();
        if (errorOverlay) errorOverlay.style.display = "none";
        updatePlayPauseBtnUI(true);
        updateSeekCapabilities();
    });

    videoPlayer.addEventListener("pause", () => {
        updatePlayPauseBtnUI(false);
    });

    videoPlayer.addEventListener("waiting", () => {
        showLoadingSpinner(false);
    });

    videoPlayer.addEventListener("stalled", () => {
        if (!videoPlayer.paused) {
            showLoadingSpinner(false);
        }
    });

    videoPlayer.addEventListener("timeupdate", () => {
        if (hasPlaybackStarted && !videoPlayer.paused && loadingOverlay && loadingOverlay.style.display !== "none") {
            hideLoadingSpinner();
        }
        updateTimeProgressUI();
    });

    videoPlayer.addEventListener("durationchange", () => {
        updateSeekCapabilities();
    });

    videoPlayer.addEventListener("loadedmetadata", () => {
        updateSeekCapabilities();
    });

    videoPlayer.addEventListener("error", (e) => {
        showPlaybackError(videoPlayer.error || e);
    });

    // Control A: Rewind (-10s)
    if (ctrlRewindBtn) {
        ctrlRewindBtn.addEventListener("click", () => {
            if (!isSeekableStream) return;
            let seekableStart = 0;
            if (videoPlayer.seekable && videoPlayer.seekable.length > 0) {
                seekableStart = videoPlayer.seekable.start(0);
            }
            videoPlayer.currentTime = Math.max(seekableStart, videoPlayer.currentTime - 10);
        });
    }

    // Control B: Play/Pause
    if (ctrlPlayPauseBtn) {
        ctrlPlayPauseBtn.addEventListener("click", () => {
            if (videoPlayer.paused) {
                videoPlayer.play().catch(e => console.error("Play error:", e));
            } else {
                videoPlayer.pause();
            }
        });
    }

    // Control C: Forward (+10s)
    if (ctrlForwardBtn) {
        ctrlForwardBtn.addEventListener("click", () => {
            if (!isSeekableStream) return;
            let seekableEnd = videoPlayer.duration;
            if (videoPlayer.seekable && videoPlayer.seekable.length > 0) {
                seekableEnd = videoPlayer.seekable.end(videoPlayer.seekable.length - 1);
            }
            if (isFinite(seekableEnd)) {
                videoPlayer.currentTime = Math.min(seekableEnd - 1, videoPlayer.currentTime + 10);
            } else {
                videoPlayer.currentTime += 10;
            }
        });
    }

    // Control D: Progress Bar Scrubbing
    if (ctrlProgressContainer) {
        ctrlProgressContainer.addEventListener("mousedown", (e) => {
            if (!isSeekableStream) return;
            isSeekingScrubbing = true;
            handleScrub(e);
        });

        window.addEventListener("mousemove", (e) => {
            if (isSeekingScrubbing) {
                handleScrub(e);
            }
        });

        window.addEventListener("mouseup", () => {
            if (isSeekingScrubbing) {
                isSeekingScrubbing = false;
            }
        });

        ctrlProgressContainer.addEventListener("touchstart", (e) => {
            if (!isSeekableStream) return;
            isSeekingScrubbing = true;
            handleScrub(e);
        }, { passive: true });

        window.addEventListener("touchmove", (e) => {
            if (isSeekingScrubbing) {
                handleScrub(e);
            }
        }, { passive: true });

        window.addEventListener("touchend", () => {
            if (isSeekingScrubbing) {
                isSeekingScrubbing = false;
            }
        });
    }

    // Control E: Mute and Volume
    if (ctrlMuteBtn) {
        ctrlMuteBtn.addEventListener("click", () => {
            videoPlayer.muted = !videoPlayer.muted;
            updateMuteBtnUI(videoPlayer.muted, videoPlayer.volume);
            if (!videoPlayer.muted && unmuteBanner) {
                unmuteBanner.style.display = "none";
            }
        });
    }

    if (ctrlVolumeSlider) {
        ctrlVolumeSlider.addEventListener("input", (e) => {
            const val = parseFloat(e.target.value);
            videoPlayer.volume = val;
            videoPlayer.muted = (val === 0);
            updateMuteBtnUI(videoPlayer.muted, val);
            if (val > 0 && unmuteBanner) {
                unmuteBanner.style.display = "none";
            }
        });
    }

    // Live Edge Button Click
    if (liveEdgeBtn) {
        liveEdgeBtn.addEventListener("click", () => {
            if (videoPlayer.seekable && videoPlayer.seekable.length > 0) {
                videoPlayer.currentTime = videoPlayer.seekable.end(videoPlayer.seekable.length - 1) - 0.5;
            }
        });
    }

    // Control F: Settings Menu
    if (ctrlSettingsBtn && ctrlSettingsMenu) {
        ctrlSettingsBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isVisible = ctrlSettingsMenu.style.display !== "none";
            ctrlSettingsMenu.style.display = isVisible ? "none" : "block";
            ctrlSettingsBtn.setAttribute("aria-expanded", !isVisible ? "true" : "false");
        });

        if (settingsCloseBtn) {
            settingsCloseBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                ctrlSettingsMenu.style.display = "none";
                ctrlSettingsBtn.setAttribute("aria-expanded", "false");
            });
        }

        document.addEventListener("click", (e) => {
            if (ctrlSettingsMenu.style.display !== "none" && !ctrlSettingsMenu.contains(e.target) && e.target !== ctrlSettingsBtn) {
                ctrlSettingsMenu.style.display = "none";
                ctrlSettingsBtn.setAttribute("aria-expanded", "false");
            }
        });
    }

    // Settings Option: Playback Speed
    const speedOptionsContainer = document.getElementById("speedOptions");
    if (speedOptionsContainer) {
        speedOptionsContainer.querySelectorAll(".speed-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const speed = parseFloat(btn.getAttribute("data-speed"));
                if (!isNaN(speed)) {
                    videoPlayer.playbackRate = speed;
                    speedOptionsContainer.querySelectorAll(".speed-btn").forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                }
            });
        });
    }

    // Settings Option: Quality Select
    if (ctrlQualitySelect) {
        ctrlQualitySelect.addEventListener("change", (e) => {
            const levelIndex = parseInt(e.target.value, 10);
            if (currentHlsInstance) {
                currentHlsInstance.currentLevel = levelIndex;
            }
        });
    }

    // Settings Option: Audio Select
    if (ctrlAudioSelect) {
        ctrlAudioSelect.addEventListener("change", (e) => {
            const trackIndex = parseInt(e.target.value, 10);
            if (currentHlsInstance) {
                currentHlsInstance.audioTrack = trackIndex;
            }
        });
    }

    // Settings Option: Subtitle Select
    if (ctrlSubtitleSelect) {
        ctrlSubtitleSelect.addEventListener("change", (e) => {
            const trackIndex = parseInt(e.target.value, 10);
            if (currentHlsInstance) {
                currentHlsInstance.subtitleTrack = trackIndex;
            }
        });
    }

    // Settings Option: Picture in Picture
    if (ctrlPipBtn) {
        if (!document.pictureInPictureEnabled || !videoPlayer.requestPictureInPicture) {
            ctrlPipBtn.disabled = true;
            ctrlPipBtn.querySelector("span").textContent = "Picture-in-Picture (Unsupported)";
        } else {
            ctrlPipBtn.addEventListener("click", async () => {
                try {
                    if (document.pictureInPictureElement) {
                        await document.exitPictureInPicture();
                    } else {
                        await videoPlayer.requestPictureInPicture();
                    }
                } catch (err) {
                    console.error("Picture-in-Picture error:", err);
                }
            });
        }
    }

    // Control G: Fullscreen
    if (ctrlFullscreenBtn) {
        ctrlFullscreenBtn.addEventListener("click", () => {
            if (document.fullscreenElement || document.webkitFullscreenElement) {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            } else {
                if (videoWrapper.requestFullscreen) {
                    videoWrapper.requestFullscreen();
                } else if (videoWrapper.webkitRequestFullscreen) {
                    videoWrapper.webkitRequestFullscreen();
                } else if (videoPlayer.webkitEnterFullscreen) {
                    videoPlayer.webkitEnterFullscreen();
                }
            }
        });
    }

    if (retryBtn) {
        retryBtn.addEventListener("click", () => {
            if (currentActiveChannel) {
                loadChannelStream(currentActiveChannel);
            }
        });
    }

    // Auto-hide controls bar on inactivity
    function resetControlsTimer() {
        if (controlsBar) controlsBar.classList.remove("controls-hidden");

        clearTimeout(controlsTimeout);
        controlsTimeout = setTimeout(() => {
            if (videoPlayer && !videoPlayer.paused && ctrlSettingsMenu && ctrlSettingsMenu.style.display === "none") {
                if (controlsBar) controlsBar.classList.add("controls-hidden");
            }
        }, 3000);
    }

    if (videoWrapper) {
        videoWrapper.addEventListener("mousemove", resetControlsTimer);
        videoWrapper.addEventListener("touchstart", resetControlsTimer, { passive: true });
        videoWrapper.addEventListener("pointermove", resetControlsTimer);
    }

    // Clean up on page unload
    window.addEventListener("beforeunload", () => {
        stopCurrentPlayback();
    });

    // Start playback for selected channel
    loadChannelStream(channel);
}

/* HOMEPAGE DYNAMIC INTEGRATION */
async function initHomePage() {
    const trendingGrid = document.getElementById("trendingGrid");
    const popularMoviesGrid = document.getElementById("popularMoviesGrid");
    const popularSeriesGrid = document.getElementById("popularSeriesGrid");
    const recentlyAddedGrid = document.getElementById("recentlyAddedGrid");
    const homeCategories = document.getElementById("homeCategories");

    if (!trendingGrid && !popularMoviesGrid && !recentlyAddedGrid) return;

    try {
        const res = await fetch("/api/movies?limit=30");
        if (!res.ok) throw new Error("Failed to fetch homepage movies");
        const data = await res.json();
        const movies = data.movies || [];

        if (movies.length === 0) return;

        // Featured Hero Section Update
        const homeFeaturedCard = document.getElementById("homeFeaturedCard");
        const featuredTitle = document.getElementById("featuredTitle");
        const featuredDesc = document.getElementById("featuredDesc");
        const featuredWatchBtn = document.getElementById("featuredWatchBtn");
        if (homeFeaturedCard && movies.length > 0) {
            const feat = movies[0];
            if (featuredTitle) featuredTitle.textContent = feat.title;
            if (featuredDesc) featuredDesc.textContent = `Watch ${feat.title} translated in Luganda by ${feat.vj}. High quality ${feat.quality} stream available now.`;
            if (featuredWatchBtn) {
                featuredWatchBtn.addEventListener("click", () => {
                    window.location.href = `/movie/${feat.id}`;
                });
            }
        }

        // VJ Categories Bar
        if (homeCategories && data.vjs && data.vjs.length > 0) {
            homeCategories.innerHTML = '<button class="category active" data-vj="all">All</button>';
            data.vjs.forEach(vjName => {
                const btn = document.createElement("button");
                btn.className = "category";
                btn.setAttribute("data-vj", vjName);
                btn.textContent = vjName;
                homeCategories.appendChild(btn);
            });
            homeCategories.querySelectorAll(".category").forEach(btn => {
                btn.addEventListener("click", () => {
                    const vj = btn.getAttribute("data-vj");
                    window.location.href = `/movies${vj && vj !== 'all' ? '?vj=' + encodeURIComponent(vj) : ''}`;
                });
            });
        }

        // Trending Grid
        if (trendingGrid) {
            trendingGrid.innerHTML = "";
            const trendingList = movies.slice(0, 10);
            trendingList.forEach((movie, idx) => {
                trendingGrid.appendChild(createTrendingCard(movie, idx + 1));
            });
        }

        // Popular Movies Grid
        if (popularMoviesGrid) {
            popularMoviesGrid.innerHTML = "";
            const popList = movies.slice(0, 6);
            popList.forEach(movie => {
                popularMoviesGrid.appendChild(createMovieCard(movie));
            });
        }

        // Popular Series Grid
        if (popularSeriesGrid) {
            popularSeriesGrid.innerHTML = "";
            const seriesList = movies.slice(6, 12);
            seriesList.forEach(movie => {
                popularSeriesGrid.appendChild(createMovieCard(movie));
            });
        }

        // Recently Added Grid
        if (recentlyAddedGrid) {
            recentlyAddedGrid.innerHTML = "";
            const recentList = movies.slice(0, 6);
            recentList.forEach(movie => {
                recentlyAddedGrid.appendChild(createMovieCard(movie));
            });
        }

    } catch (err) {
        console.error("Homepage load error:", err);
    }
}

/* CATEGORY / SUBPAGE DYNAMIC INTEGRATION */
async function initSubpage(containerId, isTrending = false, limit = 24) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Skip if on homepage where it is handled by initHomePage
    const isHomepage = document.getElementById("home") !== null;
    if (isHomepage) return;

    container.innerHTML = `<div class="loading-state">Loading SanyuHub movies...</div>`;

    try {
        const res = await fetch(`/api/movies?limit=${limit}`);
        if (!res.ok) throw new Error("HTTP error " + res.status);
        const data = await res.json();
        const movies = data.movies || [];

        if (movies.length === 0) {
            container.innerHTML = `<div class="loading-state">No movies found.</div>`;
            return;
        }

        container.innerHTML = "";
        movies.forEach((movie, idx) => {
            if (isTrending) {
                container.appendChild(createTrendingCard(movie, idx + 1));
            } else {
                container.appendChild(createMovieCard(movie));
            }
        });

    } catch (err) {
        console.error(`Failed loading ${containerId}:`, err);
        container.innerHTML = `<div class="error-state">Unable to load movies. Please check connection.</div>`;
    }
}

/* CONTINUE WATCHING DYNAMIC INTEGRATION */
function initContinueWatching() {
    const grid = document.getElementById("continueWatchingGrid");
    if (!grid) return;

    try {
        const saved = localStorage.getItem("sanyuhub_continue_watching");
        const list = saved ? JSON.parse(saved) : [];

        if (!list || list.length === 0) {
            grid.innerHTML = `<div class="loading-state">No recent watch history found. Start watching a movie to track your progress!</div>`;
            return;
        }

        grid.innerHTML = "";
        list.forEach(movie => {
            grid.appendChild(createMovieCard(movie));
        });
    } catch (e) {
        grid.innerHTML = `<div class="loading-state">No recent watch history found.</div>`;
    }
}

/* CATALOGUE PAGE (/movies) INTEGRATION */
const movieCardGrid = document.getElementById("movieCardGrid");
const vjCategoriesContainer = document.getElementById("vjCategories");
const genreFilterSelect = document.getElementById("genreFilterSelect");
const sortFilterSelect = document.getElementById("sortFilterSelect");
const paginationControls = document.getElementById("paginationControls");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageInfoSpan = document.getElementById("pageInfoSpan");
const movieSearchInput = document.getElementById("movieSearchInput");

if (movieCardGrid) {
    const urlParams = new URLSearchParams(window.location.search);
    let currentPage = parseInt(urlParams.get("page"), 10) || 1;
    let currentLimit = 24;
    let currentVj = urlParams.get("vj") || "all";
    let currentGenre = urlParams.get("genre") || "all";
    let currentSort = urlParams.get("sort") || "recently-added";
    let currentSearch = urlParams.get("search") || "";
    let searchDebounceTimer = null;

    if (movieSearchInput && currentSearch) {
        movieSearchInput.value = currentSearch;
    }

    async function fetchAndRenderCatalogue() {
        movieCardGrid.innerHTML = '<div class="loading-state">Loading SanyuHub movie catalogue...</div>';

        try {
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: currentLimit
            });
            if (currentVj && currentVj !== "all") queryParams.append("vj", currentVj);
            if (currentGenre && currentGenre !== "all") queryParams.append("genre", currentGenre);
            if (currentSort) queryParams.append("sort", currentSort);
            if (currentSearch) queryParams.append("search", currentSearch);

            const res = await fetch(`/api/movies?${queryParams.toString()}`);
            if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);

            const data = await res.json();
            const movies = data.movies || [];

            if (data.vjs && data.vjs.length > 0 && vjCategoriesContainer && vjCategoriesContainer.children.length <= 1) {
                renderVjCategoryButtons(data.vjs);
            }

            if (data.genres && data.genres.length > 0 && genreFilterSelect && genreFilterSelect.children.length <= 1) {
                data.genres.forEach(g => {
                    const opt = document.createElement("option");
                    opt.value = g;
                    opt.textContent = g;
                    genreFilterSelect.appendChild(opt);
                });
            }

            if (movies.length === 0) {
                movieCardGrid.innerHTML = '<div class="loading-state">No movies found matching your request.</div>';
                if (paginationControls) paginationControls.style.display = "none";
                return;
            }

            movieCardGrid.innerHTML = "";
            movies.forEach(movie => {
                movieCardGrid.appendChild(createMovieCard(movie));
            });

            if (paginationControls) {
                if (data.totalPages > 1) {
                    paginationControls.style.display = "flex";
                    if (pageInfoSpan) pageInfoSpan.textContent = `Page ${data.page} of ${data.totalPages} (${data.total} movies)`;
                    if (prevPageBtn) prevPageBtn.disabled = (data.page <= 1);
                    if (nextPageBtn) nextPageBtn.disabled = (data.page >= data.totalPages);
                } else {
                    paginationControls.style.display = "none";
                }
            }

        } catch (err) {
            console.error("Failed to load movie catalogue:", err);
            movieCardGrid.innerHTML = '<div class="error-state">Unable to load movie catalogue. Please try again later.</div>';
            if (paginationControls) paginationControls.style.display = "none";
        }
    }

    function renderVjCategoryButtons(vjs) {
        if (!vjCategoriesContainer) return;
        vjCategoriesContainer.innerHTML = '<button class="category active" data-vj="all">All</button>';
        vjs.forEach(vjName => {
            const btn = document.createElement("button");
            btn.className = "category";
            if (vjName.toLowerCase() === currentVj.toLowerCase()) {
                vjCategoriesContainer.querySelector(".category")?.classList.remove("active");
                btn.className = "category active";
            }
            btn.setAttribute("data-vj", vjName);
            btn.textContent = vjName;
            vjCategoriesContainer.appendChild(btn);
        });

        vjCategoriesContainer.querySelectorAll(".category").forEach(btn => {
            btn.addEventListener("click", function() {
                vjCategoriesContainer.querySelectorAll(".category").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                currentVj = btn.getAttribute("data-vj") || "all";
                currentPage = 1;
                fetchAndRenderCatalogue();
            });
        });
    }

    if (genreFilterSelect) {
        genreFilterSelect.addEventListener("change", (e) => {
            currentGenre = e.target.value;
            currentPage = 1;
            fetchAndRenderCatalogue();
        });
    }

    if (sortFilterSelect) {
        sortFilterSelect.addEventListener("change", (e) => {
            currentSort = e.target.value;
            currentPage = 1;
            fetchAndRenderCatalogue();
        });
    }

    if (prevPageBtn) {
        prevPageBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                fetchAndRenderCatalogue();
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener("click", () => {
            currentPage++;
            fetchAndRenderCatalogue();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    if (movieSearchInput) {
        movieSearchInput.addEventListener("input", (e) => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                currentSearch = e.target.value.trim();
                currentPage = 1;
                fetchAndRenderCatalogue();
            }, 300);
        });
    }

    fetchAndRenderCatalogue();
}

/* SERIES CATALOGUE PAGE (/series) INTEGRATION */
const seriesCardGrid = document.getElementById("seriesCardGrid");
const seriesSearchInput = document.getElementById("seriesSearchInput");
const seriesGenreSelect = document.getElementById("seriesGenreSelect");
const seriesSortSelect = document.getElementById("seriesSortSelect");
const seriesPaginationControls = document.getElementById("seriesPaginationControls");
const seriesPrevBtn = document.getElementById("seriesPrevBtn");
const seriesNextBtn = document.getElementById("seriesNextBtn");
const seriesPageInfo = document.getElementById("seriesPageInfo");

if (seriesCardGrid) {
    let sPage = 1;
    let sLimit = 24;
    let sGenre = "all";
    let sSort = "popular";
    let sSearch = "";
    let sDebounce = null;

    async function fetchAndRenderSeries() {
        seriesCardGrid.innerHTML = '<div class="loading-state">Loading SanyuHub series catalogue...</div>';

        try {
            const queryParams = new URLSearchParams({
                page: sPage,
                limit: sLimit,
                sort: sSort
            });
            if (sGenre && sGenre !== "all") queryParams.append("genre", sGenre);
            if (sSearch) queryParams.append("search", sSearch);

            const res = await fetch(`/api/series?${queryParams.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            const seriesList = data.series || [];

            if (data.genres && data.genres.length > 0 && seriesGenreSelect && seriesGenreSelect.children.length <= 1) {
                data.genres.forEach(g => {
                    const opt = document.createElement("option");
                    opt.value = g;
                    opt.textContent = g;
                    seriesGenreSelect.appendChild(opt);
                });
            }

            if (seriesList.length === 0) {
                seriesCardGrid.innerHTML = '<div class="loading-state">No series found matching your request.</div>';
                if (seriesPaginationControls) seriesPaginationControls.style.display = "none";
                return;
            }

            seriesCardGrid.innerHTML = "";
            seriesList.forEach(series => {
                seriesCardGrid.appendChild(createSeriesCard(series));
            });

            if (seriesPaginationControls) {
                if (data.totalPages > 1) {
                    seriesPaginationControls.style.display = "flex";
                    if (seriesPageInfo) seriesPageInfo.textContent = `Page ${data.page} of ${data.totalPages} (${data.total} series)`;
                    if (seriesPrevBtn) seriesPrevBtn.disabled = (data.page <= 1);
                    if (seriesNextBtn) seriesNextBtn.disabled = (data.page >= data.totalPages);
                } else {
                    seriesPaginationControls.style.display = "none";
                }
            }

        } catch (err) {
            console.error("Failed to load series catalogue:", err);
            seriesCardGrid.innerHTML = '<div class="error-state">Unable to load series catalogue. Please try again later.</div>';
            if (seriesPaginationControls) seriesPaginationControls.style.display = "none";
        }
    }

    if (seriesSearchInput) {
        seriesSearchInput.addEventListener("input", (e) => {
            clearTimeout(sDebounce);
            sDebounce = setTimeout(() => {
                sSearch = e.target.value.trim();
                sPage = 1;
                fetchAndRenderSeries();
            }, 300);
        });
    }

    if (seriesGenreSelect) {
        seriesGenreSelect.addEventListener("change", (e) => {
            sGenre = e.target.value;
            sPage = 1;
            fetchAndRenderSeries();
        });
    }

    if (seriesSortSelect) {
        seriesSortSelect.addEventListener("change", (e) => {
            sSort = e.target.value;
            sPage = 1;
            fetchAndRenderSeries();
        });
    }

    if (seriesPrevBtn) {
        seriesPrevBtn.addEventListener("click", () => {
            if (sPage > 1) {
                sPage--;
                fetchAndRenderSeries();
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    }

    if (seriesNextBtn) {
        seriesNextBtn.addEventListener("click", () => {
            sPage++;
            fetchAndRenderSeries();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    fetchAndRenderSeries();
}

/* SERIES DETAILS PAGE INTEGRATION */
async function initSeriesDetailPage() {
    const mainContainer = document.getElementById("seriesDetailPage");
    if (!mainContainer) return;

    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const seriesId = pathParts[pathParts.length - 1];

    if (!seriesId || seriesId === "series") {
        mainContainer.innerHTML = `<div class="error-state" style="padding: 120px 20px;">
            <h2>Series Not Specified</h2>
            <p style="margin-top: 10px;"><a href="/series" class="btn-back-secondary">Return to Series Catalogue</a></p>
        </div>`;
        return;
    }

    try {
        const res = await fetch(`/api/series/${seriesId}`);
        if (!res.ok) throw new Error("Series not found");
        const series = await res.json();

        document.title = `${series.title} — SanyuHub Series`;

        const backdropUrl = series.backdropUrl || series.posterUrl;
        const backdropStyle = backdropUrl ? `style="background-image: url('${backdropUrl}');"` : '';

        const posterImageHtml = series.posterUrl
            ? `<img src="${series.posterUrl}" alt="${series.title}" onerror="this.parentElement.innerHTML='<div class=\\'poster-unavailable-fallback\\'><div class=\\'poster-unavailable-icon\\'>&#127916;</div><div class=\\'poster-unavailable-text\\'>${series.title.replace(/'/g, "&apos;")}</div><div class=\\'poster-unavailable-sub\\'>Poster Unavailable</div></div>'">`
            : `<div class="poster-unavailable-fallback"><div class="poster-unavailable-icon">&#127916;</div><div class="poster-unavailable-text">${series.title}</div><div class="poster-unavailable-sub">Poster Unavailable</div></div>`;

        const genreBadges = (series.genres && series.genres.length > 0)
            ? series.genres.map(g => `<span class="series-badge" style="background:#333;">${g}</span>`).join(" ")
            : `<span class="series-badge" style="background:#333;">Drama</span>`;

        let seasonsTabsHtml = "";
        if (series.seasons && series.seasons.length > 0) {
            seasonsTabsHtml = series.seasons.map((sec, idx) => `
                <button class="season-tab ${idx === 0 ? 'active' : ''}" data-season="${sec.seasonNumber}">
                    ${sec.name} (${sec.episodeCount} EP)
                </button>
            `).join("");
        }

        mainContainer.innerHTML = `
            <div class="series-hero" ${backdropStyle}>
                <div class="series-hero-content">
                    <div class="series-poster-box">
                        ${posterImageHtml}
                    </div>
                    <div class="series-info-box">
                        <h1 class="series-title-text">${series.title}</h1>
                        <div class="series-badge-row">
                            <span class="series-badge">${series.quality || 'HD'}</span>
                            <span>${series.vj || 'Luganda'}</span>
                            ${series.year ? `<span>• ${series.year}</span>` : ''}
                            <span>• ${series.totalSeasons || 1} Season${(series.totalSeasons || 1) > 1 ? 's' : ''}</span>
                            <span>• ${series.totalEpisodes || 1} Episodes</span>
                        </div>
                        <div class="series-badge-row">
                            ${genreBadges}
                        </div>
                        <p class="series-overview-text">
                            ${series.overview || `Watch full seasons of <strong>${series.title}</strong> translated in Luganda by <strong>${series.vj}</strong> on SanyuHub.`}
                        </p>
                    </div>
                </div>
            </div>

            <div style="margin-top: 30px;">
                <h2 style="font-size: 1.4rem; color: #fff; margin-bottom: 16px;">Seasons & Episodes</h2>
                <div class="season-tabs" id="seasonTabsContainer">
                    ${seasonsTabsHtml}
                </div>
                <div class="episodes-grid" id="episodesGridContainer">
                    <!-- Episodes rendered via JS -->
                </div>
            </div>
        `;

        function renderEpisodesForSeason(seasonNum) {
            const grid = document.getElementById("episodesGridContainer");
            if (!grid) return;

            const seasonData = series.seasons.find(s => s.seasonNumber === seasonNum) || series.seasons[0];
            const eps = seasonData ? seasonData.episodes : (series.episodes || []);

            if (eps.length === 0) {
                grid.innerHTML = `<div class="loading-state">No episodes found for Season ${seasonNum}.</div>`;
                return;
            }

            grid.innerHTML = "";
            eps.forEach(ep => {
                const card = document.createElement("div");
                card.className = "episode-card";
                card.innerHTML = `
                    <div>
                        <div class="episode-title">Episode ${ep.episode}: ${ep.title}</div>
                        <div class="episode-meta">${ep.vj || 'Luganda'} • ${ep.quality || 'HD'} • ${(ep.format || 'mp4').toUpperCase()}</div>
                    </div>
                    <a href="/series/watch/${ep.id}" class="btn-play-episode">&#9654; Watch Episode</a>
                `;
                card.addEventListener("click", (e) => {
                    if (!e.target.classList.contains("btn-play-episode")) {
                        window.location.href = `/series/watch/${ep.id}`;
                    }
                });
                grid.appendChild(card);
            });
        }

        const tabsContainer = document.getElementById("seasonTabsContainer");
        if (tabsContainer) {
            tabsContainer.querySelectorAll(".season-tab").forEach(tab => {
                tab.addEventListener("click", () => {
                    tabsContainer.querySelectorAll(".season-tab").forEach(t => t.classList.remove("active"));
                    tab.classList.add("active");
                    const sNum = parseInt(tab.getAttribute("data-season"), 10);
                    renderEpisodesForSeason(sNum);
                });
            });
        }

        // Default render first season
        const initialSeason = (series.seasons && series.seasons.length > 0) ? series.seasons[0].seasonNumber : 1;
        renderEpisodesForSeason(initialSeason);

    } catch (err) {
        console.error("Failed to load series details:", err);
        mainContainer.innerHTML = `
            <div class="error-state" style="padding: 120px 20px;">
                <h2>Series Not Found</h2>
                <p style="margin-top: 10px; color: #888;">The series record you requested could not be found.</p>
                <p style="margin-top: 20px;"><a href="/series" class="btn-back-secondary">Return to Series Catalogue</a></p>
            </div>
        `;
    }
}

/* SERIES WATCH PAGE INTEGRATION */
async function initSeriesWatchPage() {
    const watchPage = document.getElementById("seriesWatchPage");
    if (!watchPage) return;

    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const episodeId = pathParts[pathParts.length - 1];

    const titleEl = document.getElementById("seriesEpWatchTitle");
    const metaEl = document.getElementById("seriesEpWatchMeta");
    const backBtn = document.getElementById("backToSeriesDetailBtn");
    const player = document.getElementById("seriesEpisodePlayer");
    const statusText = document.getElementById("seriesPlayerStatusText");
    const selectorBar = document.getElementById("episodeSelectorBar");

    if (!episodeId || episodeId === "watch") {
        if (titleEl) titleEl.textContent = "Episode Stream Not Found";
        if (statusText) statusText.textContent = "No valid episode ID provided.";
        return;
    }

    try {
        // Fetch series catalogue to locate current episode and parent series details
        const seriesListRes = await fetch("/api/series?limit=100");
        if (!seriesListRes.ok) throw new Error("Failed to fetch series list");
        const seriesData = await seriesListRes.json();
        const allSeries = seriesData.series || [];

        let parentSeries = null;
        let currentEpisode = null;

        for (const s of allSeries) {
            const epMatch = s.episodes.find(e => e.id === episodeId);
            if (epMatch) {
                parentSeries = s;
                currentEpisode = epMatch;
                break;
            }
        }

        if (!currentEpisode) {
            throw new Error("Episode record not found in series catalogue");
        }

        document.title = `Watching ${parentSeries.title} S${currentEpisode.season}E${currentEpisode.episode} — SanyuHub`;

        if (titleEl) titleEl.textContent = `${parentSeries.title} — Season ${currentEpisode.season} Episode ${currentEpisode.episode}`;
        if (metaEl) metaEl.textContent = `${currentEpisode.vj || 'Luganda'} • ${currentEpisode.quality || 'HD'} • ${(currentEpisode.format || 'mp4').toUpperCase()}`;
        if (backBtn) backBtn.href = `/series/${parentSeries.id}`;

        // Update Metadata Grid
        const vjVal = document.getElementById("seriesWatchVjVal");
        const qualVal = document.getElementById("seriesWatchQualityVal");
        const fmtVal = document.getElementById("seriesWatchFormatVal");
        const catVal = document.getElementById("seriesWatchCategoryVal");
        if (vjVal) vjVal.textContent = currentEpisode.vj || "Luganda VJ";
        if (qualVal) qualVal.textContent = currentEpisode.quality || "HD";
        if (fmtVal) fmtVal.textContent = (currentEpisode.format || "mp4").toUpperCase();
        if (catVal) catVal.textContent = parentSeries.category || "Luganda Series";

        // Episode selector bar
        if (selectorBar && parentSeries.episodes) {
            selectorBar.innerHTML = "";
            parentSeries.episodes.forEach(ep => {
                const btn = document.createElement("a");
                btn.className = "ep-nav-btn" + (ep.id === currentEpisode.id ? " active" : "");
                btn.href = `/series/watch/${ep.id}`;
                btn.textContent = `S${ep.season} E${ep.episode}`;
                selectorBar.appendChild(btn);
            });
        }

        // Video Player setup
        if (player && currentEpisode.mediaUrl) {
            player.src = currentEpisode.mediaUrl;
            player.style.display = "block";
            if (statusText) statusText.style.display = "none";

            player.onerror = function() {
                if (statusText) {
                    statusText.style.display = "block";
                    statusText.innerHTML = '<span style="color:#e57373;">Episode media stream is currently unavailable or offline.</span>';
                }
            };
        } else if (statusText) {
            statusText.innerHTML = '<span style="color:#e57373;">No playback stream URL configured for this episode.</span>';
        }

        // Save to Continue Watching LocalStorage
        saveToContinueWatching({
            id: currentEpisode.id,
            title: `${parentSeries.title} S${currentEpisode.season}E${currentEpisode.episode}`,
            posterUrl: currentEpisode.posterUrl || parentSeries.posterUrl,
            vj: currentEpisode.vj || parentSeries.vj,
            quality: currentEpisode.quality || 'HD'
        });

    } catch (err) {
        console.error("Failed to load series watch page:", err);
        if (titleEl) titleEl.textContent = "Stream Unavailable";
        if (statusText) {
            statusText.style.display = "block";
            statusText.innerHTML = '<span style="color:#e57373;">Unable to load episode stream. Record not found.</span>';
        }
    }
}

/* MOVIE DETAILS PAGE INTEGRATION */
async function initMovieDetailsPage() {
    const detailMain = document.getElementById("movieDetailPage");
    if (!detailMain) return;

    // Extract ID from path e.g. /movie/0a1b2c3d
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const movieId = pathParts[pathParts.length - 1];

    if (!movieId || movieId === "movie") {
        detailMain.innerHTML = `<div class="error-state" style="padding: 120px 20px;">
            <h2>Movie Not Specified</h2>
            <p style="margin-top: 10px;"><a href="/movies" class="btn-back-secondary">Return to Catalogue</a></p>
        </div>`;
        return;
    }

    try {
        const res = await fetch(`/api/movies/${movieId}`);
        if (!res.ok) throw new Error("Movie not found");
        const movie = await res.json();

        document.title = `${movie.title} — SanyuHub`;

        const backdropUrl = movie.backdropUrl || movie.posterUrl;
        const backdropStyle = backdropUrl ? `style="background-image: url('${backdropUrl}');"` : '';

        const posterImageHtml = movie.posterUrl
            ? `<img src="${movie.posterUrl}" alt="${movie.title}" onerror="this.parentElement.innerHTML='<div class=\\'poster-unavailable-fallback\\'><div class=\\'poster-unavailable-icon\\'>&#127916;</div><div class=\\'poster-unavailable-text\\'>${movie.title.replace(/'/g, "&apos;")}</div><div class=\\'poster-unavailable-sub\\'>Poster Unavailable</div></div>'">`
            : `<div class="poster-unavailable-fallback"><div class="poster-unavailable-icon">&#127916;</div><div class="poster-unavailable-text">${movie.title}</div><div class="poster-unavailable-sub">Poster Unavailable</div></div>`;

        detailMain.innerHTML = `
            <div class="movie-detail-hero" ${backdropStyle}>
                <div class="movie-detail-layout">
                    <div class="movie-detail-poster">
                        ${posterImageHtml}
                    </div>
                    <div class="movie-detail-info">
                        <h1 class="movie-detail-title">${movie.title}</h1>
                        <div class="movie-detail-meta">
                            <span class="movie-meta-badge">${movie.quality || 'HD'}</span>
                            <span>${movie.vj || 'Luganda'}</span>
                            ${movie.year ? `<span>• ${movie.year}</span>` : ''}
                            <span>• ${movie.category || 'Luganda Movie'}</span>
                            <span>• ${movie.format ? movie.format.toUpperCase() : 'MP4'}</span>
                        </div>
                        <p class="movie-detail-overview">
                            Watch <strong>${movie.title}</strong> translated in Luganda by <strong>${movie.vj}</strong>.
                            High definition ${movie.quality} stream delivered straight to your device on SanyuHub.
                        </p>
                        <div class="movie-detail-actions">
                            <a href="/watch/${movie.id}" class="btn-watch-primary">&#9654; Watch Movie</a>
                            <a href="/movies" class="btn-back-secondary">&laquo; Back to Catalogue</a>
                        </div>
                        <div class="movie-metadata-grid">
                            <div class="metadata-item">
                                <label>Title</label>
                                <span>${movie.title}</span>
                            </div>
                            <div class="metadata-item">
                                <label>Translator / VJ</label>
                                <span>${movie.vj}</span>
                            </div>
                            <div class="metadata-item">
                                <label>Release Year</label>
                                <span>${movie.year || 'N/A'}</span>
                            </div>
                            <div class="metadata-item">
                                <label>Stream Quality</label>
                                <span>${movie.quality}</span>
                            </div>
                            <div class="metadata-item">
                                <label>Category</label>
                                <span>${movie.category}</span>
                            </div>
                            <div class="metadata-item">
                                <label>Format</label>
                                <span>${movie.format ? movie.format.toUpperCase() : 'MP4'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Render recommendations
        initRelatedMovies("relatedMoviesGrid", movie.id);

    } catch (err) {
        console.error("Failed to load movie details:", err);
        detailMain.innerHTML = `
            <div class="error-state" style="padding: 120px 20px;">
                <h2>Movie Not Found</h2>
                <p style="margin-top: 10px; color: #888;">The movie you requested could not be found or is unavailable.</p>
                <p style="margin-top: 20px;"><a href="/movies" class="btn-back-secondary">Return to Movies Catalogue</a></p>
            </div>
        `;
    }
}

/* WATCH PAGE INTEGRATION */
async function initWatchPage() {
    const watchMain = document.getElementById("movieWatchPage");
    if (!watchMain) return;

    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const movieId = pathParts[pathParts.length - 1];

    const watchTitle = document.getElementById("watchTitle");
    const watchMetaText = document.getElementById("watchMetaText");
    const backToDetailBtn = document.getElementById("backToDetailBtn");
    const moviePlayer = document.getElementById("moviePlayer");
    const playerStatusText = document.getElementById("playerStatusText");

    if (!movieId || movieId === "watch") {
        if (watchTitle) watchTitle.textContent = "Movie Stream Not Found";
        if (playerStatusText) playerStatusText.textContent = "No valid movie ID provided.";
        return;
    }

    try {
        const res = await fetch(`/api/movies/${movieId}`);
        if (!res.ok) throw new Error("Movie not found");
        const movie = await res.json();

        document.title = `Watching ${movie.title} — SanyuHub`;

        if (watchTitle) watchTitle.textContent = movie.title;
        if (watchMetaText) watchMetaText.textContent = `${movie.vj || 'Luganda'} • ${movie.year || ''} • ${movie.quality} • ${movie.category || 'Movie'}`;
        if (backToDetailBtn) backToDetailBtn.href = `/movie/${movie.id}`;

        // Update Metadata Grid
        const watchVjVal = document.getElementById("watchVjVal");
        const watchQualityVal = document.getElementById("watchQualityVal");
        const watchFormatVal = document.getElementById("watchFormatVal");
        const watchCategoryVal = document.getElementById("watchCategoryVal");
        if (watchVjVal) watchVjVal.textContent = movie.vj || "Luganda VJ";
        if (watchQualityVal) watchQualityVal.textContent = movie.quality || "HD";
        if (watchFormatVal) watchFormatVal.textContent = (movie.format || "mp4").toUpperCase();
        if (watchCategoryVal) watchCategoryVal.textContent = movie.category || "Luganda";

        // Set up Video Player
        if (moviePlayer && movie.mediaUrl) {
            const mediaUrl = movie.mediaUrl;
            const isHls = mediaUrl.includes('.m3u8') || (movie.format && movie.format.toUpperCase() === 'HLS');

            if (isHls && window.Hls && Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(mediaUrl);
                hls.attachMedia(moviePlayer);
                hls.on(Hls.Events.MANIFEST_PARSED, function() {
                    moviePlayer.style.display = "block";
                    if (playerStatusText) playerStatusText.style.display = "none";
                    moviePlayer.play().catch(e => console.log("Autoplay prevented"));
                });
                hls.on(Hls.Events.ERROR, function(event, data) {
                    if (data.fatal) {
                        if (playerStatusText) {
                            playerStatusText.style.display = "block";
                            playerStatusText.innerHTML = '<span style="color:#e57373;">HLS stream connection failed.</span>';
                        }
                    }
                });
            } else {
                moviePlayer.src = mediaUrl;
                moviePlayer.style.display = "block";
                if (playerStatusText) playerStatusText.style.display = "none";

                moviePlayer.onerror = function() {
                    if (playerStatusText) {
                        playerStatusText.style.display = "block";
                        playerStatusText.innerHTML = '<span style="color:#e57373;">Media stream unavailable or failed to load.</span>';
                    }
                };
            }
        } else if (movie.externalUrl) {
            moviePlayer.style.display = "none";
            if (playerStatusText) {
                playerStatusText.style.display = "block";
                playerStatusText.innerHTML = `<div style="padding: 20px;"><p style="color:#ffcc00; margin-bottom: 15px;">This movie is hosted externally on ${movie.source || 'provider'}.</p><a href="${movie.externalUrl}" target="_blank" rel="noopener noreferrer" class="btn-watch-primary" style="display: inline-block;">Open External Viewing Page</a></div>`;
            }
        } else if (playerStatusText) {
            playerStatusText.innerHTML = '<span style="color:#e57373;">No media stream URL available for this record.</span>';
        }

        // Save to Continue Watching LocalStorage
        saveToContinueWatching(movie);

        // Render Recommendations
        initRelatedMovies("watchRelatedGrid", movie.id);

    } catch (err) {
        console.error("Failed to load watch page:", err);
        if (watchTitle) watchTitle.textContent = "Stream Unavailable";
        if (playerStatusText) {
            playerStatusText.style.display = "block";
            playerStatusText.innerHTML = '<span style="color:#e57373;">Unable to load movie stream. Movie record not found.</span>';
        }
    }
}

/* RECOMMENDATIONS HELPER */
async function initRelatedMovies(targetGridId, currentMovieId) {
    const targetGrid = document.getElementById(targetGridId);
    if (!targetGrid) return;

    try {
        const res = await fetch("/api/movies?limit=12");
        if (!res.ok) return;
        const data = await res.json();
        const movies = (data.movies || []).filter(m => m.id !== currentMovieId).slice(0, 6);

        if (movies.length === 0) {
            targetGrid.innerHTML = `<div class="loading-state">No related movies available.</div>`;
            return;
        }

        targetGrid.innerHTML = "";
        movies.forEach(movie => {
            targetGrid.appendChild(createMovieCard(movie));
        });
    } catch (err) {
        targetGrid.innerHTML = "";
    }
}

/* SAVE WATCH HISTORY TO LOCAL STORAGE */
function saveToContinueWatching(movie) {
    try {
        const saved = localStorage.getItem("sanyuhub_continue_watching");
        let list = saved ? JSON.parse(saved) : [];
        list = list.filter(m => m.id !== movie.id);
        list.unshift(movie);
        list = list.slice(0, 10); // Keep last 10
        localStorage.setItem("sanyuhub_continue_watching", JSON.stringify(list));
    } catch (e) {
        console.error("LocalStorage save error:", e);
    }
}

/* BOTTOM NAVIGATION ACTIVE TAB HIGHLIGHTING */
function updateBottomNavActiveState() {
    const path = window.location.pathname.toLowerCase();
    const navItems = document.querySelectorAll(".bottom-nav-item");
    if (!navItems || navItems.length === 0) return;

    navItems.forEach(item => item.classList.remove("active"));

    if (path.startsWith("/live-tv")) {
        const channelsTab = document.getElementById("navChannels");
        if (channelsTab) channelsTab.classList.add("active");
    } else if (path.startsWith("/movies") || path.startsWith("/movie") || path.startsWith("/watch")) {
        const moviesTab = document.getElementById("navMovies");
        if (moviesTab) moviesTab.classList.add("active");
    } else if (
        path.startsWith("/more") ||
        path.startsWith("/series") ||
        path.startsWith("/popular-series") ||
        path.startsWith("/trending") ||
        path.startsWith("/popular") ||
        path.startsWith("/recently-added") ||
        path.startsWith("/featured") ||
        path.startsWith("/continue-watching")
    ) {
        const moreTab = document.getElementById("navMore");
        if (moreTab) moreTab.classList.add("active");
    } else {
        const homeTab = document.getElementById("navHome");
        if (homeTab) homeTab.classList.add("active");
    }
}

/* DOM INITIALIZATION */
document.addEventListener("DOMContentLoaded", () => {
    updateBottomNavActiveState();
    initHomePage();
    initSubpage("trendingGrid", true, 20);
    initSubpage("popularGrid", false, 24);
    initSubpage("featuredGrid", false, 24);
    initSubpage("recentlyAddedGrid", false, 24);
    initSubpage("seriesGrid", false, 24);
    initSubpage("popularSeriesGrid", false, 24);
    initContinueWatching();
    initMovieDetailsPage();
    initWatchPage();
    initSeriesDetailPage();
    initSeriesWatchPage();
    initLiveTvCatalogue();
    initLiveTvWatchPage();
});
