/* ==========================================================================
   Englisify — Dashboard (Beranda) logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const levels = [
    { code: 'A1', name: 'Pemula', state: 'done' },
    { code: 'A2', name: 'Dasar', state: 'done' },
    { code: 'B1', name: 'Menengah', state: 'current' },
    { code: 'B2', name: 'Menengah Atas', state: 'locked' },
    { code: 'C1', name: 'Mahir', state: 'locked' },
    { code: 'C2', name: 'Master', state: 'locked' },
  ];

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

  list.querySelectorAll('.level-item').forEach((el) => {
    el.addEventListener('click', () => {
      const state = el.dataset.state;
      const code = el.dataset.code;
      if (state === 'locked') {
        window.Englisify.toast(`Selesaikan level sebelumnya untuk membuka ${code}`);
        return;
      }
      // Remember which level was picked, then head to the exam hub
      localStorage.setItem('englisify-selected-level', code);
      window.location.href = 'ujian-level.html';
    });
  });
});