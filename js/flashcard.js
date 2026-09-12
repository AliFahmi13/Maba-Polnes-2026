/* ==========================================================================
   Englisify — Flashcard logic (dengan pemilihan level + randomisasi sesi)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------------------------------
     Level metadata — konsisten dengan Beranda & Ujian Level.
     state: 'done' | 'current' | 'locked'
     ------------------------------------------------------------------ */
  const LEVELS = [
    { code: 'A1', name: 'Pemula', desc: 'Kosakata dasar & kalimat sederhana.', state: 'done' },
    { code: 'A2', name: 'Dasar', desc: 'Bahasa Inggris sehari-hari & ekspresi umum.', state: 'done' },
    { code: 'B1', name: 'Menengah', desc: 'Memahami percakapan dan teks sehari-hari.', state: 'current' },
    { code: 'B2', name: 'Menengah Atas', desc: 'Berkomunikasi dengan lebih lancar.', state: 'locked' },
    { code: 'C1', name: 'Mahir', desc: 'Memahami bahasa Inggris kompleks.', state: 'locked' },
    { code: 'C2', name: 'Master', desc: 'Penguasaan bahasa Inggris tingkat tinggi.', state: 'locked' },
  ];

  /* ------------------------------------------------------------------
     Bank kata per level — TIDAK PERNAH dimutasi langsung.
     Setiap kali sesi dimulai, kita bikin SALINAN lalu diacak.
     ------------------------------------------------------------------ */
  const WORD_BANK = {
    A1: [
      { word: 'apple', ipa: '/ˈæpəl/', type: 'noun', typeLabel: 'kata benda', meaning: 'Buah apel.', example: '"I eat an apple every morning."' },
      { word: 'house', ipa: '/haʊs/', type: 'noun', typeLabel: 'kata benda', meaning: 'Rumah, tempat tinggal.', example: '"This is my house."' },
      { word: 'book', ipa: '/bʊk/', type: 'noun', typeLabel: 'kata benda', meaning: 'Buku.', example: '"She is reading a book."' },
      { word: 'school', ipa: '/skuːl/', type: 'noun', typeLabel: 'kata benda', meaning: 'Sekolah.', example: '"He goes to school by bus."' },
      { word: 'chair', ipa: '/tʃɛər/', type: 'noun', typeLabel: 'kata benda', meaning: 'Kursi.', example: '"Please sit on the chair."' },
      { word: 'water', ipa: '/ˈwɔːtər/', type: 'noun', typeLabel: 'kata benda', meaning: 'Air.', example: '"I drink water every day."' },
      { word: 'family', ipa: '/ˈfæməli/', type: 'noun', typeLabel: 'kata benda', meaning: 'Keluarga.', example: '"My family is very important to me."' },
      { word: 'friend', ipa: '/frɛnd/', type: 'noun', typeLabel: 'kata benda', meaning: 'Teman.', example: '"She is my best friend."' },
    ],
    A2: [
      { word: 'weather', ipa: '/ˈwɛðər/', type: 'noun', typeLabel: 'kata benda', meaning: 'Cuaca.', example: '"The weather is nice today."' },
      { word: 'borrow', ipa: '/ˈbɒroʊ/', type: 'verb', typeLabel: 'kata kerja', meaning: 'Meminjam.', example: '"Can I borrow your pen?"' },
      { word: 'early', ipa: '/ˈɜːrli/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Awal, pagi-pagi.', example: '"I woke up early this morning."' },
      { word: 'holiday', ipa: '/ˈhɒlɪdeɪ/', type: 'noun', typeLabel: 'kata benda', meaning: 'Hari libur, liburan.', example: '"We are planning a holiday next month."' },
      { word: 'difficult', ipa: '/ˈdɪfɪkəlt/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Sulit.', example: '"This exercise is quite difficult."' },
      { word: 'arrive', ipa: '/əˈraɪv/', type: 'verb', typeLabel: 'kata kerja', meaning: 'Tiba, sampai.', example: '"The train will arrive at noon."' },
      { word: 'crowded', ipa: '/ˈkraʊdɪd/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Ramai, penuh sesak.', example: '"The mall was very crowded on weekends."' },
      { word: 'remember', ipa: '/rɪˈmɛmbər/', type: 'verb', typeLabel: 'kata kerja', meaning: 'Mengingat.', example: "\"I can't remember his name.\"" },
    ],
    B1: [
      { word: 'departure', ipa: '/dɪˈpɑːrtʃər/', type: 'noun', typeLabel: 'kata benda', meaning: 'Tindakan meninggalkan suatu tempat, terutama untuk memulai perjalanan.', example: '"Our departure is at 7:30 tomorrow."' },
      { word: 'reliable', ipa: '/rɪˈlaɪəbl/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Dapat dipercaya atau diandalkan secara konsisten.', example: '"She is a reliable friend who always keeps her word."' },
      { word: 'neighborhood', ipa: '/ˈneɪbərhʊd/', type: 'noun', typeLabel: 'kata benda', meaning: 'Lingkungan atau area tempat tinggal di sekitar seseorang.', example: '"We took a walk around the neighborhood."' },
      { word: 'opportunity', ipa: '/ˌɒpərˈtjuːnəti/', type: 'noun', typeLabel: 'kata benda', meaning: 'Kesempatan atau peluang untuk melakukan sesuatu.', example: '"This job is a great opportunity for her career."' },
      { word: 'improve', ipa: '/ɪmˈpruːv/', type: 'verb', typeLabel: 'kata kerja', meaning: 'Membuat atau menjadi lebih baik dari sebelumnya.', example: '"He wants to improve his English speaking skills."' },
      { word: 'experience', ipa: '/ɪkˈspɪəriəns/', type: 'noun', typeLabel: 'kata benda', meaning: 'Pengetahuan atau keterampilan yang didapat dari melakukan sesuatu.', example: '"Living abroad was an unforgettable experience."' },
      { word: 'comfortable', ipa: '/ˈkʌmftəbl/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Merasa nyaman, tenang, tanpa rasa sakit atau kekhawatiran.', example: '"Make yourself comfortable on the sofa."' },
      { word: 'surroundings', ipa: '/səˈraʊndɪŋz/', type: 'noun', typeLabel: 'kata benda', meaning: 'Lingkungan atau kondisi sekitar suatu tempat.', example: '"The hotel is set in beautiful surroundings."' },
      { word: 'routine', ipa: '/ruːˈtiːn/', type: 'noun', typeLabel: 'kata benda', meaning: 'Rangkaian kegiatan tetap yang dilakukan secara teratur.', example: '"Exercise is part of my daily routine."' },
      { word: 'patient', ipa: '/ˈpeɪʃnt/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Mampu menunggu atau menerima sesuatu tanpa mengeluh.', example: '"Please be patient, the results will come soon."' },
    ],
    B2: [
      { word: 'adjust', ipa: '/əˈdʒʌst/', type: 'verb', typeLabel: 'kata kerja', meaning: 'Menyesuaikan diri atau mengubah sesuatu agar lebih sesuai.', example: '"It took time to adjust to the new schedule."' },
      { word: 'unfamiliar', ipa: '/ˌʌnfəˈmɪliər/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Belum dikenal atau tidak familiar.', example: '"The streets felt unfamiliar in the dark."' },
      { word: 'achieve', ipa: '/əˈtʃiːv/', type: 'verb', typeLabel: 'kata kerja', meaning: 'Berhasil mencapai suatu tujuan setelah berusaha.', example: '"She worked hard to achieve her goals."' },
      { word: 'confident', ipa: '/ˈkɒnfɪdənt/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Merasa yakin akan kemampuan diri sendiri.', example: '"He felt confident before the job interview."' },
      { word: 'gesture', ipa: '/ˈdʒestʃər/', type: 'noun', typeLabel: 'kata benda', meaning: 'Gerakan tubuh atau tangan untuk menyampaikan sesuatu.', example: '"She waved as a friendly gesture."' },
      { word: 'encourage', ipa: '/ɪnˈkʌrɪdʒ/', type: 'verb', typeLabel: 'kata kerja', meaning: 'Memberi semangat atau dorongan kepada seseorang.', example: '"His teacher encouraged him to keep practicing."' },
      { word: 'boundary', ipa: '/ˈbaʊndri/', type: 'noun', typeLabel: 'kata benda', meaning: 'Batas yang memisahkan satu wilayah dari wilayah lain.', example: '"The river forms a natural boundary between the towns."' },
      { word: 'genuine', ipa: '/ˈdʒenjuɪn/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Asli dan tulus, tidak dibuat-buat.', example: '"Her smile was warm and genuine."' },
    ],
    C1: [
      { word: 'ambiguous', ipa: '/æmˈbɪɡjuəs/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Ambigu, memiliki lebih dari satu arti.', example: '"His answer was ambiguous and confusing."' },
      { word: 'meticulous', ipa: '/məˈtɪkjələs/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Sangat teliti dan hati-hati.', example: '"She is meticulous about her work."' },
      { word: 'resilience', ipa: '/rɪˈzɪliəns/', type: 'noun', typeLabel: 'kata benda', meaning: 'Ketahanan atau kemampuan bangkit dari kesulitan.', example: '"Resilience helped him recover from failure."' },
      { word: 'articulate', ipa: '/ɑːrˈtɪkjəleɪt/', type: 'verb', typeLabel: 'kata kerja', meaning: 'Mengungkapkan pikiran dengan jelas.', example: '"He can articulate his ideas very clearly."' },
      { word: 'plausible', ipa: '/ˈplɔːzəbl/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Masuk akal, dapat dipercaya.', example: '"That explanation sounds plausible."' },
      { word: 'discrepancy', ipa: '/dɪˈskrɛpənsi/', type: 'noun', typeLabel: 'kata benda', meaning: 'Perbedaan atau ketidaksesuaian.', example: '"There was a discrepancy in the report."' },
      { word: 'inevitable', ipa: '/ɪnˈɛvɪtəbl/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Tidak dapat dihindari.', example: '"Change is inevitable in life."' },
      { word: 'underlying', ipa: '/ˌʌndərˈlaɪɪŋ/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Mendasar, yang menjadi dasar sesuatu.', example: '"We need to find the underlying cause."' },
    ],
    C2: [
      { word: 'ubiquitous', ipa: '/juːˈbɪkwɪtəs/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Ada di mana-mana.', example: '"Smartphones have become ubiquitous."' },
      { word: 'ephemeral', ipa: '/ɪˈfɛmərəl/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Sementara, cepat berlalu.', example: '"Fame can be ephemeral."' },
      { word: 'paradigm', ipa: '/ˈpærədaɪm/', type: 'noun', typeLabel: 'kata benda', meaning: 'Pola pikir atau kerangka acuan umum.', example: '"This discovery created a new paradigm."' },
      { word: 'eloquent', ipa: '/ˈɛləkwənt/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Fasih dan meyakinkan dalam berbicara.', example: '"She gave an eloquent speech."' },
      { word: 'nuance', ipa: '/ˈnjuːɑːns/', type: 'noun', typeLabel: 'kata benda', meaning: 'Perbedaan makna yang sangat halus.', example: '"Translation often loses subtle nuance."' },
      { word: 'cognizant', ipa: '/ˈkɒɡnɪzənt/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Menyadari sepenuhnya.', example: '"He was cognizant of the risks involved."' },
      { word: 'juxtapose', ipa: '/ˈdʒʌkstəpoʊz/', type: 'verb', typeLabel: 'kata kerja', meaning: 'Menempatkan dua hal berdampingan untuk dibandingkan.', example: '"The film juxtaposes past and present."' },
      { word: 'quintessential', ipa: '/ˌkwɪntɪˈsɛnʃəl/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Paling khas atau paling mewakili sesuatu.', example: "\"It's the quintessential example of good design.\"" },
    ],
  };

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

  /* ------------------------------------------------------------------
     State
     ------------------------------------------------------------------ */
  let selectedLevel = null;
  let deck = [];
  let index = 0;
  let flipped = false;
  const favorites = new Set();

  const el = (id) => document.getElementById(id);
  const stepLevel = el('fcStepLevel');
  const stepDeck = el('fcStepDeck');
  const levelGrid = el('fcLevelGrid');
  const startBtn = el('fcStartBtn');
  const levelBadge = el('fcLevelBadge');
  const emptyState = el('fcEmptyState');
  const progressWrap = el('fcProgressWrap');

  const wordEl = el('fcWord'), ipaEl = el('fcIpa'), typeEl = el('fcType');
  const meaningEl = el('fcMeaning'), exampleEl = el('fcExample');
  const front = el('fcFront'), back = el('fcBack');
  const card = el('flashcard');
  const countEl = el('fcCount'), barEl = el('fcProgressBar');
  const favBtn = el('fcFavBtn'), audioBtn = el('fcAudioBtn');
  const active = el('fcActive'), done = el('fcDone');

  /* ---------------- STEP 1: pilih level ---------------- */
  const lockIcon = `<svg class="icon" viewBox="0 0 24 24" style="width:16px;height:16px;"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`;

  function renderLevelGrid() {
    levelGrid.innerHTML = LEVELS.map((lv) => {
      const cls = ['card', 'level-card'];
      if (lv.state === 'locked') cls.push('locked');
      if (lv.code === selectedLevel) cls.push('selected');
      const badgeContent = lv.state === 'locked' ? lockIcon : lv.code;
      return `
        <div class="${cls.join(' ')}" data-code="${lv.code}" data-state="${lv.state}">
          <div class="lv-top"><div class="lv-badge">${badgeContent}</div></div>
          <div class="lv-title">${lv.code} · ${lv.name}</div>
          <div class="lv-desc">${lv.desc}</div>
        </div>`;
    }).join('');

    levelGrid.querySelectorAll('.level-card').forEach((cardEl) => {
      cardEl.addEventListener('click', () => {
        const code = cardEl.dataset.code;
        const state = cardEl.dataset.state;
        if (state === 'locked') {
          window.Englisify.toast(`Selesaikan level sebelumnya untuk membuka ${code}`);
          return;
        }
        selectedLevel = code;
        renderLevelGrid();
        startBtn.disabled = false;
      });
    });
  }

  startBtn.addEventListener('click', () => {
    if (!selectedLevel) return;
    beginSession(selectedLevel);
  });

  el('fcBackToLevel').addEventListener('click', () => {
    stepDeck.classList.add('hidden');
    stepLevel.classList.remove('hidden');
  });

  el('fcChooseAnother').addEventListener('click', () => {
    done.classList.add('hidden');
    stepDeck.classList.add('hidden');
    stepLevel.classList.remove('hidden');
  });

  /* ---------------- STEP 2: sesi flashcard ---------------- */
  function beginSession(levelCode) {
    const bank = WORD_BANK[levelCode] || [];
    levelBadge.textContent = levelCode;
    stepLevel.classList.add('hidden');
    stepDeck.classList.remove('hidden');
    done.classList.add('hidden');
    favorites.clear();
    index = 0;

    if (bank.length === 0) {
      emptyState.classList.remove('hidden');
      progressWrap.classList.add('hidden');
      active.classList.add('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    progressWrap.classList.remove('hidden');
    active.classList.remove('hidden');

    // Salin lalu acak urutan kartu — data asli (WORD_BANK) tidak diubah.
    deck = shuffle(bank);
    render();
  }

  function render() {
    const item = deck[index];
    wordEl.textContent = item.word;
    ipaEl.textContent = item.ipa;
    typeEl.textContent = item.typeLabel;
    typeEl.className = `tag ${item.type}`;
    meaningEl.textContent = item.meaning;
    exampleEl.textContent = item.example;
    flipped = false;
    front.classList.add('visible');
    back.classList.remove('visible');
    favBtn.classList.toggle('on', favorites.has(index));
    countEl.textContent = `${index + 1} dari ${deck.length}`;
    barEl.style.width = `${((index + 1) / deck.length) * 100}%`;
  }

  function flip() {
    flipped = !flipped;
    front.classList.toggle('visible', !flipped);
    back.classList.toggle('visible', flipped);
  }

  function goTo(newIndex) {
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= deck.length) {
      active.classList.add('hidden');
      done.classList.remove('hidden');
      return;
    }
    index = newIndex;
    render();
  }

  card.addEventListener('click', flip);
  el('fcPrev').addEventListener('click', () => goTo(index - 1));
  el('fcNext').addEventListener('click', () => goTo(index + 1));

  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    favorites.has(index) ? favorites.delete(index) : favorites.add(index);
    favBtn.classList.toggle('on', favorites.has(index));
    window.Englisify.toast(favorites.has(index) ? 'Ditambahkan ke favorit' : 'Dihapus dari favorit');
  });

  audioBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    try {
      const utter = new SpeechSynthesisUtterance(deck[index].word);
      utter.lang = 'en-US';
      utter.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (err) {
      window.Englisify.toast('Audio tidak tersedia di perangkat ini');
    }
  });

  document.querySelectorAll('.rate-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const labels = { forgot: 'Ditandai: Lupa', hard: 'Ditandai: Sulit', good: 'Ditandai: Ingat', easy: 'Ditandai: Mudah' };
      window.Englisify.toast(labels[btn.dataset.rate]);
      goTo(index + 1);
    });
  });

  el('fcRestart').addEventListener('click', () => {
    // Mulai ulang level yang sama dengan urutan baru (di-shuffle ulang).
    beginSession(selectedLevel);
  });

  document.addEventListener('keydown', (e) => {
    if (stepDeck.classList.contains('hidden') || active.classList.contains('hidden')) return;
    if (e.key === 'ArrowLeft') goTo(index - 1);
    if (e.key === 'ArrowRight') goTo(index + 1);
    if (e.key === ' ') { e.preventDefault(); flip(); }
  });

  renderLevelGrid();
});
