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
    },
    {
        id: "cartoon-network",
        aliases: ["cartoonnetwork", "cn"],
        name: "Cartoon Network",
        category: "kids",
        categoryLabel: "Animation & Kids Shows",
        logo: "/images/cartoon-network-logo.png",
        streamType: "hls",
        streamUrl: "https://vodzong.mjunoon.tv:8087/streamtest/cartoon-network-87/playlist.m3u8",
        embedUrl: "https://www.cartoonnetwork.com",
        meta: "Official Live Broadcast • HD • Cartoons & Animation",
        description: "Cartoon Network is home to top animated shows, classic cartoons, and kids entertainment."
    },
    {
        id: "baby-shark-tv",
        aliases: ["babysharktv", "baby-shark", "babyshark"],
        name: "Baby Shark TV",
        category: "kids",
        categoryLabel: "Children's Songs & Animation",
        logo: "/images/baby-shark-logo.png",
        streamType: "hls",
        streamUrl: "https://newidco-babysharktv-1-eu.rakuten.wurl.tv/playlist.m3u8",
        embedUrl: "https://www.pinkfong.com",
        meta: "Official Live Broadcast • HD • Kids & Nursery Rhymes",
        description: "Baby Shark TV features non-stop nursery rhymes, fun songs, educational animation, and kids entertainment."
    },
    {
        id: "pbs-kids-pacific",
        aliases: ["pbskids", "pbs-kids"],
        name: "PBS Kids Pacific",
        category: "kids",
        categoryLabel: "Educational & Kids TV",
        logo: "/images/pbs-kids-pacific-logo.png",
        streamType: "hls",
        streamUrl: "https://livestream.pbskids.org/out/v1/11f2e6b73eaa4887b3746cb863960e79/pst.m3u8",
        embedUrl: "https://pbskids.org",
        meta: "Official Live Broadcast • HD • Educational Shows",
        description: "PBS Kids Pacific delivers educational television, fun children's series, and inspiring programming."
    },
    {
        id: "telemundo",
        aliases: ["telemundo-pr"],
        name: "Telemundo",
        category: "entertainment",
        categoryLabel: "Spanish Series & News",
        logo: "/images/telemundo-logo.png",
        streamType: "hls",
        streamUrl: "https://nbculocallive.akamaized.net/hls/live/2037499/puertorico/stream1/master_1080.m3u8",
        embedUrl: "https://www.telemundo.com",
        meta: "Official Live Broadcast • HD • Spanish Entertainment",
        description: "Telemundo offers premier Spanish-language telenovelas, live news, reality TV, and entertainment."
    },
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
        description: "Dembe FM is Uganda's premier Luganda music and entertainment radio station."
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
        description: "Galaxy FM 100.2 Zzina is Uganda's leading youth urban music station."
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
        description: "Bukedde FM is Uganda's top Luganda radio station for news, talk shows, and local music."
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
        description: "XFM 94.8 is a Top 40 hit music radio station based in Kampala, Uganda."
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
        description: "Radio West is the leading radio station in Western Uganda."
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

    let selectedType = "tv"; // 'tv', 'radio', 'matches', 'crusades'
    let searchQuery = "";

    function renderCards() {
        cardGrid.innerHTML = "";

        const cleanSearch = searchQuery.trim().toLowerCase();
        let channels = LIVE_TV_CHANNELS;

        // Filter by channel type selector
        if (selectedType === "kids") {
            channels = channels.filter(ch => ch.category === "kids" || ch.type === "kids");
        } else if (selectedType === "radio") {
            channels = channels.filter(ch => ch.isRadio || ch.type === "radio" || ch.category === "radio");
        } else if (selectedType === "matches") {
            channels = channels.filter(ch => ch.type === "matches" || ch.category === "matches");
        } else if (selectedType === "crusades") {
            channels = channels.filter(ch => ch.type === "crusades" || ch.category === "crusades");
        } else {
            // Default: 'tv' - shows all TV channels
            channels = channels.filter(ch => !ch.isRadio && ch.type !== "radio" && ch.category !== "radio" && ch.category !== "matches" && ch.category !== "crusades" && ch.type !== "matches" && ch.type !== "crusades");
        }

        // Filter by search query
        if (cleanSearch) {
            channels = channels.filter(ch => ch.name.toLowerCase().includes(cleanSearch));
        }

        if (channels.length === 0) {
            if (selectedType === "kids") {
                cardGrid.innerHTML = `<div class="loading-state">No Children's TV channels available at the moment.</div>`;
            } else if (selectedType === "matches") {
                cardGrid.innerHTML = `<div class="loading-state">No live matches available at the moment.</div>`;
            } else if (selectedType === "crusades") {
                cardGrid.innerHTML = `<div class="loading-state">No crusades available at the moment.</div>`;
            } else if (selectedType === "radio") {
                cardGrid.innerHTML = `<div class="loading-state">No radio channels found.</div>`;
            } else {
                cardGrid.innerHTML = `<div class="loading-state">No TV channels found.</div>`;
            }
            return;
        }

        channels.forEach(ch => {
            cardGrid.appendChild(createChannelCard(ch, false));
        });
    }

    // Search bar input listener
    const searchInput = document.getElementById("channelSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            renderCards();
        });
    }

    // Channel type selector buttons (TV Channels, Radio Channels, Live Matches, Crusades)
    const typeSelectorContainer = document.getElementById("channelTypeSelector");
    if (typeSelectorContainer) {
        typeSelectorContainer.querySelectorAll(".category").forEach(btn => {
            btn.addEventListener("click", () => {
                typeSelectorContainer.querySelectorAll(".category").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                selectedType = btn.getAttribute("data-type") || "tv";
                renderCards();
            });
        });
    }

    renderCards();
}

/* Helper: Calculate current East Africa Time (EAT = UTC+3) */
function getEATTime() {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 3));
}

