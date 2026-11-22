(() => {
  const form = document.querySelector('#sti-screening-form');
  const result = document.querySelector('#sti-screening-result');
  if (!form || !result) return;

  const getChecked = (name) => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((el) => el.value);
  const getRadio = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || '';

  form.querySelectorAll('input[data-exclusive]').forEach((exclusive) => {
    exclusive.addEventListener('change', () => {
      if (!exclusive.checked) return;
      const name = exclusive.name;
      form.querySelectorAll(`input[name="${name}"]`).forEach((item) => { if (item !== exclusive) item.checked = false; });
    });
  });
  form.querySelectorAll('input[type="checkbox"]:not([data-exclusive])').forEach((box) => {
    box.addEventListener('change', () => {
      if (!box.checked) return;
      form.querySelectorAll(`input[name="${box.name}"][data-exclusive]`).forEach((item) => { item.checked = false; });
    });
  });

  form.addEventListener('reset', () => {
    result.hidden = true;
    result.innerHTML = '';
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const symptoms = getRadio('symptoms') === 'yes';
    const exposure = getRadio('exposure') === 'yes';
    const timing = form.elements.timing?.value || 'unknown';
    const redflags = getChecked('redflag').filter((v) => v !== 'none');
    const risks = getChecked('risk').filter((v) => v !== 'none');
    const sites = getChecked('site').filter((v) => v !== 'unknown');

    let level = 'routine';
    let title = 'Boleh pertimbangkan saringan berdasarkan risiko anda.';
    let text = 'Walaupun anda tiada simptom, sesetengah STI boleh berlaku tanpa tanda. Doktor boleh menilai sama ada ujian diperlukan dan bila masa yang sesuai berdasarkan window period.';

    if (redflags.length) {
      level = 'urgent';
      title = 'Dapatkan penilaian perubatan dengan segera.';
      text = 'Jawapan anda mengandungi tanda yang tidak sesuai dinilai melalui saringan web sahaja. Hubungi klinik atau perkhidmatan kecemasan yang sesuai pada hari yang sama.';
    } else if (exposure && timing === 'lt72') {
      level = 'urgent';
      title = 'Jangan tunggu — pendedahan kurang 72 jam perlu dinilai segera.';
      text = 'Jika pendedahan berpotensi melibatkan HIV, PEP mungkin relevan dan keberkesanannya bergantung pada masa. Dapatkan penilaian hari ini.';
    } else if (symptoms || risks.includes('partner')) {
      level = 'soon';
      title = 'Tempah konsultasi STI/STD dalam masa terdekat.';
      text = 'Simptom atau pasangan yang positif memerlukan penilaian doktor supaya ujian, rawatan dan partner management boleh dipilih dengan tepat.';
    } else if (exposure || risks.length) {
      level = 'screen';
      title = 'Saringan STI wajar dipertimbangkan.';
      text = 'Anda mempunyai sekurang-kurangnya satu faktor yang boleh menjadikan saringan relevan. Jenis ujian dan masa ujian bergantung pada jangkitan yang hendak dinilai dan masa sejak pendedahan.';
    }

    const siteAdvice = sites.length
      ? `<p><strong>Maklumkan lokasi pendedahan kepada doktor:</strong> ${sites.join(', ')}. Ini boleh mempengaruhi jenis spesimen atau swab yang sesuai.</p>`
      : '';

    const actions = level === 'urgent'
      ? '<a class="p8-btn p8-btn-primary" href="https://wa.me/60126009784">WhatsApp klinik sekarang</a><a class="p8-btn p8-btn-secondary" href="/booking.html">Tempah konsultasi</a>'
      : '<a class="p8-btn p8-btn-primary" href="/booking.html">Tempah konsultasi STI/STD</a><a class="p8-btn p8-btn-secondary" href="https://wa.me/60126009784">WhatsApp secara sulit</a>';

    result.className = `p15-screening-result p15-result-${level}`;
    result.innerHTML = `<span class="p8-eyebrow">Cadangan awal</span><h3>${title}</h3><p>${text}</p>${siteAdvice}<div class="p15-result-actions">${actions}</div><small>Saringan ini bukan diagnosis dan tidak menentukan bahawa anda mempunyai atau tidak mempunyai STI.</small>`;
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
})();
