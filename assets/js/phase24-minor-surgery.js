(() => {
  const tabs = Array.from(document.querySelectorAll('[data-ms24-lesion-tab]'));
  const panels = Array.from(document.querySelectorAll('[data-ms24-lesion-panel]'));

  const activateTab = (id) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.ms24LesionTab === id;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => {
      const active = panel.dataset.ms24LesionPanel === id;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab.dataset.ms24LesionTab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      const next = tabs[nextIndex];
      activateTab(next.dataset.ms24LesionTab);
      next.focus();
    });
  });

  const redFlags = Array.from(document.querySelectorAll('[data-ms24-redflag]'));
  const result = document.querySelector('[data-ms24-redflag-result]');

  const updateRedFlags = () => {
    if (!result) return;
    const count = redFlags.filter((input) => input.checked).length;
    result.classList.toggle('ms24-redflag-active', count > 0);
    if (count > 0) {
      result.innerHTML = `<strong>${count} tanda amaran dipilih.</strong><span>Dapatkan penilaian doktor sebelum merancang minor surgery. Jika ada demam, kemerahan yang cepat merebak, pendarahan berterusan atau sakit yang kuat, dapatkan rawatan dengan lebih segera.</span>`;
    } else {
      result.innerHTML = '<strong>Belum ada tanda dipilih.</strong><span>Jika ketulan stabil dan tidak mempunyai tanda amaran, doktor masih perlu memeriksanya sebelum memutuskan sama ada prosedur sesuai.</span>';
    }
  };

  redFlags.forEach((input) => input.addEventListener('change', updateRedFlags));

  const revealItems = Array.from(document.querySelectorAll('.ms24-reveal'));
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }
})();
