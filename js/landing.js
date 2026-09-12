(function () {
  const toggle = document.getElementById('landingNavToggle');
  const menu = document.getElementById('landingMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => menu.classList.toggle('open'));
    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => menu.classList.remove('open'));
    });
  }
})();
