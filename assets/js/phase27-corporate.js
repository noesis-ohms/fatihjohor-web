(() => {
  const root = document.querySelector('[data-corporate-page]');
  if (!root) return;
  const buttons = [...root.querySelectorAll('[data-corp-lang-button]')];
  const nodes = [...root.querySelectorAll('[data-corp-lang]')];
  const storageKey = 'klinik-alfatih-corporate-language';

  const setLanguage = (lang, persist = true) => {
    const selected = lang === 'ms' ? 'ms' : 'en';
    root.dataset.corpCurrentLang = selected;
    nodes.forEach((node) => {
      node.hidden = node.dataset.corpLang !== selected;
    });
    buttons.forEach((button) => {
      const active = button.dataset.corpLangButton === selected;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (persist) {
      try { localStorage.setItem(storageKey, selected); } catch (_) {}
    }
  };

  buttons.forEach((button) => button.addEventListener('click', () => setLanguage(button.dataset.corpLangButton)));
  let initial = 'en';
  try { initial = localStorage.getItem(storageKey) || 'en'; } catch (_) {}
  setLanguage(initial, false);
})();
