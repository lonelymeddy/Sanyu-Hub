/* NAVBAR + SIDEBAR SCROLL BEHAVIOR */

const navbar = document.getElementById("navbar");
const sidebar = document.getElementById("sidebar");

let lastScrollY = window.scrollY;
let scrollTimer = null;
let scrollTicking = false;

function showNavigation(){

    navbar.classList.remove("nav-hidden");

    /*
     * Keep the sidebar visible if it was already open.
     */

    if(sidebar && sidebar.classList.contains("active")){

        sidebar.classList.add("active");

    }

}

function hideNavigation(){

    /*
     * If the sidebar is open, keep the navbar
     * and sidebar visible so they remain usable.
     */

    if(sidebar && !sidebar.classList.contains("active")){

        navbar.classList.add("nav-hidden");

    }else if (navbar) {

        navbar.classList.remove("nav-hidden");

    }

}

function handleNavigationScroll(){

    const currentScrollY = window.scrollY;

    /*
     * Always show at the very top.
     */

    if(currentScrollY <= 5){

        showNavigation();

    }

    /*
     * Scrolling downward.
     */

    else if(currentScrollY > lastScrollY){

        hideNavigation();

    }

    /*
     * Scrolling upward.
     */

    else if(currentScrollY < lastScrollY){

        showNavigation();

    }

    lastScrollY = currentScrollY;

    /*
     * When scrolling stops, always bring
     * the navigation back.
     */

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


/* RETURN NAVIGATION WHEN TOUCH SCROLL ENDS */

window.addEventListener("touchend",function(){

    clearTimeout(scrollTimer);

    scrollTimer = setTimeout(function(){

        showNavigation();

    },180);

},{passive:true});


/* RETURN NAVIGATION AFTER WHEEL INPUT STOPS */

window.addEventListener("wheel",function(){

    clearTimeout(scrollTimer);

    scrollTimer = setTimeout(function(){

        showNavigation();

    },180);

},{passive:true});


/* RETURN NAVIGATION AFTER KEYBOARD SCROLLING */

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


/* SIDEBAR */

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


/* HAMBURGER */

if (menuButton) {
    menuButton.addEventListener("click",function(){

        if(sidebar && sidebar.classList.contains("active")){

            closeSidebar();

        }else{

            openSidebar();

        }

    });
}


/* CLICK OUTSIDE */

if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click",function(){

        closeSidebar();

    });
}


/* ESCAPE */

document.addEventListener("keydown",function(event){

    if(event.key === "Escape"){

        closeSidebar();

    }

});


/* MAIN FEATURES + SMALLER FEATURES */

