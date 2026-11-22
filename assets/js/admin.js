import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.116.0';
import { locumAiAvatar } from './locum-avatar.js';

const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.content || '';
const url = meta('phase57-supabase-url');
const publishableKey = meta('phase57-supabase-key');
const loginCard=document.getElementById('admin-login-card');
const loginForm=document.getElementById('admin-login-form');
const loginStatus=document.getElementById('admin-login-status');
const app=document.getElementById('admin-app');
const statusBox=document.getElementById('admin-status');
let client=null, profile=null, branches=[], services=[], doctors=[], rosterPreview=null;
const appointmentsById=new Map();

function status(text,type=''){statusBox.textContent=text;statusBox.className=`admin-status ${type}`;}
function loginMessage(text,type=''){loginStatus.textContent=text;loginStatus.className=type;}
function escapeHtml(value=''){return String(value).replace(/[&<>'"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function formatMY(value){if(!value)return '';return new Intl.DateTimeFormat('en-MY',{timeZone:'Asia/Kuala_Lumpur',dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}
function labelBy(list,id){return list.find(x=>x.id===id)?.name || id || '—';}
function setOptions(select,list,includeBlank=false){select.innerHTML=includeBlank?'<option value="">Any mapped service</option>':'';list.forEach(x=>{const o=document.createElement('option');o.value=x.id;o.textContent=x.name;select.appendChild(o);});}

async function loadProfile(user){
  const {data,error}=await client.from('website_user_profiles').select('user_id,role,branch_id,display_name,is_active').eq('user_id',user.id).maybeSingle();
  if(error) throw error;
  if(!data) throw new Error('Website admin profile is not configured for this account. Add this Auth user to website_user_profiles before signing in.');
  if(!data.is_active) throw new Error('Your website admin profile is inactive.');
  profile=data;
}

async function loadReferenceData(){
  const [b,s,d]=await Promise.all([
    client.from('branches').select('id,slug,name').eq('is_active',true).order('name'),
    client.from('services').select('id,slug,name').eq('is_active',true).order('name'),
    client.from('doctors').select('id,slug,name').eq('is_active',true).order('name'),
  ]);
  for(const result of [b,s,d]) if(result.error) throw result.error;
  branches=b.data||[];services=s.data||[];doctors=d.data||[];
  const branchSelect=document.getElementById('schedule-branch');
  setOptions(branchSelect,branches);
  if(profile.role!=='master_admin'){branchSelect.value=profile.branch_id;branchSelect.disabled=true;}
  setOptions(document.getElementById('schedule-doctor'),doctors);
  setOptions(document.getElementById('schedule-service'),services,true);
}

async function loadAppointments(){
  const body=document.getElementById('appointments-body');body.innerHTML='<tr><td colspan="6">Loading…</td></tr>';
  const {data,error}=await client.from('appointments').select('id,reference_code,starts_at,ends_at,patient_name,phone,email,notes,status,branch_id,doctor_id,service_id,created_at,source').order('starts_at',{ascending:true}).limit(200);
  if(error) throw error;
  body.innerHTML='';appointmentsById.clear();
  for(const row of data||[]){
    appointmentsById.set(row.id,row);
    const tr=document.createElement('tr');
    const statuses=['pending','confirmed','completed','cancelled','no_show'];
    tr.innerHTML=`<td>${escapeHtml(formatMY(row.starts_at))}</td><td>${escapeHtml(row.patient_name)}</td><td>${escapeHtml(row.phone)}</td><td><select class="status-select" data-appointment-status="${row.id}">${statuses.map(s=>`<option value="${s}" ${s===row.status?'selected':''}>${s}</option>`).join('')}</select></td><td>${escapeHtml(row.reference_code)}</td><td><button class="btn btn-outline appointment-view-button" type="button" data-appointment-view="${row.id}">View details</button></td>`;
    body.appendChild(tr);
  }
  if(!(data||[]).length) body.innerHTML='<tr><td colspan="6">No appointments found.</td></tr>';
}

function openAppointmentDetails(id){
  const row=appointmentsById.get(id);if(!row)return;
  const dialog=document.getElementById('appointment-detail-dialog');
  const body=document.getElementById('appointment-detail-body');
  const fields=[
    ['Reference',row.reference_code],['Status',row.status],['Appointment start',formatMY(row.starts_at)],['Appointment end',formatMY(row.ends_at)],
    ['Patient',row.patient_name],['Phone',row.phone],['Email',row.email||'—'],['Branch',labelBy(branches,row.branch_id)],
    ['Doctor',labelBy(doctors,row.doctor_id)],['Service',labelBy(services,row.service_id)],['Submitted',formatMY(row.created_at)],['Source',row.source||'—'],
  ];
  body.replaceChildren();
  for(const [label,value] of fields){const item=document.createElement('div');const term=document.createElement('span');const detail=document.createElement('strong');term.textContent=label;detail.textContent=value||'—';item.append(term,detail);body.appendChild(item);}
  const notes=document.getElementById('appointment-detail-notes');notes.textContent=row.notes||'No notes supplied.';
  if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
}

async function loadSchedules(){
  const body=document.getElementById('schedules-body');body.innerHTML='<tr><td colspan="5">Loading…</td></tr>';
  const {data,error}=await client.from('availability_blocks').select('id,branch_id,doctor_id,service_id,starts_at,ends_at,is_active').order('starts_at',{ascending:true}).limit(300);
  if(error) throw error;
  body.innerHTML='';
  for(const row of data||[]){const tr=document.createElement('tr');tr.innerHTML=`<td>${escapeHtml(formatMY(row.starts_at))}</td><td>${escapeHtml(formatMY(row.ends_at))}</td><td>${escapeHtml(labelBy(doctors,row.doctor_id))}</td><td>${escapeHtml(row.service_id?labelBy(services,row.service_id):'Any mapped service')}</td><td>${row.is_active?'Yes':'No'}</td>`;body.appendChild(tr);}
  if(!(data||[]).length) body.innerHTML='<tr><td colspan="5">No schedule blocks found.</td></tr>';
}


function rosterEndpoint(){return `${url.replace(/\/$/,'')}/functions/v1/doctor-roster-import`;}
async function rosterHeaders(jsonBody=false){
  const {data:{session}}=await client.auth.getSession();
  if(!session?.access_token) throw new Error('Your website admin session has expired. Please sign in again.');
  const headers={apikey:publishableKey,authorization:`Bearer ${session.access_token}`};
  if(jsonBody) headers['Content-Type']='application/json';
  return headers;
}
function rosterMonthLabel(value=''){
  const match=String(value).match(/^(\d{4})-(\d{2})/);if(!match)return String(value||'—');
  return new Intl.DateTimeFormat('en-MY',{month:'short',year:'numeric',timeZone:'Asia/Kuala_Lumpur'}).format(new Date(`${match[1]}-${match[2]}-01T00:00:00+08:00`));
}
function rosterDateLabel(iso=''){if(!iso)return '—';return new Intl.DateTimeFormat('en-MY',{timeZone:'Asia/Kuala_Lumpur',day:'2-digit',month:'short',year:'numeric'}).format(new Date(iso));}
function rosterTimeLabel(iso=''){if(!iso)return '—';return new Intl.DateTimeFormat('en-MY',{timeZone:'Asia/Kuala_Lumpur',hour:'numeric',minute:'2-digit',hour12:true}).format(new Date(iso));}

function renderRosterPreview(data){
  rosterPreview=data||null;
  const wrap=document.getElementById('roster-preview');
  const summary=document.getElementById('roster-preview-summary');
  const warningBox=document.getElementById('roster-preview-warnings');
  const body=document.getElementById('roster-preview-body');
  const confirmButton=document.getElementById('roster-confirm-button');
  if(!wrap||!summary||!warningBox||!body||!confirmButton)return;
  if(!data){wrap.hidden=true;summary.innerHTML='';warningBox.innerHTML='';body.innerHTML='';confirmButton.disabled=true;return;}
  wrap.hidden=false;
  const detected=data.detected||{};const counts=data.summary||{};
  summary.innerHTML=`
    <div><span>Detected branch</span><strong>${escapeHtml(detected.branch_name||labelBy(branches,detected.branch_id)||'—')}</strong><small>${escapeHtml(detected.external_branch_id||'')}</small></div>
    <div><span>Roster month</span><strong>${escapeHtml(rosterMonthLabel(detected.month))}</strong><small>Backend detected</small></div>
    <div><span>Parsed shifts</span><strong>${Number(counts.parsed||0)}</strong><small>${Number(counts.mapped||0)} mapped to website doctors</small></div>
    <div><span>Locum roster-only</span><strong>${Number(counts.locum_only||0)}</strong><small>Shown on duty roster, not booking</small></div>
    <div><span>Excluded</span><strong>${Number(counts.excluded||0)}</strong><small>${Number(counts.warnings||0)} warning(s)</small></div>`;
  const warnings=Array.isArray(data.warnings)?data.warnings:[];
  warningBox.innerHTML=warnings.length?`<strong>Preview warnings</strong><ul>${warnings.slice(0,12).map(w=>`<li><b>${escapeHtml(w.code||'Warning')}</b> ${escapeHtml(w.message||'')}</li>`).join('')}</ul>${warnings.length>12?`<span>+ ${warnings.length-12} more warning(s)</span>`:''}`:'<span class="roster-preview-ok">No blocking parser warnings detected.</span>';
  const entries=Array.isArray(data.entries)?data.entries:[];
  body.innerHTML=entries.map(row=>{
    const mapped=row.doctor_id?`Mapped · ${labelBy(doctors,row.doctor_id)}`:(row.is_unassigned?'Excluded':row.is_locum?'Roster only':'Unmapped');
    const badge=row.doctor_id?'mapped':row.is_unassigned?'excluded':row.is_locum?'locum':'warning';
    const doctorCell=row.is_locum
      ? `<span class="roster-doctor-cell"><img class="roster-avatar" src="${locumAiAvatar(row.display_name||'locum')}" alt="AI avatar" loading="lazy"><span>${escapeHtml(row.display_name||'—')}<small>AI avatar</small></span></span>`
      : `<span class="roster-doctor-cell"><span>${escapeHtml(row.display_name||'—')}</span></span>`;
    return `<tr><td>${escapeHtml(rosterDateLabel(row.starts_at||row.roster_date))}</td><td>${escapeHtml(rosterTimeLabel(row.starts_at))} – ${escapeHtml(rosterTimeLabel(row.ends_at))}</td><td>${doctorCell}</td><td>${row.is_locum?'Locum':'Resident'}</td><td><span class="roster-badge ${badge}">${escapeHtml(mapped)}</span></td></tr>`;
  }).join('')||'<tr><td colspan="5">No roster entries were parsed.</td></tr>';
  confirmButton.dataset.importId=data.import_id||'';
  confirmButton.disabled=!data.can_commit||profile?.role==='staff'||!data.import_id;
  confirmButton.textContent=data.already_committed?'Already committed':'Confirm import';
}

async function previewRoster(file){
  if(!file)throw new Error('Choose a KlinikOS Doctor Roster .xlsx file.');
  const form=new FormData();form.append('action','preview');form.append('file',file);
  const response=await fetch(rosterEndpoint(),{method:'POST',headers:await rosterHeaders(false),body:form});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Roster preview failed.');
  renderRosterPreview(data);return data;
}

async function commitRoster(){
  if(!rosterPreview?.import_id)throw new Error('Preview a roster before confirming the import.');
  const response=await fetch(rosterEndpoint(),{method:'POST',headers:await rosterHeaders(true),body:JSON.stringify({action:'commit',import_id:rosterPreview.import_id})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Roster import failed.');
  return data;
}

async function loadRosterHistory(){
  const body=document.getElementById('roster-import-history-body');if(!body)return;
  body.innerHTML='<tr><td colspan="7">Loading…</td></tr>';
  const qs=new URLSearchParams([['action','history']]);
  const response=await fetch(`${rosterEndpoint()}?${qs.toString()}`,{headers:await rosterHeaders(false)});
  const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||'Unable to load roster import history.');
  const rows=Array.isArray(payload.imports)?payload.imports:[];
  body.innerHTML=rows.map(row=>`<tr><td>${escapeHtml(rosterMonthLabel(row.roster_month))}</td><td>${escapeHtml(labelBy(branches,row.branch_id))}</td><td>${escapeHtml(row.source_filename)}</td><td><span class="roster-badge ${escapeHtml(row.status)}">${escapeHtml(row.status)}</span></td><td>${Number(row.parsed_count||0)}</td><td>${Number(row.warning_count||0)}</td><td>${escapeHtml(formatMY(row.created_at))}</td></tr>`).join('')||'<tr><td colspan="7">No roster imports found.</td></tr>';
}

async function loadLeads(){
  const body=document.getElementById('leads-body');body.innerHTML='<tr><td colspan="6">Loading…</td></tr>';
  const {data,error}=await client.from('corporate_leads').select('id,reference_code,company_name,contact_name,phone,services_requested,status,preferred_branch_id,created_at').order('created_at',{ascending:false}).limit(200);
  if(error) throw error;
  body.innerHTML='';
  const statuses=['new','contacted','meeting','proposal','negotiation','won','lost'];
  for(const row of data||[]){const tr=document.createElement('tr');tr.innerHTML=`<td>${escapeHtml(row.company_name)}</td><td>${escapeHtml(row.contact_name)}</td><td>${escapeHtml(row.phone)}</td><td>${escapeHtml((row.services_requested||[]).join(', '))}</td><td><select class="status-select" data-lead-status="${row.id}">${statuses.map(s=>`<option value="${s}" ${s===row.status?'selected':''}>${s}</option>`).join('')}</select></td><td>${escapeHtml(row.reference_code)}</td>`;body.appendChild(tr);}
  if(!(data||[]).length) body.innerHTML='<tr><td colspan="6">No corporate leads found for this scope.</td></tr>';
}

async function openApp(session){
  await loadProfile(session.user);await loadReferenceData();
  loginCard.hidden=true;app.hidden=false;
  document.getElementById('admin-user-name').textContent=profile.display_name || session.user.email || 'Website user';
  document.getElementById('admin-scope').textContent=profile.role==='master_admin'?'Master Admin · All website branches':`${profile.role.replace('_',' ')} · ${labelBy(branches,profile.branch_id)}`;
  const scheduleForm=document.getElementById('schedule-form');
  scheduleForm.hidden=profile.role==='staff';
  const rosterImportControls=document.getElementById('roster-import-controls');
  if(rosterImportControls)rosterImportControls.hidden=profile.role==='staff';
  await Promise.all([loadAppointments(),loadSchedules(),loadLeads(),loadRosterHistory()]);
}

async function init(){
  if(!url||!publishableKey){loginMessage('Website Supabase is not configured yet.','error');loginForm.querySelector('button').disabled=true;return;}
  client=createClient(url,publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const {data:{session}}=await client.auth.getSession();
  if(session){try{await openApp(session);}catch(error){loginMessage(error.message||'Unable to open admin.','error');await client.auth.signOut();}}
}

loginForm?.addEventListener('submit',async(e)=>{e.preventDefault();loginMessage('Signing in…');const fd=new FormData(loginForm);const {data,error}=await client.auth.signInWithPassword({email:String(fd.get('email')||''),password:String(fd.get('password')||'')});if(error){loginMessage(error.message,'error');return;}try{await openApp(data.session);loginMessage('');}catch(err){loginMessage(err.message||'Access denied.','error');await client.auth.signOut();}});
document.getElementById('admin-signout')?.addEventListener('click',async()=>{await client.auth.signOut();location.reload();});

document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b===btn));document.querySelectorAll('[data-panel]').forEach(p=>p.classList.toggle('active',p.dataset.panel===btn.dataset.tab));}));
document.querySelectorAll('[data-refresh]').forEach(btn=>btn.addEventListener('click',async()=>{try{status('Refreshing…');const type=btn.dataset.refresh;if(type==='appointments')await loadAppointments();if(type==='schedules'){await loadSchedules();await loadRosterHistory();}if(type==='leads')await loadLeads();status('Updated.','success');}catch(e){status(e.message||'Refresh failed.','error');}}));

