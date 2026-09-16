/* ==========================================================================
   Englisify — Kalender logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const accountStart = window.Englisify.getAccountStartDate();
  accountStart.setHours(0, 0, 0, 0);
  const stats = window.Englisify.getLearningStats();
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  const learnedDates = new Set((stats.activityDates || []).map((value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toDateString();
  }).filter(Boolean));
  const firstAvailableDate = accountStart > today ? accountStart : today;

  let viewYear = firstAvailableDate.getFullYear();
  let viewMonth = firstAvailableDate.getMonth();
  let selectedDate = new Date(firstAvailableDate);

  const grid = document.getElementById('calGrid');
  const monthLabel = document.getElementById('calMonthLabel');
  const dayTitle = document.getElementById('calDayTitle');
  const daySub = document.getElementById('calDaySub');

  function sameDay(a, b) { return a.toDateString() === b.toDateString(); }
  function beforeAccountStart(date) { return date < accountStart; }

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
      const unavailable = cell.muted || beforeAccountStart(cell.date);
      if (unavailable) el.classList.add('muted');
      if (sameDay(cell.date, today)) el.classList.add('today');
      if (learnedDates.has(cell.date.toDateString()) && !unavailable) el.classList.add('learned');
      if (sameDay(cell.date, selectedDate) && !unavailable) el.classList.add('selected');

      el.innerHTML = `${cell.day}${learnedDates.has(cell.date.toDateString()) && !unavailable ? '<span class="dot"></span>' : ''}`;
      el.dataset.date = cell.date.toISOString();
      grid.appendChild(el);
    });
  }

  function renderDayInfo() {
    if (beforeAccountStart(selectedDate)) {
      dayTitle.textContent = 'Belum tersedia';
      daySub.textContent = `Akun dibuat ${accountStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      document.getElementById('calInfoList').innerHTML = '<p style="font-size:13px;color:var(--text-secondary);">Tanggal ini sebelum akun dibuat.</p>';
      return;
    }
    const isToday = sameDay(selectedDate, today);
    dayTitle.textContent = isToday ? 'Hari Ini' : selectedDate.toLocaleDateString('id-ID', { weekday: 'long' });
    daySub.textContent = selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const list = document.getElementById('calInfoList');
    const dayActivities = stats.activities.filter((activity) => {
      const date = new Date(activity.at);
      return !Number.isNaN(date.getTime()) && sameDay(date, selectedDate);
    });
    if (dayActivities.length > 0) {
      list.innerHTML = dayActivities.map((activity) => `
        <div class="cal-info-item">
          <div class="cal-info-ico"><svg class="icon" viewBox="0 0 24 24" style="width:16px;height:16px;"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="9"/></svg></div>
          <div><div class="t">${window.Englisify.escapeHtml(activity.title)}</div><div class="s">${Math.max(1, Math.ceil(activity.seconds / 60))} menit</div></div>
        </div>`).join('');
    } else if (learnedDates.has(selectedDate.toDateString())) {
      list.innerHTML = '<p style="font-size:13px;color:var(--text-secondary);">Ada aktivitas belajar pada tanggal ini.</p>';
    } else {
      list.innerHTML = `<p style="font-size:13px;color:var(--text-secondary);">Tidak ada aktivitas belajar pada tanggal ini.</p>`;
    }
  }

  grid.addEventListener('click', (event) => {
    const day = event.target.closest('.cal-day');
    if (!day || day.classList.contains('muted')) return;
    selectedDate = new Date(day.dataset.date);
    renderCalendar();
    renderDayInfo();
  });

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

  document.getElementById('calWeekLearned').textContent = stats.activityDates.filter((value) => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date >= weekStart && date <= today;
  }).length;
  document.getElementById('calWeekReviews').textContent = stats.todayReviews;
  document.getElementById('calWeekReading').textContent = stats.activities.filter((activity) => activity.icon === 'reading').length;
  document.getElementById('calStreak').textContent = `${stats.streakDays} hari`;

  renderCalendar();
  renderDayInfo();
});
