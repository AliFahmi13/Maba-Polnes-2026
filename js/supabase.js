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
  function accessToken() { const current = session(); return current && current.access_token; }
  function userId() { const current = session(); return current && current.user && current.user.id; }

  async function request(path, options) {
    const response = await fetch(`${SUPABASE_URL}${path}`, {
      ...options,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        ...(accessToken() ? { Authorization: `Bearer ${accessToken()}` } : {}),
        ...(options && options.headers ? options.headers : {}),
      },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
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
    const globalCards = await request('/rest/v1/flashcard?select=*&order=id.asc');
    let userCards = [];
    if (userId() && accessToken()) {
      try {
        userCards = await request(`/rest/v1/user_flashcards?auth_user_id=eq.${encodeURIComponent(userId())}&select=*&order=id.asc`);
      } catch (error) {
        if (error.status !== 404 && error.status !== 400) throw error;
      }
    }
    return [...globalCards, ...userCards];
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
    dataStore: {
      get(key) { const values = cache(); return values[cacheKey(key)] ?? null; },
      set: setData,
      remove: removeData,
    },
  };

  if (session()) pullData();
})();