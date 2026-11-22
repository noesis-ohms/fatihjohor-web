(() => {
  const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.52 3.48A11.85 11.85 0 0 0 12.08 0C5.5 0 .14 5.35.14 11.93c0 2.1.55 4.15 1.6 5.95L.04 24l6.26-1.64a11.9 11.9 0 0 0 5.77 1.47h.01C18.66 23.83 24 18.48 24 11.9c0-3.18-1.23-6.17-3.48-8.42ZM12.08 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.97.99-3.62-.24-.37a9.88 9.88 0 0 1-1.51-5.26c0-5.47 4.45-9.92 9.93-9.92a9.84 9.84 0 0 1 7.01 2.91 9.85 9.85 0 0 1 2.9 7.02c0 5.47-4.45 9.91-9.95 9.91Zm5.45-7.43c-.3-.15-1.76-.87-2.04-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.9-.8-1.5-1.77-1.68-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.1 4.48.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.11.57-.08 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z"/></svg>';
  const dialog = document.querySelector('#h17-wa-dialog');
  const header = document.querySelector('.p8-nav-actions a[href*="wa.me"]');
  if (header) { header.href = '#hubungi'; header.removeAttribute('target'); header.dataset.waPicker = ''; header.classList.add('h17-whatsapp'); }
  document.querySelectorAll('a[href*="wa.me/"], [data-wa-picker]').forEach(el => {
    el.classList.add('h17-whatsapp');
    if (!el.querySelector('svg')) el.insertAdjacentHTML('afterbegin', icon);
  });
  if (dialog && typeof dialog.showModal === 'function') {
    document.querySelectorAll('[data-wa-picker]').forEach(el => el.addEventListener('click', event => { event.preventDefault(); dialog.showModal(); }));
    dialog.querySelector('.h17-dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  }
  const form = document.querySelector('#h17-bmi-form');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const height = Number(form.elements.height.value), weight = Number(form.elements.weight.value);
    if (!Number.isFinite(height) || !Number.isFinite(weight) || height < 100 || height > 250 || weight < 25 || weight > 350) return;
    document.querySelector('#h17-bmi-value').textContent = (weight / ((height / 100) ** 2)).toFixed(1);
    document.querySelector('#h17-bmi-message').textContent = 'Bincangkan bacaan ini dan matlamat anda bersama doktor.';
  });
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('h17-reveal'); observer.unobserve(entry.target); } }), { threshold: .12 });
    document.querySelectorAll('.h17-feature-copy, .h17-doctor-visual, .h17-bmi, .p11-section-heading, .h17-branch, .p11-panel-spotlight, .p11-corporate-grid, .p12-duty-card, .h17-faq-grid').forEach(el => observer.observe(el));
  }
})();
