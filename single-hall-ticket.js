(function(){
  function e(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function msg(t){if(typeof toast==='function')toast(t);else alert(t)}

  function styles(){
    if(document.getElementById('two-hall-ticket-styles'))return;
    const s=document.createElement('style');s.id='two-hall-ticket-styles';s.textContent=`
      .dual-ticket-page{display:grid;grid-template-columns:1fr;gap:0;background:#fff;color:#111}.dual-ticket-half{border:1px solid #666;padding:12px;background:#fff;color:#111;min-height:360px}.dual-ticket-half+.dual-ticket-half{border-top:2px dashed #777}.dual-ticket-title{text-align:center;margin:0;font-size:16px}.dual-ticket-sub{text-align:center;margin:2px 0 5px;font-size:10px}.dual-ticket-label{text-align:center;font-weight:900;font-size:11px;margin-bottom:7px;letter-spacing:.06em}.dual-info,.dual-subjects{width:100%;border-collapse:collapse;min-width:0}.dual-info td{border:1px solid #777;padding:4px 5px;font-size:9px;background:#fff;color:#111}.dual-info td:nth-child(odd){font-weight:800;width:18%}.dual-subjects{margin-top:6px}.dual-subjects th,.dual-subjects td{border:1px solid #777;padding:3px 4px;font-size:8px;background:#fff;color:#111}.dual-sign{display:flex;justify-content:space-between;gap:16px;margin-top:7px;font-size:8px}.two-hall-note{margin-top:8px;color:var(--muted);font-size:12px}
      @media print{.dual-ticket-page{height:270mm;grid-template-rows:1fr 1fr}.dual-ticket-half{padding:5mm;overflow:hidden;min-height:0}.dual-ticket-half+.dual-ticket-half{border-top:1px dashed #222}.ticket{inset:5mm!important}.ticket .dual-ticket-page,.ticket .dual-ticket-page *{visibility:visible}.dual-ticket-title{font-size:14px}.dual-info td{font-size:8.5px}.dual-subjects th,.dual-subjects td{font-size:7.5px}}
    `;document.head.appendChild(s);
  }

  function ensureTwoSelectors(){
    const form=document.querySelector('#halltickets .form-grid.single');if(!form)return;
    const first=document.getElementById('hallStudentSelect');if(!first)return;
    const firstLabel=first.closest('label');if(firstLabel){for(const n of [...firstLabel.childNodes])if(n.nodeType===Node.TEXT_NODE){n.textContent='Student 1';break}}
    if(!document.getElementById('hallStudentSelect2')){
      const label=document.createElement('label');label.innerHTML='Student 2<select class="input" id="hallStudentSelect2"></select>';
      firstLabel.after(label);
    }
    document.getElementById('singleHallInfoNote')?.remove();
    if(!document.getElementById('twoHallInfoNote')){const p=document.createElement('p');p.id='twoHallInfoNote';p.className='two-hall-note';p.textContent='Two hall tickets are generated on one A4 page.';form.after(p)}
  }

  function filteredStudents(){
    const branch=document.getElementById('hallBranchFilter')?.value||'';
    const year=document.getElementById('hallYearFilter')?.value||'';
    const sem=document.getElementById('hallSemesterFilter')?.value||'';
    return (state.students||[]).filter(s=>(s.status||'Active')==='Active'&&(!branch||s.branch===branch)&&(!year||s.year===year)&&(!sem||s.sem===sem)).sort((a,b)=>String(a.hall).localeCompare(String(b.hall)));
  }
  function fillStudents(){
    ensureTwoSelectors();const list=filteredStudents();
    const a=document.getElementById('hallStudentSelect'),b=document.getElementById('hallStudentSelect2');
    const av=a?.value||'',bv=b?.value||'';
    if(a){a.innerHTML='<option value="">Select Student 1</option>'+list.map(s=>`<option value="${s.id}">${e(s.hall)} — ${e(s.name)}</option>`).join('');if(list.some(s=>String(s.id)===av))a.value=av}
    if(b){b.innerHTML='<option value="">Select Student 2</option>'+list.map(s=>`<option value="${s.id}">${e(s.hall)} — ${e(s.name)}</option>`).join('');if(list.some(s=>String(s.id)===bv))b.value=bv}
    const sum=document.getElementById('hallFilterSummary');if(sum)sum.textContent=`${list.length} active student${list.length===1?'':'s'} available for the selected Branch / Year / Semester.`;
  }

  function ticketHalf(student,exam,centre){
    const semester=exam.semester||`${student.year||''}-${student.sem||''}`;
    const subjects=(state.subjects||[]).filter(s=>s.branch===student.branch&&s.semester===semester);
    return `<section class="dual-ticket-half"><h3 class="dual-ticket-title">${e((state.settings?.collegeName||'ABC College of Engineering').toUpperCase())}</h3><p class="dual-ticket-sub">Autonomous Institution</p><div class="dual-ticket-label">HALL TICKET</div><table class="dual-info"><tr><td>Hall Ticket</td><td><b>${e(student.hall)}</b></td><td>Student</td><td><b>${e(student.name)}</b></td></tr><tr><td>Branch</td><td>${e(student.branch)}</td><td>Year / Sem</td><td>${e(student.year)} / ${e(student.sem)}</td></tr><tr><td>Regulation</td><td>${e(student.regulation||'')}</td><td>Exam Sem</td><td>${e(semester)}</td></tr><tr><td>Examination</td><td colspan="3">${e(exam.name)}</td></tr><tr><td>Centre</td><td colspan="3">${e(centre)}</td></tr><tr><td>Date</td><td>${e(typeof formatDate==='function'?formatDate(exam.date):exam.date||'')}</td><td>Session</td><td>${e(exam.session||'')}</td></tr></table><table class="dual-subjects"><thead><tr><th>S.No</th><th>Subject Code</th><th>Subject Name</th></tr></thead><tbody>${subjects.length?subjects.map((s,i)=>`<tr><td>${i+1}</td><td>${e(s.code)}</td><td>${e(s.name)}</td></tr>`).join(''):'<tr><td colspan="3">No subjects configured</td></tr>'}</tbody></table><div class="dual-sign"><span>Student Signature: __________</span><span>Controller of Examinations</span></div></section>`;
  }
  function generate(){
    const s1=(state.students||[]).find(s=>Number(s.id)===Number(document.getElementById('hallStudentSelect')?.value));
    const s2=(state.students||[]).find(s=>Number(s.id)===Number(document.getElementById('hallStudentSelect2')?.value));
    const exam=(state.exams||[]).find(x=>Number(x.id)===Number(document.getElementById('hallExamSelect')?.value));
    const centre=document.getElementById('examCentre')?.value||'';
    if(!s1||!s2||!exam){msg('Select Student 1, Student 2 and Examination');return}
    if(s1.id===s2.id){msg('Select two different students');return}
    const preview=document.getElementById('hallTicketPreview');if(preview)preview.innerHTML=`<div class="dual-ticket-page">${ticketHalf(s1,exam,centre)}${ticketHalf(s2,exam,centre)}</div>`;
    msg('Two-student hall ticket generated');
  }
  function installGenerate(){
    const old=document.getElementById('generateHallBtn');if(!old||old.dataset.twoHall==='true')return;
    const fresh=old.cloneNode(true);fresh.dataset.twoHall='true';old.replaceWith(fresh);fresh.addEventListener('click',generate);
  }

  styles();ensureTwoSelectors();fillStudents();installGenerate();
  ['hallBranchFilter','hallYearFilter','hallSemesterFilter'].forEach(id=>document.getElementById(id)?.addEventListener('change',fillStudents));
  document.querySelector('[data-view="halltickets"]')?.addEventListener('click',()=>{ensureTwoSelectors();fillStudents();installGenerate()});
})();