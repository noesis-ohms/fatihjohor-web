(function(){
  const toggle=document.querySelector('[data-menu-toggle]');
  const nav=document.querySelector('[data-nav]');
  if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',open?'true':'false');});}
  document.querySelectorAll('[data-whatsapp-intent]').forEach(btn=>{
    btn.addEventListener('click',function(e){
      const form=this.closest('form');
      if(!form)return;
      e.preventDefault();
      const phone=this.dataset.phone||'60126009784';
      const topic=form.querySelector('[name="topic"]')?.value||'Pertanyaan website';
      const name=form.querySelector('[name="name"]')?.value||'';
      const note=form.querySelector('[name="note"]')?.value||'';
      const msg=`Assalamualaikum Klinik Al-Fatih Johor. Saya ${name}. Saya nak tanya tentang ${topic}. ${note}`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,'_blank','noopener');
    });
  });
  const bmiForm=document.querySelector('[data-bmi-form]');
  if(bmiForm){
    bmiForm.addEventListener('submit',function(e){
      e.preventDefault();
      const weight=parseFloat(this.querySelector('[name="weight"]').value);
      const heightCm=parseFloat(this.querySelector('[name="height"]').value);
      const out=this.querySelector('[data-bmi-result]');
      const wa=this.querySelector('[data-bmi-whatsapp]');
      if(!out)return;
      if(!weight||!heightCm||weight<20||heightCm<100){
        out.textContent='Masukkan berat dan tinggi yang betul dahulu.';
        return;
      }
      const bmi=weight/Math.pow(heightCm/100,2);
      let cat='Normal / optimal mengikut bacaan Asian BMI';
      let risk='Risiko metabolik lebih rendah, tetapi tetap perlu lihat ukuran pinggang, pemakanan, aktiviti dan sejarah keluarga.';
      let advice='Teruskan gaya hidup sihat dan pantau berat secara berkala.';
      let tone='good';
      if(bmi<18.5){
        cat='Kurang berat';
        risk='Berat mungkin terlalu rendah. Jika turun berat tanpa sengaja, cepat penat atau kurang selera makan, elok dinilai oleh doktor.';
        advice='Semak pemakanan, tidur, tekanan dan punca perubatan jika berkaitan.';
        tone='warn';
      }else if(bmi>=23 && bmi<27.5){
        cat='Pre-obese / overweight mengikut bacaan Asian BMI';
        risk='Untuk populasi Asia, BMI 23.0–27.4 dikategorikan sebagai pre-obese/overweight dan risiko metabolik mula meningkat.';
        advice='Sesuai untuk semak body composition, visceral fat, ukuran pinggang dan ujian darah jika perlu.';
        tone='risk';
      }else if(bmi>=27.5 && bmi<32.5){
        cat='Obese I mengikut bacaan Asian BMI';
        risk='Bacaan ini dikaitkan dengan risiko komorbid yang tinggi seperti diabetes, darah tinggi, kolesterol, fatty liver, OSA atau sakit sendi.';
        advice='Pertimbangkan penilaian doktor untuk semak sejarah kesihatan, ubat semasa, tekanan darah, ujian berkaitan jika perlu dan pilihan pengurusan yang sesuai.';
        tone='high';
      }else if(bmi>=32.5 && bmi<37.5){
        cat='Obese II mengikut bacaan Asian BMI';
        risk='Bacaan ini menunjukkan risiko komorbid yang sangat tinggi dan memerlukan penilaian kesihatan yang lebih menyeluruh.';
        advice='Penilaian doktor disarankan untuk menilai risiko kesihatan berkaitan berat badan dan menentukan pelan pengurusan yang sesuai.';
        tone='high';
      }else if(bmi>=37.5){
        cat='Obese III mengikut bacaan Asian BMI';
        risk='Bacaan ini menunjukkan risiko kesihatan ekstrem/amat tinggi. Pelan rawatan perlu dibuat secara tersusun dan dipantau doktor.';
        advice='Dapatkan penilaian doktor untuk menilai risiko kesihatan, keperluan pemeriksaan lanjut dan pilihan rawatan yang sesuai.';
        tone='high';
      }
      out.className='bmi-result-box bmi-'+tone;
      const urgentNote = bmi>=27.5 ? '<p class="bmi-urgent-inline"><b>Nota:</b> BMI 27.5 ke atas berada dalam julat obesiti bagi cut-off Asia dan wajar dinilai bersama faktor risiko kesihatan yang lain.</p>' : '';
      out.innerHTML=`<strong>BMI anda: ${bmi.toFixed(1)} kg/m²</strong><span>${cat}</span><p>${risk}</p><p><b>Cadangan:</b> ${advice}</p>${urgentNote}`;
      if(wa){
        const urgentMsg = bmi>=27.5 ? ' Saya ingin berbincang tentang faktor risiko dan pilihan pengurusan yang sesuai.' : '';
        const msg=`Assalamualaikum Klinik Al-Fatih Johor. Saya nak semak program weight loss. Berat: ${weight}kg, tinggi: ${heightCm}cm, BMI: ${bmi.toFixed(1)} (${cat}).${urgentMsg}`;
        wa.href=`https://wa.me/60126009784?text=${encodeURIComponent(msg)}`;
      }
    });
  }

  const dassForm=document.querySelector('[data-dass-form]');
  if(dassForm){
    const severity = {
      depression: [
        [9,'Normal'],[13,'Mild'],[20,'Moderate'],[27,'Severe'],[999,'Extremely Severe']
      ],
      anxiety: [
        [7,'Normal'],[9,'Mild'],[14,'Moderate'],[19,'Severe'],[999,'Extremely Severe']
      ],
      stress: [
        [14,'Normal'],[18,'Mild'],[25,'Moderate'],[33,'Severe'],[999,'Extremely Severe']
      ]
    };
    const labelFor=(type,score)=>{
      const found=severity[type].find(([max])=>score<=max);
      return found?found[1]:'Extremely Severe';
    };
    dassForm.addEventListener('submit',function(e){
      e.preventDefault();
      const out=this.querySelector('[data-dass-result]');
      const wa=this.querySelector('[data-dass-whatsapp]');
      const radios=[...this.querySelectorAll('input[type="radio"]:checked')];
      if(radios.length<21){
        if(out) out.innerHTML='<div class="dass-warning"><strong>Sila jawab semua 21 soalan dahulu.</strong><p>Keputusan hanya boleh dikira selepas semua soalan lengkap.</p></div>';
        return;
      }
      const scores={depression:0,anxiety:0,stress:0};
      const domains={d:'depression',a:'anxiety',s:'stress'};
      radios.forEach(r=>{
        const field=r.closest('[data-domain]');
        if(!field)return;
        const key=domains[field.dataset.domain];
        scores[key]+=parseInt(r.value,10)||0;
      });
      const scaled={
        depression:scores.depression*2,
        anxiety:scores.anxiety*2,
        stress:scores.stress*2
      };
      const labels={
        depression:labelFor('depression',scaled.depression),
        anxiety:labelFor('anxiety',scaled.anxiety),
        stress:labelFor('stress',scaled.stress)
      };
      const abnormal=[labels.depression,labels.anxiety,labels.stress].some(v=>v!=='Normal');
      const urgent=[labels.depression,labels.anxiety,labels.stress].some(v=>v==='Severe'||v==='Extremely Severe');
      const advice = urgent
        ? 'Keputusan menunjukkan bacaan severe / extremely severe pada sekurang-kurangnya satu domain. Aturkan penilaian dengan doktor atau profesional kesihatan mental untuk memahami simptom dan langkah seterusnya.'
        : abnormal
          ? 'Keputusan menunjukkan bacaan abnormal pada sekurang-kurangnya satu domain. Anda disarankan berjumpa doktor untuk penilaian lanjut.'
          : 'Keputusan berada dalam julat normal. Teruskan penjagaan diri dan dapatkan bantuan jika simptom mengganggu fungsi harian.';
      const crisis = 'Jika anda rasa tidak selamat, ada dorongan mencederakan diri, atau krisis emosi yang kuat, hubungi 999 atau Talian HEAL 15555 dengan segera.';
      if(out){
        out.className='dass-result '+(urgent?'dass-urgent':abnormal?'dass-abnormal':'dass-normal');
        out.innerHTML=`
          <h3>Keputusan DASS-21 anda</h3>
          <div class="dass-score-grid">
            <div><span>Depression</span><strong>${scaled.depression}</strong><em>${labels.depression}</em></div>
            <div><span>Anxiety</span><strong>${scaled.anxiety}</strong><em>${labels.anxiety}</em></div>
            <div><span>Stress</span><strong>${scaled.stress}</strong><em>${labels.stress}</em></div>
          </div>
          <p><b>Nasihat:</b> ${advice}</p>
          <p class="dass-crisis">${crisis}</p>
          <p class="mini-note">DASS-21 ialah saringan laporan kendiri, bukan diagnosis. Skor perlu dibincangkan bersama doktor atau profesional kesihatan mental.</p>
        `;
      }
      if(wa){
        const msg=`Assalamualaikum Klinik Al-Fatih Johor. Saya nak bincang keputusan DASS-21. Depression: ${scaled.depression} (${labels.depression}), Anxiety: ${scaled.anxiety} (${labels.anxiety}), Stress: ${scaled.stress} (${labels.stress}). ${urgent?'Saya ingin aturkan penilaian lanjut untuk keputusan severe/extremely severe.':abnormal?'Saya ingin bincang keputusan saringan yang abnormal.':''}`;
        wa.href=`https://wa.me/60126009784?text=${encodeURIComponent(msg)}`;
      }
    });
    dassForm.addEventListener('reset',function(){
      const out=this.querySelector('[data-dass-result]');
      if(out){
        out.className='dass-result';
        out.textContent='Keputusan akan dipaparkan selepas anda menjawab semua 21 soalan.';
      }
      const wa=this.querySelector('[data-dass-whatsapp]');
      if(wa){
        wa.href='https://wa.me/60126009784?text=Assalamualaikum%20Klinik%20Al-Fatih%20Johor%2C%20saya%20nak%20konsultasi%20mental%20health';
      }
    });
  }


  document.querySelectorAll('[data-corporate-panel-whatsapp]').forEach(btn=>{
    btn.addEventListener('click',function(e){
      const form=this.closest('form');
      if(!form)return;
      e.preventDefault();
      const company=form.querySelector('[name="company"]')?.value||'';
      const pic=form.querySelector('[name="pic"]')?.value||'';
      const staff=form.querySelector('[name="staff"]')?.value||'';
      const need=form.querySelector('[name="need"]')?.value||'Panel klinik staf';
      const msg=`Assalamualaikum Klinik Al-Fatih Johor. Syarikat kami nak apply panel klinik.\n\nNama syarikat: ${company}\nPIC/HR: ${pic}\nAnggaran staf: ${staff}\nKeperluan utama: ${need}\n\nMohon team klinik hubungi kami untuk proses seterusnya.`;
      window.open(`https://wa.me/60126009784?text=${encodeURIComponent(msg)}`,'_blank','noopener');
    });
  });


  document.querySelectorAll('.nav-dropdown-toggle').forEach(btn=>{
    btn.addEventListener('click',function(){
      const wrap=this.closest('.nav-dropdown');
      if(!wrap)return;
      const open=wrap.classList.toggle('open');
      this.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.addEventListener('click',function(e){
    document.querySelectorAll('.nav-dropdown.open').forEach(wrap=>{
      if(!wrap.contains(e.target)){
        wrap.classList.remove('open');
        const btn=wrap.querySelector('.nav-dropdown-toggle');
        if(btn)btn.setAttribute('aria-expanded','false');
      }
    });
  });

})();
