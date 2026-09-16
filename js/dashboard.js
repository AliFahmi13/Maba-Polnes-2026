/* ==========================================================================
   Englisify — Dashboard (Beranda) logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  // Sync words learned count from Supabase history
  if (window.Englisify.syncWordsLearnedFromHistory) {
    await window.Englisify.syncWordsLearnedFromHistory();
  }
  
  /* ---------------- Sapaan beranda: ikut nama profil & waktu saat ini ---------------- */
  const greetingEl = document.getElementById('dashGreeting');
  if (greetingEl) {
    const profile = window.Englisify.getProfile();
    const firstName = String(profile.name || '').trim().split(/\s+/)[0] || profile.name;

    const hour = new Date().getHours();
    let greetWord = 'Selamat malam';
    if (hour >= 4 && hour < 11) greetWord = 'Selamat pagi';
    else if (hour >= 11 && hour < 15) greetWord = 'Selamat siang';
    else if (hour >= 15 && hour < 18) greetWord = 'Selamat sore';

    greetingEl.textContent = `${greetWord}, ${firstName}! 👋`;
  }

  const levels = window.Englisify.levels;
  const stats = window.Englisify.getLearningStats();
  const currentLevel = levels.find((level) => level.state === 'current') || levels[0];
  const todayKey = new Date().toDateString();
  const todaySeconds = Number(stats.learningSecondsByDate[todayKey]) || 0;
  const targetMinutes = window.Englisify.getSessionTargetMinutes();
  const todayMinutes = Math.floor(todaySeconds / 60);
  const progressPercent = Math.min(100, Math.round((todaySeconds / (targetMinutes * 60)) * 100));

  const progressEl = document.getElementById('dashProgress');
  const progressLabelEl = document.getElementById('dashProgressLabel');
  const reviewCountEl = document.getElementById('dashReviewCount');
  const reviewEstimateEl = document.getElementById('dashReviewEstimate');
  if (progressEl) progressEl.style.width = `${progressPercent}%`;
  if (progressLabelEl) progressLabelEl.textContent = `${todayMinutes}/${targetMinutes} menit · Level ${currentLevel.code} · ${currentLevel.name}`;
  if (reviewCountEl) reviewCountEl.textContent = `${todayMinutes} menit waktu belajar`;
  if (reviewEstimateEl) reviewEstimateEl.textContent = `Target sesi: ${targetMinutes} menit`;
  const dashboardValues = {
    dashWordsLearned: stats.wordsLearned,
    dashReviews: todayMinutes,
    dashAverageScore: `${stats.averageScore}%`,
    dashCurrentLevel: currentLevel.code,
  };
  Object.entries(dashboardValues).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
  const dashStreak = document.getElementById('dashStreak');
  if (dashStreak) dashStreak.textContent = `${stats.streakDays} Hari Berturut-turut`;
  const dashLevelBadge = document.getElementById('dashLevelBadge');
  if (dashLevelBadge) dashLevelBadge.textContent = currentLevel.code;
  const dashCalendarStreak = document.getElementById('dashCalendarStreak');
  if (dashCalendarStreak) dashCalendarStreak.textContent = `${stats.streakDays} hari`;

  const recommendationCard = document.getElementById('dashRecommendation');
  const recent = stats.activities[stats.activities.length - 1];
  if (recommendationCard && recent) {
    const destinations = { flashcard: 'flashcard.html', reading: 'reading-test.html', exam: 'ujian-level.html', vocabulary: 'kosakata.html' };
    const recentTitle = document.getElementById('dashRecommendationTitle');
    const recentSub = document.getElementById('dashRecommendationSub');
    const recentLink = document.getElementById('dashRecommendationLink');
    if (recentTitle) recentTitle.textContent = recent.title;
    if (recentSub) recentSub.textContent = `Terakhir digunakan ${recent.seconds} detik`;
    if (recentLink) recentLink.href = destinations[recent.feature] || 'flashcard.html';
    recommendationCard.hidden = false;
  }

  const checkIcon = `<svg class="icon" viewBox="0 0 24 24" stroke="#12b76a"><path d="M20 6 9 17l-5-5"/></svg>`;
  const lockIcon = `<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`;
  const chevIcon = `<svg class="icon" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>`;

  const list = document.getElementById('levelList');
  if (!list) return;

  list.innerHTML = levels.map((lv) => {
    const cls = ['level-item'];
    if (lv.state === 'current') cls.push('current');
    if (lv.state === 'locked') cls.push('locked');

    let stateHtml = '';
    if (lv.state === 'done') stateHtml = checkIcon;
    else if (lv.state === 'locked') stateHtml = lockIcon;
    else stateHtml = chevIcon;

    return `
      <div class="${cls.join(' ')}" data-code="${lv.code}" data-state="${lv.state}">
        <div class="level-left">
          <div class="lv-code">${lv.code}</div>
          <div>
            <div class="lv-name">${lv.name}</div>
          </div>
        </div>
        <div class="lv-state">${stateHtml}</div>
      </div>`;
  }).join('');

  list.addEventListener('click', (event) => {
    const item = event.target.closest('.level-item');
    if (!item) return;
    const state = item.dataset.state;
    const code = item.dataset.code;
    if (state === 'locked') {
      window.Englisify.toast(`Selesaikan level sebelumnya untuk membuka ${code}`);
      return;
    }
    window.Englisify.accountStore.set('englisify-selected-level', code);
    window.location.href = 'ujian-level.html';
  });
});
