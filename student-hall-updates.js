(function(){
  const YEARS=['I','II','III','IV'];
  let studentPage=1;
  const studentPageSize=50;

  function esc2(v=''){
    return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]));
  }
  function msg(t){ if(typeof toast==='function') toast(t); else alert(t); }

  function injectModuleStyles(){
    if(document.getElementById('student-hall-update-styles')) return;
    const s=document.createElement('style');
    s.id='student-hall-update-styles';
    s.textContent=`
      .student-actions{display:flex;gap:6px;align-items:center;white-space:nowrap}
      .student-action-btn{border:1px solid var(--line);background:var(--surface);color:var(--text);padding:6px 10px;border-radius:9px;font-size:12px;font-weight:800}
      .student-action-btn:hover{border-color:#60a5fa;color:var(--primary)}
      .student-action-btn.delete{color:var(--danger)}
      .student-action-btn.delete:hover{border-color:#fca5a5;background:rgba(220,38,38,.05)}
      .student-pager{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 2px 0;flex-wrap:wrap}.student-pager-info{font-size:12px;color:var(--muted);font-weight:800}.student-pager-actions{display:flex;gap:7px;align-items:center}.student-page-btn{border:1px solid var(--line);background:var(--surface);color:var(--text);border-radius:9px;padding:7px 11px;font-weight:800}.student-page-btn:disabled{opacity:.45;cursor:not-allowed}.student-clear-btn{white-space:nowrap}.student-empty-filter{padding:26px;text-align:center;color:var(--muted)}
      .hall-filter-panel{border:1px solid var(--line);background:var(--surface-2);border-radius:14px;padding:12px;margin:0 0 14px}
      .hall-filter-title{font-size:12px;font-weight:900;margin:0 0 8px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
      .hall-filter-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
      .hall-filter-grid label{display:grid;gap:5px;font-size:12px;font-weight:800}
      .hall-filter-summary{margin:9px 0 0;font-size:12px;color:var(--muted);font-weight:700}
      @media(max-width:650px){.hall-filter-grid{grid-template-columns:1fr}.student-pager{align-items:flex-start;flex-direction:column}}
    `;
    document.head.appendChild(s);
  }

  function branchList(){
    const masters=Array.isArray(state?.branches)?state.branches.filter(x=>(x.status||'Active')==='Active'):[];
    if(masters.length) return masters.map(x=>({code:x.code,name:x.name||x.code}));
    const codes=[...new Set((state?.students||[]).map(x=>x.branch).filter(Boolean))].sort();
    return codes.map(code=>({code,name:code}));
  }

  function installStudentPagerUI(){
    const filters=document.querySelector('#students .filters');
    if(filters&&!document.getElementById('studentClearFilters')){
      const btn=document.createElement('button');btn.type='button';btn.className='btn btn-outline student-clear-btn';btn.id='studentClearFilters';btn.textContent='Clear Filters';
      const exportBtn=document.getElementById('exportStudentsBtn');filters.insertBefore(btn,exportBtn||null);
      btn.addEventListener('click',()=>{
        const q=document.getElementById('studentSearch'),b=document.getElementById('branchFilter'),y=document.getElementById('yearFilter'),s=document.getElementById('semesterFilter');
        if(q)q.value='';if(b)b.value='';if(y)y.value='';if(s)s.value='';studentPage=1;renderStudents();
      });
    }
    const wrap=document.querySelector('#students .table-wrap');
    if(wrap&&!document.getElementById('studentPager')){
      const p=document.createElement('div');p.className='student-pager';p.id='studentPager';p.innerHTML='<div class="student-pager-info" id="studentPagerInfo"></div><div class="student-pager-actions"><button class="student-page-btn" id="studentPrevPage" type="button">← Previous</button><span class="student-pager-info" id="studentPageLabel"></span><button class="student-page-btn" id="studentNextPage" type="button">Next →</button></div>';
      wrap.after(p);
      document.getElementById('studentPrevPage').addEventListener('click',()=>{if(studentPage>1){studentPage--;renderStudents();document.querySelector('#students .card')?.scrollIntoView({behavior:'smooth',block:'start'})}});
      document.getElementById('studentNextPage').addEventListener('click',()=>{studentPage++;renderStudents();document.querySelector('#students .card')?.scrollIntoView({behavior:'smooth',block:'start'})});
    }
    ['studentSearch','branchFilter','yearFilter','semesterFilter'].forEach(id=>{
      const el=document.getElementById(id);if(el&&!el.dataset.pageReset){el.dataset.pageReset='1';el.addEventListener(id==='studentSearch'?'input':'change',()=>{studentPage=1})}
    });
  }

  function protectReset(){
    const btn=document.getElementById('resetDemoBtn');
    if(!btn)return;
    const total=(state.students||[]).length;
    if(total>10){btn.disabled=true;btn.textContent='Reset Disabled';btn.title=`Protected because ${total} student records are stored in this browser`;}
  }

  function installStudentActions(){
    const table=document.querySelector('#students table');
    if(table){const ths=table.querySelectorAll('thead th');if(ths.length) ths[ths.length-1].textContent='Actions';}
    installStudentPagerUI();

    renderStudents=function(){
      installStudentPagerUI();
      const q=document.getElementById('studentSearch')?.value.trim().toLowerCase()||'';
      const branch=document.getElementById('branchFilter')?.value||'';
      const year=document.getElementById('yearFilter')?.value||'';
      const sem=document.getElementById('semesterFilter')?.value||'';
      const all=(state.students||[]).slice().sort((a,b)=>String(a.hall||'').localeCompare(String(b.hall||'')));
      const items=all.filter(s=>(!q||`${s.hall} ${s.name}`.toLowerCase().includes(q))&&(!branch||s.branch===branch)&&(!year||s.year===year)&&(!sem||s.sem===sem));
      const pages=Math.max(1,Math.ceil(items.length/studentPageSize));if(studentPage>pages)studentPage=pages;if(studentPage<1)studentPage=1;
      const start=(studentPage-1)*studentPageSize,end=Math.min(start+studentPageSize,items.length),pageItems=items.slice(start,end);
      const body=document.getElementById('studentTableBody');
      if(body){
        body.innerHTML=pageItems.map(s=>`<tr><td><b>${esc2(s.hall)}</b></td><td>${esc2(s.name)}</td><td>${esc2(s.branch)}</td><td>${esc2(s.year)}</td><td>${esc2(s.sem)}</td><td>${esc2(s.regulation)}</td><td>${typeof badge==='function'?badge(s.status):esc2(s.status)}</td><td><div class="student-actions"><button class="student-action-btn" type="button" onclick="updateStudentRecord(${s.id})">Update</button><button class="student-action-btn delete" type="button" onclick="deleteStudentRecord(${s.id})">Delete</button></div></td></tr>`).join('') || `<tr><td colspan="8" class="student-empty-filter">${all.length?`No students match the selected filters. Total stored students: <b>${all.length}</b>. Click <b>Clear Filters</b>.`:'No students are currently stored in this browser.'}</td></tr>`;
      }
      const c=document.getElementById('studentFilterCount');if(c)c.textContent=`${items.length} matching / ${all.length} total`;
      const info=document.getElementById('studentPagerInfo');if(info)info.textContent=items.length?`Showing ${start+1}–${end} of ${items.length} matching students · ${all.length} total stored`:`0 matching students · ${all.length} total stored`;
      const label=document.getElementById('studentPageLabel');if(label)label.textContent=`Page ${items.length?studentPage:0} of ${items.length?pages:0}`;
      const prev=document.getElementById('studentPrevPage'),next=document.getElementById('studentNextPage');if(prev)prev.disabled=studentPage<=1||!items.length;if(next)next.disabled=studentPage>=pages||!items.length;
      protectReset();
    };

    window.resetStudentPagination=function(){studentPage=1};
    window.updateStudentRecord=function(id){const student=(state.students||[]).find(x=>Number(x.id)===Number(id));if(!student){msg('Student not found');return;}openStudentModal(student);};
    window.deleteStudentRecord=function(id){const student=(state.students||[]).find(x=>Number(x.id)===Number(id));if(!student){msg('Student not found');return;}if(!confirm(`Delete student ${student.hall} — ${student.name}?`)) return;state.students=(state.students||[]).filter(x=>Number(x.id)!==Number(id));if(state.results&&Object.prototype.hasOwnProperty.call(state.results,id))delete state.results[id];saveData();renderStudents();if(typeof renderDashboard==='function')renderDashboard();if(typeof populateStudentSelects==='function')populateStudentSelects();if(typeof populateHallSelects==='function')populateHallSelects();msg('Student deleted successfully');};
    renderStudents();
  }

  function filteredStudents(){const branch=document.getElementById('hallBranchFilter')?.value||'',year=document.getElementById('hallYearFilter')?.value||'',sem=document.getElementById('hallSemesterFilter')?.value||'';return(state.students||[]).filter(s=>(s.status||'Active')==='Active').filter(s=>(!branch||s.branch===branch)&&(!year||s.year===year)&&(!sem||s.sem===sem)).sort((a,b)=>String(a.hall).localeCompare(String(b.hall)));}
  function fillStudentSelect(sel,placeholder,students,current){if(!sel)return;sel.innerHTML=`<option value="">${placeholder}</option>`+students.map(s=>`<option value="${s.id}">${esc2(s.hall)} — ${esc2(s.name)}</option>`).join('');if(current&&students.some(s=>String(s.id)===String(current)))sel.value=String(current)}
  function refreshHallStudentFilters(){const list=filteredStudents(),s1=document.getElementById('hallStudentSelect'),s2=document.getElementById('hallStudentSelect2'),current1=s1?.value||'',current2=s2?.value||'';fillStudentSelect(s1,'Select first student',list,current1);fillStudentSelect(s2,'Select second student',list,current2);const summary=document.getElementById('hallFilterSummary');if(summary)summary.textContent=`${list.length} active student${list.length===1?'':'s'} available for the selected Branch / Year / Semester.`}

  function installHallTicketFilters(){
    const form=document.querySelector('#halltickets .form-grid.single');if(!form)return;
    if(!document.getElementById('hallBranchFilter')){const panel=document.createElement('div');panel.className='hall-filter-panel';panel.innerHTML=`<p class="hall-filter-title">Filter Students</p><div class="hall-filter-grid"><label>Branch<select class="input" id="hallBranchFilter"><option value="">All Branches</option></select></label><label>Year<select class="input" id="hallYearFilter"><option value="">All Years</option>${YEARS.map(y=>`<option value="${y}">${y} Year</option>`).join('')}</select></label><label>Semester<select class="input" id="hallSemesterFilter"><option value="">All Semesters</option><option value="I">Semester I</option><option value="II">Semester II</option></select></label></div><p class="hall-filter-summary" id="hallFilterSummary"></p>`;form.parentElement.insertBefore(panel,form);const b=document.getElementById('hallBranchFilter');b.innerHTML='<option value="">All Branches</option>'+branchList().map(x=>`<option value="${esc2(x.code)}">${esc2(x.code)} — ${esc2(x.name)}</option>`).join('');['hallBranchFilter','hallYearFilter','hallSemesterFilter'].forEach(id=>document.getElementById(id)?.addEventListener('change',refreshHallStudentFilters));}
    populateHallSelects=function(){const examSel=document.getElementById('hallExamSelect'),currentExam=examSel?.value||'';if(examSel){examSel.innerHTML='<option value="">Select examination</option>'+(state.exams||[]).map(e=>`<option value="${e.id}">${esc2(e.name)}</option>`).join('');if(currentExam&&(state.exams||[]).some(e=>String(e.id)===String(currentExam)))examSel.value=currentExam;}refreshHallStudentFilters();};populateHallSelects();
  }

  injectModuleStyles();installStudentActions();installHallTicketFilters();protectReset();
  document.querySelector('[data-view="halltickets"]')?.addEventListener('click',()=>setTimeout(()=>{const b=document.getElementById('hallBranchFilter');if(b){const current=b.value;b.innerHTML='<option value="">All Branches</option>'+branchList().map(x=>`<option value="${esc2(x.code)}">${esc2(x.code)} — ${esc2(x.name)}</option>`).join('');if([...b.options].some(o=>o.value===current))b.value=current;}refreshHallStudentFilters();},0));
  if(!document.querySelector('script[data-attendance-loader]')){const loader=document.createElement('script');loader.src='attendance-module.js';loader.dataset.attendanceLoader='true';document.body.appendChild(loader);}
})();