/* UNIFIED REUSABLE MEDIA PLAYER CONTROLLER SYSTEM */
function attachCustomPlayerController(config) {
    const {
        wrapper,
        videoPlayer,
        centralPlayBtn,
        unmuteBanner,
        loadingOverlay,
        loadingText,
        errorOverlay,
        errorTitle,
        errorMsg,
        retryBtn,
        controlsBar,
        rewindBtn,
        playPauseBtn,
        forwardBtn,
        progressContainer,
        progressFill,
        progressThumb,
        timeDisplay,
        muteBtn,
        volumeSlider,
        settingsBtn,
        settingsMenu,
        settingsCloseBtn,
        speedSettingsGroup,
        speedOptions,
        qualitySettingsGroup,
        qualitySelect,
        audioSettingsGroup,
        audioSelect,
        subtitleSettingsGroup,
        subtitleSelect,
        castBtn,
        castBtnText,
        pipBtn,
        fullscreenBtn,
        isLiveStream = false,
        liveStreamStatus = null,
        liveEdgeBtn = null,
        onRetry = null,
        mediaTitle = "SanyuHub Media"
    } = config;

    if (!videoPlayer) return null;

    let hlsInstance = null;
    let controlsTimeout = null;
    let isSeekingScrubbing = false;
    let isSeekableStream = !isLiveStream;
    let hasPlaybackStarted = false;
    let currentStreamUrl = null;

    function formatTime(seconds) {
        if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) {
            return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
        }
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    }

    function getBufferedAhead() {
        if (!videoPlayer || !videoPlayer.buffered || videoPlayer.buffered.length === 0) return 0;
        const ct = videoPlayer.currentTime;
        for (let i = 0; i < videoPlayer.buffered.length; i++) {
            const start = videoPlayer.buffered.start(i);
            const end = videoPlayer.buffered.end(i);
            if (ct >= start && ct <= end) {
                return Math.max(0, end - ct);
            }
        }
        return 0;
    }

    function showLoadingSpinner(msg = "Loading stream...") {
        if (errorOverlay) errorOverlay.style.display = "none";
        if (loadingOverlay) {
            loadingOverlay.style.display = "flex";
            if (loadingText && msg) loadingText.textContent = msg;
        }
    }

    function hideLoadingSpinner() {
        if (loadingOverlay) loadingOverlay.style.display = "none";
    }

    function showPlaybackError(title = "Stream Unavailable", msg = "The stream is currently unreachable.") {
        hideLoadingSpinner();
        if (errorOverlay) {
            if (errorTitle) errorTitle.textContent = title;
            if (errorMsg) errorMsg.textContent = msg;
            errorOverlay.style.display = "flex";
        }
    }

    function updatePlayPauseBtnUI(isPlaying) {
        if (playPauseBtn) {
            const iconPlay = playPauseBtn.querySelector(".icon-play");
            const iconPause = playPauseBtn.querySelector(".icon-pause");
            if (iconPlay && iconPause) {
                iconPlay.style.display = isPlaying ? "none" : "block";
                iconPause.style.display = isPlaying ? "block" : "none";
            }
        }
        if (centralPlayBtn) {
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
        if (muteBtn) {
            const iconHigh = muteBtn.querySelector(".icon-vol-high");
            const iconMute = muteBtn.querySelector(".icon-vol-mute");
            if (iconHigh && iconMute) {
                iconHigh.style.display = (isMuted || volume === 0) ? "none" : "block";
                iconMute.style.display = (isMuted || volume === 0) ? "block" : "none";
            }
        }
        if (volumeSlider && typeof volume === "number") {
            volumeSlider.value = isMuted ? 0 : volume;
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

        isSeekableStream = hasFiniteDuration || hasDvrWindow || !isLiveStream;

        if (rewindBtn) rewindBtn.style.display = isSeekableStream ? "flex" : "none";
        if (forwardBtn) forwardBtn.style.display = isSeekableStream ? "flex" : "none";
        if (speedSettingsGroup) speedSettingsGroup.style.display = isSeekableStream ? "flex" : "none";
        if (progressContainer) progressContainer.style.display = "flex";
        if (timeDisplay) timeDisplay.style.display = isSeekableStream ? "inline" : "none";
        if (liveStreamStatus) liveStreamStatus.style.display = isLiveStream && !hasFiniteDuration ? "flex" : "none";

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
        let percentage = 0;

        if (isFinite(duration) && duration > 0) {
            percentage = (currentTime / duration) * 100;
            if (timeDisplay) {
                timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
            }
        } else if (seekRange > 0) {
            percentage = Math.min(100, Math.max(0, ((currentTime - seekableStart) / seekRange) * 100));
            const liveDiff = seekableEnd - currentTime;
            if (timeDisplay) {
                if (liveDiff < 5) {
                    timeDisplay.textContent = "LIVE";
                } else {
                    timeDisplay.textContent = `-${formatTime(liveDiff)} DVR`;
                }
            }
        } else if (isLiveStream) {
            percentage = 100;
            if (timeDisplay) timeDisplay.textContent = "LIVE";
        }

        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (progressThumb) progressThumb.style.left = `${percentage}%`;
    }

    function seekToPercentage(percentage) {
        let duration = videoPlayer.duration;
        let seekableStart = 0;
        let seekableEnd = 0;

        if (videoPlayer.seekable && videoPlayer.seekable.length > 0) {
            seekableStart = videoPlayer.seekable.start(0);
            seekableEnd = videoPlayer.seekable.end(videoPlayer.seekable.length - 1);
        }

        const seekRange = seekableEnd - seekableStart;

        if (isFinite(duration) && duration > 0) {
            videoPlayer.currentTime = (percentage / 100) * duration;
        } else if (seekRange > 0) {
            videoPlayer.currentTime = seekableStart + (percentage / 100) * seekRange;
        }
    }

    function handleScrub(e) {
        if (!isSeekableStream || !progressContainer) return;

        const rect = progressContainer.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const offsetX = Math.min(rect.width, Math.max(0, clientX - rect.left));
        const percentage = (offsetX / rect.width) * 100;

        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (progressThumb) progressThumb.style.left = `${percentage}%`;

        seekToPercentage(percentage);
    }

    function resetControlsTimeout() {
        if (!controlsBar) return;
        controlsBar.classList.remove("controls-hidden");
        if (controlsTimeout) clearTimeout(controlsTimeout);

        if (!videoPlayer.paused) {
            controlsTimeout = setTimeout(() => {
                if (!videoPlayer.paused && !isSeekingScrubbing && (!settingsMenu || settingsMenu.style.display === "none")) {
                    controlsBar.classList.add("controls-hidden");
                }
            }, 3500);
        }
    }

    if (wrapper) {
        wrapper.addEventListener("mousemove", resetControlsTimeout);
        wrapper.addEventListener("touchstart", resetControlsTimeout, { passive: true });
        wrapper.addEventListener("mouseleave", () => {
            if (!videoPlayer.paused) {
                controlsBar.classList.add("controls-hidden");
            }
        });
    }

    if (centralPlayBtn) {
        centralPlayBtn.addEventListener("click", () => {
            if (videoPlayer.paused) {
                videoPlayer.play().catch(e => console.error("Play error:", e));
            } else {
                videoPlayer.pause();
            }
        });
    }

    if (unmuteBanner) {
        unmuteBanner.addEventListener("click", () => {
            videoPlayer.muted = false;
            unmuteBanner.style.display = "none";
            updateMuteBtnUI(false, videoPlayer.volume);
        });
    }

    if (retryBtn) {
        retryBtn.addEventListener("click", () => {
            if (typeof onRetry === "function") onRetry();
        });
    }

    if (rewindBtn) {
        rewindBtn.addEventListener("click", () => {
            let start = 0;
            if (videoPlayer.seekable && videoPlayer.seekable.length > 0) {
                start = videoPlayer.seekable.start(0);
            }
            videoPlayer.currentTime = Math.max(start, videoPlayer.currentTime - 10);
        });
    }

    if (forwardBtn) {
        forwardBtn.addEventListener("click", () => {
            let end = videoPlayer.duration;
            if (videoPlayer.seekable && videoPlayer.seekable.length > 0) {
                end = videoPlayer.seekable.end(videoPlayer.seekable.length - 1);
            }
            if (isFinite(end) && end > 0) {
                videoPlayer.currentTime = Math.min(end - 1, videoPlayer.currentTime + 10);
            } else {
                videoPlayer.currentTime += 10;
            }
        });
    }

    if (playPauseBtn) {
        playPauseBtn.addEventListener("click", () => {
            if (videoPlayer.paused) {
                videoPlayer.play().catch(e => console.error("Play error:", e));
            } else {
                videoPlayer.pause();
            }
        });
    }

    if (progressContainer) {
        progressContainer.addEventListener("mousedown", (e) => {
            isSeekingScrubbing = true;
            handleScrub(e);
        });

        window.addEventListener("mousemove", (e) => {
            if (isSeekingScrubbing) handleScrub(e);
        });

        window.addEventListener("mouseup", () => {
            if (isSeekingScrubbing) isSeekingScrubbing = false;
        });

        progressContainer.addEventListener("touchstart", (e) => {
            isSeekingScrubbing = true;
            handleScrub(e);
        }, { passive: true });

        window.addEventListener("touchmove", (e) => {
            if (isSeekingScrubbing) handleScrub(e);
        }, { passive: true });

        window.addEventListener("touchend", () => {
            if (isSeekingScrubbing) isSeekingScrubbing = false;
        });
    }

    if (muteBtn) {
        muteBtn.addEventListener("click", () => {
            videoPlayer.muted = !videoPlayer.muted;
            updateMuteBtnUI(videoPlayer.muted, videoPlayer.volume);
            if (!videoPlayer.muted && unmuteBanner) unmuteBanner.style.display = "none";
        });
    }

    if (volumeSlider) {
        volumeSlider.addEventListener("input", (e) => {
            const val = parseFloat(e.target.value);
            videoPlayer.volume = val;
            videoPlayer.muted = (val === 0);
            updateMuteBtnUI(videoPlayer.muted, val);
            if (val > 0 && unmuteBanner) unmuteBanner.style.display = "none";
        });
    }

    if (liveEdgeBtn) {
        liveEdgeBtn.addEventListener("click", () => {
            if (videoPlayer.seekable && videoPlayer.seekable.length > 0) {
                videoPlayer.currentTime = videoPlayer.seekable.end(videoPlayer.seekable.length - 1) - 0.5;
            }
        });
    }

    if (settingsBtn && settingsMenu) {
        settingsBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isVisible = settingsMenu.style.display !== "none";
            settingsMenu.style.display = isVisible ? "none" : "block";
            settingsBtn.setAttribute("aria-expanded", !isVisible ? "true" : "false");
        });

        if (settingsCloseBtn) {
            settingsCloseBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                settingsMenu.style.display = "none";
                settingsBtn.setAttribute("aria-expanded", "false");
            });
        }

        document.addEventListener("click", (e) => {
            if (settingsMenu.style.display !== "none" && !settingsMenu.contains(e.target) && e.target !== settingsBtn) {
                settingsMenu.style.display = "none";
                settingsBtn.setAttribute("aria-expanded", "false");
            }
        });
    }

    if (speedOptions) {
        speedOptions.querySelectorAll(".speed-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                speedOptions.querySelectorAll(".speed-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                const speed = parseFloat(btn.getAttribute("data-speed"));
                videoPlayer.playbackRate = speed;
            });
        });
    }

    if (qualitySelect) {
        qualitySelect.addEventListener("change", (e) => {
            const levelIndex = parseInt(e.target.value, 10);
            if (hlsInstance) hlsInstance.currentLevel = levelIndex;
        });
    }

    if (audioSelect) {
        audioSelect.addEventListener("change", (e) => {
            const trackIndex = parseInt(e.target.value, 10);
            if (hlsInstance) hlsInstance.audioTrack = trackIndex;
        });
    }

    if (subtitleSelect) {
        subtitleSelect.addEventListener("change", (e) => {
            const trackIndex = parseInt(e.target.value, 10);
            if (hlsInstance) hlsInstance.subtitleTrack = trackIndex;
        });
    }

    if (pipBtn) {
        pipBtn.addEventListener("click", async () => {
            try {
                if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture();
                } else if (document.pictureInPictureEnabled && videoPlayer) {
                    await videoPlayer.requestPictureInPicture();
                }
            } catch (err) {
                console.warn("Picture-in-Picture error:", err);
            }
        });
    }

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener("click", () => {
            const fsContainer = wrapper || videoPlayer;
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                if (fsContainer.requestFullscreen) {
                    fsContainer.requestFullscreen().catch(err => console.log("Fullscreen request failed:", err));
                } else if (fsContainer.webkitRequestFullscreen) {
                    fsContainer.webkitRequestFullscreen();
                }
                if (screen.orientation && screen.orientation.lock) {
                    screen.orientation.lock("landscape").catch(() => {});
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
                if (screen.orientation && screen.orientation.unlock) {
                    screen.orientation.unlock();
                }
            }
        });
    }

    if (castBtn) {
        window.__onGCastApiAvailable = function(isAvailable) {
            if (isAvailable && window.cast && window.cast.framework) {
                try {
                    const context = cast.framework.CastContext.getInstance();
                    context.setOptions({
                        receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
                        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
                    });

                    context.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, (event) => {
                        switch (event.sessionState) {
                            case cast.framework.SessionState.SESSION_STARTED:
                            case cast.framework.SessionState.SESSION_RESUMED:
                                if (castBtnText) castBtnText.textContent = "Connected to Cast Device";
                                if (currentStreamUrl) {
                                    const session = context.getCurrentSession();
                                    if (session) {
                                        const mediaInfo = new chrome.cast.media.MediaInfo(currentStreamUrl, "application/x-mpegurl");
                                        mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
                                        mediaInfo.metadata.title = mediaTitle;
                                        mediaInfo.streamType = isLiveStream ? chrome.cast.media.StreamType.LIVE : chrome.cast.media.StreamType.BUFFERED;
                                        session.loadMedia(new chrome.cast.media.LoadRequest(mediaInfo));
                                    }
                                }
                                break;
                            case cast.framework.SessionState.SESSION_ENDING:
                            case cast.framework.SessionState.SESSION_ENDED:
                                if (castBtnText) castBtnText.textContent = "Cast to Device";
                                break;
                            default:
                                break;
                        }
                    });
                } catch (e) {
                    console.warn("Cast init error:", e);
                }
            }
        };

        castBtn.addEventListener("click", async () => {
            if (window.cast && window.cast.framework) {
                try {
                    const context = cast.framework.CastContext.getInstance();
                    await context.requestSession();
                } catch (err) {
                    console.warn("Cast request cancelled or failed:", err);
                }
            } else if (navigator.remotePlayback && videoPlayer.remote) {
                try {
                    await videoPlayer.remote.prompt();
                } catch (err) {
                    console.warn("Remote playback error:", err);
                }
            } else {
                alert("Casting is not supported in this browser environment.");
            }
        });
    }

    videoPlayer.addEventListener("playing", () => {
        hasPlaybackStarted = true;
        hideLoadingSpinner();
        if (errorOverlay) errorOverlay.style.display = "none";
        updatePlayPauseBtnUI(true);
        updateSeekCapabilities();
        resetControlsTimeout();
    });

    videoPlayer.addEventListener("pause", () => {
        updatePlayPauseBtnUI(false);
        resetControlsTimeout();
    });

    videoPlayer.addEventListener("waiting", () => {
        showLoadingSpinner("Buffering stream...");
    });

    videoPlayer.addEventListener("stalled", () => {
        if (!videoPlayer.paused) showLoadingSpinner("Connecting...");
    });

    videoPlayer.addEventListener("timeupdate", () => {
        if (hasPlaybackStarted && !videoPlayer.paused && loadingOverlay && loadingOverlay.style.display !== "none") {
            hideLoadingSpinner();
        }
        updateTimeProgressUI();
    });

    videoPlayer.addEventListener("durationchange", updateSeekCapabilities);
    videoPlayer.addEventListener("loadedmetadata", updateSeekCapabilities);
    videoPlayer.addEventListener("error", (e) => {
        showPlaybackError("Stream Unavailable", "The media stream is currently unreachable.");
    });

    function loadSource(streamUrl, options = {}) {
        destroy();
        currentStreamUrl = streamUrl;
        hasPlaybackStarted = false;
        showLoadingSpinner(options.loadingMessage || "Connecting to stream...");

        videoPlayer.style.display = "block";

        const isHlsUrl = streamUrl && (streamUrl.includes(".m3u8") || options.isHls);

        if (isHlsUrl && window.Hls && Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: isLiveStream,
                maxBufferLength: 30,            // 30 seconds continuous forward buffer target
                maxMaxBufferLength: 60,         // 60 seconds maximum buffer cap
                maxBufferSize: 60 * 1024 * 1024, // 60MB max buffer size
                backBufferLength: 90
            });

            hlsInstance = hls;
            hls.loadSource(streamUrl);
            hls.attachMedia(videoPlayer);

            hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                if (qualitySelect && data.levels && data.levels.length > 1) {
                    qualitySelect.innerHTML = '<option value="-1">Auto Quality</option>';
                    data.levels.forEach((level, idx) => {
                        const opt = document.createElement("option");
                        opt.value = idx;
                        opt.textContent = level.height ? `${level.height}p` : `Quality ${idx + 1}`;
                        qualitySelect.appendChild(opt);
                    });
                    if (qualitySettingsGroup) qualitySettingsGroup.style.display = "flex";
                } else if (qualitySettingsGroup) {
                    qualitySettingsGroup.style.display = "none";
                }

                if (audioSelect && hls.audioTracks && hls.audioTracks.length > 1) {
                    audioSelect.innerHTML = "";
                    hls.audioTracks.forEach((track, idx) => {
                        const opt = document.createElement("option");
                        opt.value = idx;
                        opt.textContent = track.name || `Audio Track ${idx + 1}`;
                        audioSelect.appendChild(opt);
                    });
                    if (audioSettingsGroup) audioSettingsGroup.style.display = "flex";
                } else if (audioSettingsGroup) {
                    audioSettingsGroup.style.display = "none";
                }

                if (subtitleSelect && hls.subtitleTracks && hls.subtitleTracks.length > 0) {
                    subtitleSelect.innerHTML = '<option value="-1">Off</option>';
                    hls.subtitleTracks.forEach((track, idx) => {
                        const opt = document.createElement("option");
                        opt.value = idx;
                        opt.textContent = track.name || `Subtitles ${idx + 1}`;
                        subtitleSelect.appendChild(opt);
                    });
                    if (subtitleSettingsGroup) subtitleSettingsGroup.style.display = "flex";
                } else if (subtitleSettingsGroup) {
                    subtitleSettingsGroup.style.display = "none";
                }

                videoPlayer.play().then(() => {
                    hasPlaybackStarted = true;
                    hideLoadingSpinner();
                    updatePlayPauseBtnUI(true);
                }).catch(err => {
                    console.warn("Autoplay prevented, attempting muted playback...", err);
                    videoPlayer.muted = true;
                    updateMuteBtnUI(true, 0);
                    if (unmuteBanner) unmuteBanner.style.display = "inline-flex";

                    videoPlayer.play().then(() => {
                        hasPlaybackStarted = true;
                        hideLoadingSpinner();
                        updatePlayPauseBtnUI(true);
                    }).catch(e => {
                        console.warn("Muted autoplay rejected, user interaction required.", e);
                        hideLoadingSpinner();
                        updatePlayPauseBtnUI(false);
                    });
                });
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            showPlaybackError("Playback Error", data.type + " - " + data.details);
                            break;
                    }
                }
            });

        } else if (videoPlayer.canPlayType("application/vnd.apple.mpegurl") && isHlsUrl) {
            videoPlayer.src = streamUrl;
            videoPlayer.play().then(() => {
                hasPlaybackStarted = true;
                hideLoadingSpinner();
                updatePlayPauseBtnUI(true);
            }).catch(err => {
                videoPlayer.muted = true;
                updateMuteBtnUI(true, 0);
                if (unmuteBanner) unmuteBanner.style.display = "inline-flex";
                videoPlayer.play().then(() => {
                    hasPlaybackStarted = true;
                    hideLoadingSpinner();
                    updatePlayPauseBtnUI(true);
                }).catch(() => {
                    hideLoadingSpinner();
                    updatePlayPauseBtnUI(false);
                });
            });
        } else {
            videoPlayer.src = streamUrl;
            videoPlayer.play().then(() => {
                hasPlaybackStarted = true;
                hideLoadingSpinner();
                updatePlayPauseBtnUI(true);
            }).catch(() => {
                hideLoadingSpinner();
                updatePlayPauseBtnUI(false);
            });
        }
    }

    function destroy() {
        hasPlaybackStarted = false;
        if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
        }
        if (videoPlayer) {
            videoPlayer.pause();
            videoPlayer.removeAttribute("src");
            videoPlayer.load();
        }
        if (unmuteBanner) unmuteBanner.style.display = "none";
        if (settingsMenu) settingsMenu.style.display = "none";
    }

    return {
        loadSource,
        getBufferedAhead,
        destroy,
        showLoadingSpinner,
        hideLoadingSpinner,
        showPlaybackError
    };
}

