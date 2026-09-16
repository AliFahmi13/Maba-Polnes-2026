/* Englisify - small Supabase REST/Auth adapter for the static site. */
(function () {
  const SUPABASE_URL = 'https://nyzlrtjzfzskcdnrvyzo.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55emxydGp6Znpza2NkbnJ2eXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MTMyMDIsImV4cCI6MjEwNTA4OTIwMn0.cPHl3OpPOWGvhZuXWzJf5epr2xYP64weQh0aPI6rtI8';
  const SESSION_KEY = 'englisify-supabase-session';
  const DATA_CACHE_KEY = 'englisify-supabase-cache';

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { /* cache is optional */ }
  }

  function session() { return readJson(SESSION_KEY, null); }
  function accessToken() { 
    const current = session(); 
    if (!current || !current.access_token) return null;
    
    // Check if token is expired
    if (current.expires_at) {
      const expiresAt = new Date(current.expires_at * 1000);
      if (expiresAt < new Date()) {
        // Token expired - clear it
        try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
        return null;
      }
    }
    
    return current.access_token;
  }
  function userId() { const current = session(); return current && current.user && current.user.id; }

  async function request(path, options) {
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      ...(accessToken() ? { Authorization: `Bearer ${accessToken()}` } : {}),
      ...(options && options.headers ? options.headers : {}),
    };
    
    // Only add Content-Type for POST/PUT/PATCH requests
    if (options && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
      headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(`${SUPABASE_URL}${path}`, {
      ...options,
      headers,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      // If JWT expired, clear session and retry without auth
      if (response.status === 401 && (body.message || '').includes('expired')) {
        try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
        // Retry request without Authorization header
        delete headers.Authorization;
        const retryResponse = await fetch(`${SUPABASE_URL}${path}`, {
          ...options,
          headers,
        });
        if (retryResponse.ok) {
          return await retryResponse.json().catch(() => ({}));
        }
      }
      
      const message = body.error_description || body.msg || body.message || 'Supabase request gagal.';
      const error = new Error(message);
      error.status = response.status;
      error.code = body.code || body.error || '';
      throw error;
    }
    return body;
  }

  async function signUp(email, password, name) {
    const result = await request('/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, data: { name } }),
    });
    if (result.access_token) writeJson(SESSION_KEY, result);
    return result;
  }

  async function signIn(email, password) {
    const result = await request('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    writeJson(SESSION_KEY, result);
    return result;
  }

  async function signOut() {
    if (accessToken()) {
      try { await request('/auth/v1/logout', { method: 'POST' }); } catch (error) { /* local sign-out still wins */ }
    }
    try { localStorage.removeItem(SESSION_KEY); } catch (error) { /* ignore */ }
  }

  function cache() { return readJson(DATA_CACHE_KEY, {}); }
  function cacheKey(key) { return `${userId() || 'guest'}:${key}`; }

  async function pullData() {
    if (!userId() || !accessToken()) return;
    try {
      const rows = await request(`/rest/v1/user_data?user_id=eq.${encodeURIComponent(userId())}&select=data_key,data_value`);
      const next = cache();
      rows.forEach((row) => { next[cacheKey(row.data_key)] = row.data_value; });
      writeJson(DATA_CACHE_KEY, next);
    } catch (error) {
      console.warn('Supabase data sync skipped:', error.message);
    }
  }

  async function getDictionary() {
    return request('/rest/v1/dictionary_words?select=word,ipa,word_type,meaning,example&order=word.asc');
  }

  async function getFlashcards() {
    try {
      const cards = await request('/rest/v1/flashcard?select=*&order=id.asc');
      return Array.isArray(cards) ? cards : [];
    } catch (error) {
      console.error('getFlashcards error:', error);
      return [];
    }
  }

  async function getVocabularyHistory() {
    if (!userId() || !accessToken()) return [];
    try {
      const result = await request(`/rest/v1/user_vocabulary_history?user_id=eq.${encodeURIComponent(userId())}&select=*`);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      if (error.status === 404 || error.status === 400) return [];
      console.error('getVocabularyHistory error:', error);
      return [];
    }
  }

  async function recordVocabularyReview(word, rating) {
    if (!userId() || !accessToken()) {
      console.warn('User not logged in, skipping vocabulary review recording');
      return;
    }
    try {
      // Calculate next review interval based on rating
      let intervalDays = 1;
      switch (rating) {
        case 'forgot': intervalDays = 1; break;
        case 'hard': intervalDays = 3; break;
        case 'good': intervalDays = 7; break;
        case 'easy': intervalDays = 14; break;
        default: intervalDays = 7;
      }

      const now = new Date();
      const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

      console.log('Recording vocabulary review:', { word, rating, intervalDays });

      // Upsert: insert or update if word already exists
      const result = await request('/rest/v1/user_vocabulary_history', {
        method: 'POST',
        headers: { 
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify({
          user_id: userId(),
          word: word,
          last_studied: now.toISOString(),
          next_review: nextReview.toISOString(),
          rating: rating,
        }),
      });
      
      console.log('Vocabulary review recorded:', result);
      return result;
    } catch (error) {
      console.error('recordVocabularyReview error:', error);
      throw error;
    }
  }

  function setData(key, value) {
    const next = cache();
    next[cacheKey(key)] = value;
    writeJson(DATA_CACHE_KEY, next);
    if (!userId() || !accessToken()) return;
    request('/rest/v1/user_data?on_conflict=user_id,data_key', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ user_id: userId(), data_key: key, data_value: value }),
    }).catch((error) => console.warn('Supabase data write skipped:', error.message));
  }

  function removeData(key) {
    const next = cache();
    delete next[cacheKey(key)];
    writeJson(DATA_CACHE_KEY, next);
    if (userId() && accessToken()) {
      request(`/rest/v1/user_data?user_id=eq.${encodeURIComponent(userId())}&data_key=eq.${encodeURIComponent(key)}`, { method: 'DELETE' })
        .catch((error) => console.warn('Supabase data delete skipped:', error.message));
    }
  }

  window.EnglisifySupabase = {
    signUp,
    signIn,
    signOut,
    getSession: session,
    getUserId: userId,
    hasSession: () => Boolean(accessToken() && userId()),
    pullData,
    getDictionary,
    getFlashcards,
    getVocabularyHistory,
    recordVocabularyReview,
    dataStore: {
      get(key) { const values = cache(); return values[cacheKey(key)] ?? null; },
      set: setData,
      remove: removeData,
    },
  };

  if (session()) pullData();
})();