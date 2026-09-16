/* Englisify - Supabase authentication and page guards. */
(function () {
  const supabase = window.EnglisifySupabase;

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function currentUser() {
    const session = supabase.getSession();
    const user = session && session.user;
    if (!user) return null;
    return {
      id: user.id,
      email: normalizeEmail(user.email),
      name: (user.user_metadata && user.user_metadata.name) || normalizeEmail(user.email).split('@')[0],
      createdAt: user.created_at || new Date().toISOString(),
    };
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  }

  function syncProfileName(name) {
    if (window.Englisify && typeof window.Englisify.setProfileName === 'function') {
      window.Englisify.setProfileName(name);
    }
  }

  function authError(error, fallback) {
    const message = String(error && error.message || '').toLowerCase();
    if (error && error.status === 429 || message.includes('rate limit') || message.includes('too many requests')) {
      return 'Supabase sedang memblokir email pendaftaran karena batas kuota. Admin harus mematikan Confirm email untuk development atau mengatur SMTP custom.';
    }
    if (message.includes('already registered') || message.includes('already been registered')) {
      return 'Email ini sudah terdaftar. Silakan masuk.';
    }
    if (message.includes('email not confirmed')) {
      return 'Email belum dikonfirmasi. Cek inbox atau spam, lalu coba masuk lagi.';
    }
    return (error && error.message) || fallback;
  }

  async function register({ name, email, password, confirmPassword }) {
    const cleanName = String(name || '').trim();
    const cleanEmail = normalizeEmail(email);
    const cleanPassword = String(password || '').trim();
    const cleanConfirm = String(confirmPassword || '').trim();

    if (!cleanName) return { ok: false, error: 'Nama tidak boleh kosong.', field: 'name' };
    if (!isValidEmail(cleanEmail)) return { ok: false, error: 'Format email tidak valid.', field: 'email' };
    if (cleanPassword.length < 6) return { ok: false, error: 'Password minimal 6 karakter.', field: 'password' };
    if (cleanConfirm !== cleanPassword) return { ok: false, error: 'Konfirmasi password tidak sama dengan password.', field: 'confirmPassword' };
    try {
      const result = await supabase.signUp(cleanEmail, cleanPassword, cleanName);
      if (!result.access_token) {
        return { ok: true, needsConfirmation: true, name: cleanName };
      }
      syncProfileName(cleanName);
      return { ok: true, name: cleanName };
    } catch (error) {
      return { ok: false, error: authError(error, 'Pendaftaran gagal.') };
    }
  }

  async function login({ email, password }) {
    const cleanEmail = normalizeEmail(email);
    const cleanPassword = String(password || '').trim();
    if (!isValidEmail(cleanEmail)) return { ok: false, error: 'Format email tidak valid.' };
    if (!cleanPassword) return { ok: false, error: 'Password tidak boleh kosong.' };
    try {
      await supabase.signIn(cleanEmail, cleanPassword);
      const user = currentUser();
      syncProfileName(user && user.name);
      await supabase.pullData();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: authError(error, 'Email atau password salah.') };
    }
  }

  function logout() {
    supabase.signOut().finally(() => { window.location.href = 'index.html'; });
  }

  function clearLocalData() {
    try {
      localStorage.removeItem('englisify-supabase-session');
      localStorage.removeItem('englisify-supabase-cache');
    } catch (error) { /* ignore */ }
  }

  window.EnglisifyAuth = {
    register,
    login,
    logout,
    clearLocalData,
    isLoggedIn: () => supabase.hasSession(),
    getCurrentUser: currentUser,
  };

  const thisScript = document.currentScript;
  const guardMode = thisScript ? thisScript.getAttribute('data-guard') : null;
  if (guardMode === 'protected' && !supabase.hasSession()) {
    window.location.replace('login.html');
  } else if (guardMode === 'guest' && supabase.hasSession()) {
    window.location.replace('beranda.html');
  }
})();