document.getElementById('schedule-form')?.addEventListener('submit',async(e)=>{e.preventDefault();if(profile.role==='staff')return;const fd=new FormData(e.currentTarget);const branchId=profile.role==='master_admin'?String(fd.get('branch_id')):profile.branch_id;const date=String(fd.get('date'));const start=String(fd.get('start_time'));const end=String(fd.get('end_time'));const startsAt=new Date(`${date}T${start}:00+08:00`).toISOString();const endsAt=new Date(`${date}T${end}:00+08:00`).toISOString();if(new Date(endsAt)<=new Date(startsAt)){status('End time must be after start time.','error');return;}const row={branch_id:branchId,doctor_id:String(fd.get('doctor_id')),service_id:fd.get('service_id')?String(fd.get('service_id')):null,starts_at:startsAt,ends_at:endsAt,slot_minutes:Number(fd.get('slot_minutes')),created_by:(await client.auth.getUser()).data.user?.id};const {error}=await client.from('availability_blocks').insert(row);if(error){status(error.message,'error');return;}status('Availability block added.','success');e.currentTarget.reset();await loadSchedules();});

document.addEventListener('change',async(e)=>{const el=e.target;if(!(el instanceof HTMLSelectElement))return;if(el.dataset.appointmentStatus){const {error}=await client.from('appointments').update({status:el.value}).eq('id',el.dataset.appointmentStatus);status(error?error.message:'Appointment status updated.',error?'error':'success');}if(el.dataset.leadStatus){const {error}=await client.from('corporate_leads').update({status:el.value}).eq('id',el.dataset.leadStatus);status(error?error.message:'Lead status updated.',error?'error':'success');}});

