(() => {
  const root = document.querySelector('[data-booking-doctor-profile]');
  if (!root) return;

  const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.content || '';
  const base = meta('phase57-supabase-url').replace(/\/$/, '');
  const key = meta('phase57-supabase-key');
  const endpoint = `${base}/functions/v1/public-booking`;
  const doctorSlug = root.dataset.doctorSlug || '';

  const alertBox = root.querySelector('[data-booking-alert]');
  const servicesEl = root.querySelector('[data-booking-services]');
  const datesEl = root.querySelector('[data-booking-dates]');
  const slotsEl = root.querySelector('[data-booking-slots]');
  const dutySummary = root.querySelector('[data-booking-duty-summary]');
  const form = root.querySelector('[data-booking-form]');
  const confirmation = root.querySelector('[data-booking-confirmation]');
  const submit = root.querySelector('[data-booking-submit]');
  const branchInput = root.querySelector('[data-booking-branch-id]');
  const serviceInput = root.querySelector('[data-booking-service-id]');
  const doctorInput = root.querySelector('[data-booking-doctor-id]');
  const startsInput = root.querySelector('[data-booking-starts-at]');
  const blockInput = root.querySelector('[data-booking-block-id]');

  const state = { profile: null, serviceId: '', duty: null };
  const headers = () => ({ 'Content-Type': 'application/json', apikey: key });
  const setAlert = (text, type = '') => { alertBox.textContent = text; alertBox.className = `booking-alert ${type}`; };
  const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); };
  const paragraph = (text, className = 'muted') => { const p = document.createElement('p'); p.className = className; p.textContent = text; return p; };
  const button = (label, className = 'p32-choice') => { const b = document.createElement('button'); b.type = 'button'; b.className = className; b.textContent = label; return b; };

  async function api(url, options = {}) {
    const res = await fetch(url, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Maklumat tempahan tidak dapat dimuatkan.');
    return data;
  }

  async function loadProfile() {
    if (!base || !key || !doctorSlug) throw new Error('Online booking is not configured yet.');
    setAlert('Memuatkan jadual doktor…');
    const data = await api(`${endpoint}?${new URLSearchParams({ action: 'doctor-profile', doctor_slug: doctorSlug })}`);
    state.profile = data;
    doctorInput.value = data.doctor?.id || '';
    clear(servicesEl);
    const services = data.services || [];
    if (!services.length) servicesEl.appendChild(paragraph('Tiada servis online yang aktif untuk doktor ini buat masa ini.'));
    services.forEach((service) => {
      const b = button(service.name);
      b.dataset.serviceId = service.id;
      b.addEventListener('click', () => selectService(service.id));
      servicesEl.appendChild(b);
    });
    setAlert('');
  }

  async function selectService(serviceId) {
    state.serviceId = serviceId;
    state.duty = null;
    serviceInput.value = serviceId;
    branchInput.value = '';
    startsInput.value = '';
    blockInput.value = '';
    servicesEl.querySelectorAll('button').forEach((el) => el.classList.toggle('active', el.dataset.serviceId === serviceId));
    clear(datesEl); datesEl.appendChild(paragraph('Memuatkan hari bertugas…'));
    clear(slotsEl); slotsEl.appendChild(paragraph('Pilih hari bertugas dahulu.')); slotsEl.disabled = true;
    await loadCalendar(doctorSlug, serviceId);
  }

  async function loadCalendar(slug, serviceId) {
    try {
      const data = await api(`${endpoint}?${new URLSearchParams({ action: 'doctor-calendar', doctor_slug: slug, service_id: serviceId })}`);
      clear(datesEl);
      const dates = data.dates || [];
      if (!dates.length) { datesEl.appendChild(paragraph('Tiada jadual online tersedia dalam tempoh akan datang. Sila pilih servis lain atau hubungi klinik.')); return; }
      dates.forEach((duty) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'p32-duty-card';
        const date = document.createElement('strong'); date.textContent = duty.date_label || duty.date;
        const branch = document.createElement('span'); branch.textContent = duty.branch_name;
        b.append(date, branch);
        b.addEventListener('click', () => selectDutyDate(duty));
        datesEl.appendChild(b);
      });
    } catch (error) {
      clear(datesEl); datesEl.appendChild(paragraph(error.message || 'Jadual tidak dapat dimuatkan.'));
    }
  }

  async function selectDutyDate(duty) {
    state.duty = duty;
    branchInput.value = duty.branch_id;
    startsInput.value = '';
    blockInput.value = '';
    datesEl.querySelectorAll('button').forEach((el) => el.classList.remove('active'));
    const buttons = [...datesEl.querySelectorAll('button')];
    const selected = buttons.find((el) => el.querySelector('strong')?.textContent === (duty.date_label || duty.date) && el.querySelector('span')?.textContent === duty.branch_name);
    selected?.classList.add('active');
    dutySummary.textContent = `${duty.branch_name} · ${duty.date_label || duty.date}`;
    await loadAvailability(duty.branch_id, doctorInput.value, state.serviceId, duty.date);
  }

  async function loadAvailability(branchId, doctorId, serviceId, date) {
    clear(slotsEl); slotsEl.appendChild(paragraph('Memuatkan slot yang tersedia…')); slotsEl.disabled = true;
    try {
      const params = new URLSearchParams({ action:'availability', branch_id:branchId, doctor_id:doctorId, service_id:serviceId, date });
      const data = await api(`${endpoint}?${params}`);
      clear(slotsEl);
      const available = data.slots || [];
      if (!available.length) { slotsEl.appendChild(paragraph('Tiada slot yang masih tersedia pada hari ini. Pilih hari bertugas lain.')); return; }
      const grid = document.createElement('div'); grid.className = 'booking-slot-grid';
      available.forEach((slot, index) => {
        const wrap = document.createElement('div'); wrap.className = 'booking-slot';
        const input = document.createElement('input'); input.type = 'radio'; input.name = 'doctor_slot'; input.id = `doctor-slot-${index}`; input.value = slot.starts_at;
        const label = document.createElement('label'); label.htmlFor = input.id; label.textContent = slot.label;
        input.addEventListener('change', () => { startsInput.value = slot.starts_at; blockInput.value = slot.availability_block_id; });
        wrap.append(input, label); grid.appendChild(wrap);
      });
      slotsEl.appendChild(grid); slotsEl.disabled = false;
    } catch (error) {
      clear(slotsEl); slotsEl.appendChild(paragraph(error.message || 'Slot tidak dapat dimuatkan.'));
    }
  }

  function renderPendingReceipt(data) {
    clear(confirmation);
    const h2 = document.createElement('h2'); h2.textContent = 'Permintaan temujanji diterima';
    const status = document.createElement('p'); const strong = document.createElement('strong'); strong.textContent = 'Status: '; status.append(strong, document.createTextNode('Pending Confirmation'));
    const ref = document.createElement('p'); ref.textContent = `Rujukan: ${data.reference || '-'}`;
    const label = document.createElement('p'); label.textContent = data.label || '';
    const message = document.createElement('p'); message.textContent = data.message || 'Team klinik perlu mengesahkan slot ini dahulu.';
    confirmation.append(h2, status, ref, label, message); confirmation.hidden = false;
  }

  async function submitPendingBooking(event) {
    event.preventDefault();
    if (!startsInput.value || !blockInput.value || !branchInput.value || !serviceInput.value || !doctorInput.value) { setAlert('Sila pilih servis, hari bertugas dan masa yang tersedia.', 'error'); return; }
    if (!form.reportValidity()) return;
    const fd = new FormData(form);
    const payload = {
      branch_id: branchInput.value, service_id: serviceInput.value, doctor_id: doctorInput.value,
      availability_block_id: blockInput.value, starts_at: startsInput.value,
      patient_name: fd.get('patient_name'), phone: fd.get('phone'), email: fd.get('email') || null,
      notes: fd.get('notes') || null, consent: fd.get('consent') === '1', turnstile_token: window.phase57TurnstileToken || null,
    };
    submit.disabled = true; setAlert('Menghantar permintaan temujanji…');
    try {
      const data = await api(endpoint, { method:'POST', body:JSON.stringify(payload) });
      setAlert('Permintaan diterima. Menunggu pengesahan klinik.', 'success');
      renderPendingReceipt(data);
      confirmation.scrollIntoView({ behavior:'smooth', block:'center' });
      form.reset(); startsInput.value = ''; blockInput.value = '';
    } catch (error) { setAlert(error.message || 'Permintaan tidak dapat dihantar. Sila hubungi klinik.', 'error'); }
    finally { submit.disabled = false; }
  }

  form.addEventListener('submit', submitPendingBooking);
  loadProfile().catch((error) => setAlert(error.message || 'Jadual doktor tidak dapat dimuatkan.', 'error'));
})();