/* LIVE TV WATCH PAGE */
let liveTvPlayerController = null;

function initLiveTvWatchPage() {
    const videoPlayer = document.getElementById("liveVideoPlayer");
    if (!videoPlayer) return;

    const playerSection = document.getElementById("liveTvPlayerSection");
    const notFoundSection = document.getElementById("channelNotFoundSection");
    const otherChannelsGrid = document.getElementById("otherChannelsGrid");

    const activeLogo = document.getElementById("activeChannelLogo");
    const activeName = document.getElementById("activeChannelName");
    const viewerCount = document.getElementById("viewerCount");

    const tabBtnEPG = document.getElementById("tabBtnEPG");
    const tabBtnInfo = document.getElementById("tabBtnInfo");
    const tabContentEPG = document.getElementById("tabContentEPG");
    const tabContentInfo = document.getElementById("tabContentInfo");

    const pathParts = window.location.pathname.split("/").filter(Boolean);
    let channelId = null;

    if (pathParts.length >= 3 && pathParts[0] === "live-tv" && pathParts[1] === "watch") {
        channelId = pathParts[2];
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        channelId = urlParams.get("channel");
    }

    const channel = findChannelById(channelId);

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

    document.title = `${channel.name} — Live TV — SanyuHub`;
    currentActiveChannel = channel;

    if (activeLogo) activeLogo.src = channel.logo;
    if (activeName) activeName.textContent = channel.name;

    async function fetchViewerCount() {
        if (!viewerCount) return;
        try {
            const res = await fetch(`/api/live-tv/viewers/${channel.id}`);
            if (res.ok) {
                const data = await res.json();
                if (data && typeof data.viewers === "number" && !isNaN(data.viewers)) {
                    if (data.viewers >= 1000) {
                        viewerCount.textContent = `${(data.viewers / 1000).toFixed(1)}K viewers`;
                    } else {
                        viewerCount.textContent = `${data.viewers} viewers`;
                    }
                } else {
                    viewerCount.textContent = "Viewers unavailable";
                }
            } else {
                viewerCount.textContent = "Viewers unavailable";
            }
        } catch (e) {
            viewerCount.textContent = "Viewers unavailable";
        }
    }
    fetchViewerCount();
    const viewerInterval = setInterval(fetchViewerCount, 30000);

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
                    <div class="epg-item ${isNowAiring ? "now-airing" : ""}">
                        <div class="epg-time-box">
                            <span class="epg-time">${item.start} - ${item.end}</span>
                            ${isNowAiring ? '<span class="now-badge"><span class="live-dot"></span> NOW AIRING</span>' : ""}
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
                    <p class="info-desc">${targetChannel.description || "Live television broadcast station."}</p>
                </div>
                <div class="info-meta-table">
                    <div class="info-meta-row">
                        <span class="info-meta-label">Channel Name:</span>
                        <span class="info-meta-val">${targetChannel.name}</span>
                    </div>
                    <div class="info-meta-row">
                        <span class="info-meta-label">Category:</span>
                        <span class="info-meta-val">${targetChannel.categoryLabel || "General Broadcast"}</span>
                    </div>
                    <div class="info-meta-row">
                        <span class="info-meta-label">Stream Type:</span>
                        <span class="info-meta-val">${targetChannel.isRadio ? "Live Radio Stream (Audio HD)" : "HLS Live Stream (HD 1080p)"}</span>
                    </div>
                    <div class="info-meta-row">
                        <span class="info-meta-label">Language:</span>
                        <span class="info-meta-val">${targetChannel.category === "news" ? "English & Luganda" : "Luganda & Regional"}</span>
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

    liveTvPlayerController = attachCustomPlayerController({
        wrapper: document.getElementById("liveVideoWrapper"),
        videoPlayer: videoPlayer,
        centralPlayBtn: document.getElementById("liveCentralPlayBtn"),
        unmuteBanner: document.getElementById("liveUnmuteBanner"),
        loadingOverlay: document.getElementById("liveLoadingOverlay"),
        loadingText: document.getElementById("liveLoadingText"),
        errorOverlay: document.getElementById("liveErrorOverlay"),
        errorTitle: document.getElementById("liveErrorTitle"),
        errorMsg: document.getElementById("liveErrorMsg"),
        retryBtn: document.getElementById("liveRetryBtn"),
        controlsBar: document.getElementById("liveControlsBar"),
        rewindBtn: document.getElementById("ctrlRewindBtn"),
        playPauseBtn: document.getElementById("ctrlPlayPauseBtn"),
        forwardBtn: document.getElementById("ctrlForwardBtn"),
        progressContainer: document.getElementById("ctrlProgressContainer"),
        progressFill: document.getElementById("ctrlProgressFill"),
        progressThumb: document.getElementById("ctrlProgressThumb"),
        timeDisplay: document.getElementById("ctrlTimeDisplay"),
        muteBtn: document.getElementById("ctrlMuteBtn"),
        volumeSlider: document.getElementById("ctrlVolumeSlider"),
        settingsBtn: document.getElementById("ctrlSettingsBtn"),
        settingsMenu: document.getElementById("ctrlSettingsMenu"),
        settingsCloseBtn: document.getElementById("settingsCloseBtn"),
        speedSettingsGroup: document.getElementById("speedSettingsGroup"),
        speedOptions: document.getElementById("speedOptions"),
        qualitySettingsGroup: document.getElementById("qualitySettingsGroup"),
        qualitySelect: document.getElementById("ctrlQualitySelect"),
        audioSettingsGroup: document.getElementById("audioSettingsGroup"),
        audioSelect: document.getElementById("ctrlAudioSelect"),
        subtitleSettingsGroup: document.getElementById("subtitleSettingsGroup"),
        subtitleSelect: document.getElementById("ctrlSubtitleSelect"),
        castBtn: document.getElementById("ctrlCastBtn"),
        castBtnText: document.getElementById("castBtnText"),
        pipBtn: document.getElementById("ctrlPipBtn"),
        fullscreenBtn: document.getElementById("ctrlFullscreenBtn"),
        isLiveStream: true,
        liveStreamStatus: document.getElementById("liveStreamStatus"),
        liveEdgeBtn: document.getElementById("liveEdgeBtn"),
        mediaTitle: channel.name,
        onRetry: () => {
            if (channel && liveTvPlayerController) {
                liveTvPlayerController.loadSource(channel.streamUrl, { isHls: channel.streamType === "hls" || channel.streamUrl.includes(".m3u8") });
            }
        }
    });

    window.addEventListener("beforeunload", () => {
        clearInterval(viewerInterval);
        if (liveTvPlayerController) liveTvPlayerController.destroy();
    });

    if (liveTvPlayerController) {
        liveTvPlayerController.loadSource(channel.streamUrl, {
            isHls: channel.streamType === "hls" || channel.streamUrl.includes(".m3u8"),
            loadingMessage: `Connecting to ${channel.name}...`
        });
    }
}


