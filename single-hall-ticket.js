(function(){
  function escSingle(v=''){
    return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }
  function notifySingle(t){ if(typeof toast==='function') toast(t); else alert(t); }

  function installStyles(){
    if(document.getElementById('single-hall-ticket-styles')) return;
    const s=document.createElement('style');
    s.id='single-hall-ticket-styles';
    s.textContent=`
      .single-hall-ticket{background:#fff;color:#111;border:1px solid #cfd5df;border-radius:14px;padding:22px;font-family:Arial,sans-serif}
      .single-hall-head{text-align:center;border-bottom:2px solid #222;padding-bottom:12px;margin-bottom:14px}
      .single-hall-head h3{margin:0;font-size:20px}.single-hall-head p{margin:4px 0;font-size:12px}.single-hall-label{font-weight:900;letter-spacing:.08em;font-size:13px}
      .single-hall-info{width:100%;border-collapse:collapse;margin-top:10px}.single-hall-info td{border:1px solid #666;padding:7px 8px;font-size:12px;background:#fff;color:#111}.single-hall-info td.label{font-weight:800;width:20%}
      .single-hall-subjects{width:100%;border-collapse:collapse;margin-top:14px}.single-hall-subjects th,.single-hall-subjects td{border:1px solid #666;padding:6px 8px;font-size:11px;background:#fff;color:#111}.single-hall-subjects th{font-weight:900}
      .single-hall-sign{display:flex;justify-content:space-between;gap:20px;margin-top:28px;font-size:11px}.single-hall-note{margin-top:10px;color:var(--muted);font-size:12px}
      @media print{.single-hall-ticket{border:1px solid #222;box-shadow:none;padding:12mm}.single-hall-info td,.single-hall-subjects th,.single-hall-subjects td{font-size:10px}}
    `;
    document.head.appendChild(s);
  }

  function simplifyForm(){
    const first=document.getElementById('hallStudentSelect');
    if(first){
      const label=first.closest('label');
      if(label){
        // Replace any "Student 1" text while preserving the select element.
        for(const n of [...label.childNodes]){
          if(n.nodeType===Node.TEXT_NODE){ n.textContent='Student'; break; }
        }
      }
    }

    const second=document.getElementById('hallStudentSelect2');
    if(second){
      const secondLabel=second.closest('label');
      if(secondLabel) secondLabel.remove();
    }

    document.querySelectorAll('#halltickets .hall-note').forEach(n=>n.remove());

    const form=document.querySelector('#halltickets .form-grid.single');
    if(form && !document.getElementById('singleHallInfoNote')){
      const note=document.createElement('p');
      note.id='singleHallInfoNote';
      note.className='single-hall-note';
      note.textContent='Select one student and one examination to generate the hall ticket.';
      form.after(note);
    }
  }

  function generateSingleHallTicket(){
    const studentId=Number(document.getElementById('hallStudentSelect')?.value||0);
    const examId=Number(document.getElementById('hallExamSelect')?.value||0);
    const student=(state.students||[]).find(s=>Number(s.id)===studentId);
    const exam=(state.exams||[]).find(e=>Number(e.id)===examId);
    if(!student||!exam){ notifySingle('Select Student and Examination'); return; }

    const centre=document.getElementById('examCentre')?.value||'';
    const semester=exam.semester||`${student.year||''}-${student.sem||''}`;
    const subjects=(state.subjects||[]).filter(s=>s.branch===student.branch&&s.semester===semester);
    const college=state.settings?.collegeName||'ABC College of Engineering';
    const preview=document.getElementById('hallTicketPreview');
    if(!preview) return;

    preview.innerHTML=`
      <div class="single-hall-ticket">
        <div class="single-hall-head">
          <h3>${escSingle(college.toUpperCase())}</h3>
          <p>Autonomous Institution</p>
          <div class="single-hall-label">HALL TICKET</div>
        </div>
        <table class="single-hall-info">
          <tr><td class="label">Hall Ticket No.</td><td><b>${escSingle(student.hall)}</b></td><td class="label">Student Name</td><td><b>${escSingle(student.name)}</b></td></tr>
          <tr><td class="label">Branch</td><td>${escSingle(student.branch)}</td><td class="label">Year / Semester</td><td>${escSingle(student.year)} Year / Semester ${escSingle(student.sem)}</td></tr>
          <tr><td class="label">Regulation</td><td>${escSingle(student.regulation||'')}</td><td class="label">Exam Semester</td><td>${escSingle(semester)}</td></tr>
          <tr><td class="label">Examination</td><td colspan="3">${escSingle(exam.name)}</td></tr>
          <tr><td class="label">Exam Centre</td><td colspan="3">${escSingle(centre)}</td></tr>
          <tr><td class="label">Date</td><td>${typeof formatDate==='function'?escSingle(formatDate(exam.date)):escSingle(exam.date||'')}</td><td class="label">Session</td><td>${escSingle(exam.session||'')}</td></tr>
        </table>
        <table class="single-hall-subjects">
          <thead><tr><th>S.No</th><th>Subject Code</th><th>Subject Name</th></tr></thead>
          <tbody>${subjects.length?subjects.map((s,i)=>`<tr><td>${i+1}</td><td>${escSingle(s.code)}</td><td>${escSingle(s.name)}</td></tr>`).join(''):'<tr><td colspan="3">No subjects configured for this branch / semester.</td></tr>'}</tbody>
        </table>
        <div class="single-hall-sign"><span>Student Signature: __________________</span><span>Controller of Examinations</span></div>
      </div>`;
    notifySingle('Hall ticket generated');
  }

  function replaceGenerateButton(){
    const old=document.getElementById('generateHallBtn');
    if(!old||old.dataset.singleHall==='true') return;
    const fresh=old.cloneNode(true);
    fresh.dataset.singleHall='true';
    old.replaceWith(fresh);
    fresh.addEventListener('click',generateSingleHallTicket);
  }

  installStyles();
  simplifyForm();
  replaceGenerateButton();

  // Reapply if another previously loaded module attempts to rebuild the hall-ticket form.
  document.querySelector('[data-view="halltickets"]')?.addEventListener('click',()=>setTimeout(()=>{
    simplifyForm();
    replaceGenerateButton();
  },0));
})();