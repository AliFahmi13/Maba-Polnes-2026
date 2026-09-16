(function () {
  const form = document.getElementById('loginForm');
  const errorBox = document.getElementById('loginError');
  const authCard = document.querySelector('.auth-card');
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const submitBtn = form.querySelector('.auth-submit');
  let submitting = false;

  function hideError() {
    errorBox.hidden = true;
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
    authCard.classList.remove('shake');
    // Re-trigger animasi meski error sebelumnya sama persis.
    void authCard.offsetWidth;
    authCard.classList.add('shake');
  }

  [emailInput, passwordInput].forEach((input) => {
    input.addEventListener('input', hideError);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitting) return;
    hideError();
    submitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Memeriksa...';

    let result;
    try {
      result = await window.EnglisifyAuth.login({
        email: emailInput.value,
        password: passwordInput.value,
      });
    } catch (error) {
      result = { ok: false, error: 'Login gagal. Coba lagi.' };
    }

    if (result.ok) {
      window.location.href = 'beranda.html';
    } else {
      submitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Masuk';
      showError(result.error);
    }
  });
})();