/* HERO CAROUSEL CONTROLLER */
function initHeroCarousel() {
    const carouselTrack = document.getElementById("carouselTrack");
    const slides = document.querySelectorAll(".carousel-slide");
    const prevBtn = document.getElementById("carouselPrev");
    const nextBtn = document.getElementById("carouselNext");
    const indicators = document.querySelectorAll("#carouselIndicators .indicator");

    if (!carouselTrack || slides.length === 0) return;

    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoPlayInterval = null;

    function goToSlide(index) {
        currentSlide = (index + totalSlides) % totalSlides;
        slides.forEach((slide, idx) => {
            slide.classList.toggle("active", idx === currentSlide);
        });
        indicators.forEach((ind, idx) => {
            ind.classList.toggle("active", idx === currentSlide);
        });
    }

    function startAutoPlay() {
        stopAutoPlay();
        autoPlayInterval = setInterval(() => {
            goToSlide(currentSlide + 1);
        }, 6000);
    }

    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            goToSlide(currentSlide - 1);
            startAutoPlay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            goToSlide(currentSlide + 1);
            startAutoPlay();
        });
    }

    indicators.forEach((ind, idx) => {
        ind.addEventListener("click", () => {
            goToSlide(idx);
            startAutoPlay();
        });
    });

    const carouselContainer = document.getElementById("heroCarousel");
    if (carouselContainer) {
        carouselContainer.addEventListener("mouseenter", stopAutoPlay);
        carouselContainer.addEventListener("mouseleave", startAutoPlay);
        carouselContainer.addEventListener("touchstart", stopAutoPlay, { passive: true });
        carouselContainer.addEventListener("touchend", startAutoPlay, { passive: true });
    }

    goToSlide(0);
    startAutoPlay();
}

