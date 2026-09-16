/* ==========================================================================
   Englisify — Auth (MOCK, berbasis localStorage)
   ==========================================================================
  PENTING: ini tetap BUKAN autentikasi sungguhan. Data akun berada di
  localStorage browser pengguna dan seluruh kode dapat dimodifikasi pengguna.
  Password tidak disimpan mentah, tetapi aplikasi produksi tetap wajib memakai
  auth server asli (mis. Firebase Auth / Supabase Auth / backend sendiri).
   ========================================================================== */

(function () {
  const USERS_KEY = 'englisify-users';     // [{ name, email, passwordHash, createdAt }]
  const SESSION_KEY = 'englisify-session'; // email pengguna yang sedang login

  function readUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed)
        ? parsed.filter((user) => user && typeof user === 'object' && typeof user.email === 'string')
        : [];
    } catch (error) {
      return [];
    }
  }

  function writeUsers(users) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      // Storage penuh / private browsing — akun tidak akan tersimpan permanen.
    }
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  async function hashPassword(password) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API tidak tersedia. Buka aplikasi melalui HTTPS atau localhost.');
    }
    const data = new TextEncoder().encode(password);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  function findUser(email) {
    const target = normalizeEmail(email);
    return readUsers().find((u) => {
      const hasCredential = typeof u.passwordHash === 'string' || typeof u.password === 'string';
      return hasCredential && normalizeEmail(u.email) === target;
    }) || null;
  }

  function getSessionEmail() {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch (error) {
      return null;
    }
  }

  function setSessionEmail(email) {
    try {
      if (email) localStorage.setItem(SESSION_KEY, normalizeEmail(email));
      else localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      // ignore
    }
  }

  function isLoggedIn() {
    const email = getSessionEmail();
    const valid = !!(email && findUser(email));
    if (!valid && email) setSessionEmail(null);
    return valid;
  }

  function getCurrentUser() {
    const email = getSessionEmail();
    const user = email ? findUser(email) : null;
    if (user && !user.createdAt) {
      const users = readUsers();
      const storedUser = users.find((candidate) => normalizeEmail(candidate.email) === normalizeEmail(email));
      if (storedUser) {
        storedUser.createdAt = new Date().toISOString();
        writeUsers(users);
        user.createdAt = storedUser.createdAt;
      }
    }
    return user;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  }

  function syncProfileName(name) {
    if (window.Englisify && typeof window.Englisify.setProfileName === 'function') {
      window.Englisify.setProfileName(name);
    }
  }

  /**
   * Daftar akun baru. Otomatis login setelah sukses.
   * @returns {{ok:true,name:string}|{ok:false,error:string,field:string}}
   */
  async function register({ name, email, password, confirmPassword }) {
    const cleanName = String(name || '').trim();
    const cleanEmail = normalizeEmail(email);
    const cleanPassword = String(password || '').trim();
    const cleanConfirm = String(confirmPassword || '').trim();

    if (!cleanName) {
      return { ok: false, error: 'Nama tidak boleh kosong.', field: 'name' };
    }
    if (!isValidEmail(cleanEmail)) {
      return { ok: false, error: 'Format email tidak valid.', field: 'email' };
    }
    if (cleanPassword.length < 6) {
      return { ok: false, error: 'Password minimal 6 karakter.', field: 'password' };
    }
    if (cleanConfirm !== cleanPassword) {
      return { ok: false, error: 'Konfirmasi password tidak sama dengan password.', field: 'confirmPassword' };
    }
    if (findUser(cleanEmail)) {
      return { ok: false, error: 'Email ini sudah terdaftar. Coba masuk saja.', field: 'email' };
    }

    let passwordHash;
    try {
      passwordHash = await hashPassword(cleanPassword);
    } catch (error) {
      return { ok: false, error: error.message, field: 'password' };
    }

    const users = readUsers();
    users.push({ name: cleanName, email: cleanEmail, passwordHash, createdAt: new Date().toISOString() });
    writeUsers(users);
    setSessionEmail(cleanEmail);
    syncProfileName(cleanName);
    return { ok: true, name: cleanName };
  }

  /**
   * Login dengan email + password.
   * @returns {{ok:true}|{ok:false,error:string}}
   */
  async function login({ email, password }) {
    const cleanEmail = normalizeEmail(email);
    const cleanPassword = String(password || '').trim();
    const user = findUser(cleanEmail);

    if (!user) {
      if (readUsers().length === 0) {
        return {
          ok: false,
          error: 'Belum ada akun tersimpan di browser ini. Kalau kamu sudah pernah daftar, pastikan membuka lewat alamat (URL) yang persis sama seperti saat mendaftar.',
        };
      }
      return { ok: false, error: 'Email atau password salah. Periksa kembali, lalu coba lagi.' };
    }
    let passwordHash;
    try {
      passwordHash = await hashPassword(cleanPassword);
    } catch (error) {
      return { ok: false, error: error.message };
    }
    const isLegacyPassword = typeof user.password === 'string';
    if (user.passwordHash !== passwordHash && (!isLegacyPassword || user.password !== cleanPassword)) {
      return { ok: false, error: 'Email atau password salah. Periksa kembali, lalu coba lagi.' };
    }

    if (isLegacyPassword) {
      const users = readUsers();
      const storedUser = users.find((candidate) => normalizeEmail(candidate.email) === cleanEmail);
      if (storedUser) {
        delete storedUser.password;
        storedUser.passwordHash = passwordHash;
        writeUsers(users);
      }
    }

    setSessionEmail(cleanEmail);
    syncProfileName(user.name);
    return { ok: true };
  }

  function logout() {
    setSessionEmail(null);
    window.location.href = 'index.html';
  }

  function clearLocalData() {
    [USERS_KEY, SESSION_KEY].forEach((key) => {
      try { localStorage.removeItem(key); } catch (error) { /* ignore */ }
    });
  }

  window.EnglisifyAuth = {
    register,
    login,
    logout,
    clearLocalData,
    isLoggedIn,
    getCurrentUser,
  };

  /* ------------------------------------------------------------------
     Guard halaman — otomatis jalan berdasarkan atribut data-guard di tag
     <script> ini sendiri, dieksekusi sinkron sebelum halaman sempat
     ter-render supaya tidak ada "kedip" konten yang seharusnya terkunci:

       data-guard="protected"  → halaman internal (Beranda, dst).
                                  Belum login? Lempar ke login.html.
       data-guard="guest"      → halaman login.html / register.html.
                                  Sudah login? Lempar ke beranda.html.
     ------------------------------------------------------------------ */
  const thisScript = document.currentScript;
  const guardMode = thisScript ? thisScript.getAttribute('data-guard') : null;

  if (guardMode === 'protected' && !isLoggedIn()) {
    window.location.replace('login.html');
  } else if (guardMode === 'guest' && isLoggedIn()) {
    window.location.replace('beranda.html');
  }
})();