document.querySelectorAll(".has-submenu").forEach(function(link){

    link.addEventListener("click",function(event){

        event.preventDefault();

        const submenu = link.nextElementSibling;

        if(!submenu){

            return;

        }

        const isOpen = submenu.classList.contains("open");

        document.querySelectorAll(".sidebar-submenu").forEach(function(menu){

            if(menu !== submenu){

                menu.classList.remove("open");

            }

        });

        document.querySelectorAll(".has-submenu").forEach(function(item){

            if(item !== link){

                item.classList.remove("expanded");

            }

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


/* NORMAL SIDEBAR LINKS */

document.querySelectorAll(".sidebar-link:not(.has-submenu)").forEach(function(link){

    link.addEventListener("click",function(){

        document.querySelectorAll(".sidebar-link").forEach(function(item){

            item.classList.remove("active");

        });

        link.classList.add("active");

        closeSidebar();

    });

});


/* SMALLER FEATURES */

document.querySelectorAll(".sidebar-submenu a").forEach(function(link){

    link.addEventListener("click",function(){

        closeSidebar();

    });

});


/* CATEGORY BUTTONS (Static elements) */

document.querySelectorAll(".category:not([data-vj])").forEach(function(category){

    category.addEventListener("click",function(){

        document.querySelectorAll(".category").forEach(function(item){

            item.classList.remove("active");

        });

        category.classList.add("active");

    });

});


/* HERO BUTTONS */

const exploreBtn = document.getElementById("exploreButton");
if (exploreBtn) {

    exploreBtn.addEventListener("click",function(){

        const target = document.getElementById("popular-movies");

        if (target) {

            target.scrollIntoView({

                behavior:"smooth"

            });

        }

    });

}

const categoriesBtn = document.getElementById("categoriesButton");
if (categoriesBtn) {

    categoriesBtn.addEventListener("click",function(){

        const target = document.getElementById("categories");

        if (target) {

            target.scrollIntoView({

                behavior:"smooth"

            });

        }

    });

}


/* SEARCH BUTTON */

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

/* DYNAMIC MOVIE CATALOGUE INTEGRATION */
const movieCardGrid = document.getElementById("movieCardGrid");
const vjCategoriesContainer = document.getElementById("vjCategories");
const paginationControls = document.getElementById("paginationControls");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageInfoSpan = document.getElementById("pageInfoSpan");
const movieSearchInput = document.getElementById("movieSearchInput");

if (movieCardGrid) {
  let currentPage = 1;
  let currentLimit = 24;
  let currentVj = "all";
  let currentSearch = "";
  let searchDebounceTimer = null;

  async function fetchAndRenderMovies() {
    movieCardGrid.innerHTML = '<div class="loading-state">Loading SanyuHub movie catalogue...</div>';

    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: currentLimit
      });
      if (currentVj && currentVj !== "all") {
        queryParams.append("vj", currentVj);
      }
      if (currentSearch) {
        queryParams.append("search", currentSearch);
      }

      const res = await fetch(`/api/movies?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const movies = data.movies || [];

      // Render VJ categories once if available
      if (data.vjs && data.vjs.length > 0 && vjCategoriesContainer && vjCategoriesContainer.children.length <= 1) {
        renderVjCategoryButtons(data.vjs);
      }

      if (movies.length === 0) {
        movieCardGrid.innerHTML = '<div class="loading-state">No movies found matching your request.</div>';
        if (paginationControls) paginationControls.style.display = "none";
        return;
      }

      movieCardGrid.innerHTML = "";
      movies.forEach(movie => {
        const card = document.createElement("article");
        card.className = "movie-card";
        card.setAttribute("data-id", movie.id);

        const posterDiv = document.createElement("div");
        posterDiv.className = "poster";

        const img = document.createElement("img");
        img.src = movie.posterUrl || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=80";
        img.alt = movie.title || "Movie Poster";
        img.loading = "lazy";
        img.onerror = function() {
          this.onerror = null;
          this.src = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=80";
        };

        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = movie.quality || "HD";

        posterDiv.appendChild(img);
        posterDiv.appendChild(badge);

        const titleDiv = document.createElement("div");
        titleDiv.className = "card-title";
        titleDiv.title = movie.title;
        titleDiv.textContent = movie.title;

        const metaDiv = document.createElement("div");
        metaDiv.className = "card-meta";
        const metaText = `${movie.vj || 'Luganda'}${movie.year ? ' • ' + movie.year : ''}`;
        metaDiv.textContent = metaText;

        card.appendChild(posterDiv);
        card.appendChild(titleDiv);
        card.appendChild(metaDiv);

        movieCardGrid.appendChild(card);
      });

      // Update Pagination
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
      console.error("Failed to load movies:", err);
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
        fetchAndRenderMovies();
      });
    });
  }

  if (prevPageBtn) {
    prevPageBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        fetchAndRenderMovies();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener("click", () => {
      currentPage++;
      fetchAndRenderMovies();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (movieSearchInput) {
    movieSearchInput.addEventListener("input", (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        currentSearch = e.target.value.trim();
        currentPage = 1;
        fetchAndRenderMovies();
      }, 300);
    });
  }

  // Initial load
  fetchAndRenderMovies();
}