/* HOMEPAGE DYNAMIC INTEGRATION */
async function initHomePage() {
    const homeLiveTvGrid = document.getElementById("homeLiveTvGrid");
    const homeTrendingGrid = document.getElementById("homeTrendingGrid");
    const homeMusicGrid = document.getElementById("homeMusicGrid");
    const homeConcertsGrid = document.getElementById("homeConcertsGrid");
    const homeRadioGrid = document.getElementById("homeRadioGrid");

    if (!homeLiveTvGrid && !homeTrendingGrid && !homeMusicGrid && !homeConcertsGrid && !homeRadioGrid) return;

    initHeroCarousel();

    // 1. Live TV Section (Up to 2 items)
    if (homeLiveTvGrid) {
        homeLiveTvGrid.innerHTML = "";
        const tvChannels = LIVE_TV_CHANNELS.filter(ch => !ch.isRadio && ch.category !== "radio").slice(0, 2);
        tvChannels.forEach(ch => {
            const card = document.createElement("a");
            card.href = `/live-tv/watch/${ch.id}/`;
            card.className = "live-card";
            card.innerHTML = `
                <img src="${ch.logo}" alt="${ch.name}" style="object-fit: contain; padding: 12px; background: #0d0d0d;">
                <div class="live-overlay">
                    <span class="live-badge"><span class="live-dot"></span> LIVE</span>
                    <div class="live-title">${ch.name}</div>
                </div>
            `;
            homeLiveTvGrid.appendChild(card);
        });
    }

    // 2. Trending Movies Section (Up to 2 items)
    if (homeTrendingGrid) {
        try {
            const res = await fetch("/api/movies?limit=10");
            if (res.ok) {
                const data = await res.json();
                const movies = (data.movies || []).slice(0, 2);
                homeTrendingGrid.innerHTML = "";
                movies.forEach((movie, idx) => {
                    homeTrendingGrid.appendChild(createTrendingCard(movie, idx + 1));
                });
            } else {
                homeTrendingGrid.innerHTML = `<div class="loading-state">Unable to load movies.</div>`;
            }
        } catch (err) {
            homeTrendingGrid.innerHTML = `<div class="loading-state">Unable to load movies.</div>`;
        }
    }

    // 3. Hot Music Section (Up to 2 items)
    if (homeMusicGrid) {
        homeMusicGrid.innerHTML = "";
        const musicItems = [
            {
                id: "trace-mziki-home",
                title: "Trace Mziki Live",
                vj: "East African Music",
                year: "2026",
                quality: "HD",
                posterUrl: "/images/tracemziki-logo.png",
                targetUrl: "/live-tv/watch/trace-mziki/"
            }
        ];
        musicItems.slice(0, 2).forEach(m => {
            const card = document.createElement("article");
            card.className = "movie-card";
            card.style.cursor = "pointer";
            card.innerHTML = `
                <div class="poster" style="background:#0d0d0d; display:flex; align-items:center; justify-content:center;">
                    <img src="${m.posterUrl}" alt="${m.title}" style="object-fit:contain; padding:12px;">
                    <span class="badge">${m.quality}</span>
                </div>
                <div class="card-title" title="${m.title}">${m.title}</div>
                <div class="card-meta">${m.vj} • ${m.year}</div>
            `;
            card.addEventListener("click", () => {
                window.location.href = m.targetUrl;
            });
            homeMusicGrid.appendChild(card);
        });
    }

    // 4. Concerts Section (Up to 2 items)
    if (homeConcertsGrid) {
        try {
            const res = await fetch("/api/movies?limit=20");
            if (res.ok) {
                const data = await res.json();
                const concertMovies = (data.movies || []).slice(2, 4);
                homeConcertsGrid.innerHTML = "";
                if (concertMovies.length > 0) {
                    concertMovies.forEach(movie => {
                        homeConcertsGrid.appendChild(createMovieCard(movie));
                    });
                } else {
                    homeConcertsGrid.innerHTML = `<div class="loading-state">No concerts available.</div>`;
                }
            } else {
                homeConcertsGrid.innerHTML = `<div class="loading-state">No concerts available.</div>`;
            }
        } catch (err) {
            homeConcertsGrid.innerHTML = `<div class="loading-state">No concerts available.</div>`;
        }
    }

    // 5. Doppest Radio Stations Section (Up to 2 items)
    if (homeRadioGrid) {
        homeRadioGrid.innerHTML = "";
        const radioChannels = LIVE_TV_CHANNELS.filter(ch => ch.isRadio || ch.category === "radio").slice(0, 2);
        radioChannels.forEach(ch => {
            const card = document.createElement("a");
            card.href = `/live-tv/watch/${ch.id}/`;
            card.className = "live-card";
            card.innerHTML = `
                <img src="${ch.logo}" alt="${ch.name}" style="object-fit: contain; padding: 12px; background: #0d0d0d;">
                <div class="live-overlay">
                    <span class="live-badge"><span class="live-dot"></span> RADIO</span>
                    <div class="live-title">${ch.name}</div>
                </div>
            `;
            homeRadioGrid.appendChild(card);
        });
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

/* CATALOGUE / UNIFIED LIBRARY PAGE (/movies) INTEGRATION */
const movieCardGrid = document.getElementById("movieCardGrid");
const vjCategoriesContainer = document.getElementById("vjCategories");
const genreFilterSelect = document.getElementById("genreFilterSelect");
const sortFilterSelect = document.getElementById("sortFilterSelect");
const paginationControls = document.getElementById("paginationControls");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageInfoSpan = document.getElementById("pageInfoSpan");
const movieSearchInput = document.getElementById("movieSearchInput");
const libraryCategorySelector = document.getElementById("libraryCategorySelector");

if (movieCardGrid) {
    const urlParams = new URLSearchParams(window.location.search);
    let activeCategory = (urlParams.get("category") || "movies").toLowerCase();
    if (!["movies", "series", "music", "concerts"].includes(activeCategory)) {
        activeCategory = "movies";
    }

    let currentPage = parseInt(urlParams.get("page"), 10) || 1;
    let currentLimit = 24;
    let currentVj = urlParams.get("vj") || "all";
    let currentGenre = urlParams.get("genre") || "all";
    let currentSort = urlParams.get("sort") || "recently-added";
    let currentSearch = urlParams.get("search") || "";
    let searchDebounceTimer = null;

    if (movieSearchInput) {
        if (currentSearch) movieSearchInput.value = currentSearch;
        updateSearchPlaceholder();
    }

    function updateSearchPlaceholder() {
        if (!movieSearchInput) return;
        if (activeCategory === "series") {
            movieSearchInput.placeholder = "Search series by title, VJ, overview...";
            movieSearchInput.setAttribute("aria-label", "Search series");
        } else if (activeCategory === "music") {
            movieSearchInput.placeholder = "Search music by title, artist, album...";
            movieSearchInput.setAttribute("aria-label", "Search music");
        } else if (activeCategory === "concerts") {
            movieSearchInput.placeholder = "Search concerts by event, performer, location...";
            movieSearchInput.setAttribute("aria-label", "Search concerts");
        } else {
            movieSearchInput.placeholder = "Search movies by title, VJ, synopsis...";
            movieSearchInput.setAttribute("aria-label", "Search movies");
        }
    }

    function syncCategoryButtonsUI() {
        if (!libraryCategorySelector) return;
        libraryCategorySelector.querySelectorAll(".category").forEach(btn => {
            const cat = (btn.getAttribute("data-category") || "movies").toLowerCase();
            if (cat === activeCategory) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });
        if (vjCategoriesContainer) {
            vjCategoriesContainer.style.display = (activeCategory === "movies") ? "flex" : "none";
        }
        updateSearchPlaceholder();
    }

    function updateUrlState() {
        const params = new URLSearchParams();
        params.set("category", activeCategory);
        if (currentPage > 1) params.set("page", currentPage);
        if (currentSearch) params.set("search", currentSearch);
        if (currentGenre && currentGenre !== "all") params.set("genre", currentGenre);
        if (currentSort && currentSort !== "recently-added") params.set("sort", currentSort);
        if (activeCategory === "movies" && currentVj && currentVj !== "all") params.set("vj", currentVj);

        const newRelativePathQuery = window.location.pathname + '?' + params.toString();
        window.history.replaceState(null, '', newRelativePathQuery);
    }

    async function fetchAndRenderCatalogue() {
        updateUrlState();
        movieCardGrid.innerHTML = '<div class="loading-state">Loading SanyuHub Library...</div>';

        if (activeCategory === "series") {
            await fetchAndRenderLibrarySeries();
        } else if (activeCategory === "music") {
            await fetchAndRenderLibraryMusic();
        } else if (activeCategory === "concerts") {
            await fetchAndRenderLibraryConcerts();
        } else {
            await fetchAndRenderLibraryMovies();
        }
    }

    async function fetchAndRenderLibraryMovies() {
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

            updateGenreOptions(data.genres || []);

            if (movies.length === 0) {
                movieCardGrid.innerHTML = '<div class="loading-state">No movies found matching your request.</div>';
                if (paginationControls) paginationControls.style.display = "none";
                return;
            }

            movieCardGrid.innerHTML = "";
            movies.forEach(movie => {
                movieCardGrid.appendChild(createMovieCard(movie));
            });

            renderPagination(data.page, data.totalPages, data.total, "movies");

        } catch (err) {
            console.error("Failed to load movie catalogue:", err);
            movieCardGrid.innerHTML = '<div class="error-state">Unable to load movie catalogue. Please try again later.</div>';
            if (paginationControls) paginationControls.style.display = "none";
        }
    }

    async function fetchAndRenderLibrarySeries() {
        try {
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: currentLimit
            });
            if (currentGenre && currentGenre !== "all") queryParams.append("genre", currentGenre);
            if (currentSort) queryParams.append("sort", currentSort);
            if (currentSearch) queryParams.append("search", currentSearch);

            const res = await fetch(`/api/series?${queryParams.toString()}`);
            if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);

            const data = await res.json();
            const seriesList = data.series || [];

            updateGenreOptions(data.genres || []);

            if (seriesList.length === 0) {
                movieCardGrid.innerHTML = '<div class="loading-state">No series found matching your request.</div>';
                if (paginationControls) paginationControls.style.display = "none";
                return;
            }

            movieCardGrid.innerHTML = "";
            seriesList.forEach(series => {
                movieCardGrid.appendChild(createSeriesCard(series));
            });

            renderPagination(data.page, data.totalPages, data.total, "series");

        } catch (err) {
            console.error("Failed to load series catalogue:", err);
            movieCardGrid.innerHTML = '<div class="error-state">Unable to load series catalogue. Please try again later.</div>';
            if (paginationControls) paginationControls.style.display = "none";
        }
    }

    async function fetchAndRenderLibraryMusic() {
        try {
            const MUSIC_RECORDS = [
                {
                    id: "trace-mziki-music",
                    title: "Trace Mziki Live Broadcast",
                    vj: "East African Music",
                    year: "2026",
                    quality: "HD",
                    posterUrl: "/images/tracemziki-logo.png",
                    streamUrl: "https://channels.trace.plus/Traceprod/MZIKI_hd/index.m3u8",
                    targetUrl: "/live-tv/watch/trace-mziki/"
                }
            ];

            let filtered = MUSIC_RECORDS;
            if (currentSearch) {
                const searchLower = currentSearch.toLowerCase();
                filtered = filtered.filter(m =>
                    (m.title && m.title.toLowerCase().includes(searchLower)) ||
                    (m.vj && m.vj.toLowerCase().includes(searchLower))
                );
            }

            if (filtered.length === 0) {
                movieCardGrid.innerHTML = currentSearch ?
                    '<div class="loading-state">No music found matching your request.</div>' :
                    '<div class="loading-state">No music content available at the moment.</div>';
                if (paginationControls) paginationControls.style.display = "none";
                return;
            }

            movieCardGrid.innerHTML = "";
            filtered.forEach(m => {
                const card = document.createElement("article");
                card.className = "movie-card";
                card.style.cursor = "pointer";
                card.innerHTML = `
                    <div class="poster">
                        <img src="${m.posterUrl}" alt="${m.title}">
                        <span class="badge">${m.quality}</span>
                    </div>
                    <div class="card-title" title="${m.title}">${m.title}</div>
                    <div class="card-meta">${m.vj} • ${m.year}</div>
                `;
                card.addEventListener("click", () => {
                    window.location.href = m.targetUrl;
                });
                movieCardGrid.appendChild(card);
            });

            if (paginationControls) paginationControls.style.display = "none";

        } catch (err) {
            console.error("Failed to load music content:", err);
            movieCardGrid.innerHTML = '<div class="error-state">Unable to load music content.</div>';
            if (paginationControls) paginationControls.style.display = "none";
        }
    }

    async function fetchAndRenderLibraryConcerts() {
        try {
            let concerts = [];
            if (currentSearch) {
                const searchLower = currentSearch.toLowerCase();
                concerts = concerts.filter(c =>
                    (c.title && c.title.toLowerCase().includes(searchLower)) ||
                    (c.performer && c.performer.toLowerCase().includes(searchLower))
                );
            }

            if (concerts.length === 0) {
                movieCardGrid.innerHTML = currentSearch ?
                    '<div class="loading-state">No concerts found matching your request.</div>' :
                    '<div class="loading-state">No concerts available at the moment.</div>';
                if (paginationControls) paginationControls.style.display = "none";
                return;
            }

            movieCardGrid.innerHTML = "";
            concerts.forEach(c => {
                movieCardGrid.appendChild(createMovieCard(c));
            });

            if (paginationControls) paginationControls.style.display = "none";

        } catch (err) {
            console.error("Failed to load concert content:", err);
            movieCardGrid.innerHTML = '<div class="error-state">Unable to load concert content.</div>';
            if (paginationControls) paginationControls.style.display = "none";
        }
    }

    function updateGenreOptions(genresList) {
        if (!genreFilterSelect) return;
        const selectedValue = genreFilterSelect.value;
        genreFilterSelect.innerHTML = '<option value="all">All Genres</option>';
        genresList.forEach(g => {
            const opt = document.createElement("option");
            opt.value = g;
            opt.textContent = g;
            if (g.toLowerCase() === selectedValue.toLowerCase()) {
                opt.selected = true;
            }
            genreFilterSelect.appendChild(opt);
        });
    }

    function renderPagination(page, totalPages, total, itemLabel) {
        if (!paginationControls) return;
        if (totalPages > 1) {
            paginationControls.style.display = "flex";
            if (pageInfoSpan) pageInfoSpan.textContent = `Page ${page} of ${totalPages} (${total} ${itemLabel})`;
            if (prevPageBtn) prevPageBtn.disabled = (page <= 1);
            if (nextPageBtn) nextPageBtn.disabled = (page >= totalPages);
        } else {
            paginationControls.style.display = "none";
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

    if (libraryCategorySelector) {
        libraryCategorySelector.querySelectorAll(".category").forEach(btn => {
            btn.addEventListener("click", () => {
                const cat = (btn.getAttribute("data-category") || "movies").toLowerCase();
                if (cat === activeCategory) return;

                activeCategory = cat;
                currentPage = 1;
                syncCategoryButtonsUI();
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

    syncCategoryButtonsUI();
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
let seriesPlayerController = null;

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

        const vjVal = document.getElementById("seriesWatchVjVal");
        const qualVal = document.getElementById("seriesWatchQualityVal");
        const fmtVal = document.getElementById("seriesWatchFormatVal");
        const catVal = document.getElementById("seriesWatchCategoryVal");
        if (vjVal) vjVal.textContent = currentEpisode.vj || "Luganda VJ";
        if (qualVal) qualVal.textContent = currentEpisode.quality || "HD";
        if (fmtVal) fmtVal.textContent = (currentEpisode.format || "mp4").toUpperCase();
        if (catVal) catVal.textContent = parentSeries.category || "Luganda Series";

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

        seriesPlayerController = attachCustomPlayerController({
            wrapper: document.getElementById("seriesVideoWrapper"),
            videoPlayer: player,
            centralPlayBtn: document.getElementById("seriesCentralPlayBtn"),
            unmuteBanner: document.getElementById("seriesUnmuteBanner"),
            loadingOverlay: document.getElementById("seriesLoadingOverlay"),
            loadingText: document.getElementById("seriesLoadingText"),
            errorOverlay: document.getElementById("seriesErrorOverlay"),
            errorTitle: document.getElementById("seriesErrorTitle"),
            errorMsg: document.getElementById("seriesErrorMsg"),
            retryBtn: document.getElementById("seriesRetryBtn"),
            controlsBar: document.getElementById("seriesControlsBar"),
            rewindBtn: document.getElementById("seriesCtrlRewindBtn"),
            playPauseBtn: document.getElementById("seriesCtrlPlayPauseBtn"),
            forwardBtn: document.getElementById("seriesCtrlForwardBtn"),
            progressContainer: document.getElementById("seriesCtrlProgressContainer"),
            progressFill: document.getElementById("seriesCtrlProgressFill"),
            progressThumb: document.getElementById("seriesCtrlProgressThumb"),
            timeDisplay: document.getElementById("seriesCtrlTimeDisplay"),
            muteBtn: document.getElementById("seriesCtrlMuteBtn"),
            volumeSlider: document.getElementById("seriesCtrlVolumeSlider"),
            settingsBtn: document.getElementById("seriesCtrlSettingsBtn"),
            settingsMenu: document.getElementById("seriesCtrlSettingsMenu"),
            settingsCloseBtn: document.getElementById("seriesSettingsCloseBtn"),
            speedSettingsGroup: document.getElementById("seriesSpeedSettingsGroup"),
            speedOptions: document.getElementById("seriesSpeedOptions"),
            qualitySettingsGroup: document.getElementById("seriesQualitySettingsGroup"),
            qualitySelect: document.getElementById("seriesCtrlQualitySelect"),
            audioSettingsGroup: document.getElementById("seriesAudioSettingsGroup"),
            audioSelect: document.getElementById("seriesCtrlAudioSelect"),
            subtitleSettingsGroup: document.getElementById("seriesSubtitleSettingsGroup"),
            subtitleSelect: document.getElementById("seriesCtrlSubtitleSelect"),
            castBtn: document.getElementById("seriesCtrlCastBtn"),
            castBtnText: document.getElementById("seriesCastBtnText"),
            pipBtn: document.getElementById("seriesCtrlPipBtn"),
            fullscreenBtn: document.getElementById("seriesCtrlFullscreenBtn"),
            isLiveStream: false,
            mediaTitle: `${parentSeries.title} S${currentEpisode.season}E${currentEpisode.episode}`,
            onRetry: () => {
                if (currentEpisode && currentEpisode.mediaUrl && seriesPlayerController) {
                    seriesPlayerController.loadSource(currentEpisode.mediaUrl, { isHls: currentEpisode.mediaUrl.includes('.m3u8') });
                }
            }
        });

        if (seriesPlayerController && currentEpisode.mediaUrl) {
            seriesPlayerController.loadSource(currentEpisode.mediaUrl, {
                isHls: currentEpisode.mediaUrl.includes('.m3u8') || (currentEpisode.format && currentEpisode.format.toUpperCase() === 'HLS'),
                loadingMessage: `Loading ${parentSeries.title} S${currentEpisode.season}E${currentEpisode.episode}...`
            });
        }

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
    const mainContainer = document.getElementById("movieDetailPage");
    if (!mainContainer) return;

    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const movieId = pathParts[pathParts.length - 1];

    if (!movieId || movieId === "movie") {
        mainContainer.innerHTML = `<div class="error-state" style="padding: 120px 20px; text-align: center;">
            <h2>Movie Not Specified</h2>
            <p style="margin-top: 10px;"><a href="/movies" class="btn-back-secondary">Return to Library</a></p>
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

        const genreBadges = (movie.genres && movie.genres.length > 0)
            ? movie.genres.map(g => `<span class="series-badge" style="background:#333;">${g}</span>`).join(" ")
            : `<span class="series-badge" style="background:#333;">Action</span>`;

        mainContainer.innerHTML = `
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
                            <span>• ${(movie.format || 'mp4').toUpperCase()}</span>
                        </div>
                        <div class="movie-detail-meta">
                            ${genreBadges}
                        </div>
                        <p class="movie-detail-overview">
                            ${movie.overview || `Watch <strong>${movie.title}</strong> translated in Luganda by <strong>${movie.vj || 'Luganda VJ'}</strong> on SanyuHub.`}
                        </p>
                        <div class="movie-detail-actions">
                            <a href="/watch/${movie.id}" class="btn-watch-primary" style="padding: 12px 28px; font-size: 1rem; border-radius: 8px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; background: #e50914; color: #fff; text-decoration: none;">
                                &#9654; Watch Movie Now
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        initRelatedMovies("relatedMoviesGrid", movie.id);

    } catch (err) {
        console.error("Failed to load movie details:", err);
        mainContainer.innerHTML = `
            <div class="error-state" style="padding: 120px 20px; text-align: center;">
                <h2>Movie Not Found</h2>
                <p style="margin-top: 10px; color: #888;">The movie record you requested could not be found.</p>
                <p style="margin-top: 20px;"><a href="/movies" class="btn-back-secondary">Return to Library</a></p>
            </div>
        `;
    }
}

/* WATCH PAGE INTEGRATION */
let moviePlayerController = null;

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

        const watchVjVal = document.getElementById("watchVjVal");
        const watchQualityVal = document.getElementById("watchQualityVal");
        const watchFormatVal = document.getElementById("watchFormatVal");
        const watchCategoryVal = document.getElementById("watchCategoryVal");
        if (watchVjVal) watchVjVal.textContent = movie.vj || "Luganda VJ";
        if (watchQualityVal) watchQualityVal.textContent = movie.quality || "HD";
        if (watchFormatVal) watchFormatVal.textContent = (movie.format || "mp4").toUpperCase();
        if (watchCategoryVal) watchCategoryVal.textContent = movie.category || "Luganda";

        moviePlayerController = attachCustomPlayerController({
            wrapper: document.getElementById("movieVideoWrapper"),
            videoPlayer: moviePlayer,
            centralPlayBtn: document.getElementById("movieCentralPlayBtn"),
            unmuteBanner: document.getElementById("movieUnmuteBanner"),
            loadingOverlay: document.getElementById("movieLoadingOverlay"),
            loadingText: document.getElementById("movieLoadingText"),
            errorOverlay: document.getElementById("movieErrorOverlay"),
            errorTitle: document.getElementById("movieErrorTitle"),
            errorMsg: document.getElementById("movieErrorMsg"),
            retryBtn: document.getElementById("movieRetryBtn"),
            controlsBar: document.getElementById("movieControlsBar"),
            rewindBtn: document.getElementById("movieCtrlRewindBtn"),
            playPauseBtn: document.getElementById("movieCtrlPlayPauseBtn"),
            forwardBtn: document.getElementById("movieCtrlForwardBtn"),
            progressContainer: document.getElementById("movieCtrlProgressContainer"),
            progressFill: document.getElementById("movieCtrlProgressFill"),
            progressThumb: document.getElementById("movieCtrlProgressThumb"),
            timeDisplay: document.getElementById("movieCtrlTimeDisplay"),
            muteBtn: document.getElementById("movieCtrlMuteBtn"),
            volumeSlider: document.getElementById("movieCtrlVolumeSlider"),
            settingsBtn: document.getElementById("movieCtrlSettingsBtn"),
            settingsMenu: document.getElementById("movieCtrlSettingsMenu"),
            settingsCloseBtn: document.getElementById("movieSettingsCloseBtn"),
            speedSettingsGroup: document.getElementById("movieSpeedSettingsGroup"),
            speedOptions: document.getElementById("movieSpeedOptions"),
            qualitySettingsGroup: document.getElementById("movieQualitySettingsGroup"),
            qualitySelect: document.getElementById("movieCtrlQualitySelect"),
            audioSettingsGroup: document.getElementById("movieAudioSettingsGroup"),
            audioSelect: document.getElementById("movieCtrlAudioSelect"),
            subtitleSettingsGroup: document.getElementById("movieSubtitleSettingsGroup"),
            subtitleSelect: document.getElementById("movieCtrlSubtitleSelect"),
            castBtn: document.getElementById("movieCtrlCastBtn"),
            castBtnText: document.getElementById("movieCastBtnText"),
            pipBtn: document.getElementById("movieCtrlPipBtn"),
            fullscreenBtn: document.getElementById("movieCtrlFullscreenBtn"),
            isLiveStream: false,
            mediaTitle: movie.title,
            onRetry: () => {
                if (movie && movie.mediaUrl && moviePlayerController) {
                    moviePlayerController.loadSource(movie.mediaUrl, { isHls: movie.mediaUrl.includes('.m3u8') });
                }
            }
        });

        if (moviePlayerController && movie.mediaUrl) {
            moviePlayerController.loadSource(movie.mediaUrl, {
                isHls: movie.mediaUrl.includes('.m3u8') || (movie.format && movie.format.toUpperCase() === 'HLS'),
                loadingMessage: `Loading ${movie.title}...`
            });
        } else if (movie.externalUrl && moviePlayerController) {
            moviePlayerController.showPlaybackError("Externally Hosted", `<p style="color:#ffcc00; margin-bottom: 15px;">This movie is hosted externally on ${movie.source || 'provider'}.</p><a href="${movie.externalUrl}" target="_blank" rel="noopener noreferrer" class="btn-watch-primary" style="display: inline-block;">Open External Viewing Page</a>`);
        }

        saveToContinueWatching(movie);
        initRelatedMovies("watchRelatedGrid", movie.id);

    } catch (err) {
        console.error("Failed to load watch page:", err);
        if (watchTitle) watchTitle.textContent = "Stream Unavailable";
        if (moviePlayerController) {
            moviePlayerController.showPlaybackError("Movie Not Found", "Unable to load movie stream. Movie record not found.");
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
