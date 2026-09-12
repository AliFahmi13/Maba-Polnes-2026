/* ==========================================================================
   Englisify — Halaman Pengaturan
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------- Akun (read-only, diedit dari halaman Profil) ---------------- */
  document.getElementById('settingsAccountName').textContent = window.Englisify.getProfile().name;

  /* ---------------- Tema ---------------- */
  const themeRadios = document.querySelectorAll('#settingsThemeRow .theme-radio');

  function syncThemeRadios() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    themeRadios.forEach((el) => el.classList.toggle('active', el.dataset.mode === current));
  }

  themeRadios.forEach((el) => {
    el.addEventListener('click', () => {
      // Tombol .theme-btn tersembunyi (di topbar) yang jadi satu-satunya sumber
      // logika ganti tema (main.js) — di sini kita cuma memicu klik yang sama
      // supaya tidak duplikasi logic setTheme().
      const hiddenBtn = document.querySelector(`.theme-toggle .theme-btn[data-mode="${el.dataset.mode}"]`);
      if (hiddenBtn) hiddenBtn.click();
      syncThemeRadios();
    });
  });
  syncThemeRadios();

  /* ---------------- Target kata harian ---------------- */
  const dailyGoalSelect = document.getElementById('dailyGoalSelect');
  dailyGoalSelect.value = String(window.Englisify.getDailyGoal());
  dailyGoalSelect.addEventListener('change', () => {
    window.Englisify.setDailyGoal(Number(dailyGoalSelect.value));
    window.Englisify.toast(`Target harian diatur ke ${dailyGoalSelect.value} kata/hari`);
  });

  /* ---------------- Efek suara ---------------- */
  const soundSwitch = document.getElementById('soundSwitch');

  function renderSoundSwitch() {
    const enabled = window.Englisify.isSoundEnabled();
    soundSwitch.classList.toggle('on', enabled);
    soundSwitch.setAttribute('aria-checked', String(enabled));
  }

  function toggleSound() {
    const next = !window.Englisify.isSoundEnabled();
    window.Englisify.setSoundEnabled(next);
    renderSoundSwitch();
    window.Englisify.toast(next ? 'Efek suara diaktifkan' : 'Efek suara dimatikan');
  }

  soundSwitch.addEventListener('click', toggleSound);
  soundSwitch.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleSound();
    }
  });
  renderSoundSwitch();

  /* ---------------- Hapus semua data lokal ---------------- */
  document.getElementById('btnResetData').addEventListener('click', () => {
    const confirmed = window.confirm(
      'Yakin ingin menghapus semua data lokal? Tema, nama profil, dan preferensi akan kembali ke pengaturan awal.'
    );
    if (!confirmed) return;
    window.Englisify.resetAllLocalData();
    window.Englisify.toast('Semua data lokal telah dihapus');
    setTimeout(() => window.location.reload(), 600);
  });
});
