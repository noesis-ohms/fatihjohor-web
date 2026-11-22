(() => {
  const root = document.querySelector('[data-mens-screening]');
  if (!root) return;
  const form = root.querySelector('#mens-screening-form');
  const results = root.querySelector('#mens-screening-results');
  const resultGrid = root.querySelector('#mens-domain-results');
  const redFlagBox = root.querySelector('#mens-redflag-result');
  const teratai = root.querySelector('#mens-wa-teratai');
  const tropika = root.querySelector('#mens-wa-tropika');

  const labels = {
    metabolic: 'Metabolik & berat badan',
    sleep: 'Tenaga, tidur & dengkur',
    sexual: 'Fungsi seksual',
    urinary: 'Kencing & prostat',
    hair: 'Rambut gugur',
    lifestyle: 'Merokok, stres & gaya hidup',
  };

  const advice = (score) => {
    if (score >= 5) return {level:'priority', title:'Wajar dibincangkan dengan doktor', text:'Beberapa jawapan dalam domain ini menunjukkan isu yang lebih konsisten atau berulang.'};
    if (score >= 3) return {level:'review', title:'Pertimbangkan semakan', text:'Ada beberapa faktor yang mungkin berguna untuk dinilai bersama simptom dan sejarah kesihatan.'};
    return {level:'low', title:'Tiada isyarat kuat daripada saringan ini', text:'Kekalkan pencegahan dan buat pemeriksaan berdasarkan umur, sejarah keluarga dan faktor risiko.'};
  };

  function calculate() {
    const scores = {};
    root.querySelectorAll('fieldset[data-domain]').forEach((fieldset) => {
      const domain = fieldset.dataset.domain;
      let score = 0;
      fieldset.querySelectorAll('select').forEach((select) => score += Number(select.value || 0));
      scores[domain] = score;
    });
    const redFlag = Array.from(root.querySelectorAll('[data-red-flag]')).some((el) => el.checked);
    return {scores, redFlag};
  }

  function summaryText(data) {
    const lines = ['Ringkasan saringan awal kesihatan lelaki (bukan diagnosis):'];
    Object.entries(data.scores).forEach(([domain, score]) => {
      const a = advice(score);
      lines.push(`- ${labels[domain]}: ${a.title}`);
    });
    if (data.redFlag) lines.push('- RED FLAG dipilih: saya perlukan penilaian perubatan lebih segera.');
    lines.push('Saya faham jawapan ini hanya ringkasan kendiri dan perlu dinilai oleh doktor.');
    return lines.join('\n');
  }

  function render(data) {
    resultGrid.innerHTML = '';
    Object.entries(data.scores).forEach(([domain, score]) => {
      const a = advice(score);
      const card = document.createElement('article');
      card.className = `mens-result-card mens-result-${a.level}`;
      card.innerHTML = `<span>${labels[domain]}</span><strong>${a.title}</strong><p>${a.text}</p>`;
      resultGrid.appendChild(card);
    });
    if (data.redFlag) {
      redFlagBox.hidden = false;
      redFlagBox.innerHTML = '<strong>Ada red flag yang dipilih.</strong><p>Jangan bergantung pada skor saringan ini. Dapatkan penilaian perubatan dengan lebih segera. Jika simptom terasa kecemasan seperti sakit dada teruk, sesak nafas, pitam, strok, sakit testis akut atau tidak boleh kencing langsung, dapatkan rawatan kecemasan.</p>';
    } else {
      redFlagBox.hidden = true;
      redFlagBox.innerHTML = '';
    }
    const message = encodeURIComponent(summaryText(data));
    teratai.href = `https://wa.me/60126009137?text=${message}`;
    tropika.href = `https://wa.me/60175204224?text=${message}`;
    results.hidden = false;
    results.scrollIntoView({behavior:'smooth', block:'start'});
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    render(calculate());
  });

  form.addEventListener('reset', () => {
    window.setTimeout(() => {
      results.hidden = true;
      resultGrid.innerHTML = '';
      redFlagBox.hidden = true;
      redFlagBox.innerHTML = '';
    }, 0);
  });
})();
