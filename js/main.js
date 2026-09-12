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
    try {
      return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
    } catch (error) {
      return 'light';
    }
  }

  function setTheme(mode) {
    const safeMode = mode === 'dark' ? 'dark' : 'light';
    try {
      localStorage.setItem(STORAGE_KEY, safeMode);
    } catch (error) {
      // Private browsing or disabled storage should not break the UI.
    }
    applyTheme(safeMode);
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
  window.Englisify.levels = [
    { code: 'A1', name: 'Pemula', desc: 'Kosakata dasar & kalimat sederhana.', state: 'done' },
    { code: 'A2', name: 'Dasar', desc: 'Bahasa Inggris sehari-hari & ekspresi umum.', state: 'done' },
    { code: 'B1', name: 'Menengah', desc: 'Memahami percakapan dan teks sehari-hari.', state: 'current' },
    { code: 'B2', name: 'Menengah Atas', desc: 'Berkomunikasi dengan lebih lancar.', state: 'locked' },
    { code: 'C1', name: 'Mahir', desc: 'Memahami bahasa Inggris kompleks.', state: 'locked' },
    { code: 'C2', name: 'Master', desc: 'Penguasaan bahasa Inggris tingkat tinggi.', state: 'locked' },
  ];
  window.Englisify.escapeHtml = function (value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[character]));
  };
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