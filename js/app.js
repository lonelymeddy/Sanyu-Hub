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

    if(sidebar.classList.contains("active")){

        sidebar.classList.add("active");

    }

}

function hideNavigation(){

    /*
     * If the sidebar is open, keep the navbar
     * and sidebar visible so they remain usable.
     */

    if(!sidebar.classList.contains("active")){

        navbar.classList.add("nav-hidden");

    }else{

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

    sidebar.classList.add("active");

    sidebarOverlay.classList.add("active");

    menuButton.classList.add("active");

    menuButton.setAttribute("aria-expanded","true");

    navbar.classList.remove("nav-hidden");

}

function closeSidebar(){

    sidebar.classList.remove("active");

    sidebarOverlay.classList.remove("active");

    menuButton.classList.remove("active");

    menuButton.setAttribute("aria-expanded","false");

    document.querySelectorAll(".sidebar-submenu").forEach(function(menu){

        menu.classList.remove("open");

    });

    document.querySelectorAll(".has-submenu").forEach(function(item){

        item.classList.remove("expanded");

    });

}


/* HAMBURGER */

menuButton.addEventListener("click",function(){

    if(sidebar.classList.contains("active")){

        closeSidebar();

    }else{

        openSidebar();

    }

});


/* CLICK OUTSIDE */

sidebarOverlay.addEventListener("click",function(){

    closeSidebar();

});


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


/* CATEGORY BUTTONS */

document.querySelectorAll(".category").forEach(function(category){

    category.addEventListener("click",function(){

        document.querySelectorAll(".category").forEach(function(item){

            item.classList.remove("active");

        });

        category.classList.add("active");

    });

});


/* HERO BUTTONS */

document.getElementById("exploreButton").addEventListener("click",function(){

    document.getElementById("popular-movies").scrollIntoView({

        behavior:"smooth"

    });

});

document.getElementById("categoriesButton").addEventListener("click",function(){

    document.getElementById("categories").scrollIntoView({

        behavior:"smooth"

    });

});


/* SEARCH BUTTON */

document.querySelectorAll(".search-button").forEach(function(button){

    button.addEventListener("click",function(){

        /*
         * Connect this to the SanyuHub
         * movie search system when the
         * backend/search API is ready.
         */

    });

});