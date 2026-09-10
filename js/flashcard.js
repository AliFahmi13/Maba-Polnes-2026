/* ==========================================================================
   Englisify — Flashcard logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const deck = [
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
    { word: 'adjust', ipa: '/əˈdʒʌst/', type: 'verb', typeLabel: 'kata kerja', meaning: 'Menyesuaikan diri atau mengubah sesuatu agar lebih sesuai.', example: '"It took time to adjust to the new schedule."' },
    { word: 'unfamiliar', ipa: '/ˌʌnfəˈmɪliər/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Belum dikenal atau tidak familiar.', example: '"The streets felt unfamiliar in the dark."' },
    { word: 'achieve', ipa: '/əˈtʃiːv/', type: 'verb', typeLabel: 'kata kerja', meaning: 'Berhasil mencapai suatu tujuan setelah berusaha.', example: '"She worked hard to achieve her goals."' },
    { word: 'confident', ipa: '/ˈkɒnfɪdənt/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Merasa yakin akan kemampuan diri sendiri.', example: '"He felt confident before the job interview."' },
    { word: 'gesture', ipa: '/ˈdʒestʃər/', type: 'noun', typeLabel: 'kata benda', meaning: 'Gerakan tubuh atau tangan untuk menyampaikan sesuatu.', example: '"She waved as a friendly gesture."' },
    { word: 'encourage', ipa: '/ɪnˈkʌrɪdʒ/', type: 'verb', typeLabel: 'kata kerja', meaning: 'Memberi semangat atau dorongan kepada seseorang.', example: '"His teacher encouraged him to keep practicing."' },
    { word: 'boundary', ipa: '/ˈbaʊndri/', type: 'noun', typeLabel: 'kata benda', meaning: 'Batas yang memisahkan satu wilayah dari wilayah lain.', example: '"The river forms a natural boundary between the towns."' },
    { word: 'genuine', ipa: '/ˈdʒenjuɪn/', type: 'adjective', typeLabel: 'kata sifat', meaning: 'Asli dan tulus, tidak dibuat-buat.', example: '"Her smile was warm and genuine."' },
    { word: 'accomplish', ipa: '/əˈkɒmplɪʃ/', type: 'verb', typeLabel: 'kata kerja', meaning: 'Menyelesaikan atau berhasil melakukan suatu tugas.', example: '"We accomplished a lot this week."' },
    { word: 'gratitude', ipa: '/ˈɡrætɪtjuːd/', type: 'noun', typeLabel: 'kata benda', meaning: 'Perasaan berterima kasih atau bersyukur.', example: '"He expressed his gratitude for their support."' },
  ];

  let index = 0;
  let flipped = false;
  const favorites = new Set();

  const el = (id) => document.getElementById(id);
  const wordEl = el('fcWord'), ipaEl = el('fcIpa'), typeEl = el('fcType');
  const meaningEl = el('fcMeaning'), exampleEl = el('fcExample');
  const front = el('fcFront'), back = el('fcBack');
  const card = el('flashcard');
  const countEl = el('fcCount'), barEl = el('fcProgressBar');
  const favBtn = el('fcFavBtn'), audioBtn = el('fcAudioBtn');
  const active = el('fcActive'), done = el('fcDone');

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
    index = 0;
    active.classList.remove('hidden');
    done.classList.add('hidden');
    render();
  });

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (active.classList.contains('hidden')) return;
    if (e.key === 'ArrowLeft') goTo(index - 1);
    if (e.key === 'ArrowRight') goTo(index + 1);
    if (e.key === ' ') { e.preventDefault(); flip(); }
  });

  render();
});