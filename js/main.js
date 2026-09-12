/* ==========================================================================
   Englisify — Shared logic (theme + mobile nav)
   Runs on every page.
   ========================================================================== */

(function () {
  const STORAGE_KEY = 'englisify-theme'; // 'light' | 'dark'
  const PROFILE_KEY = 'englisify-profile'; // { name }
  const SOUND_KEY = 'englisify-sound-enabled'; // '1' | '0'
  const DAILY_GOAL_KEY = 'englisify-daily-goal'; // '10' | '20' | '30' | '50'
  const DEFAULT_NAME = 'Budi Santoso';

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

    // Avatar menu (topbar) → dropdown ke Profil Saya / Pengaturan
    const avatarBtn = document.getElementById('avatarMenuBtn');
    const avatarDropdown = document.getElementById('avatarDropdown');
    if (avatarBtn && avatarDropdown) {
      avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        avatarDropdown.classList.toggle('open');
      });
      avatarDropdown.querySelectorAll('[data-nav]').forEach((item) => {
        item.addEventListener('click', () => {
          window.location.href = item.dataset.nav;
        });
      });
    }

    // Terapkan nama/inisial profil yang tersimpan ke sidebar & topbar
    window.Englisify.applyProfileToPage();
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

  /* ------------------------------------------------------------------
     Profil (nama tampilan) — dipakai di sidebar, topbar, dan halaman Profil.
     ------------------------------------------------------------------ */
  window.Englisify.getProfile = function () {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.name === 'string' && parsed.name.trim()) {
          return { name: parsed.name.trim() };
        }
      }
    } catch (error) {
      // Data korup / storage tidak tersedia — pakai default.
    }
    return { name: DEFAULT_NAME };
  };

  window.Englisify.setProfileName = function (name) {
    const safeName = String(name || '').trim() || DEFAULT_NAME;
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: safeName }));
    } catch (error) {
      // Private browsing atau storage penuh — UI tetap jalan, cuma tidak tersimpan.
    }
    window.Englisify.applyProfileToPage();
    return safeName;
  };

  window.Englisify.getInitials = function (name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    return parts.slice(0, 2).map((word) => word[0].toUpperCase()).join('');
  };

  window.Englisify.applyProfileToPage = function () {
    const profile = window.Englisify.getProfile();
    const initials = window.Englisify.getInitials(profile.name);
    document.querySelectorAll('.u-name').forEach((el) => { el.textContent = profile.name; });
    document.querySelectorAll('.avatar').forEach((el) => { el.textContent = initials; });
  };

  /* ------------------------------------------------------------------
     Efek suara pelafalan (dipakai oleh Flashcard & Kosakata) — diatur dari
     halaman Pengaturan.
     ------------------------------------------------------------------ */
  window.Englisify.isSoundEnabled = function () {
    try {
      return localStorage.getItem(SOUND_KEY) !== '0';
    } catch (error) {
      return true;
    }
  };

  window.Englisify.setSoundEnabled = function (enabled) {
    try {
      localStorage.setItem(SOUND_KEY, enabled ? '1' : '0');
    } catch (error) {
      // Storage tidak tersedia — pengaturan tidak tersimpan, tapi UI tetap jalan.
    }
  };

  /* ------------------------------------------------------------------
     Target kata harian — disimpan dari halaman Pengaturan.
     ------------------------------------------------------------------ */
  window.Englisify.getDailyGoal = function () {
    try {
      const stored = Number(localStorage.getItem(DAILY_GOAL_KEY));
      return [10, 20, 30, 50].includes(stored) ? stored : 20;
    } catch (error) {
      return 20;
    }
  };

  window.Englisify.setDailyGoal = function (value) {
    try {
      localStorage.setItem(DAILY_GOAL_KEY, String(value));
    } catch (error) {
      // Storage tidak tersedia.
    }
  };

  /* ------------------------------------------------------------------
     Reset semua data lokal Englisify (dipakai tombol "Hapus Semua Data"
     di halaman Pengaturan).
     ------------------------------------------------------------------ */
  window.Englisify.resetAllLocalData = function () {
    [STORAGE_KEY, PROFILE_KEY, SOUND_KEY, DAILY_GOAL_KEY, 'englisify-selected-level'].forEach((key) => {
      try { localStorage.removeItem(key); } catch (error) { /* ignore */ }
    });
  };
})();