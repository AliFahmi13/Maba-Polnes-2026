/* ==========================================================================
   Englisify — Flashcard logic (dengan pemilihan level + randomisasi sesi)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  window.Englisify.startLearningSession('flashcard');

  /* ------------------------------------------------------------------
     Flashcard Repository: Loads ALL data from Supabase (no local fallback)
     ------------------------------------------------------------------ */
  const localFlashcardRepository = {
    async getAll() {
      if (!window.EnglisifySupabase || typeof window.EnglisifySupabase.getFlashcards !== 'function') return [];
      const rows = await window.EnglisifySupabase.getFlashcards();
      const typeLabels = { noun: 'kata benda', verb: 'kata kerja', adjective: 'kata sifat' };
      return rows
        .filter((card) => card && typeof card.word === 'string' && card.word.trim())
        .map((card) => {
          const type = String(card.type || card.word_type || 'noun').toLowerCase();
          return {
            id: card.id,
            level: card.level || '',
            word: card.word.trim(),
            ipa: card.ipa || '',
            type,
            typeLabel: typeLabels[type] || type,
            meaning: String(card.meaning || card.translation || card.definition || '').trim(),
            example: card.example || card.example_sentence || `"${card.word.trim()}"`,
          };
        })
        .filter((card) => card.meaning);
    },
  };
  const flashcardRepository = window.Englisify.flashcardRepository || localFlashcardRepository;
  window.Englisify.flashcardRepository = flashcardRepository;

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
  let deck = [];
  let index = 0;
  let flipped = false;
  let redoCount = 0;
  let redoLimit = window.Englisify.getFlashcardRedoLimit();
  const favorites = new Set();
  const FAVORITES_KEY = 'englisify-flashcard-favorites';

  const el = (id) => document.getElementById(id);
  const stepLevel = el('fcStepLevel');
  const stepDeck = el('fcStepDeck');
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
  const previousBtn = el('fcPreviousBtn');
  const active = el('fcActive'), done = el('fcDone');
  const sessionSummary = el('fcSessionSummary');

  function renderSessionSummary() {
    const target = window.Englisify.getFlashcardTarget();
    const redo = window.Englisify.getFlashcardRedoLimit();
    if (sessionSummary) sessionSummary.textContent = `${target} kartu utama · ${redo} kartu ulang maksimal`;
  }

  startBtn.addEventListener('click', () => {
    beginSession();
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
  async function beginSession() {
    let bank = [];
    try {
      bank = await flashcardRepository.getAll();
      console.log('Loaded flashcards:', bank.length, 'cards');
    } catch (error) {
      console.error('Flashcard loading error:', error);
      window.Englisify.toast('Gagal memuat flashcard: ' + error.message);
    }
    const targetCount = window.Englisify.getFlashcardTarget();
    levelBadge.textContent = 'Semua Level';
    stepLevel.classList.add('hidden');
    stepDeck.classList.remove('hidden');
    done.classList.add('hidden');
    favorites.clear();
    window.Englisify.accountStore.getJSON(FAVORITES_KEY, []).forEach((word) => favorites.add(String(word).toLowerCase()));
    index = 0;
    redoCount = 0;
    redoLimit = window.Englisify.getFlashcardRedoLimit();

    if (bank.length === 0) {
      emptyState.classList.remove('hidden');
      progressWrap.classList.add('hidden');
      active.classList.add('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    progressWrap.classList.remove('hidden');
    active.classList.remove('hidden');

    // Shuffle and fill deck from Supabase data
    deck = [];
    let source = shuffle(bank);
    while (deck.length < targetCount) {
      if (source.length === 0) source = shuffle(bank);
      deck.push(source.shift());
    }
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
    favBtn.classList.toggle('on', favorites.has(item.word.toLowerCase()));
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
      const doneSummary = el('fcDoneSummary');
      if (doneSummary) doneSummary.textContent = `Kamu sudah mereview ${deck.length} kartu. Kerja bagus!`;
      return;
    }
    index = newIndex;
    render();
  }

  previousBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    if (index > 0) goTo(index - 1);
  });

  card.addEventListener('click', flip);

  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const wordKey = deck[index].word.toLowerCase();
    favorites.has(wordKey) ? favorites.delete(wordKey) : favorites.add(wordKey);
    window.Englisify.accountStore.setJSON(FAVORITES_KEY, [...favorites]);
    favBtn.classList.toggle('on', favorites.has(wordKey));
    window.Englisify.toast(favorites.has(wordKey) ? 'Ditambahkan ke favorit' : 'Dihapus dari favorit');
  });

  audioBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!window.Englisify.isSoundEnabled()) {
      window.Englisify.toast('Efek suara dimatikan — aktifkan lagi di Pengaturan');
      return;
    }
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
    btn.addEventListener('click', async () => {
      const labels = { forgot: 'Ditandai: Lupa', hard: 'Ditandai: Sulit', good: 'Ditandai: Ingat', easy: 'Ditandai: Mudah' };
      if ((btn.dataset.rate === 'forgot' || btn.dataset.rate === 'hard') && redoCount < redoLimit) {
        deck.push(deck[index]);
        redoCount++;
      }
      window.Englisify.recordFlashcardReview(deck[index], btn.dataset.rate);
      
      // Also record to vocabulary history for Supabase tracking
      if (window.EnglisifySupabase && typeof window.EnglisifySupabase.recordVocabularyReview === 'function') {
        window.EnglisifySupabase.recordVocabularyReview(deck[index].word, btn.dataset.rate)
          .then(() => {
            // Sync words learned count after recording
            if (window.Englisify.syncWordsLearnedFromHistory) {
              window.Englisify.syncWordsLearnedFromHistory();
            }
          })
          .catch((error) => console.warn('Vocabulary review tracking skipped:', error));
      }
      
      window.Englisify.toast(labels[btn.dataset.rate]);
      goTo(index + 1);
    });
  });

  el('fcRestart').addEventListener('click', () => {
    beginSession();
  });

  document.addEventListener('keydown', (e) => {
    if (stepDeck.classList.contains('hidden') || active.classList.contains('hidden')) return;
    if (e.key === ' ') { e.preventDefault(); flip(); }
  });

  renderSessionSummary();
});
