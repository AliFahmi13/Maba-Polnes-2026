/* ==========================================================================
   Englisify — Kosakata (vocabulary) logic using flashcard table with history
   User-created words stored in localStorage
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  window.Englisify.startLearningSession('vocabulary');
  const typeLabels = { noun: 'kata benda', verb: 'kata kerja', adjective: 'kata sifat' };
  const USER_WORDS_KEY = 'englisify-user-vocabulary';

  let vocab = [];
  let historyMap = new Map(); // Map of word -> history data
  let isLoading = true;

  // Get user-created words from localStorage
  function getUserWords() {
    try {
      const stored = localStorage.getItem(USER_WORDS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load user words:', error);
      return [];
    }
  }

  // Save user-created words to localStorage
  function saveUserWords(words) {
    try {
      localStorage.setItem(USER_WORDS_KEY, JSON.stringify(words));
    } catch (error) {
      console.error('Failed to save user words:', error);
    }
  }

  // Format date to relative string
  function formatRelativeDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Besok';
    if (diffDays === -1) return 'Kemarin';
    if (diffDays > 1) return `${diffDays} hari lagi`;
    if (diffDays < -1) return `${Math.abs(diffDays)} hari lalu`;
    return '-';
  }

  // Load vocabulary from flashcard table + localStorage + learning history
  async function loadVocabulary() {
    try {
      isLoading = true;
      render(); // Show loading state
      
      console.log('Loading vocabulary...');
      
      // Load flashcards from database
      const flashcards = await window.EnglisifySupabase.getFlashcards();
      console.log('Loaded flashcards:', flashcards.length);
      
      // Load user-created words from localStorage
      const userWords = getUserWords();
      console.log('Loaded user words from localStorage:', userWords.length);
      
      // Load learning history
      const history = await window.EnglisifySupabase.getVocabularyHistory();
      console.log('Loaded history:', history.length);
      
      // Build history map
      historyMap.clear();
      history.forEach((h) => {
        historyMap.set(h.word.toLowerCase(), {
          lastStudied: h.last_studied,
          nextReview: h.next_review,
          reviewCount: h.review_count || 1,
          rating: h.rating || 'good',
        });
      });
      console.log('History map built with', historyMap.size, 'entries');
      
      // Transform flashcard data to vocabulary format with history
      const flashcardVocab = flashcards.map((item) => {
        const wordKey = item.word.toLowerCase();
        const hist = historyMap.get(wordKey);
        
        return {
          id: item.id,
          word: item.word,
          meaning: item.meaning,
          type: item.type || 'noun',
          level: item.level || 'A1',
          ipa: item.ipa || '',
          example: item.example || '',
          source: 'database',
          // Add history data
          last: hist ? formatRelativeDate(hist.lastStudied) : 'Belum dipelajari',
          next: hist ? formatRelativeDate(hist.nextReview) : '-',
          status: hist ? 'dipelajari' : 'review',
          lastStudiedRaw: hist ? hist.lastStudied : null,
          nextReviewRaw: hist ? hist.nextReview : null,
        };
      });
      
      // Transform user words to vocabulary format with history
      const userVocab = userWords.map((item, index) => {
        const wordKey = item.word.toLowerCase();
        const hist = historyMap.get(wordKey);
        
        return {
          id: `user-${index}`,
          word: item.word,
          meaning: item.meaning,
          type: item.type || 'noun',
          level: 'custom',
          ipa: item.ipa || '',
          example: item.example || `"${item.word}"`,
          source: 'user',
          // Add history data
          last: hist ? formatRelativeDate(hist.lastStudied) : 'Belum dipelajari',
          next: hist ? formatRelativeDate(hist.nextReview) : '-',
          status: hist ? 'dipelajari' : 'review',
          lastStudiedRaw: hist ? hist.lastStudied : null,
          nextReviewRaw: hist ? hist.nextReview : null,
        };
      });
      
      // Combine both sources
      vocab = [...flashcardVocab, ...userVocab];
      console.log('Total vocabulary:', vocab.length);
      
      isLoading = false;
      render();
    } catch (error) {
      console.error('Failed to load vocabulary:', error);
      window.Englisify.toast('Gagal memuat kosakata: ' + error.message);
      vocab = [];
      isLoading = false;
      render();
    }
  }

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
    if (isLoading) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Memuat kosakata...</td></tr>`;
      return;
    }

    let rows = vocab.filter((v) => {
      const matchesFilter = currentFilter === 'semua' 
        ? true 
        : currentFilter === 'dipelajari' 
          ? v.status === 'dipelajari'
          : v.status === 'review';
      const matchesSearch = v.word.toLowerCase().includes(searchTerm) || v.meaning.toLowerCase().includes(searchTerm);
      return matchesFilter && matchesSearch;
    });

    if (rows.length === 0) {
      const message = vocab.length === 0 
        ? 'Belum ada kosakata di database. Jalankan seed SQL terlebih dahulu.'
        : currentFilter === 'dipelajari'
          ? 'Belum ada kata yang dipelajari. Belajar flashcard untuk melihat riwayat.'
          : 'Tidak ada kata yang ditemukan.';
      tbody.innerHTML = `<tr><td colspan="6" class="empty-row">${message}</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map((v) => {
      const type = Object.prototype.hasOwnProperty.call(typeLabels, v.type) ? v.type : 'noun';
      const word = escapeHtml(v.word);
      const meaning = escapeHtml(v.meaning);
      const last = escapeHtml(v.last);
      const next = escapeHtml(v.next);
      
      // Check if review is due
      const isDue = v.nextReviewRaw && new Date(v.nextReviewRaw) <= new Date();
      const dueClass = isDue ? 'due-soon' : '';
      
      return `
      <tr>
        <td>
          <div class="word-cell">
            <button class="icon-toggle" data-speak="${word}" title="Putar pelafalan">${iconAudio()}</button>
            ${word}${v.source === 'user' ? ' <small style="color:#888">(custom)</small>' : ''}
          </div>
        </td>
        <td>${meaning}</td>
        <td><span class="tag ${type}">${typeLabels[type]}</span></td>
        <td>${last}</td>
        <td class="${dueClass}">${next}</td>
        <td>
          <div class="row-menu">
            <button class="menu-btn" data-menu="${v.id}">${iconMore()}</button>
            <div class="dropdown" data-dropdown="${v.id}">
              <button data-action="review" data-id="${v.id}">
                <svg class="icon" viewBox="0 0 24 24" style="width:14px;height:14px;"><rect x="3" y="4" width="14" height="16" rx="2"/><path d="M17 8h4v12H7"/></svg>
                ${v.status === 'dipelajari' ? 'Review Lagi' : 'Belajar Sekarang'}
              </button>
              <button data-action="details" data-id="${v.id}">
                <svg class="icon" viewBox="0 0 24 24" style="width:14px;height:14px;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h0"/></svg>
                Lihat Detail
              </button>
              ${v.source === 'user' ? `<button class="danger" data-action="delete" data-id="${v.id}">
                <svg class="icon" viewBox="0 0 24 24" style="width:14px;height:14px;"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                Hapus
              </button>` : ''}
            </div>
          </div>
        </td>
      </tr>`;
    }).join('');

    // One listener handles all current and future rows.
    tbody.onclick = async (event) => {
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
        const id = btn.dataset.id;
        const vocabItem = vocab.find((v) => v.id === id);
        if (!vocabItem) return;
        
        const action = btn.dataset.action;
        if (action === 'review') {
          window.location.href = 'flashcard.html';
        } else if (action === 'details') {
          // Show details modal with full information
          const hist = historyMap.get(vocabItem.word.toLowerCase());
          const histInfo = hist 
            ? `<br><small>Dipelajari ${vocabItem.last} · Review ${vocabItem.next}</small>`
            : '<br><small>Belum pernah dipelajari</small>';
          
          const details = `
            <strong>${vocabItem.word}</strong> ${vocabItem.ipa || ''}<br>
            <em>${typeLabels[vocabItem.type]}</em> · Level ${vocabItem.level}<br>
            ${vocabItem.meaning}<br>
            <small>${vocabItem.example}</small>
            ${histInfo}
          `;
          window.Englisify.toast(details);
        } else if (action === 'delete' && vocabItem.source === 'user') {
          // Delete user-created word
          const userWords = getUserWords();
          const filtered = userWords.filter(w => w.word !== vocabItem.word);
          saveUserWords(filtered);
          window.Englisify.toast(`"${vocabItem.word}" dihapus`);
          await loadVocabulary();
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

  // Add-word modal - saves to localStorage
  const overlay = document.getElementById('modalOverlay');
  document.getElementById('btnAddWord').addEventListener('click', () => overlay.classList.add('open'));
  document.getElementById('btnCancelAdd').addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });

  document.getElementById('addWordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const word = document.getElementById('fWord').value.trim();
    const meaning = document.getElementById('fMeaning').value.trim();
    const type = document.getElementById('fType').value;
    if (!word || !meaning) return;
    
    try {
      // Add to localStorage (not database)
      const userWords = getUserWords();
      userWords.push({
        word,
        meaning,
        type,
        ipa: '',
        example: `"${word}"`,
        createdAt: new Date().toISOString()
      });
      saveUserWords(userWords);
      
      e.target.reset();
      overlay.classList.remove('open');
      window.Englisify.toast(`"${word}" berhasil ditambahkan (disimpan lokal)`);
      
      // Reload vocabulary to show new word
      await loadVocabulary();
      
      // Switch to "Semua" tab
      currentFilter = 'semua';
      document.querySelectorAll('#vocabTabs .tab-btn').forEach((t) => t.classList.remove('active'));
      document.querySelector('#vocabTabs .tab-btn[data-filter="semua"]').classList.add('active');
      render();
    } catch (error) {
      console.error('Failed to add vocabulary:', error);
      window.Englisify.toast('Gagal menambahkan kata: ' + error.message);
    }
  });

  // Initial load
  await loadVocabulary();
});
