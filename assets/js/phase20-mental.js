(function(){
  const form=document.querySelector('.mh20-dass-shell [data-dass-form]');
  if(!form) return;
  const questions=[...form.querySelectorAll('.dass-question')];
  if(questions.length!==21) return;

  let step=1;
  const progress=document.createElement('div');
  progress.className='mh20-dass-progress';
  progress.innerHTML='<div class="mh20-dass-progress-top"><strong>Langkah 1 daripada 3</strong><span>Soalan 1–7 daripada 21</span></div><div class="mh20-dass-track"><div class="mh20-dass-bar"></div></div>';
  form.prepend(progress);

  const error=document.createElement('div');
  error.className='mh20-dass-error';
  error.textContent='Sila jawab semua 7 soalan dalam langkah ini sebelum meneruskan.';
  progress.after(error);

  const stepActions=document.createElement('div');
  stepActions.className='mh20-step-actions';
  stepActions.innerHTML='<button type="button" class="mh20-dass-prev">← Sebelumnya</button><button type="button" class="mh20-dass-next">Seterusnya →</button>';
  const formActions=form.querySelector('.dass-form-actions');
  formActions?.before(stepActions);

  const label=progress.querySelector('strong');
  const range=progress.querySelector('span');
  const bar=progress.querySelector('.mh20-dass-bar');
  const prev=stepActions.querySelector('.mh20-dass-prev');
  const next=stepActions.querySelector('.mh20-dass-next');

  function render(){
    form.dataset.mhStep=String(step);
    const start=(step-1)*7;
    const end=step*7;
    questions.forEach((q,index)=>q.hidden=!(index>=start && index<end));
    label.textContent=`Langkah ${step} daripada 3`;
    range.textContent=`Soalan ${start+1}–${end} daripada 21`;
    bar.style.width=`${step*33.333}%`;
    prev.hidden=step===1;
    next.hidden=step===3;
    error.classList.remove('is-visible');
  }

  function answeredCurrent(){
    const current=questions.slice((step-1)*7,step*7);
    return current.every(q=>q.querySelector('input[type="radio"]:checked'));
  }
  function scrollToForm(){ form.scrollIntoView({behavior:'smooth',block:'start'}); }

  next.addEventListener('click',()=>{
    if(!answeredCurrent()){
      error.classList.add('is-visible');
      const firstMissing=questions.slice((step-1)*7,step*7).find(q=>!q.querySelector('input[type="radio"]:checked'));
      firstMissing?.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }
    step=Math.min(3,step+1); render(); scrollToForm();
  });
  prev.addEventListener('click',()=>{step=Math.max(1,step-1); render(); scrollToForm();});
  form.addEventListener('reset',()=>{window.setTimeout(()=>{step=1;render();},0)});
  form.addEventListener('change',()=>error.classList.remove('is-visible'));
  render();
})();
