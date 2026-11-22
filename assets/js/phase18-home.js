(() => {
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('h18-reveal');
        observer.unobserve(entry.target);
      }
    }), { threshold: .1 });
    document.querySelectorAll('.h18-service-card,.h18-feature-grid,.h18-doctor-card,.h18-branch-card,.h18-faq-grid,.h18-final-card').forEach((el) => observer.observe(el));
  }
})();
