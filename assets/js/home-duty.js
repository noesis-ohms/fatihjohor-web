import { locumAiAvatar } from './locum-avatar.js';

(() => {
  const cards = [...document.querySelectorAll('[data-duty-branch]')];
  if (!cards.length) return;

  const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.content || '';
  const base = meta('phase57-supabase-url').replace(/\/$/, '');
  const key = meta('phase57-supabase-key');
  const dateLabel = document.querySelector('[data-duty-date]');
  const zone = 'Asia/Kuala_Lumpur';

  const todayParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date()).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});
  const today = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;

  const humanDate = new Intl.DateTimeFormat('ms-MY', {
    timeZone: zone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date());
  if (dateLabel) dateLabel.textContent = humanDate;

  const time = (iso) => new Intl.DateTimeFormat('en-MY', {
    timeZone: zone, hour: 'numeric', minute: '2-digit', hour12: true
  }).format(new Date(iso));

  const doctorImage = (row = {}) => {
    if (row.is_locum && !row.doctor_slug) return locumAiAvatar(row.display_name || row.doctor_name || 'locum');
    return ({
      'dr-farhan-zulkifli': '/assets/img/doctors/dr-farhan.webp',
      'dr-noor-farihah-asri': '/assets/img/doctors/dr-farihah.webp',
      'dr-anwar-ashyraff': '/assets/img/doctors/dr-anwar.webp',
    })[row.doctor_slug] || '/assets/img/logo-current.webp';
  };

  const escapeHtml = (value) => String(value || '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  })[char]);

  const renderEmpty = (list) => {
    list.innerHTML = '<div class="p12-duty-empty"><strong>Jadual belum diterbitkan untuk hari ini.</strong><span>Hubungi cawangan untuk semak doktor yang bertugas atau tempah slot yang sesuai.</span></div>';
  };

  const renderError = (list) => {
    list.innerHTML = '<div class="p12-duty-empty"><strong>Jadual tidak dapat dimuatkan sekarang.</strong><span>Sila hubungi cawangan untuk semakan doktor bertugas.</span></div>';
  };

  if (!base || !key) {
    cards.forEach((card) => renderError(card.querySelector('[data-duty-list]')));
    return;
  }

  fetch(`${base}/functions/v1/public-booking?action=duty-schedule&date=${encodeURIComponent(today)}`, {
    headers: { apikey: key }
  })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Duty schedule unavailable');
      return data;
    })
    .then((data) => {
      const rows = Array.isArray(data.schedule) ? data.schedule : [];
      cards.forEach((card) => {
        const slug = card.dataset.dutyBranch;
        const list = card.querySelector('[data-duty-list]');
        const branchRows = rows.filter((row) => row.branch_slug === slug);
        if (!branchRows.length) return renderEmpty(list);

        list.innerHTML = branchRows.map((row) => {
          const displayName = row.display_name || row.doctor_name || 'Doktor bertugas';
          const credentials = row.display_credentials || (row.is_locum ? 'Locum Medical Doctor' : 'Medical Doctor');
          const usingAiAvatar = row.is_locum && !row.doctor_slug;
          return `
          <div class="p12-duty-row">
            <img src="${doctorImage(row)}" alt="${escapeHtml(usingAiAvatar ? `AI avatar untuk ${displayName}` : displayName)}" loading="lazy" />
            <div class="p12-duty-doctor">
              <strong>${escapeHtml(displayName)}</strong>
              <span>${escapeHtml(credentials)}${usingAiAvatar ? ' <em class="p12-duty-ai">AI avatar</em>' : ''}</span>
            </div>
            <div class="p12-duty-time">
              <strong>${escapeHtml(time(row.starts_at))}</strong>
              <span>hingga ${escapeHtml(time(row.ends_at))}</span>
            </div>
          </div>`;
        }).join('');
      });
    })
    .catch(() => cards.forEach((card) => renderError(card.querySelector('[data-duty-list]'))));
})();
