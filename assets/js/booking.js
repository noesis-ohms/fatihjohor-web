(() => {
  const form = document.getElementById('booking-form');
  if (!form) return;
  const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.content || '';
  const base = meta('phase57-supabase-url').replace(/\/$/, '');
  const key = meta('phase57-supabase-key');
  const endpoint = `${base}/functions/v1/public-booking`;
  const branch = document.getElementById('booking-branch');
  const service = document.getElementById('booking-service');
  const doctor = document.getElementById('booking-doctor');
  const date = document.getElementById('booking-date');
  const slots = document.getElementById('booking-slots');
  const alertBox = document.getElementById('booking-alert');
  const startInput = document.getElementById('booking-starts-at');
  const blockInput = document.getElementById('booking-block-id');
  const confirmation = document.getElementById('booking-confirmation');
  let bootstrap = { branches: [], services: [], doctors: [], mappings: [] };

  const headers = () => ({ 'Content-Type':'application/json', 'apikey':key });
  const setAlert = (text, type='') => { alertBox.textContent=text; alertBox.className=`booking-alert ${type}`; };
  const option = (value, label) => { const o=document.createElement('option'); o.value=value; o.textContent=label; return o; };
  const resetSelect = (el, label) => { el.innerHTML=''; el.appendChild(option('', label)); el.disabled=true; };

  async function loadBootstrap() {
    if (!base || !key) { setAlert('Online booking is not configured yet. Please use WhatsApp or call the clinic.', 'error'); form.querySelectorAll('select,input,textarea,button').forEach(el=>el.disabled=true); return; }
    setAlert('Loading clinic availability…');
    const res = await fetch(`${endpoint}?action=bootstrap`, { headers: headers() });
    const data = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(data.error || 'Maklumat tempahan tidak dapat dimuatkan');
    bootstrap = data;
    branch.disabled=false;
    for (const b of data.branches || []) branch.appendChild(option(b.id, b.name));
    setAlert('');
  }

  function refreshServices() {
    resetSelect(service, 'Pilih servis'); resetSelect(doctor, 'Pilih doktor'); date.disabled=true; slots.innerHTML='<legend>Masa tersedia</legend><p class="muted">Pilih servis and doctor first.</p>';
    const branchId=branch.value; if (!branchId) return;
    const serviceIds = new Set((bootstrap.mappings||[]).filter(m=>m.branch_id===branchId && m.is_active).map(m=>m.service_id));
    (bootstrap.services||[]).filter(s=>serviceIds.has(s.id)).forEach(s=>service.appendChild(option(s.id,s.name)));
    service.disabled=false;
  }

  function refreshDoctors() {
    resetSelect(doctor,'Pilih doktor'); date.disabled=true;
    const branchId=branch.value, serviceId=service.value; if (!branchId || !serviceId) return;
    const doctorIds=new Set((bootstrap.mappings||[]).filter(m=>m.branch_id===branchId && m.service_id===serviceId && m.is_active).map(m=>m.doctor_id));
    (bootstrap.doctors||[]).filter(d=>doctorIds.has(d.id)).forEach(d=>doctor.appendChild(option(d.id,d.name)));
    doctor.disabled=false;
  }

  function activateDate() {
    date.disabled=!(branch.value && service.value && doctor.value);
    if (!date.disabled) { const today=new Date(); const iso=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10); date.min=iso; }
  }

  async function loadSlots() {
    startInput.value=''; blockInput.value='';
    if (!date.value) return;
    slots.disabled=true; slots.innerHTML='<legend>Masa tersedia</legend><p class="muted">Memuatkan slot yang tersedia…</p>';
    const qs=new URLSearchParams({action:'availability',branch_id:branch.value,service_id:service.value,doctor_id:doctor.value,date:date.value});
    const res=await fetch(`${endpoint}?${qs}`, {headers:headers()});
    const data=await res.json().catch(()=>({}));
    if (!res.ok) { slots.innerHTML=`<legend>Masa tersedia</legend><p class="muted">${data.error || 'Slot tidak dapat dimuatkan'}</p>`; return; }
    const available=data.slots||[];
    if (!available.length) { slots.innerHTML='<legend>Masa tersedia</legend><p class="muted">Tiada slot online untuk tarikh ini. Pilih tarikh lain atau hubungi klinik.</p>'; return; }
    slots.innerHTML='<legend>Masa tersedia</legend><div class="booking-slot-grid"></div>';
    const grid=slots.querySelector('.booking-slot-grid');
    available.forEach((s,i)=>{
      const wrap=document.createElement('div'); wrap.className='booking-slot';
      const input=document.createElement('input'); input.type='radio'; input.name='slot'; input.id=`slot-${i}`; input.value=s.starts_at; input.dataset.blockId=s.availability_block_id;
      const label=document.createElement('label'); label.htmlFor=input.id; label.textContent=s.label;
      input.addEventListener('change',()=>{startInput.value=s.starts_at;blockInput.value=s.availability_block_id;});
      wrap.append(input,label); grid.appendChild(wrap);
    });
    slots.disabled=false;
  }

  branch.addEventListener('change', refreshServices);
  service.addEventListener('change', refreshDoctors);
  doctor.addEventListener('change', activateDate);
  date.addEventListener('change', loadSlots);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!startInput.value) { setAlert('Please select an available time.', 'error'); return; }
    if (!form.reportValidity()) return;
    const fd=new FormData(form);
    const payload={
      branch_id:fd.get('branch_id'), service_id:fd.get('service_id'), doctor_id:fd.get('doctor_id'),
      availability_block_id:fd.get('availability_block_id'), starts_at:fd.get('starts_at'),
      patient_name:fd.get('patient_name'), phone:fd.get('phone'), email:fd.get('email') || null,
      notes:fd.get('notes') || null,
      consent:fd.get('consent')==='1', turnstile_token:window.phase57TurnstileToken || null,
    };
    const button=document.getElementById('booking-submit'); button.disabled=true; setAlert('Menghantar permintaan temujanji…');
    try {
      const res=await fetch(endpoint,{method:'POST',headers:headers(),body:JSON.stringify(payload)});
      const data=await res.json().catch(()=>({})); if(!res.ok) throw new Error(data.error || 'Tempahan tidak dapat dibuat');
      setAlert('Permintaan diterima. Menunggu pengesahan klinik.', 'success');
      confirmation.hidden=false;
      confirmation.replaceChildren();
      const title=document.createElement('h2'); title.textContent='Permintaan temujanji diterima';
      const status=document.createElement('p'); const statusLabel=document.createElement('strong'); statusLabel.textContent='Status: '; status.append(statusLabel,document.createTextNode('Pending Confirmation'));
      const reference=document.createElement('p'); reference.textContent=`Rujukan: ${data.reference || '-'}`;
      const appointment=document.createElement('p'); appointment.textContent=data.label || payload.starts_at || '';
      const message=document.createElement('p'); message.textContent=data.message || 'Team klinik perlu mengesahkan slot ini dahulu. Jika anda memasukkan email, keputusan pengesahan akan dihantar selepas semakan staff.';
      confirmation.append(title,status,reference,appointment,message);
      confirmation.scrollIntoView({behavior:'smooth',block:'center'});
      form.reset(); startInput.value=''; blockInput.value='';
    } catch(error) { setAlert(error.message || 'Tempahan tidak dapat dibuat. Please contact the clinic.', 'error'); }
    finally { button.disabled=false; }
  });

  loadBootstrap().catch(error=>setAlert(error.message || 'Tempahan tidak dapat dimuatkan.', 'error'));
})();
