(function () {
  const form = document.getElementById('registerForm');
  const errorBox = document.getElementById('registerError');
  const authCard = document.querySelector('.auth-card');
  const submitBtn = form.querySelector('.auth-submit');
  let submitting = false;

  const fields = {
    name: document.getElementById('registerName'),
    email: document.getElementById('registerEmail'),
    password: document.getElementById('registerPassword'),
    confirmPassword: document.getElementById('registerConfirmPassword'),
  };

  function clearFieldErrors() {
    Object.values(fields).forEach((input) => {
      input.closest('.field').classList.remove('invalid');
    });
  }

  function hideError() {
    errorBox.hidden = true;
    clearFieldErrors();
  }

  function showError(message, field) {
    errorBox.textContent = message;
    errorBox.hidden = false;
    clearFieldErrors();

    const input = fields[field];
    if (input) {
      input.closest('.field').classList.add('invalid');
      input.focus();
    }

    authCard.classList.remove('shake');
    void authCard.offsetWidth;
    authCard.classList.add('shake');
  }

  Object.values(fields).forEach((input) => {
    input.addEventListener('input', hideError);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitting) return;
    hideError();
    submitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mendaftarkan...';

    let result;
    try {
      result = await window.EnglisifyAuth.register({
        name: fields.name.value,
        email: fields.email.value,
        password: fields.password.value,
        confirmPassword: fields.confirmPassword.value,
      });
    } catch (error) {
      result = { ok: false, error: 'Pendaftaran gagal. Coba lagi.' };
    }

    if (result.ok && result.needsConfirmation) {
      submitBtn.textContent = 'Email terkirim';
      window.Englisify.toast('Cek email atau spam untuk konfirmasi, lalu masuk dari halaman login.');
      form.reset();
    } else if (result.ok) {
      submitBtn.textContent = 'Berhasil, mengalihkan...';
      window.Englisify.toast('Pendaftaran berhasil! Selamat datang, ' + result.name + ' 🎉');
      setTimeout(() => {
        window.location.href = 'beranda.html';
      }, 900);
    } else {
      submitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Daftar';
      showError(result.error, result.field);
    }
  });
})();
