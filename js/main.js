/* ==========================================================================
   Englisify — Shared logic (theme + mobile nav)
   Runs on every page.
   ========================================================================== */

(function () {
  const STORAGE_KEY = 'englisify-theme'; // 'light' | 'dark'
  const PROFILE_KEY = 'englisify-profile'; // { name }
  const SOUND_KEY = 'englisify-sound-enabled'; // '1' | '0'
  const DAILY_GOAL_KEY = 'englisify-daily-goal'; // '10' | '20' | '30' | '50'
  const SESSION_TARGET_KEY = 'englisify-session-target-minutes';
  const FLASHCARD_TARGET_KEY = 'englisify-flashcard-target';
  const FLASHCARD_REDO_KEY = 'englisify-flashcard-redo-limit';
  const LEVEL_PROGRESS_KEY = 'englisify-level-progress';
  const LEARNING_STATS_KEY = 'englisify-learning-stats';
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

    // One document listener handles mobile dismissal and dropdown dismissal.
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    document.addEventListener('click', (e) => {
      if (
        sidebar && menuToggle && sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) && !menuToggle.contains(e.target)
      ) {
        sidebar.classList.remove('open');
      }
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

    // Tombol "Keluar" di dropdown avatar (hanya ada di halaman internal)
    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (window.EnglisifyAuth) window.EnglisifyAuth.logout();
      });
    }
  });

  // Small reusable toast helper, available globally
  window.Englisify = window.Englisify || {};
  window.Englisify.dataStore = window.Englisify.dataStore || window.EnglisifySupabase.dataStore || {
    get(key) {
      try { return localStorage.getItem(key); } catch (error) { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch (error) { /* ignore */ }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch (error) { /* ignore */ }
    },
  };
  const defaultLearningStats = {
    wordsLearned: 0,
    todayReviews: 0,
    averageScore: 0,
    streakDays: 0,
    learningSecondsTotal: 0,
    learningSecondsByDate: {},
    activityDates: [],
    activities: [],
  };

  function getAccountKey(key) {
    const user = window.EnglisifyAuth && window.EnglisifyAuth.getCurrentUser
      ? window.EnglisifyAuth.getCurrentUser()
      : null;
    const email = user && typeof user.email === 'string' ? user.email.toLowerCase() : 'guest';
    return `${key}:${email}`;
  }

  // Account-scoped facade over the Supabase-backed data store.
  window.Englisify.accountStore = window.Englisify.accountStore || {
    get(key) {
      return window.Englisify.dataStore.get(getAccountKey(key));
    },
    set(key, value) {
      window.Englisify.dataStore.set(getAccountKey(key), value);
    },
    remove(key) {
      window.Englisify.dataStore.remove(getAccountKey(key));
    },
    getJSON(key, fallback) {
      try {
        const raw = this.get(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (error) {
        return fallback;
      }
    },
    setJSON(key, value) {
      this.set(key, JSON.stringify(value));
    },
  };

  function getLearningStats() {
    try {
      const raw = window.Englisify.dataStore.get(getAccountKey(LEARNING_STATS_KEY));
      const parsed = raw ? JSON.parse(raw) : {};
      const source = parsed && typeof parsed === 'object' ? parsed : {};
      return {
        ...defaultLearningStats,
        ...source,
        learningSecondsByDate: source.learningSecondsByDate && typeof source.learningSecondsByDate === 'object'
          ? source.learningSecondsByDate : {},
        activityDates: Array.isArray(source.activityDates) ? source.activityDates : [],
        activities: Array.isArray(source.activities) ? source.activities : [],
      };
    } catch (error) {
      return { ...defaultLearningStats, activityDates: [], activities: [] };
    }
  }

  function saveLearningStats(patch) {
    const current = getLearningStats();
    const next = { ...current, ...patch };
    window.Englisify.dataStore.set(getAccountKey(LEARNING_STATS_KEY), JSON.stringify(next));
    return next;
  }

  window.Englisify.getLearningStats = getLearningStats;
  window.Englisify.saveLearningStats = saveLearningStats;
  
  // Update words learned count from Supabase vocabulary history
  window.Englisify.syncWordsLearnedFromHistory = async function() {
    try {
      if (!window.EnglisifySupabase || typeof window.EnglisifySupabase.getVocabularyHistory !== 'function') {
        return;
      }
      const history = await window.EnglisifySupabase.getVocabularyHistory();
      const uniqueWords = new Set(history.map(h => h.word.toLowerCase()));
      const stats = getLearningStats();
      if (uniqueWords.size !== stats.wordsLearned) {
        saveLearningStats({
          wordsLearned: uniqueWords.size,
          reviewedWords: [...uniqueWords].slice(-5000),
        });
      }
    } catch (error) {
      console.warn('Failed to sync words learned from history:', error);
    }
  };
  
  window.Englisify.recordFlashcardReview = function (card, rating) {
    if (!card || typeof card.word !== 'string') return;
    const stats = getLearningStats();
    const reviewedWords = new Set(Array.isArray(stats.reviewedWords) ? stats.reviewedWords : []);
    reviewedWords.add(card.word.trim().toLowerCase());
    saveLearningStats({
      wordsLearned: reviewedWords.size,
      todayReviews: (Number(stats.todayReviews) || 0) + 1,
      reviewedWords: [...reviewedWords].slice(-5000),
      lastFlashcardRating: rating,
      lastFlashcardAt: new Date().toISOString(),
    });
  };
  window.Englisify.getSessionTargetMinutes = function () {
    const value = Number(window.Englisify.dataStore.get(getAccountKey(SESSION_TARGET_KEY)));
    return [10, 20, 30, 50].includes(value) ? value : 20;
  };
  window.Englisify.setSessionTargetMinutes = function (value) {
    if ([10, 20, 30, 50].includes(Number(value))) {
      window.Englisify.dataStore.set(getAccountKey(SESSION_TARGET_KEY), String(value));
    }
  };
  window.Englisify.getFlashcardTarget = function () {
    const value = Number(window.Englisify.dataStore.get(getAccountKey(FLASHCARD_TARGET_KEY)));
    return [10, 20, 30, 50].includes(value) ? value : 20;
  };
  window.Englisify.setFlashcardTarget = function (value) {
    if ([10, 20, 30, 50].includes(Number(value))) {
      window.Englisify.dataStore.set(getAccountKey(FLASHCARD_TARGET_KEY), String(value));
    }
  };
  window.Englisify.getFlashcardRedoLimit = function () {
    const value = Number(window.Englisify.dataStore.get(getAccountKey(FLASHCARD_REDO_KEY)));
    return [0, 10, 20, 30].includes(value) ? value : 10;
  };
  window.Englisify.setFlashcardRedoLimit = function (value) {
    if ([0, 10, 20, 30].includes(Number(value))) {
      window.Englisify.dataStore.set(getAccountKey(FLASHCARD_REDO_KEY), String(value));
    }
  };
  window.Englisify.recordLearningSession = function (feature, durationSeconds) {
    const now = new Date();
    const dateKey = now.toDateString();
    const seconds = Math.max(1, Math.min(8 * 60 * 60, Math.round(Number(durationSeconds) || 0)));
    const stats = getLearningStats();
    const secondsByDate = { ...stats.learningSecondsByDate };
    secondsByDate[dateKey] = (Number(secondsByDate[dateKey]) || 0) + seconds;
    const activityDates = [...new Set([...stats.activityDates, dateKey])].slice(-365);
    const activities = [...stats.activities, {
      feature,
      title: {
        flashcard: 'Belajar melalui Flashcard',
        reading: 'Mengerjakan Reading Test',
        exam: 'Mengerjakan Ujian Level',
        vocabulary: 'Mempelajari Kosakata',
      }[feature] || 'Belajar di Englisify',
      seconds,
      at: now.toISOString(),
      time: 'Hari ini',
    }].slice(-20);
    let streakDays = 0;
    const activeDates = new Set(activityDates);
    const cursor = new Date(now);
    cursor.setHours(0, 0, 0, 0);
    while (activeDates.has(cursor.toDateString())) {
      streakDays++;
      cursor.setDate(cursor.getDate() - 1);
    }
    saveLearningStats({
      learningSecondsTotal: (Number(stats.learningSecondsTotal) || 0) + seconds,
      learningSecondsByDate: secondsByDate,
      activityDates,
      activities,
      streakDays,
    });
  };
  window.Englisify.startLearningSession = function (feature) {
    const startedAt = Date.now();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.Englisify.recordLearningSession(feature, (Date.now() - startedAt) / 1000);
    };
    window.addEventListener('pagehide', finish, { once: true });
    return finish;
  };
  window.Englisify.getAccountStartDate = function () {
    const user = window.EnglisifyAuth && window.EnglisifyAuth.getCurrentUser
      ? window.EnglisifyAuth.getCurrentUser()
      : null;
    const date = user && user.createdAt ? new Date(user.createdAt) : new Date();
    return Number.isNaN(date.getTime()) ? new Date() : date;
  };
  const LEVEL_DEFINITIONS = [
    { code: 'A1', name: 'Pemula', desc: 'Kosakata dasar & kalimat sederhana.' },
    { code: 'A2', name: 'Dasar', desc: 'Bahasa Inggris sehari-hari & ekspresi umum.' },
    { code: 'B1', name: 'Menengah', desc: 'Memahami percakapan dan teks sehari-hari.' },
    { code: 'B2', name: 'Menengah Atas', desc: 'Berkomunikasi dengan lebih lancar.' },
    { code: 'C1', name: 'Mahir', desc: 'Memahami bahasa Inggris kompleks.' },
    { code: 'C2', name: 'Master', desc: 'Penguasaan bahasa Inggris tingkat tinggi.' },
  ];

  function readLevelProgress() {
    try {
      const parsed = JSON.parse(window.Englisify.accountStore.get(LEVEL_PROGRESS_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function writeLevelProgress(progress) {
    window.Englisify.accountStore.set(LEVEL_PROGRESS_KEY, JSON.stringify(progress));
  }

  function getLevels() {
    const progress = readLevelProgress();
    const unlockedIndex = Math.min(
      LEVEL_DEFINITIONS.length - 1,
      Math.max(0, Number.isInteger(progress.unlockedIndex) ? progress.unlockedIndex : 0),
    );
    return LEVEL_DEFINITIONS.map((level, index) => ({
      ...level,
      state: index < unlockedIndex ? 'done' : index === unlockedIndex ? 'current' : 'locked',
    }));
  }

  // Calculate current level based on both Ujian Level and Reading Test completion
  // Reads from localStorage for immediate availability
  window.Englisify.getCurrentLevelFromProgress = function() {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    let currentLevelIndex = 0; // Start at A1
    
    // Find the highest unlocked level (next level after all completed ones)
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      const ujianCompleted = window.Englisify.accountStore.get(`ujian-${level}-completed`) === 'true';
      const readingCompleted = window.Englisify.accountStore.get(`reading-test-${level}-completed`) === 'true';
      
      if (ujianCompleted || readingCompleted) {
        // This level is completed, so current level is at least the next one
        currentLevelIndex = Math.min(i + 1, levels.length - 1);
      } else {
        // Found first incomplete level, this is the current one
        currentLevelIndex = i;
        break;
      }
    }
    
    return levels[currentLevelIndex];
  };
  
  // Sync level completions from Supabase to localStorage on load
  window.Englisify.syncLevelCompletionsFromSupabase = async function() {
    try {
      const completions = await window.EnglisifySupabase.getLevelCompletions();
      completions.forEach((comp) => {
        const key = `${comp.test_type}-${comp.level_code}-completed`;
        window.Englisify.accountStore.set(key, 'true');
        if (comp.score) {
          window.Englisify.accountStore.set(`${comp.test_type}-${comp.level_code}-score`, String(comp.score));
        }
      });
      console.log('Synced', completions.length, 'level completions from Supabase');
      
      // Calculate and update average score from ujian results
      const ujianCompletions = completions.filter(c => c.test_type === 'ujian' && c.score != null);
      if (ujianCompletions.length > 0) {
        const totalScore = ujianCompletions.reduce((sum, c) => sum + c.score, 0);
        const averageScore = Math.round(totalScore / ujianCompletions.length);
        
        // Update learning stats with the average
        const stats = getLearningStats();
        saveLearningStats({ averageScore: averageScore });
        console.log('Updated average score:', averageScore, 'from', ujianCompletions.length, 'ujian results');
      }
    } catch (error) {
      console.error('Failed to sync level completions:', error);
    }
  };

  window.Englisify.levels = getLevels();
  window.Englisify.getLevels = getLevels;
  window.Englisify.unlockNextLevel = function (code) {
    const index = LEVEL_DEFINITIONS.findIndex((level) => level.code === code);
    if (index < 0) return getLevels();
    const progress = readLevelProgress();
    const nextIndex = Math.min(LEVEL_DEFINITIONS.length - 1, index + 1);
    if ((Number.isInteger(progress.unlockedIndex) ? progress.unlockedIndex : 0) <= nextIndex) {
      writeLevelProgress({ unlockedIndex: nextIndex });
    }
    window.Englisify.levels = getLevels();
    return window.Englisify.levels;
  };
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
      const raw = window.Englisify.accountStore.get(PROFILE_KEY);
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
      window.Englisify.accountStore.set(PROFILE_KEY, JSON.stringify({ name: safeName }));
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
    const currentLevelCode = window.Englisify.getCurrentLevelFromProgress();
    const currentLevel = window.Englisify.getLevels().find((level) => level.code === currentLevelCode) || window.Englisify.getLevels()[0];
    document.querySelectorAll('.u-name').forEach((el) => { el.textContent = profile.name; });
    document.querySelectorAll('.avatar').forEach((el) => { el.textContent = initials; });
    document.querySelectorAll('.u-level').forEach((el) => { el.textContent = `Level ${currentLevel.code}`; });
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
    [STORAGE_KEY, PROFILE_KEY, SOUND_KEY, DAILY_GOAL_KEY, getAccountKey(SESSION_TARGET_KEY), getAccountKey(FLASHCARD_TARGET_KEY), getAccountKey(FLASHCARD_REDO_KEY), LEVEL_PROGRESS_KEY, getAccountKey(LEARNING_STATS_KEY), getAccountKey('englisify-vocabulary'), 'englisify-selected-level'].forEach((key) => {
      try { localStorage.removeItem(key); } catch (error) { /* ignore */ }
    });
    if (window.EnglisifyAuth && typeof window.EnglisifyAuth.clearLocalData === 'function') {
      window.EnglisifyAuth.clearLocalData();
    }
  };
})();