(function(){
  let bulkMarkRows=[];
  const escExam=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const notify=t=>typeof toast==='function'?toast(t):alert(t);

  function addStyles(){
    if(document.getElementById('exam-section-module-styles'))return;
    const s=document.createElement('style');s.id='exam-section-module-styles';s.textContent=`
      .exam-module{margin:4px 0}.exam-module-toggle{width:100%;border:0;background:transparent;color:#aebbd8;padding:12px 14px;border-radius:12px;display:flex;align-items:center;gap:12px;font-weight:800;text-align:left}.exam-module-toggle:hover,.exam-module.open>.exam-module-toggle{background:rgba(96,165,250,.15);color:#fff}.exam-module-toggle .exam-icon{width:22px;text-align:center;font-size:18px}.exam-module-toggle .exam-arrow{margin-left:auto;transition:.2s}.exam-module.open .exam-arrow{transform:rotate(90deg)}.exam-module-items{display:none;margin:4px 0 4px 18px;padding-left:10px;border-left:1px solid rgba(255,255,255,.12);gap:4px}.exam-module.open .exam-module-items{display:grid}.exam-module-items .nav-link{padding:10px 12px;font-size:13px}.exam-module-items .nav-link span{font-size:15px}
      .marks-toolbar-actions{display:flex;gap:8px;flex-wrap:wrap}.marks-bulk-modal{width:min(1100px,96vw)}.marks-upload-guide{display:flex;justify-content:space-between;gap:14px;align-items:center;background:var(--surface-2);border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:14px}.marks-upload-guide p{margin:4px 0 0;color:var(--muted);font-size:12px}.marks-drop{min-height:150px;border:2px dashed #93c5fd;border-radius:18px;background:rgba(59,130,246,.04);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center;padding:22px;cursor:pointer}.marks-drop.dragover{border-color:var(--primary);background:rgba(59,130,246,.09)}.marks-bulk-summary{display:grid;grid-template-columns:repeat(5,1fr);gap:9px;margin-top:14px}.marks-bulk-summary>div{background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:11px}.marks-bulk-summary small{display:block;color:var(--muted);margin-bottom:4px}.marks-bulk-summary b{font-size:19px}.marks-preview{max-height:340px;border:1px solid var(--line);border-radius:12px;margin-top:14px}.marks-preview table{min-width:1000px}.marks-valid{color:var(--success);font-weight:800}.marks-invalid{color:var(--danger);font-weight:800}.marks-update{color:var(--warning);font-weight:800}.marks-file-chip{margin-top:8px;border:1px solid var(--line);background:var(--surface);padding:7px 10px;border-radius:999px;font-size:12px}.exam-module-dashboard{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:18px}.exam-module-card{border:1px solid var(--line);background:var(--surface);border-radius:14px;padding:14px;text-align:left;color:var(--text)}.exam-module-card b,.exam-module-card small{display:block}.exam-module-card small{color:var(--muted);margin-top:4px}.exam-module-card:hover{border-color:#93c5fd;transform:translateY(-1px)}
      @media(max-width:900px){.exam-module-dashboard{grid-template-columns:repeat(2,1fr)}.marks-bulk-summary{grid-template-columns:1fr 1fr}.marks-upload-guide{align-items:flex-start;flex-direction:column}}
    `;document.head.appendChild(s);
  }

  function ensureExamSectionView(){
    const content=document.querySelector('.content');
    if(!content||document.getElementById('examsection'))return;
    const sec=document.createElement('section');sec.className='view';sec.id='examsection';sec.innerHTML=`
      <div class="section-toolbar"><div><h3>Examination Section</h3><p>Central module for examination scheduling, hall tickets, seating, attendance, marks and results.</p></div></div>
      <div class="exam-module-dashboard">
        <button class="exam-module-card" data-exam-jump="exams"><b>Examinations</b><small>Create and manage exam schedules</small></button>
        <button class="exam-module-card" data-exam-jump="halltickets"><b>Hall Tickets</b><small>Generate and print hall tickets</small></button>
        <button class="exam-module-card" data-exam-jump="seating"><b>Seating Plan</b><small>Room-wise seating and exports</small></button>
        <button class="exam-module-card" data-exam-jump="attendance"><b>Exam Attendance</b><small>Attendance sheets and exports</small></button>
        <button class="exam-module-card" data-exam-jump="marks"><b>Marks & Results</b><small>Marks entry, bulk upload and SGPA</small></button>
      </div>
      <div class="card"><h3>Examination Workflow</h3><p class="muted">Examinations → Hall Tickets → Seating Plan → Exam Attendance → Marks & Results</p></div>`;content.appendChild(sec);
    sec.querySelectorAll('[data-exam-jump]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.examJump;if(document.getElementById(v)){navigate(v)}else notify(`${b.querySelector('b').textContent} module is still loading. Try again.`)}));
  }

  function groupExamNavigation(){
    const nav=document.querySelector('.nav');if(!nav)return;
    let wrap=document.getElementById('examModuleNav');
    if(!wrap){
      wrap=document.createElement('div');wrap.className='exam-module';wrap.id='examModuleNav';
      wrap.innerHTML='<button class="exam-module-toggle" type="button"><span class="exam-icon">▣</span><span>Examination Section</span><span class="exam-arrow">›</span></button><div class="exam-module-items" id="examModuleItems"></div>';
      const reports=document.querySelector('[data-view="reports"]');nav.insertBefore(wrap,reports||null);
      wrap.querySelector('.exam-module-toggle').addEventListener('click',()=>{wrap.classList.toggle('open');if(document.getElementById('examsection'))navigate('examsection')});
    }
    const items=document.getElementById('examModuleItems');
    const order=['exams','halltickets','seating','attendance','marks'];
    order.forEach(v=>{const btn=document.querySelector(`.nav-link[data-view="${v}"]`);if(btn&&btn.parentElement!==items)items.appendChild(btn)});
    if(order.some(v=>document.getElementById(v)?.classList.contains('active')))wrap.classList.add('open');
  }

  function watchDynamicModules(){
    groupExamNavigation();
    const obs=new MutationObserver(()=>groupExamNavigation());
    const nav=document.querySelector('.nav');if(nav)obs.observe(nav,{childList:true,subtree:true});
  }

  function installExamSectionNavButton(){
    const nav=document.querySelector('.nav');if(!nav||document.querySelector('[data-view="examsection"]'))return;
    // The collapsible parent itself opens the overview; no extra flat menu button is needed.
  }

  function installBulkMarksButton(){
    const toolbar=document.querySelector('#marks .section-toolbar');if(!toolbar||document.getElementById('bulkMarksBtn'))return;
    const actions=document.createElement('div');actions.className='marks-toolbar-actions';
    actions.innerHTML='<button class="btn btn-outline" id="downloadMarksTemplateBtn" type="button">Download Marks Template</button><button class="btn btn-primary" id="bulkMarksBtn" type="button">Bulk Upload Marks</button>';
    toolbar.appendChild(actions);
    document.getElementById('downloadMarksTemplateBtn').addEventListener('click',downloadMarksTemplate);
    document.getElementById('bulkMarksBtn').addEventListener('click',openBulkMarks);
    buildBulkMarksModal();
  }

  function buildBulkMarksModal(){
    if(document.getElementById('bulkMarksBackdrop'))return;
    const modal=document.createElement('div');modal.className='modal-backdrop';modal.id='bulkMarksBackdrop';modal.hidden=true;modal.innerHTML=`
      <div class="modal marks-bulk-modal" role="dialog" aria-modal="true">
        <div class="modal-head"><div><h3>Bulk Marks Upload</h3><p class="modal-subtitle">Upload CSV or Excel. One row represents one student-subject mark entry.</p></div><button class="icon-btn" id="closeBulkMarks" type="button">✕</button></div>
        <div class="modal-body">
          <div class="marks-upload-guide"><div><b>Required columns</b><p>Hall Ticket, Semester, Subject Code, Internal, External</p></div><button class="btn btn-outline" id="marksTemplateInside" type="button">Download CSV Template</button></div>
          <label class="marks-drop" id="marksDropZone"><input type="file" id="marksBulkFile" accept=".csv,.xlsx,.xls" hidden><span class="drop-icon">⇧</span><b>Choose CSV / Excel file</b><small>or drag and drop it here</small><small class="muted">Grades, grade points, SGPA and results are calculated automatically.</small></label>
          <div id="marksBulkSummary" class="marks-bulk-summary" hidden></div>
          <div id="marksPreviewWrap" hidden><div class="table-wrap marks-preview"><table><thead><tr><th>#</th><th>Hall Ticket</th><th>Student</th><th>Semester</th><th>Subject</th><th>Internal</th><th>External</th><th>Total</th><th>Grade</th><th>Validation</th></tr></thead><tbody id="marksPreviewBody"></tbody></table></div></div>
        </div>
        <div class="modal-actions"><button class="btn btn-outline" id="cancelBulkMarks" type="button">Cancel</button><button class="btn btn-primary" id="importBulkMarks" type="button" disabled>Import Marks</button></div>
      </div>`;document.body.appendChild(modal);
    document.getElementById('closeBulkMarks').addEventListener('click',closeBulkMarks);
    document.getElementById('cancelBulkMarks').addEventListener('click',closeBulkMarks);
    document.getElementById('marksTemplateInside').addEventListener('click',downloadMarksTemplate);
    document.getElementById('bulkMarksBackdrop').addEventListener('click',e=>{if(e.target.id==='bulkMarksBackdrop')closeBulkMarks()});
    document.getElementById('importBulkMarks').addEventListener('click',importBulkMarks);
    const input=document.getElementById('marksBulkFile'),dz=document.getElementById('marksDropZone');
    input.addEventListener('change',()=>handleMarksFile(input.files?.[0]));
    ['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('dragover')}));
    ['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('dragover')}));
    dz.addEventListener('drop',e=>handleMarksFile(e.dataTransfer.files?.[0]));
  }

  function openBulkMarks(){bulkMarkRows=[];document.getElementById('bulkMarksBackdrop').hidden=false;document.getElementById('marksBulkFile').value='';document.getElementById('marksBulkSummary').hidden=true;document.getElementById('marksPreviewWrap').hidden=true;document.getElementById('importBulkMarks').disabled=true;document.querySelectorAll('#marksDropZone .marks-file-chip').forEach(x=>x.remove())}
  function closeBulkMarks(){document.getElementById('bulkMarksBackdrop').hidden=true;bulkMarkRows=[]}
  function downloadMarksTemplate(){
    const rows=[['Hall Ticket','Semester','Subject Code','Internal','External'],['232T1A0507','III-II','23CS601',25,62],['232T1A0507','III-II','23CS602',26,58]];
    if(typeof downloadCSV==='function')downloadCSV('marks_bulk_upload_template.csv',rows);else{const csv=rows.map(r=>r.join(',')).join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='marks_bulk_upload_template.csv';a.click()}
  }

  function norm(v){return String(v??'').trim().toLowerCase().replace(/[_\-./]/g,' ').replace(/\s+/g,' ')}
  function col(row,names){const x={};Object.keys(row||{}).forEach(k=>x[norm(k)]=row[k]);for(const n of names){if(Object.prototype.hasOwnProperty.call(x,norm(n)))return x[norm(n)]}return''}
  function parseCsv(text){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(ch===','&&!quoted){row.push(cell);cell=''}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);cell='';if(row.some(v=>String(v).trim()))rows.push(row);row=[]}else cell+=ch}row.push(cell);if(row.some(v=>String(v).trim()))rows.push(row);if(!rows.length)return[];const h=rows[0].map(x=>String(x).trim());return rows.slice(1).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]??''])))}

  function parseMarkRow(row,index){
    const hall=String(col(row,['Hall Ticket','Hall Ticket No','HT No','HTNO'])||'').trim().toUpperCase();
    const semester=String(col(row,['Semester','Sem'])||'').trim().toUpperCase();
    const code=String(col(row,['Subject Code','Code','Subject'])||'').trim().toUpperCase();
    const internal=Number(col(row,['Internal','Internal Marks']));
    const external=Number(col(row,['External','External Marks']));
    const student=(state.students||[]).find(s=>String(s.hall).trim().toUpperCase()===hall);
    const subject=(state.subjects||[]).find(s=>String(s.code).trim().toUpperCase()===code);
    const errors=[];
    if(!hall)errors.push('Hall Ticket missing');else if(!student)errors.push('Student not found');
    if(!semester)errors.push('Semester missing');
    if(!code)errors.push('Subject Code missing');else if(!subject)errors.push('Subject not found');
    if(student&&subject&&student.branch!==subject.branch)errors.push('Branch mismatch');
    if(subject&&semester&&subject.semester!==semester)errors.push('Semester mismatch');
    if(!Number.isFinite(internal)||internal<0)errors.push('Invalid internal');else if(subject&&internal>Number(subject.internal))errors.push(`Internal > ${subject.internal}`);
    if(!Number.isFinite(external)||external<0)errors.push('Invalid external');else if(subject&&external>Number(subject.external))errors.push(`External > ${subject.external}`);
    const total=Number.isFinite(internal)&&Number.isFinite(external)?internal+external:0;
    const [grade,gp]=typeof gradeFromTotal==='function'?gradeFromTotal(total):total>=90?['S',10]:total>=80?['A',9]:total>=70?['B',8]:total>=60?['C',7]:total>=50?['D',6]:total>=40?['E',5]:['F',0];
    return{index:index+1,hall,semester,code,internal,external,total,grade,gp,student,subject,errors};
  }

  async function handleMarksFile(file){
    if(!file)return;try{
      let rows=[],ext=file.name.split('.').pop().toLowerCase();
      if(ext==='csv')rows=parseCsv(await file.text());
      else if(['xlsx','xls'].includes(ext)){if(typeof XLSX==='undefined')throw new Error('Excel reader is not available');const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''})}
      else throw new Error('Choose CSV, XLSX or XLS file');
      if(!rows.length)throw new Error('No marks rows found');if(rows.length>10000)throw new Error('Maximum 10,000 mark rows per upload');
      bulkMarkRows=rows.map(parseMarkRow);renderMarksPreview(file.name);
      document.querySelectorAll('#marksDropZone .marks-file-chip').forEach(x=>x.remove());const c=document.createElement('span');c.className='marks-file-chip';c.textContent=`Selected: ${file.name}`;document.getElementById('marksDropZone').appendChild(c);
    }catch(err){notify(err.message||'Could not read marks file')}
  }

  function renderMarksPreview(fileName){
    const valid=bulkMarkRows.filter(r=>!r.errors.length),invalid=bulkMarkRows.filter(r=>r.errors.length),students=new Set(valid.map(r=>r.student.id)),subjects=new Set(valid.map(r=>r.subject.id)),semesters=new Set(valid.map(r=>r.semester));
    const sm=document.getElementById('marksBulkSummary');sm.hidden=false;sm.innerHTML=`<div><small>Total Rows</small><b>${bulkMarkRows.length}</b></div><div><small>Valid</small><b>${valid.length}</b></div><div><small>Invalid</small><b>${invalid.length}</b></div><div><small>Students</small><b>${students.size}</b></div><div><small>Subjects</small><b>${subjects.size}</b></div>`;
    document.getElementById('marksPreviewWrap').hidden=false;
    document.getElementById('marksPreviewBody').innerHTML=bulkMarkRows.slice(0,100).map(r=>`<tr><td>${r.index}</td><td><b>${escExam(r.hall)}</b></td><td>${escExam(r.student?.name||'—')}</td><td>${escExam(r.semester)}</td><td>${escExam(r.code)}${r.subject?` — ${escExam(r.subject.name)}`:''}</td><td>${Number.isFinite(r.internal)?r.internal:'—'}</td><td>${Number.isFinite(r.external)?r.external:'—'}</td><td>${r.total}</td><td>${r.grade}</td><td>${r.errors.length?`<span class="marks-invalid">${escExam(r.errors.join(', '))}</span>`:'<span class="marks-valid">Ready</span>'}</td></tr>`).join('');
    const btn=document.getElementById('importBulkMarks');btn.disabled=!valid.length;btn.textContent=valid.length?`Import ${valid.length} Valid Mark Row${valid.length===1?'':'s'}`:'Import Marks';
  }

  function importBulkMarks(){
    const valid=bulkMarkRows.filter(r=>!r.errors.length);if(!valid.length){notify('No valid marks to import');return}
    const groups=new Map();
    valid.forEach(r=>{const key=`${r.student.id}|${r.semester}`;if(!groups.has(key))groups.set(key,{student:r.student,semester:r.semester,rows:[]});groups.get(key).rows.push(r)});
    let saved=0,failedGroups=0;
    groups.forEach(g=>{
      const semesterSubjects=(state.subjects||[]).filter(s=>s.branch===g.student.branch&&s.semester===g.semester);
      const previous=state.results[g.student.id];
      let marks=previous&&previous.semester===g.semester?{...(previous.marks||{})}:{};
      g.rows.forEach(r=>{marks[r.subject.id]={internal:r.internal,external:r.external,total:r.total,grade:r.grade,gp:r.gp}});
      let weighted=0,credits=0,failed=false;
      semesterSubjects.forEach(s=>{const m=marks[s.id];if(!m)return;const c=Number(s.credits)||0;weighted+=Number(m.gp||0)*c;credits+=c;if(m.grade==='F')failed=true});
      if(!credits){failedGroups++;return}
      let sgpa=weighted/credits;if(state.settings?.failSgpaZero&&failed)sgpa=0;
      state.results[g.student.id]={studentId:g.student.id,semester:g.semester,marks,sgpa:Number(sgpa.toFixed(2)),result:failed?'FAIL':'PASS',credits,updatedAt:new Date().toISOString(),source:'bulk-upload'};saved++;
    });
    saveData();if(typeof renderDashboard==='function')renderDashboard();closeBulkMarks();notify(`Bulk marks imported for ${saved} student result${saved===1?'':'s'}${failedGroups?`; ${failedGroups} group(s) skipped`:''}`);
  }

  addStyles();ensureExamSectionView();installExamSectionNavButton();watchDynamicModules();installBulkMarksButton();
})();