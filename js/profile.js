/* ==========================================================================
   Englisify — Halaman Profil Saya
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const escapeHtml = window.Englisify.escapeHtml;

  /* ------------------------------------------------------------------
     Data statis untuk pencapaian & aktivitas (dummy, konsisten dengan
     angka yang ditampilkan di Beranda). Belum ada backend, jadi status
     earned/locked dihitung manual sesuai data yang sudah "nyata" di app
     (428 kata, streak 8 hari, level B1 sedang berjalan).
     ------------------------------------------------------------------ */
  const badges = [
    { emoji: '🔥', name: '7 Hari Beruntun', desc: 'Belajar 7 hari berturut-turut', earned: true },
    { emoji: '📘', name: 'Level A1 Selesai', desc: 'Lulus ujian level Pemula', earned: true },
    { emoji: '📗', name: 'Level A2 Selesai', desc: 'Lulus ujian level Dasar', earned: true },
    { emoji: '📚', name: '100 Kata Dikuasai', desc: 'Menguasai 100+ kosakata', earned: true },
    { emoji: '🏆', name: 'Lulus Level B1', desc: 'Selesaikan ujian level Menengah', earned: false },
    { emoji: '⭐', name: '30 Hari Beruntun', desc: 'Belajar 30 hari berturut-turut', earned: false },
  ];

  const activities = [
    { icon: 'reading', title: 'Menyelesaikan Reading Test', sub: 'Level B1 &middot; skor 84', time: 'Hari ini' },
    { icon: 'flashcard', title: 'Me-review 12 kata kosakata', sub: 'Sesi Flashcard', time: 'Hari ini' },
    { icon: 'streak', title: 'Streak belajar hari ke-8', sub: 'Terus pertahankan!', time: 'Kemarin' },
    { icon: 'exam', title: 'Mencoba Ujian Level B1', sub: 'Belum lulus, coba lagi', time: '3 hari lalu' },
  ];

  const icons = {
    reading: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
    flashcard: '<rect x="3" y="4" width="14" height="16" rx="2"/><path d="M17 8h4v12H7"/>',
    streak: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-1.2-2-1.5-3.3C9 6.5 10 4 12 3c-.3 1.5.5 2.7 1.5 4 1 1.3 2 2.7 2 4.5A5.5 5.5 0 0 1 4 12c0-1.2.5-2 1-2.7"/>',
    exam: '<path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5z"/>',
  };

  /* ---------------- Render identitas dari profil tersimpan ---------------- */
  function renderIdentity() {
    const profile = window.Englisify.getProfile();
    const initials = window.Englisify.getInitials(profile.name);
    document.getElementById('profileName').textContent = profile.name;
    document.getElementById('profileAvatar').textContent = initials;
  }

  /* ---------------- Render pencapaian ---------------- */
  function renderBadges() {
    const grid = document.getElementById('badgeGrid');
    grid.innerHTML = badges.map((b) => `
      <div class="badge-item ${b.earned ? '' : 'locked'}">
        <div class="badge-emoji">${b.emoji}</div>
        <div class="badge-name">${escapeHtml(b.name)}</div>
        <div class="badge-desc">${escapeHtml(b.desc)}</div>
      </div>`).join('');
  }

  /* ---------------- Render aktivitas terbaru ---------------- */
  function renderActivities() {
    const list = document.getElementById('activityList');
    list.innerHTML = activities.map((a) => `
      <div class="activity-item">
        <div class="activity-ico"><svg class="icon" viewBox="0 0 24 24" style="width:16px;height:16px;">${icons[a.icon] || ''}</svg></div>
        <div>
          <div class="t">${escapeHtml(a.title)}</div>
          <div class="s">${a.sub}</div>
        </div>
        <div class="time">${escapeHtml(a.time)}</div>
      </div>`).join('');
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
  renderBadges();
  renderActivities();
});
