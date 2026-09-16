(function () {
  try {
    const mode = localStorage.getItem('englisify-theme') === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);
  } catch (error) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
