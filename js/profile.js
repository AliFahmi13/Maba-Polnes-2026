/* ==========================================================================
   Englisify — Halaman Profil Saya
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  // Sync words learned count from Supabase history
  if (window.Englisify.syncWordsLearnedFromHistory) {
    await window.Englisify.syncWordsLearnedFromHistory();
  }
  
  // Sync level completions from Supabase
  if (window.Englisify.syncLevelCompletionsFromSupabase) {
    await window.Englisify.syncLevelCompletionsFromSupabase();
  }
  
  const escapeHtml = window.Englisify.escapeHtml;
  const stats = window.Englisify.getLearningStats();
  const currentLevelCode = window.Englisify.getCurrentLevelFromProgress();
  const currentLevel = window.Englisify.getLevels().find((level) => level.code === currentLevelCode) || window.Englisify.getLevels()[0];
  const profileValues = {
    profileWordsLearned: stats.wordsLearned,
    profileStreak: `${stats.streakDays} Hari`,
    profileAverageScore: `${stats.averageScore}%`,
    profileCurrentLevel: currentLevel.code,
  };
  Object.entries(profileValues).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });

  /* ------------------------------------------------------------------
    Pencapaian berdasarkan data real dari Supabase
     ------------------------------------------------------------------ */
  
  /* ---------------- Render pencapaian ---------------- */
  async function renderBadges() {
    const grid = document.getElementById('badgeGrid');
    
    try {
      // Get data from Supabase
      const completions = await window.EnglisifySupabase.getLevelCompletions();
      const activities = await window.EnglisifySupabase.getRecentActivities(365); // Last year
      const vocabularyHistory = await window.EnglisifySupabase.getVocabularyHistory();
      
      console.log('Badge data loaded:', {
        completions: completions.length,
        activities: activities.length,
        vocabulary: vocabularyHistory.length
      });
      
      // Calculate achievements
      const ujianCompletions = completions.filter(c => c.test_type === 'ujian');
      const readingCompletions = completions.filter(c => c.test_type === 'reading-test');
      
      console.log('Ujian completions:', ujianCompletions.map(c => ({ level: c.level_code, score: c.score })));
      console.log('Reading completions:', readingCompletions.map(c => ({ level: c.level_code, score: c.score })));
      
      // Check which levels completed - case insensitive
      const completedLevels = new Set();
      ujianCompletions.forEach(c => {
        if (c.level_code) {
          completedLevels.add(c.level_code.toUpperCase());
        }
      });
      
      console.log('Completed levels:', Array.from(completedLevels));
      
      // Calculate streak from activities
      const uniqueDates = new Set(activities.map(a => new Date(a.created_at).toDateString()));
      const activityDates = Array.from(uniqueDates).sort((a, b) => new Date(b) - new Date(a));
      
      let currentStreak = 0;
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      if (activityDates.length > 0) {
        const lastActivity = activityDates[0];
        if (lastActivity === today || lastActivity === yesterday) {
          currentStreak = 1;
          let checkDate = new Date(lastActivity);
          for (let i = 1; i < activityDates.length; i++) {
            checkDate.setDate(checkDate.getDate() - 1);
            if (activityDates[i] === checkDate.toDateString()) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
      }
      
      // Count words learned
      const wordsLearned = vocabularyHistory.length;
      
      // Count flashcard sessions
      const flashcardSessions = activities.filter(a => a.activity_type === 'flashcard').length;
      
      // Define badges with real conditions
      const badges = [
        { 
          emoji: '🎯', 
          name: 'Memulai Perjalanan', 
          desc: 'Selesaikan sesi flashcard pertama', 
          earned: flashcardSessions >= 1 
        },
        { 
          emoji: '🔥', 
          name: '7 Hari Beruntun', 
          desc: 'Belajar 7 hari berturut-turut', 
          earned: currentStreak >= 7 
        },
        { 
          emoji: '📘', 
          name: 'Level A1 Selesai', 
          desc: 'Lulus ujian level Pemula', 
          earned: completedLevels.has('A1') 
        },
        { 
          emoji: '📗', 
          name: 'Level A2 Selesai', 
          desc: 'Lulus ujian level Dasar', 
          earned: completedLevels.has('A2') 
        },
        { 
          emoji: '📙', 
          name: 'Level B1 Selesai', 
          desc: 'Lulus ujian level Menengah', 
          earned: completedLevels.has('B1') 
        },
        { 
          emoji: '📕', 
          name: 'Level B2 Selesai', 
          desc: 'Lulus ujian level Menengah Atas', 
          earned: completedLevels.has('B2') 
        },
        { 
          emoji: '📚', 
          name: '50 Kata Dikuasai', 
          desc: 'Pelajari 50+ kata', 
          earned: wordsLearned >= 50 
        },
        { 
          emoji: '📖', 
          name: '100 Kata Dikuasai', 
          desc: 'Pelajari 100+ kata', 
          earned: wordsLearned >= 100 
        },
        { 
          emoji: '⭐', 
          name: '30 Hari Beruntun', 
          desc: 'Belajar 30 hari berturut-turut', 
          earned: currentStreak >= 30 
        },
        { 
          emoji: '💎', 
          name: '10 Sesi Flashcard', 
          desc: 'Selesaikan 10 sesi flashcard', 
          earned: flashcardSessions >= 10 
        },
        { 
          emoji: '🏆', 
          name: 'Pembaca Hebat', 
          desc: 'Lulus 3 reading test', 
          earned: readingCompletions.length >= 3 
        },
        { 
          emoji: '👑', 
          name: 'Master C1', 
          desc: 'Lulus ujian level Mahir', 
          earned: completedLevels.has('C1') 
        },
      ];
      
      grid.innerHTML = badges.map((b) => `
        <div class="badge-item ${b.earned ? '' : 'locked'}">
          <div class="badge-emoji">${b.emoji}</div>
          <div class="badge-name">${escapeHtml(b.name)}</div>
          <div class="badge-desc">${escapeHtml(b.desc)}</div>
        </div>`).join('');
      
      console.log('Badges calculated:', {
        currentStreak,
        wordsLearned,
        flashcardSessions,
        completedLevels: Array.from(completedLevels),
        earnedCount: badges.filter(b => b.earned).length,
        earnedBadges: badges.filter(b => b.earned).map(b => b.name)
      });
    } catch (error) {
      console.error('Error loading badges:', error);
      grid.innerHTML = '<p style="color:var(--text-secondary);padding:20px;">Gagal memuat pencapaian. Silakan refresh halaman.</p>';
    }
  }

  const icons = {
    'reading-test': '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
    flashcard: '<rect x="3" y="4" width="14" height="16" rx="2"/><path d="M17 8h4v12H7"/>',
    streak: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-1.2-2-1.5-3.3C9 6.5 10 4 12 3c-.3 1.5.5 2.7 1.5 4 1 1.3 2 2.7 2 4.5A5.5 5.5 0 0 1 4 12c0-1.2.5-2 1-2.7"/>',
    ujian: '<path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5z"/>',
    vocabulary: '<path d="M4 19V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
  };

  /* ---------------- Render identitas dari profil tersimpan ---------------- */
  function renderIdentity() {
    const profile = window.Englisify.getProfile();
    const initials = window.Englisify.getInitials(profile.name);
    document.getElementById('profileName').textContent = profile.name;
    document.getElementById('profileAvatar').textContent = initials;
    document.getElementById('profileLevel').textContent = `Level ${currentLevel.code}`;
  }

  /* ---------------- Render aktivitas terbaru ---------------- */
  async function renderActivities() {
    const list = document.getElementById('activityList');
    
    // Load activities from Supabase
    const activities = await window.EnglisifySupabase.getRecentActivities(10);
    
    if (activities.length === 0) {
      list.innerHTML = '<p style="font-size:13px;color:var(--text-secondary);">Belum ada aktivitas belajar.</p>';
      return;
    }
    
    // Format relative time
    function formatRelativeTime(dateString) {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffSecs < 60) return `${diffSecs} detik lalu`;
      if (diffMins < 60) return `${diffMins} menit lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      if (diffDays === 1) return 'Kemarin';
      if (diffDays < 7) return `${diffDays} hari lalu`;
      
      // Format date for older activities
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }
    
    list.innerHTML = activities.map((a) => {
      const iconSvg = icons[a.activity_type] || icons.flashcard;
      return `
      <div class="activity-item">
        <div class="activity-ico"><svg class="icon" viewBox="0 0 24 24" style="width:16px;height:16px;">${iconSvg}</svg></div>
        <div>
          <div class="t">${escapeHtml(a.activity_title)}</div>
          <div class="s">${escapeHtml(a.activity_subtitle || '')}</div>
        </div>
        <div class="time">${formatRelativeTime(a.created_at)}</div>
      </div>`;
    }).join('');
  }

  /* ---------------- Edit profil (modal) ---------------- */
  const overlay = document.getElementById('editProfileOverlay');
  const nameInput = document.getElementById('fProfileName');

  document.getElementById('btnEditProfile').addEventListener('click', () => {
    nameInput.value = window.Englisify.getProfile().name;
    overlay.classList.add('open');
    nameInput.focus();
  });
  document.getElementById('btnCancelEditProfile').addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });

  document.getElementById('editProfileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const newName = nameInput.value.trim();
    if (!newName) return;
    window.Englisify.setProfileName(newName);
    renderIdentity();
    overlay.classList.remove('open');
    window.Englisify.toast('Profil berhasil diperbarui');
  });

  renderIdentity();
  await renderBadges();
  await renderActivities();
});
