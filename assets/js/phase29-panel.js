(() => {
  const input = document.querySelector('[data-panel-search]');
  if (!input) return;
  const cards = Array.from(document.querySelectorAll('[data-panel-card]'));
  const count = document.querySelector('[data-panel-count]');
  const empty = document.querySelector('[data-panel-empty]');
  const clear = document.querySelector('[data-panel-clear]');
  const queryButtons = Array.from(document.querySelectorAll('[data-panel-query]'));

  const normalize = (value) => (value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim();
  const apply = (value) => {
    const q = normalize(value);
    let visible = 0;
    cards.forEach((card) => {
      const match = !q || normalize(card.dataset.panelName).includes(q);
      card.hidden = !match;
      if (match) visible += 1;
    });
    if (count) count.textContent = `${visible} panel & rangkaian dipaparkan`;
    if (empty) empty.hidden = visible !== 0;
  };

  input.addEventListener('input', () => apply(input.value));
  clear?.addEventListener('click', () => { input.value = ''; apply(''); input.focus(); });
  queryButtons.forEach((button) => button.addEventListener('click', () => {
    input.value = button.dataset.panelQuery || '';
    apply(input.value);
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));

  const url = new URL(window.location.href);
  const preset = url.searchParams.get('panel');
  if (preset) { input.value = preset; apply(preset); }
})();
