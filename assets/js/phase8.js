(() => {
  const header = document.querySelector('[data-p8-header]');
  const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  document.querySelectorAll('.p8-nav-group-toggle').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const group = button.closest('.p8-nav-group');
      const open = !group?.classList.contains('open');
      document.querySelectorAll('.p8-nav-group.open').forEach((item) => item.classList.remove('open'));
      if (open) group?.classList.add('open');
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.p8-nav-group.open').forEach((item) => item.classList.remove('open'));
    document.querySelectorAll('.p8-nav-group-toggle[aria-expanded="true"]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
  });

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const targets = document.querySelectorAll('.p8-card, .p8-section-head, .p8-bullet-panel');
    targets.forEach((el) => el.classList.add('p8-reveal'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0.08 });
    targets.forEach((el) => observer.observe(el));
  }
})();
