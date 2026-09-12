/* ==========================================================================
   Englisify — Shared logic (theme + mobile nav)
   Runs on every page.
   ========================================================================== */

(function () {
  const STORAGE_KEY = 'englisify-theme'; // 'light' | 'dark'

  function applyTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  function getStoredTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'light';
  }

  function setTheme(mode) {
    localStorage.setItem(STORAGE_KEY, mode);
    applyTheme(mode);
  }

  // Apply immediately (before paint as much as possible)
  applyTheme(getStoredTheme());

  document.addEventListener('DOMContentLoaded', () => {
    // Wire up the light / dark toggle buttons
    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.mode));
    });

    // Mobile sidebar toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
      document.addEventListener('click', (e) => {
        if (
          sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) &&
          !menuToggle.contains(e.target)
        ) {
          sidebar.classList.remove('open');
        }
      });
    }

    // Close any open dropdown menus when clicking outside
    document.addEventListener('click', (e) => {
      document.querySelectorAll('.dropdown.open').forEach((dd) => {
        if (!dd.parentElement.contains(e.target)) dd.classList.remove('open');
      });
    });
  });

  // Small reusable toast helper, available globally
  window.Englisify = window.Englisify || {};
  window.Englisify.toast = function (message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };
})();