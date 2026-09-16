/* ==========================================================================
   Englisify — Reading Test logic (dengan pemilihan level + randomisasi sesi)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  window.Englisify.startLearningSession('reading');

  /* ------------------------------------------------------------------
     Level metadata — konsisten dengan Beranda, Ujian Level & Flashcard.
     ------------------------------------------------------------------ */
  const LEVELS = window.Englisify.levels;

  /* ------------------------------------------------------------------
     Bank bacaan per level. `correctAnswer` disimpan sebagai TEKS jawaban
     (bukan index), supaya tetap valid walau posisi opsi nanti diacak.
     Bank ini TIDAK PERNAH dimutasi langsung.
     ------------------------------------------------------------------ */
  const READING_BANK = {
    A1: {
      title: 'My Daily Routine',
      paragraphs: [
        'My name is Sari. I wake up at six. I eat breakfast with my family. Then I go to school.',
        'After school, I play with my friends. In the evening, I do my homework and go to sleep early.',
      ],
      questions: [
        { q: 'What time does Sari wake up?', options: ['Six', 'Seven', 'Eight', 'Nine'], correctAnswer: 'Six' },
        { q: 'Who does Sari eat breakfast with?', options: ['Her friends', 'Her family', 'Her teacher', 'Alone'], correctAnswer: 'Her family' },
        { q: 'What does Sari do after school?', options: ['Sleep', 'Cook', 'Play with friends', 'Watch TV'], correctAnswer: 'Play with friends' },
      ],
    },
    A2: {
      title: 'Planning a Holiday',
      paragraphs: [
        'Rina and her family are planning a holiday to the beach next month. She is very excited because the weather will be sunny.',
        'They will stay in a small hotel near the sea. Rina wants to try local food and take a lot of photos.',
      ],
      questions: [
        { q: 'Where are Rina and her family going?', options: ['Mountain', 'Beach', 'City', 'Village'], correctAnswer: 'Beach' },
        { q: 'Why is Rina excited?', options: ['Because it will rain', 'Because the weather will be sunny', 'Because she must work', 'Because she dislikes travel'], correctAnswer: 'Because the weather will be sunny' },
        { q: 'What does Rina want to do during the holiday?', options: ['Study English', 'Try local food', 'Stay at home', 'Avoid photos'], correctAnswer: 'Try local food' },
      ],
    },
    B1: {
      title: 'Life in a New City',
      paragraphs: [
        'Moving to a new city can be exciting, but it also takes time to feel comfortable. In the beginning, everything might feel new and unfamiliar. However, by creating a routine, meeting new people, and exploring the surroundings, you can slowly adapt and feel at home.',
        'It is important to be patient with yourself. Everyone needs time to adjust to a new environment.',
      ],
      questions: [
        { q: 'Apa yang dapat membantu seseorang merasa lebih nyaman di kota baru?', options: ['Menghindari aktivitas sehari-hari', 'Mempelajari rutinitas kecil', 'Tidak berbicara dengan orang lain', 'Segera pindah ke kota lain'], correctAnswer: 'Mempelajari rutinitas kecil' },
        { q: 'Menurut bacaan, apa yang biasanya dirasakan seseorang di awal pindah ke kota baru?', options: ['Sangat percaya diri', 'Bosan dan mengantuk', 'Semuanya terasa baru dan asing', 'Tidak ada perubahan sama sekali'], correctAnswer: 'Semuanya terasa baru dan asing' },
        { q: 'Kata "adjust" pada bacaan paling dekat artinya dengan...', options: ['Menyesuaikan diri', 'Menjauh', 'Menjual', 'Menunda'], correctAnswer: 'Menyesuaikan diri' },
        { q: 'Sikap apa yang disarankan bacaan saat beradaptasi dengan lingkungan baru?', options: ['Terburu-buru', 'Bersikap sabar', 'Mengabaikan lingkungan sekitar', 'Membandingkan dengan kota lama terus-menerus'], correctAnswer: 'Bersikap sabar' },
        { q: 'Manakah cara beradaptasi yang disebutkan dalam bacaan?', options: ['Bertemu orang baru', 'Berdiam diri di rumah', 'Menghindari eksplorasi', 'Mengubah rutinitas setiap hari'], correctAnswer: 'Bertemu orang baru' },
      ],
    },
    B2: {
      title: 'The Power of Small Habits',
      paragraphs: [
        'Building good habits does not require dramatic change. Small, consistent actions often lead to significant results over time.',
        'For example, reading ten pages a day may seem minor, but after a year, it adds up to thousands of pages. The key is consistency rather than intensity.',
      ],
      questions: [
        { q: 'According to the text, what leads to significant results?', options: ['Dramatic changes', 'Small consistent actions', 'Doing nothing', 'Reading once a year'], correctAnswer: 'Small consistent actions' },
        { q: 'What is more important than intensity?', options: ['Speed', 'Consistency', 'Luck', 'Money'], correctAnswer: 'Consistency' },
        { q: 'What example is given in the text?', options: ['Running a marathon', 'Reading ten pages a day', 'Learning a new language', 'Cooking every meal'], correctAnswer: 'Reading ten pages a day' },
      ],
    },
    C1: {
      title: 'The Ethics of Artificial Intelligence',
      paragraphs: [
        'As artificial intelligence becomes more capable, questions about accountability grow increasingly complex. When an autonomous system makes a harmful decision, determining who bears responsibility remains a contentious issue.',
        'Many experts argue that transparent design and rigorous testing can mitigate, but not entirely eliminate, these risks.',
      ],
      questions: [
        { q: 'What issue does the text mainly discuss?', options: ['The cost of AI', 'Accountability for AI decisions', 'The speed of computers', 'The history of robots'], correctAnswer: 'Accountability for AI decisions' },
        { q: 'What can mitigate the risks according to experts?', options: ['Ignoring the problem', 'Transparent design and rigorous testing', 'Banning all AI', 'Faster hardware'], correctAnswer: 'Transparent design and rigorous testing' },
        { q: 'The word "contentious" is closest in meaning to...', options: ['Simple', 'Debatable', 'Boring', 'Obsolete'], correctAnswer: 'Debatable' },
      ],
    },
    C2: {
      title: 'Cognitive Biases in Decision-Making',
      paragraphs: [
        'Human judgment is often distorted by cognitive biases, systematic patterns of deviation from rationality. Confirmation bias, for instance, leads individuals to favor information that corroborates pre-existing beliefs while disregarding contradictory evidence.',
        'Recognizing these biases is the first step toward more objective, deliberate decision-making, though complete objectivity may remain an elusive ideal.',
      ],
      questions: [
        { q: 'What is confirmation bias?', options: ['Favoring information that supports existing beliefs', 'Making random decisions', 'Avoiding all decisions', 'Trusting only new information'], correctAnswer: 'Favoring information that supports existing beliefs' },
        { q: 'What is the first step toward objective decision-making?', options: ['Ignoring all evidence', 'Recognizing cognitive biases', 'Avoiding decisions entirely', 'Trusting intuition only'], correctAnswer: 'Recognizing cognitive biases' },
        { q: 'The word "elusive" most likely means...', options: ['Easy to grasp', 'Difficult to achieve or capture', 'Common and simple', 'Loud and clear'], correctAnswer: 'Difficult to achieve or capture' },
      ],
    },
  };

  const LEVEL_LABELS = { A1: 'Pemula', A2: 'Dasar', B1: 'Menengah', B2: 'Menengah Atas', C1: 'Mahir', C2: 'Master' };
  const escapeHtml = window.Englisify.escapeHtml;

  /* ------------------------------------------------------------------
     Util: Fisher-Yates shuffle yang TIDAK memutasi array asli.
     ------------------------------------------------------------------ */
  function shuffle(sourceArray) {
    const copy = sourceArray.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * Menyiapkan satu sesi soal dari data bank level tertentu:
   * - soal disalin & diacak urutannya (array asli tidak berubah)
   * - untuk tiap soal, opsi jawaban disalin jadi objek {text, isCorrect}
   *   lalu diacak, sehingga posisi A/B/C/D berubah tapi isi teks jawaban
   *   dan status benar/salahnya tetap menempel pada teksnya.
   */
  function buildSession(levelData) {
    const shuffledQuestions = shuffle(levelData.questions);
    return shuffledQuestions.map((q) => {
      const optionObjs = q.options.map((text) => ({ text, isCorrect: text === q.correctAnswer }));
      const shuffledOptions = shuffle(optionObjs);
      return { q: q.q, options: shuffledOptions };
    });
  }

  /* ------------------------------------------------------------------
     State
     ------------------------------------------------------------------ */
  let selectedLevel = null;
  let sessionQuestions = [];
  let current = 0;
  let selected = null;
  let answered = false;
  let score = 0;
  const userCorrectFlags = [];

  const el = (id) => document.getElementById(id);
  const stepLevel = el('rtStepLevel');
  const stepReading = el('rtStepReading');
  const levelGrid = el('rtLevelGrid');
  const startBtn = el('rtStartBtn');
  const levelBadge = el('rtLevelBadge');
  const pager = el('rtPager');
  const emptyState = el('rtEmptyState');
  const passageCard = el('rtPassageCard');
  const passageTitle = el('rtPassageTitle');
  const passageBody = el('rtPassageBody');
  const quizStage = el('quizStage');
  const resultStage = el('resultStage');

  /* ---------------- STEP 1: pilih level ---------------- */
  const lockIcon = '<svg class="icon" viewBox="0 0 24 24" style="width:16px;height:16px;"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';

  function renderLevelGrid() {
    levelGrid.innerHTML = LEVELS.map((lv) => {
      const cls = ['card', 'level-card'];
      if (lv.state === 'locked') cls.push('locked');
      if (lv.code === selectedLevel) cls.push('selected');
      const badgeContent = lv.state === 'locked' ? lockIcon : lv.code;
      return (
        '<div class="' + cls.join(' ') + '" data-code="' + lv.code + '" data-state="' + lv.state + '">' +
          '<div class="lv-top"><div class="lv-badge">' + badgeContent + '</div></div>' +
          '<div class="lv-title">' + lv.code + ' &middot; ' + lv.name + '</div>' +
          '<div class="lv-desc">' + lv.desc + '</div>' +
        '</div>'
      );
    }).join('');

  }

  levelGrid.addEventListener('click', (event) => {
    const cardEl = event.target.closest('.level-card');
    if (!cardEl) return;
    const code = cardEl.dataset.code;
    if (cardEl.dataset.state === 'locked') {
      window.Englisify.toast('Selesaikan level sebelumnya untuk membuka ' + code);
      return;
    }
    selectedLevel = code;
    renderLevelGrid();
    startBtn.disabled = false;
  });

  startBtn.addEventListener('click', () => {
    if (!selectedLevel) return;
    beginSession(selectedLevel);
  });

  el('rtBackToLevel').addEventListener('click', () => {
    stepReading.classList.add('hidden');
    stepLevel.classList.remove('hidden');
  });

  /* ---------------- STEP 2: sesi reading test ---------------- */
  function resetVisibility() {
    resultStage.classList.add('hidden');
    quizStage.classList.remove('hidden');
    passageCard.classList.remove('hidden');
    document.querySelector('#rtStepReading .card-row').classList.remove('hidden');
  }

  function beginSession(levelCode) {
    const levelData = READING_BANK[levelCode];
    levelBadge.textContent = 'Level ' + levelCode + ' \u00b7 ' + (LEVEL_LABELS[levelCode] || '');
    stepLevel.classList.add('hidden');
    stepReading.classList.remove('hidden');
    current = 0;
    score = 0;
    userCorrectFlags.length = 0;

    if (!levelData || !levelData.questions || levelData.questions.length === 0) {
      emptyState.classList.remove('hidden');
      passageCard.classList.add('hidden');
      quizStage.classList.add('hidden');
      resultStage.classList.add('hidden');
      document.querySelector('#rtStepReading .card-row').classList.add('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    resetVisibility();

    passageTitle.textContent = levelData.title;
    passageBody.replaceChildren(...levelData.paragraphs.map((paragraph) => {
      const element = document.createElement('p');
      element.textContent = paragraph;
      return element;
    }));

    // Bangun sesi baru: urutan soal & opsi diacak, data asli tetap utuh.
    sessionQuestions = buildSession(levelData);
    renderQuestion();
  }

  function renderQuestion() {
    pager.textContent = (current + 1) + ' dari ' + sessionQuestions.length;
    const item = sessionQuestions[current];
    selected = null;
    answered = false;

    quizStage.innerHTML =
      '<div class="q-title">' + (current + 1) + '. ' + escapeHtml(item.q) + '</div>' +
      '<div class="option-list" id="optList">' +
        item.options.map((opt, i) =>
          '<div class="option" data-idx="' + i + '"><span class="radio"></span><span>' + escapeHtml(opt.text) + '</span></div>'
        ).join('') +
      '</div>' +
      '<div class="q-feedback" id="qFeedback"></div>' +
      '<button class="btn btn-primary mt-4" id="qAction" disabled>Jawab</button>';

    const optList = el('optList');
    const actionBtn = el('qAction');

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
        const isCorrect = item.options[selected].isCorrect;
        userCorrectFlags.push(isCorrect);
        if (isCorrect) score++;

        const correctIdx = item.options.findIndex((o) => o.isCorrect);
        optList.querySelectorAll('.option').forEach((o) => {
          o.classList.add('disabled');
          const idx = Number(o.dataset.idx);
          if (idx === correctIdx) o.classList.add('correct');
          else if (idx === selected) o.classList.add('wrong');
        });

        const fb = el('qFeedback');
        fb.textContent = isCorrect ? 'Benar! Jawabanmu tepat.' : 'Kurang tepat. Jawaban yang benar sudah ditandai hijau.';
        fb.className = 'q-feedback show ' + (isCorrect ? 'ok' : 'bad');

        actionBtn.textContent = current === sessionQuestions.length - 1 ? 'Lihat Hasil' : 'Soal Berikutnya';
      } else if (current < sessionQuestions.length - 1) {
        current++;
        renderQuestion();
      } else {
        showResult();
      }
    });
  }

  function showResult() {
    quizStage.classList.add('hidden');
    passageCard.classList.add('hidden');
    document.querySelector('#rtStepReading .card-row').classList.add('hidden');
    resultStage.classList.remove('hidden');

    const percent = Math.round((score / sessionQuestions.length) * 100);
    const passed = percent >= 60;
    const circumference = 2 * Math.PI * 60;
    const offset = circumference - (percent / 100) * circumference;

    resultStage.innerHTML =
      '<div class="score-ring"><svg viewBox="0 0 140 140">' +
        '<circle cx="70" cy="70" r="60" stroke="var(--border-color)" stroke-width="12" fill="none"/>' +
        '<circle cx="70" cy="70" r="60" stroke="' + (passed ? '#12b76a' : '#ef4444') + '" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '"/>' +
      '</svg><div class="score-text">' + percent + '<small>dari 100</small></div></div>' +
      '<h2 style="font-size:19px;font-weight:700;margin-bottom:6px;">' + (passed ? 'Kerja bagus! \ud83c\udf89' : 'Ayo coba lagi!') + '</h2>' +
      '<p style="color:var(--text-secondary);font-size:14px;">Kamu menjawab benar ' + score + ' dari ' + sessionQuestions.length + ' soal.</p>' +
      '<div class="result-breakdown">' +
        sessionQuestions.map((q, i) =>
          '<div class="result-row"><span>Soal ' + (i + 1) + '</span><span class="val" style="color:' + (userCorrectFlags[i] ? '#12b76a' : '#ef4444') + '">' + (userCorrectFlags[i] ? 'Benar' : 'Salah') + '</span></div>'
        ).join('') +
      '</div>' +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:24px;">' +
        '<button class="btn btn-outline" id="btnRetry">Ulangi Level Ini</button>' +
        '<button class="btn btn-outline" id="btnChooseAnother">Pilih Level Lain</button>' +
        '<a href="beranda.html" class="btn btn-primary">Kembali ke Beranda</a>' +
      '</div>';

    el('btnRetry').addEventListener('click', () => beginSession(selectedLevel));
    el('btnChooseAnother').addEventListener('click', () => {
      stepReading.classList.add('hidden');
      stepLevel.classList.remove('hidden');
    });
  }

  renderLevelGrid();
});
