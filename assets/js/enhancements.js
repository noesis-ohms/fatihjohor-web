(() => {
  document.body.classList.add('phase57');


  const navCta = document.querySelector('.nav-cta');
  if (navCta && !navCta.querySelector('.phase57-booking-link')) {
    const booking = document.createElement('a');
    booking.className = 'btn btn-blue phase57-booking-link';
    booking.href = '/booking.html';
    booking.textContent = 'Book Appointment';
    navCta.prepend(booking);
  }

  const dock = document.createElement('nav');
  dock.className = 'phase57-action-dock';
  dock.setAttribute('aria-label', 'Quick actions');
  dock.innerHTML = `
    <a class="book" href="/booking.html">Book Appointment</a>
    <a class="corporate" href="/corporate.html">Corporate / OHD</a>
    <a class="whatsapp" href="https://wa.me/60126009784?text=Assalamualaikum%20Klinik%20Al-Fatih%20Johor" target="_blank" rel="noopener">WhatsApp</a>
    <a class="locations" href="/cawangan-klinik.html">Locations</a>`;
  document.body.appendChild(dock);

  const pageKey = document.body.dataset.pageKey || '';
  if (['occupational-health.html', 'panel-klinik.html'].includes(pageKey)) {
    const main = document.querySelector('main');
    const footer = document.querySelector('footer');
    if (main && footer && !document.querySelector('.phase57-inline-cta')) {
      const wrap = document.createElement('section');
      wrap.className = 'container phase57-inline-cta';
      wrap.innerHTML = `
        <div><h2>Corporate healthcare for HR & HSE</h2><p>Request a structured proposal for panel clinic, OHD, screening, surveillance or workplace programmes.</p></div>
        <div class="actions"><a class="btn btn-blue" href="/corporate.html#request">Request Proposal</a><a class="btn btn-outline" href="/booking.html">Book Clinic Slot</a></div>`;
      footer.parentNode.insertBefore(wrap, footer);
    }
  }
})();
