(function(){
  const YEARS=['I','II','III','IV'];
  const SEMS=['I','II'];
  const SECTIONS=['A','B','C','D','E','F','G','H','I','J'];
  const PASS_TOTAL=40,PASS_EXTERNAL=25;
  let loaded={students:[],subject:null,semester:'',branch:'',year:'',sem:'',section:''};

  function e(v=''){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function msg(t){if(typeof toast==='function')toast(t);else alert(t)}
  function grade(total,external){total=Number(total)||0;external=Number(external)||0;if(total<PASS_TOTAL||external<PASS_EXTERNAL)return['F',0];if(total>=90)return['S',10];if(total>=80)return['A',9];if(total>=70)return['B',8];if(total>=60)return['C',7];if(total>=50)return['D',6];return['E',5]}
  function canEdit(){return window.CampusRoles?.can?window.CampusRoles.can('marks','update'):true}
  function normSection(v){const x=String(v??'').trim().toUpperCase().replace(/^SECTION\s*/,'');return SECTIONS.includes(x)?x:''}
  function branches(){const master=Array.isArray(state.branches)?state.branches.filter(x=>(x.status||'Active')==='Active').map(x=>String(x.code||'').trim().toUpperCase()):[];const used=(state.students||[]).map(x=>String(x.branch||'').trim().toUpperCase());return [...new Set([...master,...used].filter(Boolean))].sort()}
  function semesterLabel(){const y=document.getElementById('classMarksYear')?.value||'',s=document.getElementById('classMarksSem')?.value||'';return y&&s?`${y}-${s}`:''}

  function styles(){
    if(document.getElementById('class-marks-entry-styles'))return;
    const s=document.createElement('style');s.id='class-marks-entry-styles';s.textContent=`
      #marks .filters,#marks #marksCard{display:none!important}.class-marks-wrap{display:grid;gap:16px}.class-marks-filter-card{padding:16px}.class-marks-filters{display:grid;grid-template-columns:repeat(5,minmax(135px,1fr));gap:10px}.class-marks-filters label{display:grid;gap:6px;font-size:12px;font-weight:800}.class-marks-actions{display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin-top:12px}.class-marks-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.class-marks-summary>div{border:1px solid var(--line);background:var(--surface-2);border-radius:12px;padding:11px}.class-marks-summary small{display:block;color:var(--muted);font-weight:700;margin-bottom:4px}.class-marks-summary b{font-size:18px}.class-marks-table input{width:92px;min-width:78px}.class-marks-table .marks-total,.class-marks-table .marks-grade{font-weight:900}.class-marks-table .marks-grade.fail{color:var(--danger)}.class-marks-table .marks-grade.pass{color:var(--success)}.class-marks-note{font-size:12px;color:var(--muted);line-height:1.5;margin-top:8px}.class-marks-empty{padding:42px 18px;text-align:center;color:var(--muted)}.class-marks-toolbar{display:flex;gap:8px;flex-wrap:wrap}.class-marks-sticky{position:sticky;top:76px;z-index:3;background:var(--surface);border-bottom:1px solid var(--line)}
      @media(max-width:1100px){.class-marks-filters{grid-template-columns:repeat(3,1fr)}}@media(max-width:700px){.class-marks-filters{grid-template-columns:1fr 1fr}.class-marks-summary{grid-template-columns:1fr 1fr}}@media(max-width:480px){.class-marks-filters{grid-template-columns:1fr}.class-marks-table{min-width:760px}}
    `;document.head.appendChild(s)
  }

  function ensureUI(){
    const view=document.getElementById('marks');if(!view||document.getElementById('classMarksEntry'))return false;
    const toolbar=view.querySelector('.section-toolbar');if(toolbar){const p=toolbar.querySelector('p');if(p)p.textContent='Enter marks class-wise using Branch, Year, Semester, Section and Subject filters, or use spreadsheet bulk upload.'}
    const wrap=document.createElement('div');wrap.id='classMarksEntry';wrap.className='class-marks-wrap';wrap.innerHTML=`
      <div class="card class-marks-filter-card">
        <div class="class-marks-filters">
          <label>Branch<select class="input" id="classMarksBranch"></select></label>
          <label>Year<select class="input" id="classMarksYear"><option value="">Select Year</option>${YEARS.map(x=>`<option>${x}</option>`).join('')}</select></label>
          <label>Semester<select class="input" id="classMarksSem"><option value="">Select Semester</option>${SEMS.map(x=>`<option>${x}</option>`).join('')}</select></label>
          <label>Section<select class="input" id="classMarksSection"><option value="">Select Section</option>${SECTIONS.map(x=>`<option value="${x}">Section ${x}</option>`).join('')}</select></label>
          <label>Subject<select class="input" id="classMarksSubject"><option value="">Select filters first</option></select></label>
        </div>
        <div class="class-marks-actions"><button class="btn btn-primary" type="button" id="classMarksLoad">Load Students</button><button class="btn btn-outline" type="button" id="classMarksClear">Clear</button></div>
        <p class="class-marks-note">Pass rule: Total ≥ 40 and External ≥ 25. Only active students in the selected class are loaded. Existing marks for the selected subject are shown automatically.</p>
      </div>
      <div class="class-marks-summary"><div><small>Students</small><b id="classMarksCount">0</b></div><div><small>Subject</small><b id="classMarksSubjectCode">—</b></div><div><small>Internal Max</small><b id="classMarksInternalMax">—</b></div><div><small>External Max</small><b id="classMarksExternalMax">—</b></div></div>
      <div class="card">
        <div class="card-head class-marks-sticky"><div><h3 id="classMarksTitle">Class-wise Marks Entry</h3><p id="classMarksMeta">Select filters and click Load Students.</p></div><div class="class-marks-toolbar"><button class="btn btn-primary" type="button" id="classMarksSave" disabled>Save All Marks</button></div></div>
        <div class="table-wrap"><table class="class-marks-table"><thead><tr><th>#</th><th>Hall Ticket</th><th>Student</th><th>Section</th><th>Internal</th><th>External</th><th>Total</th><th>Grade</th></tr></thead><tbody id="classMarksBody"><tr><td colspan="8" class="class-marks-empty">No class loaded.</td></tr></tbody></table></div>
      </div>`;
    const firstCard=view.querySelector('.card');if(firstCard)firstCard.before(wrap);else view.appendChild(wrap);
    document.getElementById('classMarksBranch').innerHTML='<option value="">Select Branch</option>'+branches().map(x=>`<option value="${e(x)}">${e(x)}</option>`).join('');
    ['classMarksBranch','classMarksYear','classMarksSem'].forEach(id=>document.getElementById(id)?.addEventListener('change',refreshSubjects));
    document.getElementById('classMarksSection').addEventListener('change',()=>clearLoaded(false));
    document.getElementById('classMarksSubject').addEventListener('change',()=>clearLoaded(false));
    document.getElementById('classMarksLoad').addEventListener('click',loadStudents);
    document.getElementById('classMarksClear').addEventListener('click',clearAll);
    document.getElementById('classMarksSave').addEventListener('click',saveAll);
    document.getElementById('classMarksBody').addEventListener('input',ev=>{if(ev.target.matches('.class-internal,.class-external'))recalcRow(ev.target.closest('tr'))});
    applyPermission();return true
  }

  function refreshSubjects(){
    clearLoaded(false);const branch=document.getElementById('classMarksBranch')?.value||'',semester=semesterLabel(),sel=document.getElementById('classMarksSubject');if(!sel)return;
    const subs=(state.subjects||[]).filter(s=>s.branch===branch&&s.semester===semester).sort((a,b)=>String(a.code).localeCompare(String(b.code)));
    sel.innerHTML='<option value="">Select Subject</option>'+subs.map(s=>`<option value="${s.id}">${e(s.code)} — ${e(s.name)}</option>`).join('');if(!branch||!semester)sel.innerHTML='<option value="">Select Branch, Year and Semester first</option>'
  }

  function getSavedMarks(student,subject,semester){
    let r=state.results?.[student.id];if(r?.semester!==semester)r=state.resultHistory?.[String(student.id)]?.[semester]||null;return r?.marks?.[subject.id]||null
  }
  function validateFilters(){const branch=document.getElementById('classMarksBranch').value,year=document.getElementById('classMarksYear').value,sem=document.getElementById('classMarksSem').value,section=normSection(document.getElementById('classMarksSection').value),subject=(state.subjects||[]).find(s=>Number(s.id)===Number(document.getElementById('classMarksSubject').value));if(!branch||!year||!sem||!section)return{error:'Select Branch, Year, Semester and Section'};if(!subject)return{error:'Select Subject'};return{branch,year,sem,section,semester:`${year}-${sem}`,subject}}
  function loadStudents(){
    if(!canEdit())return msg('You do not have permission to enter marks');const f=validateFilters();if(f.error)return msg(f.error);
    const students=(state.students||[]).filter(s=>(s.status||'Active')==='Active'&&s.branch===f.branch&&s.year===f.year&&s.sem===f.sem&&normSection(s.section)===f.section).sort((a,b)=>String(a.hall).localeCompare(String(b.hall)));
    if(!students.length)return msg('No active students found for the selected class');loaded={...f,students};renderTable()
  }
  function renderTable(){
    const {students,subject,semester,branch,year,sem,section}=loaded,body=document.getElementById('classMarksBody');if(!body)return;
    body.innerHTML=students.map((s,i)=>{const m=getSavedMarks(s,subject,semester);return `<tr data-student-id="${s.id}"><td>${i+1}</td><td><b>${e(s.hall)}</b></td><td>${e(s.name)}</td><td>Section ${e(section)}</td><td><input class="input class-internal" type="number" min="0" max="${Number(subject.internal)||0}" step="1" value="${m?.internal??''}" placeholder="0-${Number(subject.internal)||0}"></td><td><input class="input class-external" type="number" min="0" max="${Number(subject.external)||0}" step="1" value="${m?.external??''}" placeholder="0-${Number(subject.external)||0}"></td><td class="marks-total">${m?.total??'—'}</td><td class="marks-grade ${m?.grade==='F'?'fail':m?.grade?'pass':''}">${e(m?.grade||'—')}</td></tr>`}).join('');
    [...body.querySelectorAll('tr')].forEach(recalcRow);document.getElementById('classMarksCount').textContent=students.length;document.getElementById('classMarksSubjectCode').textContent=subject.code;document.getElementById('classMarksInternalMax').textContent=subject.internal;document.getElementById('classMarksExternalMax').textContent=subject.external;document.getElementById('classMarksTitle').textContent=`${subject.code} — ${subject.name}`;document.getElementById('classMarksMeta').textContent=`${branch} · ${year}-${sem} · Section ${section} · ${students.length} students`;document.getElementById('classMarksSave').disabled=!canEdit()
  }
  function recalcRow(tr){if(!tr)return;const iv=tr.querySelector('.class-internal')?.value,ev=tr.querySelector('.class-external')?.value,totalCell=tr.querySelector('.marks-total'),gradeCell=tr.querySelector('.marks-grade');if(iv===''||ev===''){if(totalCell)totalCell.textContent='—';if(gradeCell){gradeCell.textContent='—';gradeCell.className='marks-grade'}return}const total=Number(iv)+Number(ev),[gr]=grade(total,Number(ev));if(totalCell)totalCell.textContent=total;if(gradeCell){gradeCell.textContent=gr;gradeCell.className=`marks-grade ${gr==='F'?'fail':'pass'}`}}

  function preservePreviousSemester(studentId,newSemester){const prev=state.results?.[studentId];if(!prev||!prev.semester||prev.semester===newSemester)return;if(!state.resultHistory||typeof state.resultHistory!=='object')state.resultHistory={};const sid=String(studentId);if(!state.resultHistory[sid])state.resultHistory[sid]={};state.resultHistory[sid][prev.semester]=JSON.parse(JSON.stringify(prev))}
  function baseResult(studentId,semester){const current=state.results?.[studentId];if(current?.semester===semester)return JSON.parse(JSON.stringify(current));const hist=state.resultHistory?.[String(studentId)]?.[semester];if(hist)return JSON.parse(JSON.stringify(hist));return{studentId,semester,marks:{}}}
  function recomputeResult(student,semester,marks){
    const subjects=(state.subjects||[]).filter(s=>s.branch===student.branch&&s.semester===semester),required=subjects.length;let weighted=0,credits=0,failed=false,entered=0;
    subjects.forEach(s=>{const m=marks[s.id];if(!m||m.internal==null||m.external==null)return;const total=Number(m.internal)+Number(m.external),[gr,gp]=grade(total,Number(m.external)),c=Number(s.credits)||0;m.total=total;m.grade=gr;m.gp=gp;m.pass=gr!=='F';weighted+=gp*c;credits+=c;entered++;if(gr==='F')failed=true});
    let sgpa=credits?weighted/credits:0;if(state.settings?.failSgpaZero&&failed)sgpa=0;const complete=required>0&&entered===required;return{sgpa:Number(sgpa.toFixed(2)),result:complete?(failed?'FAIL':'PASS'):'PENDING',credits,subjectsEntered:entered,subjectsRequired:required}
  }
  function saveAll(){
    if(!canEdit())return msg('You do not have permission to enter marks');if(!loaded.students.length||!loaded.subject)return msg('Load a class first');const rows=[...document.querySelectorAll('#classMarksBody tr[data-student-id]')];let saved=0,skipped=0,errors=[];
    rows.forEach(tr=>{const student=(state.students||[]).find(s=>Number(s.id)===Number(tr.dataset.studentId)),iv=tr.querySelector('.class-internal').value,ev=tr.querySelector('.class-external').value;if(iv===''&&ev===''){skipped++;return}if(iv===''||ev===''){errors.push(`${student?.hall||'Student'}: enter both Internal and External`);return}const internal=Number(iv),external=Number(ev),imax=Number(loaded.subject.internal)||0,emax=Number(loaded.subject.external)||0;if(!Number.isFinite(internal)||internal<0||internal>imax||!Number.isFinite(external)||external<0||external>emax){errors.push(`${student?.hall||'Student'}: marks out of range`);return}preservePreviousSemester(student.id,loaded.semester);const result=baseResult(student.id,loaded.semester),total=internal+external,[gr,gp]=grade(total,external);result.marks=result.marks||{};result.marks[loaded.subject.id]={internal,external,total,grade:gr,gp,pass:gr!=='F'};const calc=recomputeResult(student,loaded.semester,result.marks);state.results[student.id]={...result,studentId:student.id,semester:loaded.semester,marks:result.marks,...calc,updatedAt:new Date().toISOString(),source:'class-bulk-entry',passRule:{total:PASS_TOTAL,external:PASS_EXTERNAL}};saved++});
    if(errors.length){msg(errors.slice(0,3).join(' | ')+(errors.length>3?` | +${errors.length-3} more`:''));return}if(!saved)return msg('Enter marks for at least one student');saveData();if(typeof renderDashboard==='function')renderDashboard();window.StudentPortal?.syncResults?.();renderTable();msg(`Marks saved for ${saved} student${saved===1?'':'s'}${skipped?` · ${skipped} blank row${skipped===1?'':'s'} skipped`:''}`)
  }

  function clearLoaded(resetSummary=true){loaded={students:[],subject:null,semester:'',branch:'',year:'',sem:'',section:''};const body=document.getElementById('classMarksBody');if(body)body.innerHTML='<tr><td colspan="8" class="class-marks-empty">No class loaded.</td></tr>';const save=document.getElementById('classMarksSave');if(save)save.disabled=true;if(resetSummary){document.getElementById('classMarksCount').textContent='0';document.getElementById('classMarksSubjectCode').textContent='—';document.getElementById('classMarksInternalMax').textContent='—';document.getElementById('classMarksExternalMax').textContent='—';document.getElementById('classMarksTitle').textContent='Class-wise Marks Entry';document.getElementById('classMarksMeta').textContent='Select filters and click Load Students.'}}
  function clearAll(){['classMarksBranch','classMarksYear','classMarksSem','classMarksSection','classMarksSubject'].forEach(id=>{const x=document.getElementById(id);if(x)x.value=''});refreshSubjects();clearLoaded(true)}
  function applyPermission(){const ok=canEdit();['classMarksLoad','classMarksSave'].forEach(id=>{const x=document.getElementById(id);if(x)x.disabled=!ok});document.querySelectorAll('#classMarksBody input').forEach(x=>x.disabled=!ok)}
  function hookRoles(){if(!window.CampusRoles||window.CampusRoles.__classMarksHooked)return;const old=window.CampusRoles.applyAccess;window.CampusRoles.applyAccess=function(){const r=old.apply(this,arguments);setTimeout(applyPermission,0);return r};window.CampusRoles.__classMarksHooked=true}
  function init(){styles();ensureUI();hookRoles();applyPermission()}
  init();let tries=0;const timer=setInterval(()=>{ensureUI();hookRoles();applyPermission();tries++;if(tries>=10)clearInterval(timer)},500);document.querySelector('[data-view="marks"]')?.addEventListener('click',()=>setTimeout(()=>{ensureUI();applyPermission()},0));
  window.ClassMarksEntry={refresh:()=>{refreshSubjects();applyPermission()}};
})();