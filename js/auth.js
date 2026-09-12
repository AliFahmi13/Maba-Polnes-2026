/* ==========================================================================
   Englisify — Auth (MOCK, berbasis localStorage)
   ==========================================================================
   PENTING: ini BUKAN autentikasi sungguhan. Tidak ada server/database asli —
   akun & password disimpan apa adanya di localStorage browser pengguna
   masing-masing, tanpa enkripsi/hash. Cukup untuk demo/prototipe/tugas,
   TAPI tidak aman & tidak cocok untuk produksi nyata. Kalau proyek ini
   nanti dilanjutkan ke produksi, bagian ini wajib diganti auth server
   asli (mis. Firebase Auth / Supabase Auth / backend sendiri).
   ========================================================================== */

(function () {
  const USERS_KEY = 'englisify-users';     // [{ name, email, password }]
  const SESSION_KEY = 'englisify-session'; // email pengguna yang sedang login

  function readUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
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

  function findUser(email) {
    const target = normalizeEmail(email);
    return readUsers().find((u) => normalizeEmail(u.email) === target) || null;
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
    return !!(email && findUser(email));
  }

  function getCurrentUser() {
    const email = getSessionEmail();
    return email ? findUser(email) : null;
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
  function register({ name, email, password, confirmPassword }) {
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

    const users = readUsers();
    users.push({ name: cleanName, email: cleanEmail, password: cleanPassword });
    writeUsers(users);
    setSessionEmail(cleanEmail);
    syncProfileName(cleanName);
    return { ok: true, name: cleanName };
  }

  /**
   * Login dengan email + password.
   * @returns {{ok:true}|{ok:false,error:string}}
   */
  function login({ email, password }) {
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
    if (user.password !== cleanPassword) {
      return { ok: false, error: 'Email atau password salah. Periksa kembali, lalu coba lagi.' };
    }

    setSessionEmail(cleanEmail);
    syncProfileName(user.name);
    return { ok: true };
  }

  function logout() {
    setSessionEmail(null);
    window.location.href = 'index.html';
  }

  window.EnglisifyAuth = {
    register,
    login,
    logout,
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
