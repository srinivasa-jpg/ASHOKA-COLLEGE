(function(){
  function e(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]))}
  function msg(t){if(typeof toast==='function')toast(t);else alert(t)}

  function styles(){
    if(document.getElementById('bulk-hall-ticket-styles'))return;
    const s=document.createElement('style');s.id='bulk-hall-ticket-styles';s.textContent=`
      .bulk-hall-note{margin:8px 0 0;color:var(--muted);font-size:12px;line-height:1.5}.bulk-hall-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px}.bulk-hall-summary>div{background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:11px}.bulk-hall-summary small{display:block;color:var(--muted);margin-bottom:4px}.bulk-hall-summary b{font-size:18px}.bulk-hall-pages{display:grid;gap:18px}.bulk-hall-page{display:grid;grid-template-rows:1fr 1fr;gap:0;background:#fff;color:#111;border:1px solid #cfd5df;box-shadow:0 8px 22px rgba(15,23,42,.08);min-height:920px}.bulk-hall-ticket{padding:16px 18px;background:#fff;color:#111;font-family:Arial,sans-serif;overflow:hidden}.bulk-hall-ticket+.bulk-hall-ticket{border-top:2px dashed #777}.bulk-hall-title{text-align:center;margin:0;font-size:17px}.bulk-hall-sub{text-align:center;margin:2px 0 5px;font-size:10px}.bulk-hall-label{text-align:center;font-weight:900;font-size:11px;margin-bottom:7px;letter-spacing:.06em}.bulk-hall-info,.bulk-hall-subjects{width:100%;border-collapse:collapse;min-width:0}.bulk-hall-info td{border:1px solid #777;padding:4px 5px;font-size:9px;background:#fff;color:#111}.bulk-hall-info td:nth-child(odd){font-weight:800;width:18%}.bulk-hall-subjects{margin-top:6px}.bulk-hall-subjects th,.bulk-hall-subjects td{border:1px solid #777;padding:3px 4px;font-size:8px;background:#fff;color:#111}.bulk-hall-sign{display:flex;justify-content:space-between;gap:16px;margin-top:7px;font-size:8px}.bulk-hall-empty{display:grid;place-items:center;min-height:360px;color:#666;font-size:12px;background:#fff}.bulk-hall-filter-required{font-size:12px;font-weight:800;color:var(--muted);margin-top:8px}
      @media(max-width:800px){.bulk-hall-summary{grid-template-columns:1fr 1fr}.bulk-hall-page{min-height:auto}.bulk-hall-ticket{overflow:auto}}
      @media print{.bulk-hall-page{height:277mm;min-height:277mm;box-shadow:none;border:0;break-after:page;page-break-after:always}.bulk-hall-page:last-child{break-after:auto;page-break-after:auto}.bulk-hall-ticket{padding:5mm;border:1px solid #222;overflow:hidden}.bulk-hall-ticket+.bulk-hall-ticket{border-top:1px dashed #222}.bulk-hall-title{font-size:14px}.bulk-hall-info td{font-size:8.5px}.bulk-hall-subjects th,.bulk-hall-subjects td{font-size:7.5px}.ticket{inset:4mm!important}.ticket .bulk-hall-pages,.ticket .bulk-hall-pages *{visibility:visible}}
    `;document.head.appendChild(s);
  }

  function removeStudentSelectors(){
    ['hallStudentSelect','hallStudentSelect2'].forEach(id=>{
      const el=document.getElementById(id);if(el){const label=el.closest('label');if(label)label.remove();else el.remove()}
    });
    document.getElementById('twoHallInfoNote')?.remove();
    document.getElementById('singleHallInfoNote')?.remove();
    const form=document.querySelector('#halltickets .form-grid.single');
    if(form&&!document.getElementById('bulkHallInfoNote')){
      const p=document.createElement('p');p.id='bulkHallInfoNote';p.className='bulk-hall-note';p.textContent='Select Branch, Year and Semester filters, choose the examination, then generate hall tickets for all matching active students. Two hall tickets are arranged on each A4 page.';form.after(p)
    }
  }

  function filteredStudents(){
    const branch=document.getElementById('hallBranchFilter')?.value||'';
    const year=document.getElementById('hallYearFilter')?.value||'';
    const sem=document.getElementById('hallSemesterFilter')?.value||'';
    return (state.students||[])
      .filter(s=>(s.status||'Active')==='Active')
      .filter(s=>(!branch||s.branch===branch)&&(!year||s.year===year)&&(!sem||s.sem===sem))
      .sort((a,b)=>String(a.hall).localeCompare(String(b.hall)));
  }

  function ensureSummary(){
    const card=document.querySelector('#halltickets .grid-2 > .card');if(!card)return;
    if(!document.getElementById('bulkHallSummary')){
      const box=document.createElement('div');box.id='bulkHallSummary';box.className='bulk-hall-summary';box.innerHTML='<div><small>Matching Students</small><b id="bulkHallStudentCount">0</b></div><div><small>Hall Tickets</small><b id="bulkHallTicketCount">0</b></div><div><small>A4 Pages</small><b id="bulkHallPageCount">0</b></div><div><small>Layout</small><b>2 / page</b></div>';
      card.appendChild(box)
    }
    updateSummary();
  }

  function updateSummary(){
    const list=filteredStudents(),count=list.length,pages=Math.ceil(count/2);
    const a=document.getElementById('bulkHallStudentCount'),b=document.getElementById('bulkHallTicketCount'),c=document.getElementById('bulkHallPageCount');
    if(a)a.textContent=count;if(b)b.textContent=count;if(c)c.textContent=pages;
    const summary=document.getElementById('hallFilterSummary');if(summary)summary.textContent=`${count} active student${count===1?'':'s'} match the selected Branch / Year / Semester.`;
  }

  function ticket(student,exam,centre){
    const semester=exam.semester||`${student.year||''}-${student.sem||''}`;
    const subjects=(state.subjects||[]).filter(s=>s.branch===student.branch&&s.semester===semester);
    return `<section class="bulk-hall-ticket"><h3 class="bulk-hall-title">${e((state.settings?.collegeName||'ABC College of Engineering').toUpperCase())}</h3><p class="bulk-hall-sub">Autonomous Institution</p><div class="bulk-hall-label">HALL TICKET</div><table class="bulk-hall-info"><tr><td>Hall Ticket</td><td><b>${e(student.hall)}</b></td><td>Student</td><td><b>${e(student.name)}</b></td></tr><tr><td>Branch</td><td>${e(student.branch)}</td><td>Year / Sem</td><td>${e(student.year)} / ${e(student.sem)}</td></tr><tr><td>Regulation</td><td>${e(student.regulation||'')}</td><td>Exam Sem</td><td>${e(semester)}</td></tr><tr><td>Examination</td><td colspan="3">${e(exam.name)}</td></tr><tr><td>Centre</td><td colspan="3">${e(centre)}</td></tr><tr><td>Date</td><td>${e(typeof formatDate==='function'?formatDate(exam.date):exam.date||'')}</td><td>Session</td><td>${e(exam.session||'')}</td></tr></table><table class="bulk-hall-subjects"><thead><tr><th>S.No</th><th>Subject Code</th><th>Subject Name</th></tr></thead><tbody>${subjects.length?subjects.map((s,i)=>`<tr><td>${i+1}</td><td>${e(s.code)}</td><td>${e(s.name)}</td></tr>`).join(''):'<tr><td colspan="3">No subjects configured</td></tr>'}</tbody></table><div class="bulk-hall-sign"><span>Student Signature: __________</span><span>Controller of Examinations</span></div></section>`;
  }

  function generateBulk(){
    const branch=document.getElementById('hallBranchFilter')?.value||'';
    const year=document.getElementById('hallYearFilter')?.value||'';
    const sem=document.getElementById('hallSemesterFilter')?.value||'';
    const exam=(state.exams||[]).find(x=>Number(x.id)===Number(document.getElementById('hallExamSelect')?.value));
    const centre=document.getElementById('examCentre')?.value||'';
    if(!branch||!year||!sem){msg('Select Branch, Year and Semester');return}
    if(!exam){msg('Select Examination');return}
    const students=filteredStudents();
    if(!students.length){msg('No active students found for the selected filters');return}
    const pages=[];
    for(let i=0;i<students.length;i+=2){const first=students[i],second=students[i+1];pages.push(`<div class="bulk-hall-page">${ticket(first,exam,centre)}${second?ticket(second,exam,centre):'<section class="bulk-hall-empty">No second student on this page</section>'}</div>`)}
    const preview=document.getElementById('hallTicketPreview');if(preview){preview.classList.add('bulk-hall-preview');preview.innerHTML=`<div class="bulk-hall-pages">${pages.join('')}</div>`}
    updateSummary();msg(`${students.length} hall ticket${students.length===1?'':'s'} generated on ${pages.length} A4 page${pages.length===1?'':'s'}`)
  }

  function installGenerate(){
    const old=document.getElementById('generateHallBtn');if(!old)return;
    const fresh=old.cloneNode(true);fresh.id='generateHallBtn';fresh.textContent='Generate Bulk Hall Tickets';old.replaceWith(fresh);fresh.addEventListener('click',generateBulk)
  }

  function init(){
    styles();removeStudentSelectors();ensureSummary();installGenerate();
    ['hallBranchFilter','hallYearFilter','hallSemesterFilter'].forEach(id=>document.getElementById(id)?.addEventListener('change',updateSummary));
    document.querySelector('[data-view="halltickets"]')?.addEventListener('click',()=>setTimeout(()=>{removeStudentSelectors();ensureSummary();updateSummary()},0));
  }
  init();
})();