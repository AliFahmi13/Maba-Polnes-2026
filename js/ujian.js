/* ==========================================================================
   Englisify — Ujian Level (level exam) logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const levels = window.Englisify.levels;

  const examMeta = {
    A1: { total: 20, time: '± 12 menit', pass: 60, next: 'A2' },
    A2: { total: 25, time: '± 15 menit', pass: 65, next: 'B1' },
    B1: { total: 30, time: '± 20 menit', pass: 70, next: 'B2' },
    B2: { total: 30, time: '± 25 menit', pass: 70, next: 'C1' },
    C1: { total: 35, time: '± 30 menit', pass: 75, next: 'C2' },
    C2: { total: 40, time: '± 35 menit', pass: 80, next: null },
  };

  const examQuestions = [
    { category: 'Kosakata', q: 'Pilih arti yang paling tepat untuk kata "reliable".', options: ['Dapat dipercaya', 'Cepat', 'Mahal', 'Kosong'], correct: 0 },
    { category: 'Kosakata', q: 'Kata mana yang termasuk kata kerja (verb)?', options: ['Beautiful', 'Improve', 'Kindness', 'Slowly'], correct: 1 },
    { category: 'Tata Bahasa', q: 'Pilih bentuk kalimat yang benar: "She ___ to school every day."', options: ['go', 'goes', 'going', 'gone'], correct: 1 },
    { category: 'Tata Bahasa', q: 'Pilih kata sambung yang tepat: "I stayed home ___ it was raining."', options: ['but', 'because', 'so', 'or'], correct: 1 },
    { category: 'Membaca', q: 'Bacaan tentang beradaptasi di kota baru menyarankan sikap...', options: ['Terburu-buru', 'Sabar', 'Cuek', 'Malas'], correct: 1 },
    { category: 'Membaca', q: 'Salah satu cara beradaptasi menurut bacaan adalah...', options: ['Bertemu orang baru', 'Menutup diri', 'Diam di kamar', 'Menghindari rutinitas'], correct: 0 },
  ];
  const escapeHtml = window.Englisify.escapeHtml;

  let activeLevel = 'B1';
  let current = 0;
  let selected = null;
  let answered = false;
  const userAnswers = [];

  const stepSelect = document.getElementById('stepSelect');
  const stepIntro = document.getElementById('stepIntro');
  const stepExam = document.getElementById('stepExam');
  const stepResult = document.getElementById('stepResult');

  function showStep(step) {
    [stepSelect, stepIntro, stepExam, stepResult].forEach((s) => s.classList.add('hidden'));
    step.classList.remove('hidden');
  }

  /* ---------- Step 1: level grid ---------- */
  function renderLevelGrid() {
    const grid = document.getElementById('levelGrid');
    grid.innerHTML = levels.map((lv) => {
      const cls = ['card', 'level-card'];
      if (lv.state === 'locked') cls.push('locked');
      const badgeIcon = lv.state === 'locked'
        ? `<svg class="icon" viewBox="0 0 24 24" style="width:16px;height:16px;"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`
        : lv.code;
      return `
        <div class="${cls.join(' ')}" data-code="${lv.code}" data-state="${lv.state}">
          <div class="lv-top">
            <div class="lv-badge">${badgeIcon}</div>
          </div>
          <div class="lv-title">${lv.code}<br>${lv.name}</div>
          <div class="lv-desc">${lv.desc}</div>
        </div>`;
    }).join('');

    grid.querySelectorAll('.level-card').forEach((card) => {
      card.addEventListener('click', () => {
        const code = card.dataset.code;
        const state = card.dataset.state;
        if (state === 'locked') {
          window.Englisify.toast(`Selesaikan level sebelumnya untuk membuka ${code}`);
          return;
        }
        activeLevel = code;
        renderIntro();
        showStep(stepIntro);
      });
    });
  }

  /* ---------- Step 2: exam intro ---------- */
  function renderIntro() {
    const meta = examMeta[activeLevel];
    const level = levels.find((l) => l.code === activeLevel);
    document.getElementById('introTitle').textContent = `Ujian Level ${activeLevel}`;
    const grid = document.querySelector('#stepIntro .exam-info-grid');
    grid.innerHTML = `
      <div class="card exam-info-card">
        <div class="ico"><svg class="icon" viewBox="0 0 24 24" style="width:16px;height:16px;"><path d="M4 19V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z"/></svg></div>
        <div class="num">${meta.total} soal</div>
        <div class="lbl">Jumlah soal</div>
      </div>
      <div class="card exam-info-card">
        <div class="ico"><svg class="icon" viewBox="0 0 24 24" style="width:16px;height:16px;"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg></div>
        <div class="num">${meta.time}</div>
        <div class="lbl">Waktu pengerjaan</div>
      </div>
      <div class="card exam-info-card">
        <div class="ico"><svg class="icon" viewBox="0 0 24 24" style="width:16px;height:16px;"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5z"/></svg></div>
        <div class="num">${meta.pass}%</div>
        <div class="lbl">Nilai kelulusan</div>
      </div>`;
  }

  document.getElementById('backToSelect').addEventListener('click', () => showStep(stepSelect));
  document.getElementById('backToIntro').addEventListener('click', () => showStep(stepIntro));

  document.getElementById('startExamBtn').addEventListener('click', () => {
    current = 0;
    userAnswers.length = 0;
    showStep(stepExam);
    renderExamQuestion();
  });

  /* ---------- Step 3: exam quiz ---------- */
  function renderExamQuestion() {
    document.getElementById('examPager').textContent = `${current + 1} dari ${examQuestions.length}`;
    const item = examQuestions[current];
    selected = null;
    answered = false;

    const examCard = document.getElementById('examCard');
    examCard.innerHTML = `
      <span class="tag" style="margin-bottom:14px;display:inline-block;">${escapeHtml(item.category)}</span>
      <div class="q-title">${escapeHtml(item.q)}</div>
      <div class="option-list" id="examOptList">
        ${item.options.map((opt, i) => `
          <div class="option" data-idx="${i}">
            <span class="radio"></span><span>${escapeHtml(opt)}</span>
          </div>`).join('')}
      </div>
      <button class="btn btn-primary mt-4" id="examAction" disabled>Jawab</button>
    `;

    const optList = document.getElementById('examOptList');
    const actionBtn = document.getElementById('examAction');

    optList.querySelectorAll('.option').forEach((opt) => {
      opt.addEventListener('click', () => {
        if (answered) return;
        optList.querySelectorAll('.option').forEach((o) => o.classList.remove('selected'));
        opt.classList.add('selected');
        selected = Number(opt.dataset.idx);
        actionBtn.disabled = false;
      });
    });

    actionBtn.addEventListener('click', () => {
      if (!answered) {
        answered = true;
        userAnswers.push(selected);
        optList.querySelectorAll('.option').forEach((o) => {
          o.classList.add('disabled');
          const idx = Number(o.dataset.idx);
          if (idx === item.correct) o.classList.add('correct');
          else if (idx === selected) o.classList.add('wrong');
        });
        actionBtn.textContent = current === examQuestions.length - 1 ? 'Lihat Hasil' : 'Soal Berikutnya';
      } else if (current < examQuestions.length - 1) {
        current++;
        renderExamQuestion();
      } else {
        showExamResult();
      }
    });
  }

  /* ---------- Step 4: result ---------- */
  function showExamResult() {
    const categories = ['Kosakata', 'Tata Bahasa', 'Membaca'];
    const catScore = {};
    categories.forEach((c) => (catScore[c] = { correct: 0, total: 0 }));

    examQuestions.forEach((q, i) => {
      catScore[q.category].total++;
      if (userAnswers[i] === q.correct) catScore[q.category].correct++;
    });

    const totalCorrect = userAnswers.filter((a, i) => a === examQuestions[i].correct).length;
    const percent = Math.round((totalCorrect / examQuestions.length) * 100);
    const meta = examMeta[activeLevel];
    const passed = percent >= meta.pass;
    const circumference = 2 * Math.PI * 60;
    const offset = circumference - (percent / 100) * circumference;

    const resultCard = document.getElementById('examResultCard');
    resultCard.innerHTML = `
      <h2 style="font-size:16px;font-weight:700;margin-bottom:18px;">Hasil Ujian</h2>
      <div class="score-ring">
        <svg viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="60" stroke="var(--border-color)" stroke-width="12" fill="none"/>
          <circle cx="70" cy="70" r="60" stroke="${passed ? '#12b76a' : '#ef4444'}" stroke-width="12" fill="none"
            stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
        </svg>
        <div class="score-text">${percent}<small>/ 100</small></div>
      </div>
      <div style="font-weight:800;font-size:15px;color:${passed ? '#12b76a' : '#ef4444'};margin-bottom:18px;">
        ${passed ? 'LULUS' : 'BELUM LULUS'}
      </div>

      <div class="result-breakdown">
        ${categories.map((c) => {
          const s = catScore[c];
          const catPercent = s.total ? Math.round((s.correct / s.total) * 100) : 0;
          return `<div class="result-row"><span>${c}</span><span class="val">${catPercent}%</span></div>`;
        }).join('')}
      </div>

      <div class="${passed ? 'pass-banner' : 'pass-banner fail-banner'}">
        <svg class="icon" viewBox="0 0 24 24" style="width:22px;height:22px;">
          ${passed ? '<path d="M20 6 9 17l-5-5"/>' : '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>'}
        </svg>
        <div>
          <strong>${passed ? 'Selamat!' : 'Jangan menyerah!'}</strong>
          ${passed
            ? (meta.next ? `Kamu siap melanjutkan ke level ${meta.next}.` : 'Kamu telah menguasai level tertinggi!')
            : 'Pelajari kembali materinya dan coba ujian ini lagi.'}
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:20px;">
        <a href="index.html" class="btn btn-outline" style="flex:1;">Kembali ke Beranda</a>
        ${passed && meta.next
          ? `<button class="btn btn-primary" style="flex:1;" id="btnNextLevel">Lanjut ke ${meta.next} →</button>`
          : `<button class="btn btn-primary" style="flex:1;" id="btnRetryExam">Ulangi Ujian</button>`}
      </div>
    `;

    showStep(stepResult);

    const nextBtn = document.getElementById('btnNextLevel');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const lvl = levels.find((l) => l.code === activeLevel);
        const nextLvl = levels.find((l) => l.code === meta.next);
        if (lvl) lvl.state = 'done';
        if (nextLvl) nextLvl.state = 'current';
        window.Englisify.toast(`Level ${meta.next} telah dibuka!`);
        renderLevelGrid();
        showStep(stepSelect);
      });
    }
    const retryBtn = document.getElementById('btnRetryExam');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        current = 0;
        userAnswers.length = 0;
        showStep(stepExam);
        renderExamQuestion();
      });
    }
  }

  renderLevelGrid();
  showStep(stepSelect);
});
