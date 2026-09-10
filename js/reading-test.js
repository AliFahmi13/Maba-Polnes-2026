/* ==========================================================================
   Englisify — Reading Test logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const questions = [
    {
      q: 'Apa yang dapat membantu seseorang merasa lebih nyaman di kota baru?',
      options: ['Menghindari aktivitas sehari-hari', 'Mempelajari rutinitas kecil', 'Tidak berbicara dengan orang lain', 'Segera pindah ke kota lain'],
      correct: 1,
      feedbackOk: 'Benar! Membangun rutinitas kecil membantu seseorang merasa lebih nyaman di lingkungan baru.',
      feedbackBad: 'Kurang tepat. Bacaan menyebutkan bahwa membangun rutinitas kecil membantu seseorang beradaptasi.',
    },
    {
      q: 'Menurut bacaan, apa yang biasanya dirasakan seseorang di awal pindah ke kota baru?',
      options: ['Sangat percaya diri', 'Bosan dan mengantuk', 'Semuanya terasa baru dan asing', 'Tidak ada perubahan sama sekali'],
      correct: 2,
      feedbackOk: 'Benar! Di awal, semuanya bisa terasa baru dan tidak familiar (unfamiliar).',
      feedbackBad: 'Kurang tepat. Bacaan menyebutkan semuanya bisa terasa baru dan asing pada awalnya.',
    },
    {
      q: 'Kata "adjust" pada bacaan paling dekat artinya dengan...',
      options: ['Menyesuaikan diri', 'Menjauh', 'Menjual', 'Menunda'],
      correct: 0,
      feedbackOk: 'Benar! "Adjust" berarti menyesuaikan diri dengan lingkungan baru.',
      feedbackBad: 'Kurang tepat. "Adjust" berarti menyesuaikan diri.',
    },
    {
      q: 'Sikap apa yang disarankan bacaan saat beradaptasi dengan lingkungan baru?',
      options: ['Terburu-buru', 'Bersikap sabar (patient)', 'Mengabaikan lingkungan sekitar', 'Membandingkan dengan kota lama terus-menerus'],
      correct: 1,
      feedbackOk: 'Tepat sekali! Bacaan menekankan pentingnya bersikap sabar terhadap diri sendiri.',
      feedbackBad: 'Kurang tepat. Bacaan menekankan pentingnya bersikap sabar (patient) pada diri sendiri.',
    },
    {
      q: 'Manakah cara beradaptasi yang disebutkan dalam bacaan?',
      options: ['Bertemu orang baru', 'Berdiam diri di rumah', 'Menghindari eksplorasi', 'Mengubah rutinitas setiap hari'],
      correct: 0,
      feedbackOk: 'Benar! Bertemu orang baru adalah salah satu cara beradaptasi yang disebutkan.',
      feedbackBad: 'Kurang tepat. Bacaan menyebutkan bertemu orang baru sebagai salah satu caranya.',
    },
  ];

  let current = 0;
  let selected = null;
  let answered = false;
  let score = 0;
  const userAnswers = [];

  const quizStage = document.getElementById('quizStage');
  const resultStage = document.getElementById('resultStage');
  const pager = document.getElementById('rtPager');

  function renderQuestion() {
    pager.textContent = `${current + 1} dari ${questions.length}`;
    const item = questions[current];
    selected = null;
    answered = false;

    quizStage.innerHTML = `
      <div class="q-title">${current + 1}. ${item.q}</div>
      <div class="option-list" id="optList">
        ${item.options.map((opt, i) => `
          <div class="option" data-idx="${i}">
            <span class="radio"></span>
            <span>${opt}</span>
          </div>`).join('')}
      </div>
      <div class="q-feedback" id="qFeedback"></div>
      <button class="btn btn-primary mt-4" id="qAction" disabled>Jawab</button>
    `;

    const optList = document.getElementById('optList');
    const actionBtn = document.getElementById('qAction');

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
        const isCorrect = selected === item.correct;
        if (isCorrect) score++;

        optList.querySelectorAll('.option').forEach((o) => {
          o.classList.add('disabled');
          const idx = Number(o.dataset.idx);
          if (idx === item.correct) o.classList.add('correct');
          else if (idx === selected) o.classList.add('wrong');
        });

        const fb = document.getElementById('qFeedback');
        fb.textContent = isCorrect ? item.feedbackOk : item.feedbackBad;
        fb.className = `q-feedback show ${isCorrect ? 'ok' : 'bad'}`;

        actionBtn.textContent = current === questions.length - 1 ? 'Lihat Hasil' : 'Soal Berikutnya';
      } else {
        if (current < questions.length - 1) {
          current++;
          renderQuestion();
        } else {
          showResult();
        }
      }
    });
  }

  function showResult() {
    quizStage.classList.add('hidden');
    resultStage.classList.remove('hidden');
    document.querySelector('.reading-pass').classList.add('hidden');
    document.querySelector('.reading-layout > .card-row').classList.add('hidden');

    const percent = Math.round((score / questions.length) * 100);
    const passed = percent >= 60;
    const circumference = 2 * Math.PI * 60;
    const offset = circumference - (percent / 100) * circumference;

    resultStage.innerHTML = `
      <div class="score-ring">
        <svg viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="60" stroke="var(--border-color)" stroke-width="12" fill="none"/>
          <circle cx="70" cy="70" r="60" stroke="${passed ? '#12b76a' : '#ef4444'}" stroke-width="12" fill="none"
            stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
        </svg>
        <div class="score-text">${percent}<small>dari 100</small></div>
      </div>
      <h2 style="font-size:19px;font-weight:700;margin-bottom:6px;">${passed ? 'Kerja bagus! 🎉' : 'Ayo coba lagi!'}</h2>
      <p style="color:var(--text-secondary);font-size:14px;">Kamu menjawab benar ${score} dari ${questions.length} soal.</p>

      <div class="result-breakdown">
        ${questions.map((q, i) => `
          <div class="result-row">
            <span>Soal ${i + 1}</span>
            <span class="val" style="color:${userAnswers[i] === q.correct ? '#12b76a' : '#ef4444'}">
              ${userAnswers[i] === q.correct ? 'Benar' : 'Salah'}
            </span>
          </div>`).join('')}
      </div>

      <div style="display:flex;gap:10px;justify-content:center;margin-top:24px;">
        <button class="btn btn-outline" id="btnRetry">Ulangi Tes</button>
        <a href="index.html" class="btn btn-primary">Kembali ke Beranda</a>
      </div>
    `;

    document.getElementById('btnRetry').addEventListener('click', () => {
      current = 0;
      score = 0;
      userAnswers.length = 0;
      resultStage.classList.add('hidden');
      quizStage.classList.remove('hidden');
      document.querySelector('.reading-pass').classList.remove('hidden');
      document.querySelector('.reading-layout > .card-row').classList.remove('hidden');
      renderQuestion();
    });
  }

  renderQuestion();
});