document.addEventListener('click',(event)=>{
  const viewButton=event.target.closest('[data-appointment-view]');
  if(viewButton){openAppointmentDetails(viewButton.dataset.appointmentView);return;}
  if(event.target.closest('[data-appointment-dialog-close]'))document.getElementById('appointment-detail-dialog')?.close();
});


document.getElementById('roster-import-form')?.addEventListener('submit',async(e)=>{
  e.preventDefault();if(profile?.role==='staff')return;
  const button=document.getElementById('roster-preview-button');const file=document.getElementById('roster-file')?.files?.[0];
  try{if(button)button.disabled=true;status('Uploading roster to backend for preview…');await previewRoster(file);status('Roster preview ready. Review the detected branch, month and mappings before confirming.','success');await loadRosterHistory();}
  catch(error){renderRosterPreview(null);status(error.message||'Roster preview failed.','error');}
  finally{if(button)button.disabled=false;}
});

document.getElementById('roster-confirm-button')?.addEventListener('click',async()=>{
  if(profile?.role==='staff'||!rosterPreview?.import_id)return;
  if(!window.confirm('Confirm this KlinikOS roster import? It will replace prior roster-import data for the same branch and month, while preserving manual schedule blocks.'))return;
  const button=document.getElementById('roster-confirm-button');
  try{button.disabled=true;status('Committing roster to the website backend…');const result=await commitRoster();status(`Roster committed. ${Number(result.active_entries||0)} duty entries are active. ${Number(result.availability_blocks_created||result.availability_blocks||0)} booking availability block(s) are linked.`, 'success');renderRosterPreview({...rosterPreview,can_commit:false,already_committed:true,status:'committed'});await Promise.all([loadSchedules(),loadRosterHistory()]);}
  catch(error){status(error.message||'Roster import failed.','error');button.disabled=false;}
});

document.getElementById('roster-history-refresh')?.addEventListener('click',async()=>{try{status('Refreshing roster import history…');await loadRosterHistory();status('Roster import history updated.','success');}catch(error){status(error.message||'Unable to refresh roster history.','error');}});

init().catch(e=>loginMessage(e.message||'Unable to initialize admin.','error'));
