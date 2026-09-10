/* ==========================================================================
   Englisify — Kalender logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();
  let selectedDate = new Date(today);

  // Days in the current streak (learned), counting back from today
  const streakLength = 8;
  const learnedDates = new Set();
  for (let i = 0; i < streakLength; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    learnedDates.add(d.toDateString());
  }

  const grid = document.getElementById('calGrid');
  const monthLabel = document.getElementById('calMonthLabel');
  const dayTitle = document.getElementById('calDayTitle');
  const daySub = document.getElementById('calDaySub');

  function sameDay(a, b) { return a.toDateString() === b.toDateString(); }

  function renderCalendar() {
    monthLabel.textContent = `${monthNames[viewMonth]} ${viewYear}`;
    grid.innerHTML = '';

    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startOffset = firstOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];
    // Leading days from previous month
    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push({ day: daysInPrevMonth - i, muted: true, date: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i) });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, muted: false, date: new Date(viewYear, viewMonth, d) });
    }
    // Trailing days to complete the grid (multiple of 7)
    let trailing = 1;
    while (cells.length % 7 !== 0) {
      cells.push({ day: trailing, muted: true, date: new Date(viewYear, viewMonth + 1, trailing) });
      trailing++;
    }

    cells.forEach((cell) => {
      const el = document.createElement('div');
      el.className = 'cal-day';
      if (cell.muted) el.classList.add('muted');
      if (sameDay(cell.date, today)) el.classList.add('today');
      if (learnedDates.has(cell.date.toDateString()) && !cell.muted) el.classList.add('learned');
      if (sameDay(cell.date, selectedDate) && !cell.muted) el.classList.add('selected');

      el.innerHTML = `${cell.day}${learnedDates.has(cell.date.toDateString()) && !cell.muted ? '<span class="dot"></span>' : ''}`;

      if (!cell.muted) {
        el.addEventListener('click', () => {
          selectedDate = cell.date;
          renderCalendar();
          renderDayInfo();
        });
      }
      grid.appendChild(el);
    });
  }

  function renderDayInfo() {
    const isToday = sameDay(selectedDate, today);
    dayTitle.textContent = isToday ? 'Hari Ini' : selectedDate.toLocaleDateString('id-ID', { weekday: 'long' });
    daySub.textContent = selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const list = document.getElementById('calInfoList');
    if (learnedDates.has(selectedDate.toDateString())) {
      list.innerHTML = `
        <div class="cal-info-item">
          <div class="cal-info-ico"><svg class="icon" viewBox="0 0 24 24" style="width:16px;height:16px;"><path d="M4 19V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z"/></svg></div>
          <div><div class="t">12 kata</div><div class="s">Review kosakata</div></div>
        </div>
        <div class="cal-info-item">
          <div class="cal-info-ico"><svg class="icon" viewBox="0 0 24 24" style="width:16px;height:16px;"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg></div>
          <div><div class="t">5 soal</div><div class="s">Reading Test</div></div>
        </div>`;
    } else {
      list.innerHTML = `<p style="font-size:13px;color:var(--text-secondary);">Tidak ada aktivitas belajar pada tanggal ini.</p>`;
    }
  }

  document.getElementById('calPrev').addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
  });

  renderCalendar();
  renderDayInfo();
});