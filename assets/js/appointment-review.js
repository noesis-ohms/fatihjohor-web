(() => {
  const root = document.querySelector('[data-appointment-review]');
  if (!root) return;

  const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.content || '';
  const base = meta('phase57-supabase-url').replace(/\/$/, '');
  const key = meta('phase57-supabase-key');
  const endpoint = `${base}/functions/v1/appointment-review`;
  const sessionKey = 'phase32_appointment_review_token';

  const alertBox = root.querySelector('[data-review-alert]');
  const card = root.querySelector('[data-review-card]');
  const result = root.querySelector('[data-review-result]');
  const confirmPanel = root.querySelector('[data-review-confirm-panel]');
  const rejectPanel = root.querySelector('[data-review-reject-panel]');
  const notesWrap = root.querySelector('[data-review-notes-wrap]');
  const field = (name) => root.querySelector(`[data-review-${name}]`);
  const headers = () => ({ 'Content-Type':'application/json', apikey:key });

  function captureToken() {
    const url = new URL(window.location.href);
    const raw = (url.searchParams.get('token') || '').trim();
    if (raw) sessionStorage.setItem(sessionKey, raw);
    history.replaceState({}, document.title, window.location.pathname);
    return raw || sessionStorage.getItem(sessionKey) || '';
  }

  function showResult(title, message, type = '') {
    card.hidden = true;
    alertBox.textContent = '';
    alertBox.className = `booking-alert ${type}`;
    field('result-title').textContent = title;
    field('result-message').textContent = message;
    result.hidden = false;
  }

  function renderAppointment(appointment) {
    field('reference').textContent = appointment.reference || '-';
    field('patient').textContent = appointment.patient_name || '-';
    field('phone').textContent = appointment.phone || '-';
    field('doctor').textContent = appointment.doctor || '-';
    field('service').textContent = appointment.service || '-';
    field('branch').textContent = appointment.branch || '-';
    field('start').textContent = appointment.starts_at_label || appointment.starts_at || '-';
    const notes = appointment.notes || '';
    notesWrap.hidden = !notes;
    field('notes').textContent = notes;
    alertBox.textContent = '';
    card.hidden = false;
  }

  async function request(url, options = {}) {
    const response = await fetch(url, { ...options, headers:{ ...headers(), ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  }

  async function validateToken(token) {
    if (!base || !key) { showResult('Review unavailable', 'Appointment review is not configured on this site.', 'error'); return; }
    if (!token) { showResult('Invalid review link', 'This appointment review link is missing or invalid.', 'error'); return; }
    alertBox.textContent = 'Validating appointment…';
    const { response, data } = await request(`${endpoint}?${new URLSearchParams({ token })}`);
    if (response.ok && data.state === 'pending' && data.appointment) { renderAppointment(data.appointment); return; }
    if (data.state === 'processed') { showResult('Already processed', 'This appointment request has already been processed.', 'success'); return; }
    if (data.state === 'expired') { showResult('Review link expired', data.error || 'This review link has expired.', 'error'); return; }
    showResult('Unable to review appointment', data.error || 'This review link is invalid or no longer available.', 'error');
  }

  async function submitAction(token, action) {
    const label = action === 'confirm' ? 'Confirming appointment…' : 'Rejecting request…';
    alertBox.textContent = label;
    confirmPanel.hidden = true;
    rejectPanel.hidden = true;
    const payload = action === 'confirm' ? { token, action:'confirm' } : { token, action:'reject' };
    const { response, data } = await request(endpoint, { method:'POST', body:JSON.stringify(payload) });
    if (response.ok && data.state === 'confirmed') {
      sessionStorage.removeItem(sessionKey);
      showResult('Appointment confirmed', 'The appointment has been confirmed. The patient has been emailed when an email address was provided.', 'success');
      return;
    }
    if (response.ok && data.state === 'rejected') {
      sessionStorage.removeItem(sessionKey);
      showResult('Appointment request rejected', 'The requested slot has been released. The patient has been emailed when an email address was provided.', 'success');
      return;
    }
    if (data.state === 'processed') { showResult('Already processed', data.error || 'This request has already been processed.', 'error'); return; }
    if (data.state === 'expired') { showResult('Review link expired', data.error || 'This review link has expired.', 'error'); return; }
    alertBox.textContent = data.error || 'The appointment could not be updated.';
    alertBox.className = 'booking-alert error';
  }

  const token = captureToken();
  root.querySelector('[data-review-confirm]').addEventListener('click', () => { confirmPanel.hidden = false; rejectPanel.hidden = true; confirmPanel.scrollIntoView({ behavior:'smooth', block:'center' }); });
  root.querySelector('[data-review-reject]').addEventListener('click', () => { rejectPanel.hidden = false; confirmPanel.hidden = true; rejectPanel.scrollIntoView({ behavior:'smooth', block:'center' }); });
  root.querySelector('[data-review-cancel-confirm]').addEventListener('click', () => { confirmPanel.hidden = true; });
  root.querySelector('[data-review-cancel-reject]').addEventListener('click', () => { rejectPanel.hidden = true; });
  root.querySelector('[data-review-confirm-final]').addEventListener('click', () => submitAction(token, 'confirm'));
  root.querySelector('[data-review-reject-final]').addEventListener('click', () => submitAction(token, 'reject'));

  validateToken(token).catch((error) => showResult('Unable to review appointment', error.message || 'Please try again later.', 'error'));
})();
