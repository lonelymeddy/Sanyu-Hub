/* Meddy API Developer Platform Core JavaScript Controller */
(function () {
  'use strict';

  // State
  let activeSection = 'overview';
  let canonicalBaseUrl = window.location.origin;

  document.addEventListener('DOMContentLoaded', initPortal);

  function initPortal() {
    updateCanonicalBaseUrl();
    setupNavigation();
    setupMobileMenu();
    setupSearch();
    setupCodeTabs();
    setupCopyButtons();
    setupApiExplorer();

    // Route based on URL path or hash
    handleInitialRouting();
  }

  function updateCanonicalBaseUrl() {
    canonicalBaseUrl = window.location.origin;
    const baseUrlEls = document.querySelectorAll('.base-url-val');
    baseUrlEls.forEach(el => {
      el.textContent = canonicalBaseUrl;
    });

    // Update cURL examples with real base URL
    const curlEls = document.querySelectorAll('.curl-example');
    curlEls.forEach(el => {
      const template = el.getAttribute('data-template');
      if (template) {
        el.textContent = template.replace(/BASE_URL/g, canonicalBaseUrl);
      }
    });
  }

  function setupNavigation() {
    const navLinks = document.querySelectorAll('[data-section-target]');
    navLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const target = this.getAttribute('data-section-target');
        navigateToSection(target);

        // Close mobile drawer if open
        closeMobileMenu();
      });
    });

    window.addEventListener('hashchange', function () {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        navigateToSection(hash);
      }
    });
  }

  function handleInitialRouting() {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.replace('#', '');

    if (hash) {
      navigateToSection(hash);
      return;
    }

    if (path.includes('/movie')) {
      navigateToSection('api-movies');
    } else if (path.includes('/series')) {
      navigateToSection('api-series');
    } else if (path.includes('/live-tv')) {
      navigateToSection('api-live-tv');
    } else if (path.includes('/about')) {
      navigateToSection('overview');
    } else if (path.includes('/settings')) {
      navigateToSection('base-url');
    } else if (path.includes('/more')) {
      navigateToSection('api-search');
    } else {
      navigateToSection('overview');
    }
  }

  function navigateToSection(sectionId) {
    activeSection = sectionId;

    // Hide all sections
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(sec => sec.classList.remove('active'));

    // Show target section if exists, fallback to overview
    const targetEl = document.getElementById(sectionId) || document.getElementById('overview');
    if (targetEl) {
      targetEl.classList.add('active');
    }

    // Update sidebar active states
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
      if (link.getAttribute('data-section-target') === sectionId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update header nav active states
    const headerLinks = document.querySelectorAll('.header-nav-link');
    headerLinks.forEach(link => {
      if (link.getAttribute('data-section-target') === sectionId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Scroll content to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setupMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('portalSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (btn && sidebar && overlay) {
      btn.addEventListener('click', function () {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
      });

      overlay.addEventListener('click', closeMobileMenu);
    }
  }

  function closeMobileMenu() {
    const sidebar = document.getElementById('portalSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  function setupSearch() {
    const input = document.getElementById('globalSearchInput');
    if (!input) return;

    input.addEventListener('input', function () {
      const q = this.value.toLowerCase().trim();
      const links = document.querySelectorAll('.sidebar-link');

      if (!q) {
        links.forEach(l => l.style.display = 'flex');
        return;
      }

      links.forEach(l => {
        const text = l.textContent.toLowerCase();
        if (text.includes(q)) {
          l.style.display = 'flex';
        } else {
          l.style.display = 'none';
        }
      });
    });
  }

  function setupCodeTabs() {
    document.addEventListener('click', function (e) {
      if (e.target.classList.contains('code-tab')) {
        const parent = e.target.closest('.code-block');
        if (!parent) return;

        const tabs = parent.querySelectorAll('.code-tab');
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        const lang = e.target.getAttribute('data-lang');
        const snippets = parent.querySelectorAll('[data-code-snippet]');
        snippets.forEach(s => {
          if (s.getAttribute('data-code-snippet') === lang) {
            s.style.display = 'block';
          } else {
            s.style.display = 'none';
          }
        });
      }
    });
  }

  function setupCopyButtons() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.copy-btn');
      if (!btn) return;

      const parent = btn.closest('.code-block') || btn.closest('.base-url-box');
      if (!parent) return;

      const codeEl = parent.querySelector('pre code, .base-url-val');
      if (!codeEl) return;

      const text = codeEl.textContent.trim();
      navigator.clipboard.writeText(text).then(() => {
        const origText = btn.innerHTML;
        btn.innerHTML = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg> Copied!`;
        setTimeout(() => {
          btn.innerHTML = origText;
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
    });
  }

  function setupApiExplorer() {
    const form = document.getElementById('apiExplorerForm');
    if (!form) return;

    const endpointSelect = document.getElementById('explorerEndpoint');
    const paramInputsGroup = document.getElementById('explorerParamInputs');
    const responseBox = document.getElementById('explorerResponseBox');
    const responseStatus = document.getElementById('explorerResponseStatus');
    const responseLatency = document.getElementById('explorerResponseLatency');
    const responseBody = document.getElementById('explorerResponseBody');

    const endpointsConfig = {
      'get-movies': {
        name: 'GET /api/movies',
        method: 'GET',
        path: '/api/movies',
        params: [
          { name: 'country', type: 'select', options: ['ug', 'ke'], default: 'ug', label: 'Country Code' },
          { name: 'search', type: 'text', default: '', label: 'Search Query' },
          { name: 'vj', type: 'text', default: '', label: 'VJ Filter (e.g. DJ Mark, VJ Junior)' },
          { name: 'genre', type: 'text', default: '', label: 'Genre Filter' },
          { name: 'page', type: 'number', default: 1, label: 'Page Number' },
          { name: 'limit', type: 'number', default: 12, label: 'Items Per Page' }
        ]
      },
      'get-movie-detail': {
        name: 'GET /api/movies/:id',
        method: 'GET',
        path: '/api/movies/1',
        params: [
          { name: 'id', type: 'text', default: '1', label: 'Movie ID' }
        ]
      },
      'get-series': {
        name: 'GET /api/series',
        method: 'GET',
        path: '/api/series',
        params: [
          { name: 'country', type: 'select', options: ['ug', 'ke'], default: 'ug', label: 'Country Code' },
          { name: 'search', type: 'text', default: '', label: 'Search Query' },
          { name: 'vj', type: 'text', default: '', label: 'VJ Filter' },
          { name: 'page', type: 'number', default: 1, label: 'Page Number' }
        ]
      },
      'get-tv-channels': {
        name: 'GET /api/live-tv/channels',
        method: 'GET',
        path: '/api/live-tv/channels',
        params: [
          { name: 'country', type: 'select', options: ['ug', 'ke'], default: 'ug', label: 'Country Code' }
        ]
      },
      'get-radio-stations': {
        name: 'GET /api/radio',
        method: 'GET',
        path: '/api/radio',
        params: [
          { name: 'country', type: 'select', options: ['ug', 'ke'], default: 'ug', label: 'Country Code' }
        ]
      },
      'get-concerts': {
        name: 'GET /api/concerts',
        method: 'GET',
        path: '/api/concerts',
        params: [
          { name: 'country', type: 'select', options: ['ug', 'ke'], default: 'ug', label: 'Country Code' },
          { name: 'search', type: 'text', default: '', label: 'Search Query' }
        ]
      }
    };

    function renderParamInputs(epKey) {
      paramInputsGroup.innerHTML = '';
      const config = endpointsConfig[epKey];
      if (!config || !config.params) return;

      config.params.forEach(p => {
        const group = document.createElement('div');
        group.className = 'form-group';

        const label = document.createElement('label');
        label.className = 'form-label';
        label.textContent = p.label;

        let input;
        if (p.type === 'select') {
          input = document.createElement('select');
          input.className = 'form-control';
          p.options.forEach(opt => {
            const o = document.createElement('option');
            o.value = opt;
            o.textContent = opt.toUpperCase();
            if (opt === p.default) o.selected = true;
            input.appendChild(o);
          });
        } else {
          input = document.createElement('input');
          input.type = p.type;
          input.className = 'form-control';
          input.value = p.default;
        }
        input.setAttribute('data-param-name', p.name);

        group.appendChild(label);
        group.appendChild(input);
        paramInputsGroup.appendChild(group);
      });
    }

    if (endpointSelect) {
      endpointSelect.addEventListener('change', function () {
        renderParamInputs(this.value);
      });
      renderParamInputs(endpointSelect.value);
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const epKey = endpointSelect.value;
      const config = endpointsConfig[epKey];
      if (!config) return;

      let reqUrl = canonicalBaseUrl;
      const paramEls = paramInputsGroup.querySelectorAll('[data-param-name]');
      const queryParams = new URLSearchParams();

      let targetPath = config.path;

      paramEls.forEach(pEl => {
        const name = pEl.getAttribute('data-param-name');
        const val = pEl.value.trim();
        if (name === 'id') {
          targetPath = `/api/movies/${encodeURIComponent(val || '1')}`;
        } else if (val) {
          queryParams.append(name, val);
        }
      });

      const queryString = queryParams.toString();
      const finalUrl = `${reqUrl}${targetPath}${queryString ? '?' + queryString : ''}`;

      responseBox.style.display = 'block';
      responseStatus.innerHTML = `<span class="status-tag">Executing...</span>`;
      responseLatency.textContent = '';
      responseBody.textContent = 'Sending request to backend server...';

      const startTime = performance.now();

      try {
        const res = await fetch(finalUrl);
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);

        const statusClass = res.ok ? 'success' : 'error';
        responseStatus.innerHTML = `<span class="status-tag ${statusClass}">${res.status} ${res.statusText}</span>`;
        responseLatency.textContent = `Latency: ${latency}ms`;

        const data = await res.json();
        responseBody.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);
        responseStatus.innerHTML = `<span class="status-tag error">Request Failed</span>`;
        responseLatency.textContent = `Latency: ${latency}ms`;
        responseBody.textContent = JSON.stringify({ error: err.message }, null, 2);
      }
    });
  }

})();
