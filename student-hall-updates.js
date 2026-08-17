(function(){
  const YEARS=['I','II','III','IV'];

  function esc2(v=''){
    return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
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
      .hall-filter-panel{border:1px solid var(--line);background:var(--surface-2);border-radius:14px;padding:12px;margin:0 0 14px}
      .hall-filter-title{font-size:12px;font-weight:900;margin:0 0 8px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
      .hall-filter-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
      .hall-filter-grid label{display:grid;gap:5px;font-size:12px;font-weight:800}
      .hall-filter-summary{margin:9px 0 0;font-size:12px;color:var(--muted);font-weight:700}
      @media(max-width:650px){.hall-filter-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function branchList(){
    const masters=Array.isArray(state?.branches)?state.branches.filter(x=>(x.status||'Active')==='Active'):[];
    if(masters.length) return masters.map(x=>({code:x.code,name:x.name||x.code}));
    const codes=[...new Set((state?.students||[]).map(x=>x.branch).filter(Boolean))].sort();
    return codes.map(code=>({code,name:code}));
  }

  function installStudentActions(){
    const table=document.querySelector('#students table');
    if(table){
      const ths=table.querySelectorAll('thead th');
      if(ths.length) ths[ths.length-1].textContent='Actions';
    }

    renderStudents=function(){
      const q=document.getElementById('studentSearch')?.value.trim().toLowerCase()||'';
      const branch=document.getElementById('branchFilter')?.value||'';
      const year=document.getElementById('yearFilter')?.value||'';
      const sem=document.getElementById('semesterFilter')?.value||'';
      const items=(state.students||[]).filter(s=>(!q||`${s.hall} ${s.name}`.toLowerCase().includes(q))&&(!branch||s.branch===branch)&&(!year||s.year===year)&&(!sem||s.sem===sem));
      const body=document.getElementById('studentTableBody');
      if(body){
        body.innerHTML=items.map(s=>`<tr>
          <td><b>${esc2(s.hall)}</b></td>
          <td>${esc2(s.name)}</td>
          <td>${esc2(s.branch)}</td>
          <td>${esc2(s.year)}</td>
          <td>${esc2(s.sem)}</td>
          <td>${esc2(s.regulation)}</td>
          <td>${typeof badge==='function'?badge(s.status):esc2(s.status)}</td>
          <td><div class="student-actions">
            <button class="student-action-btn" type="button" onclick="updateStudentRecord(${s.id})">Update</button>
            <button class="student-action-btn delete" type="button" onclick="deleteStudentRecord(${s.id})">Delete</button>
          </div></td>
        </tr>`).join('')||'<tr><td colspan="8" class="empty-state">No students found.</td></tr>';
      }
      const c=document.getElementById('studentFilterCount');
      if(c)c.textContent=`${items.length} / ${(state.students||[]).length} students`;
    };

    window.updateStudentRecord=function(id){
      const student=(state.students||[]).find(x=>Number(x.id)===Number(id));
      if(!student){msg('Student not found');return;}
      openStudentModal(student);
    };

    window.deleteStudentRecord=function(id){
      const student=(state.students||[]).find(x=>Number(x.id)===Number(id));
      if(!student){msg('Student not found');return;}
      if(!confirm(`Delete student ${student.hall} — ${student.name}?`)) return;
      state.students=(state.students||[]).filter(x=>Number(x.id)!==Number(id));
      if(state.results && Object.prototype.hasOwnProperty.call(state.results,id)) delete state.results[id];
      saveData();
      renderStudents();
      if(typeof renderDashboard==='function') renderDashboard();
      if(typeof populateStudentSelects==='function') populateStudentSelects();
      if(typeof populateHallSelects==='function') populateHallSelects();
      msg('Student deleted successfully');
    };

    renderStudents();
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

  function fillStudentSelect(sel,placeholder,students,current){
    if(!sel)return;
    sel.innerHTML=`<option value="">${placeholder}</option>`+students.map(s=>`<option value="${s.id}">${esc2(s.hall)} — ${esc2(s.name)}</option>`).join('');
    if(current && students.some(s=>String(s.id)===String(current))) sel.value=String(current);
  }

  function refreshHallStudentFilters(){
    const list=filteredStudents();
    const s1=document.getElementById('hallStudentSelect');
    const s2=document.getElementById('hallStudentSelect2');
    const current1=s1?.value||'';
    const current2=s2?.value||'';
    fillStudentSelect(s1,'Select first student',list,current1);
    fillStudentSelect(s2,'Select second student',list,current2);
    const summary=document.getElementById('hallFilterSummary');
    if(summary) summary.textContent=`${list.length} active student${list.length===1?'':'s'} available for the selected Branch / Year / Semester.`;
  }

  function installHallTicketFilters(){
    const form=document.querySelector('#halltickets .form-grid.single');
    if(!form)return;

    if(!document.getElementById('hallBranchFilter')){
      const panel=document.createElement('div');
      panel.className='hall-filter-panel';
      panel.innerHTML=`
        <p class="hall-filter-title">Filter Students</p>
        <div class="hall-filter-grid">
          <label>Branch<select class="input" id="hallBranchFilter"><option value="">All Branches</option></select></label>
          <label>Year<select class="input" id="hallYearFilter"><option value="">All Years</option>${YEARS.map(y=>`<option value="${y}">${y} Year</option>`).join('')}</select></label>
          <label>Semester<select class="input" id="hallSemesterFilter"><option value="">All Semesters</option><option value="I">Semester I</option><option value="II">Semester II</option></select></label>
        </div>
        <p class="hall-filter-summary" id="hallFilterSummary"></p>`;
      form.parentElement.insertBefore(panel,form);

      const b=document.getElementById('hallBranchFilter');
      b.innerHTML='<option value="">All Branches</option>'+branchList().map(x=>`<option value="${esc2(x.code)}">${esc2(x.code)} — ${esc2(x.name)}</option>`).join('');
      ['hallBranchFilter','hallYearFilter','hallSemesterFilter'].forEach(id=>document.getElementById(id)?.addEventListener('change',refreshHallStudentFilters));
    }

    populateHallSelects=function(){
      const examSel=document.getElementById('hallExamSelect');
      const currentExam=examSel?.value||'';
      if(examSel){
        examSel.innerHTML='<option value="">Select examination</option>'+(state.exams||[]).map(e=>`<option value="${e.id}">${esc2(e.name)}</option>`).join('');
        if(currentExam && (state.exams||[]).some(e=>String(e.id)===String(currentExam))) examSel.value=currentExam;
      }
      refreshHallStudentFilters();
    };

    populateHallSelects();
  }

  injectModuleStyles();
  installStudentActions();
  installHallTicketFilters();

  document.querySelector('[data-view="halltickets"]')?.addEventListener('click',()=>setTimeout(()=>{
    const b=document.getElementById('hallBranchFilter');
    if(b){
      const current=b.value;
      b.innerHTML='<option value="">All Branches</option>'+branchList().map(x=>`<option value="${esc2(x.code)}">${esc2(x.code)} — ${esc2(x.name)}</option>`).join('');
      if([...b.options].some(o=>o.value===current)) b.value=current;
    }
    refreshHallStudentFilters();
  },0));

  if(!document.querySelector('script[data-attendance-loader]')){
    const loader=document.createElement('script');
    loader.src='attendance-module.js';
    loader.dataset.attendanceLoader='true';
    document.body.appendChild(loader);
  }
})();