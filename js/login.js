(function () {
  const form = document.getElementById('loginForm');
  const errorBox = document.getElementById('loginError');
  const authCard = document.querySelector('.auth-card');
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');

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
    hideError();

    const result = await window.EnglisifyAuth.login({
      email: emailInput.value,
      password: passwordInput.value,
    });

    if (result.ok) {
      window.location.href = 'beranda.html';
    } else {
      showError(result.error);
    }
  });
})();
