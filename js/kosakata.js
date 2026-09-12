/* ==========================================================================
   Englisify — Kosakata (vocabulary) logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const typeLabels = { noun: 'kata benda', verb: 'kata kerja', adjective: 'kata sifat' };

  let vocab = [
    { word: 'departure', meaning: 'keberangkatan', type: 'noun', last: 'Hari ini', next: '1 hari', status: 'review' },
    { word: 'reliable', meaning: 'dapat dipercaya', type: 'adjective', last: 'Besok', next: '3 hari', status: 'dipelajari' },
    { word: 'neighborhood', meaning: 'lingkungan/tempat tinggal', type: 'noun', last: '3 hari lalu', next: '7 hari', status: 'dipelajari' },
    { word: 'opportunity', meaning: 'kesempatan', type: 'noun', last: '5 hari lalu', next: '14 hari', status: 'dipelajari' },
    { word: 'improve', meaning: 'meningkatkan', type: 'verb', last: '6 hari lalu', next: '14 hari', status: 'dipelajari' },
    { word: 'experience', meaning: 'pengalaman', type: 'noun', last: '7 hari lalu', next: '30 hari', status: 'dipelajari' },
    { word: 'comfortable', meaning: 'nyaman', type: 'adjective', last: '2 hari lalu', next: '2 hari', status: 'review' },
    { word: 'routine', meaning: 'rutinitas', type: 'noun', last: 'Hari ini', next: '1 hari', status: 'review' },
    { word: 'patient', meaning: 'sabar', type: 'adjective', last: '4 hari lalu', next: '10 hari', status: 'dipelajari' },
    { word: 'achieve', meaning: 'mencapai', type: 'verb', last: '1 hari lalu', next: '5 hari', status: 'dipelajari' },
  ];

  let currentFilter = 'semua';
  let searchTerm = '';

  const escapeHtml = window.Englisify.escapeHtml;

  const tbody = document.getElementById('vocabBody');
  const searchInput = document.getElementById('vocabSearch');

  function iconMore() {
    return `<svg class="icon" viewBox="0 0 24 24" style="width:16px;height:16px;"><circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/></svg>`;
  }
  function iconAudio() {
    return `<svg class="icon" viewBox="0 0 24 24" style="width:16px;height:16px;"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>`;
  }

  function render() {
    let rows = vocab.filter((v) => {
      const matchesFilter = currentFilter === 'semua' ? true : v.status === currentFilter;
      const matchesSearch = v.word.toLowerCase().includes(searchTerm) || v.meaning.toLowerCase().includes(searchTerm);
      return matchesFilter && matchesSearch;
    });

    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Tidak ada kata yang ditemukan.</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map((v, i) => {
      const realIndex = vocab.indexOf(v);
      const dueClass = v.status === 'review' ? 'due-soon' : '';
      const type = Object.prototype.hasOwnProperty.call(typeLabels, v.type) ? v.type : 'noun';
      const word = escapeHtml(v.word);
      const meaning = escapeHtml(v.meaning);
      const last = escapeHtml(v.last);
      const next = escapeHtml(v.next);
      return `
      <tr>
        <td>
          <div class="word-cell">
            <button class="icon-toggle" data-speak="${word}" title="Putar pelafalan">${iconAudio()}</button>
            ${word}
          </div>
        </td>
        <td>${meaning}</td>
        <td><span class="tag ${type}">${typeLabels[type]}</span></td>
        <td>${last}</td>
        <td class="${dueClass}">${next}</td>
        <td>
          <div class="row-menu">
            <button class="menu-btn" data-menu="${realIndex}">${iconMore()}</button>
            <div class="dropdown" data-dropdown="${realIndex}">
              <button data-action="review" data-idx="${realIndex}">
                <svg class="icon" viewBox="0 0 24 24" style="width:14px;height:14px;"><rect x="3" y="4" width="14" height="16" rx="2"/><path d="M17 8h4v12H7"/></svg>
                Review Sekarang
              </button>
              <button data-action="mark" data-idx="${realIndex}">
                <svg class="icon" viewBox="0 0 24 24" style="width:14px;height:14px;"><path d="M20 6 9 17l-5-5"/></svg>
                Tandai Dipelajari
              </button>
              <button class="danger" data-action="delete" data-idx="${realIndex}">
                <svg class="icon" viewBox="0 0 24 24" style="width:14px;height:14px;"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                Hapus
              </button>
            </div>
          </div>
        </td>
      </tr>`;
    }).join('');

    // One listener handles all current and future rows.
    tbody.onclick = (event) => {
      const btn = event.target.closest('button');
      if (!btn || !tbody.contains(btn)) return;

      if (btn.hasAttribute('data-speak')) {
        if (!window.Englisify.isSoundEnabled()) {
          window.Englisify.toast('Efek suara dimatikan — aktifkan lagi di Pengaturan');
          return;
        }
        try {
          const u = new SpeechSynthesisUtterance(btn.dataset.speak);
          u.lang = 'en-US';
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        } catch (e) { /* no-op */ }
        return;
      }

      if (btn.classList.contains('menu-btn')) {
        const dd = tbody.querySelector(`[data-dropdown="${btn.dataset.menu}"]`);
        if (!dd) return;
        const wasOpen = dd.classList.contains('open');
        tbody.querySelectorAll('.dropdown.open').forEach((d) => d.classList.remove('open'));
        if (!wasOpen) dd.classList.add('open');
        return;
      }

      if (btn.hasAttribute('data-action')) {
        const idx = Number(btn.dataset.idx);
        if (!Number.isInteger(idx) || !vocab[idx]) return;
        const action = btn.dataset.action;
        if (action === 'review') {
          window.location.href = 'flashcard.html';
        } else if (action === 'mark') {
          vocab[idx].status = 'dipelajari';
          vocab[idx].next = '14 hari';
          window.Englisify.toast(`"${vocab[idx].word}" ditandai sudah dipelajari`);
          render();
        } else if (action === 'delete') {
          const removed = vocab[idx].word;
          vocab.splice(idx, 1);
          window.Englisify.toast(`"${removed}" dihapus dari daftar kosakata`);
          render();
        }
      }
    };
  }

  // Tabs
  document.querySelectorAll('#vocabTabs .tab-btn').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#vocabTabs .tab-btn').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      render();
    });
  });

  // Search
  searchInput.addEventListener('input', () => {
    searchTerm = searchInput.value.trim().toLowerCase();
    render();
  });

  // Add-word modal
  const overlay = document.getElementById('modalOverlay');
  document.getElementById('btnAddWord').addEventListener('click', () => overlay.classList.add('open'));
  document.getElementById('btnCancelAdd').addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });

  document.getElementById('addWordForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const word = document.getElementById('fWord').value.trim();
    const meaning = document.getElementById('fMeaning').value.trim();
    const type = document.getElementById('fType').value;
    if (!word || !meaning) return;
    vocab.unshift({ word, meaning, type, last: 'Hari ini', next: '1 hari', status: 'review' });
    e.target.reset();
    overlay.classList.remove('open');
    currentFilter = 'semua';
    document.querySelectorAll('#vocabTabs .tab-btn').forEach((t) => t.classList.remove('active'));
    document.querySelector('#vocabTabs .tab-btn[data-filter="semua"]').classList.add('active');
    render();
    window.Englisify.toast(`"${word}" berhasil ditambahkan`);
  });

  render();
});
