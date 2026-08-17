(function(){
  const PORTAL_VIEW='studentportal';
  const RESULT_HISTORY_KEY='resultHistory';
  const ACTIVE_EXAM_STATUSES=['ACTIVE','PUBLISHED'];
  const msg=t=>typeof toast==='function'?toast(t):alert(t);
  const e=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const money=v=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(v)||0);

  function styles(){
    if(document.getElementById('student-portal-styles'))return;
    const s=document.createElement('style');s.id='student-portal-styles';s.textContent=`
      .student-portal-wrap{display:grid;gap:18px}.student-profile-card{display:grid;grid-template-columns:160px 1fr;gap:22px;align-items:start}.student-photo-box{display:grid;gap:10px;justify-items:center}.student-photo{width:132px;height:162px;border-radius:14px;object-fit:cover;border:1px solid var(--line);background:var(--surface-2)}.student-photo-placeholder{width:132px;height:162px;border-radius:14px;border:1px dashed var(--line);background:var(--surface-2);display:grid;place-items:center;font-size:38px;font-weight:900;color:var(--muted)}.student-detail-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.student-detail-item{padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface-2)}.student-detail-item small{display:block;color:var(--muted);font-size:11px;font-weight:800;margin-bottom:4px}.student-detail-item b{font-size:13px;word-break:break-word}.student-portal-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.student-portal-stat{padding:15px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}.student-portal-stat small{display:block;color:var(--muted);font-weight:800;margin-bottom:6px}.student-portal-stat b{font-size:22px}.student-fee-due{color:var(--danger)}.student-fee-clear{color:var(--success)}.student-semester-card{border:1px solid var(--line);border-radius:14px;overflow:hidden;margin-top:12px}.student-semester-head{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 14px;background:var(--surface-2)}.student-semester-head strong{font-size:14px}.student-semester-meta{display:flex;gap:8px;flex-wrap:wrap;font-size:12px}.student-semester-table{width:100%;border-collapse:collapse}.student-semester-table th,.student-semester-table td{padding:8px 10px;border-top:1px solid var(--line);font-size:12px;text-align:left}.student-hall-card{background:#fff;color:#111;border:1px solid #bbb;border-radius:14px;padding:18px}.student-hall-title{text-align:center}.student-hall-title h3{margin:0;font-size:18px}.student-hall-title p{margin:3px 0;font-size:11px}.student-hall-label{font-weight:900;letter-spacing:.08em;margin-top:5px}.student-hall-info,.student-hall-subjects{width:100%;border-collapse:collapse;margin-top:12px}.student-hall-info td,.student-hall-subjects th,.student-hall-subjects td{border:1px solid #777;padding:6px 7px;font-size:10px;background:#fff;color:#111}.student-hall-info td:nth-child(odd){font-weight:800}.student-hall-actions{display:flex;justify-content:flex-end;margin-top:10px}.student-hall-unavailable{padding:18px;border:1px dashed var(--line);border-radius:14px;color:var(--muted);text-align:center}.student-photo-editor{display:grid;grid-template-columns:130px 1fr;gap:16px;align-items:start;margin-bottom:14px}.student-photo-editor img{width:110px;height:135px;object-fit:cover;border-radius:12px;border:1px solid var(--line)}.student-photo-editor-placeholder{width:110px;height:135px;border:1px dashed var(--line);border-radius:12px;display:grid;place-items:center;color:var(--muted);font-weight:900}.student-photo-controls{display:grid;gap:8px}.student-photo-controls small{color:var(--muted);line-height:1.45}.student-portal-only .nav-link:not([data-view="studentportal"]),.student-portal-only #examModuleNav{display:none!important}.student-portal-only #resetDemoBtn{display:none!important}
      @media(max-width:850px){.student-profile-card{grid-template-columns:1fr}.student-photo-box{justify-items:start}.student-detail-grid{grid-template-columns:1fr 1fr}.student-portal-stats{grid-template-columns:1fr}}
      @media(max-width:520px){.student-detail-grid{grid-template-columns:1fr}.student-photo-editor{grid-template-columns:1fr}}
      @media print{body.student-hall-print *{visibility:hidden!important}body.student-hall-print .student-hall-card,body.student-hall-print .student-hall-card *{visibility:visible!important}body.student-hall-print .student-hall-card{position:absolute;left:8mm;right:8mm;top:8mm;border:1px solid #222}.student-hall-actions{display:none!important}}
    `;document.head.appendChild(s)
  }

  function ensureHistory(){
    if(!state[RESULT_HISTORY_KEY]||typeof state[RESULT_HISTORY_KEY]!=='object')state[RESULT_HISTORY_KEY]={};
  }
  function syncResultHistory(){
    ensureHistory();
    Object.values(state.results||{}).forEach(r=>{
      if(!r||!r.studentId||!r.semester)return;
      const sid=String(r.studentId);if(!state[RESULT_HISTORY_KEY][sid])state[RESULT_HISTORY_KEY][sid]={};
      state[RESULT_HISTORY_KEY][sid][r.semester]=JSON.parse(JSON.stringify(r));
    });
  }
  function wrapSaveData(){
    if(window.__studentPortalSaveWrapped||typeof saveData!=='function')return;
    const original=saveData;
    saveData=function(){syncResultHistory();return original();};
    window.__studentPortalSaveWrapped=true;
    syncResultHistory();original();
  }

  function branchOptions(selected=''){
    const master=Array.isArray(state.branches)?state.branches.filter(x=>(x.status||'Active')==='Active').map(x=>String(x.code||'').trim().toUpperCase()):[];
    const existing=(state.students||[]).map(x=>String(x.branch||'').trim().toUpperCase());
    return [...new Set([...master,...existing,'CIVIL','CSE','ECE','EEE','MECH'].filter(Boolean))].sort().map(x=>`<option value="${e(x)}" ${x===selected?'selected':''}>${e(x)}</option>`).join('');
  }
  function openStudentEditor(student=null){
    const can=window.CampusRoles?.can?window.CampusRoles.can('students',student?'update':'add'):true;
    if(!can)return msg('You do not have permission to manage students');
    modalMode={type:'student',id:student?.id||null};
    const photo=student?.photo||'';
    openModal(student?'Edit Student':'Add Student',`
      <div class="student-photo-editor">
        <div id="studentPhotoEditorPreview">${photo?`<img src="${e(photo)}" alt="Student photo">`:'<div class="student-photo-editor-placeholder">PHOTO</div>'}</div>
        <div class="student-photo-controls">
          <label>Student Photo<input class="input" type="file" id="studentPhotoFile" accept="image/jpeg,image/png,image/webp"></label>
          <input type="hidden" name="photo" id="studentPhotoValue" value="${e(photo)}">
          <button class="btn btn-outline" type="button" id="removeStudentPhoto">Remove Photo</button>
          <small>JPG/PNG/WebP. The image is automatically resized and compressed for this browser-based prototype.</small>
        </div>
      </div>
      <div class="form-grid">
        <label>Hall Ticket No<input class="input" name="hall" required value="${e(student?.hall||'')}"></label>
        <label>Student Name<input class="input" name="name" required value="${e(student?.name||'')}"></label>
        <label>Branch<select class="input" name="branch">${branchOptions(student?.branch||'')}</select></label>
        <label>Year<select class="input" name="year">${['I','II','III','IV'].map(x=>`<option ${student?.year===x?'selected':''}>${x}</option>`).join('')}</select></label>
        <label>Semester<select class="input" name="sem"><option ${student?.sem==='I'?'selected':''}>I</option><option ${student?.sem==='II'?'selected':''}>II</option></select></label>
        <label>Regulation<input class="input" name="regulation" value="${e(student?.regulation||state.settings?.defaultRegulation||'R23')}"></label>
        <label>Fee Due (₹)<input class="input" type="number" min="0" step="1" name="feeDue" value="${Number(student?.feeDue)||0}"></label>
        <label>Status<select class="input" name="status">${['Active','Detained','Completed'].map(x=>`<option ${student?.status===x?'selected':''}>${x}</option>`).join('')}</select></label>
      </div>`);
    const file=document.getElementById('studentPhotoFile'),hidden=document.getElementById('studentPhotoValue'),preview=document.getElementById('studentPhotoEditorPreview');
    file?.addEventListener('change',async()=>{
      const f=file.files?.[0];if(!f)return;
      try{const data=await compressPhoto(f);hidden.value=data;preview.innerHTML=`<img src="${data}" alt="Student photo">`}catch(err){msg(err.message||'Could not process photo');file.value=''}
    });
    document.getElementById('removeStudentPhoto')?.addEventListener('click',()=>{hidden.value='';if(file)file.value='';preview.innerHTML='<div class="student-photo-editor-placeholder">PHOTO</div>'});
  }
  function installStudentEditor(){
    window.openStudentModal=openStudentEditor;
    window.editStudent=id=>openStudentEditor((state.students||[]).find(x=>Number(x.id)===Number(id)));
    window.updateStudentRecord=id=>openStudentEditor((state.students||[]).find(x=>Number(x.id)===Number(id)));
  }
  function compressPhoto(file){
    return new Promise((resolve,reject)=>{
      if(!file.type.startsWith('image/'))return reject(new Error('Choose an image file'));
      if(file.size>5*1024*1024)return reject(new Error('Photo must be below 5 MB'));
      const reader=new FileReader();reader.onerror=()=>reject(new Error('Could not read photo'));reader.onload=()=>{
        const img=new Image();img.onerror=()=>reject(new Error('Invalid image'));img.onload=()=>{
          const maxW=320,maxH=400,scale=Math.min(1,maxW/img.width,maxH/img.height),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
          const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,w,h);resolve(c.toDataURL('image/jpeg',.78));
        };img.src=reader.result;
      };reader.readAsDataURL(file);
    })
  }

  function ensurePortalView(){
    const content=document.querySelector('.content');if(!content||document.getElementById(PORTAL_VIEW))return;
    const sec=document.createElement('section');sec.className='view';sec.id=PORTAL_VIEW;sec.innerHTML='<div class="section-toolbar"><div><h3>Student Dashboard</h3><p>Your profile, results, fee status and active examination hall ticket.</p></div></div><div class="student-portal-wrap" id="studentPortalBody"></div>';content.appendChild(sec);
    const nav=document.querySelector('.nav');if(nav&&!document.querySelector('[data-view="studentportal"]')){const b=document.createElement('button');b.className='nav-link';b.dataset.view='studentportal';b.innerHTML='<span>▦</span>Student Dashboard';nav.insertBefore(b,nav.firstChild);b.addEventListener('click',()=>{navigate(PORTAL_VIEW);renderPortal()})}
  }
  function studentForSession(){const s=window.CampusSession;if(!s||s.role!=='student')return null;return(state.students||[]).find(x=>Number(x.id)===Number(s.studentId))||null}
  function semesterOrder(v){const m=String(v||'').match(/^(I|II|III|IV)-(I|II)$/);if(!m)return 99;return ({I:1,II:2,III:3,IV:4}[m[1]]*10)+({I:1,II:2}[m[2]]||0)}
  function resultEntries(studentId){
    syncResultHistory();const hist=state[RESULT_HISTORY_KEY]?.[String(studentId)]||{},map={...hist};const current=state.results?.[studentId];if(current?.semester)map[current.semester]=current;
    return Object.entries(map).sort((a,b)=>semesterOrder(a[0])-semesterOrder(b[0]));
  }
  function subjectFor(id){return(state.subjects||[]).find(s=>Number(s.id)===Number(id))}
  function detailsHtml(student){
    const preferred=['hall','name','branch','year','sem','regulation','status'];
    const labels={hall:'Hall Ticket / Roll No.',name:'Student Name',branch:'Branch',year:'Year',sem:'Semester',regulation:'Regulation',status:'Status',feeDue:'Fee Due'};
    const extras=Object.keys(student).filter(k=>!['id','photo','feeDue',...preferred].includes(k)&&student[k]!==''&&student[k]!=null);
    const keys=[...preferred,...extras];
    return keys.map(k=>`<div class="student-detail-item"><small>${e(labels[k]||k.replace(/([A-Z])/g,' $1').replace(/^./,x=>x.toUpperCase()))}</small><b>${e(student[k]??'—')}</b></div>`).join('')+`<div class="student-detail-item"><small>Academic Year</small><b>${e(state.settings?.academicYear||'—')}</b></div>`;
  }
  function resultsHtml(student){
    const entries=resultEntries(student.id);if(!entries.length)return '<div class="empty-state">No semester results have been published for this student yet.</div>';
    return entries.map(([sem,r])=>{
      const marks=Object.entries(r.marks||{});return `<div class="student-semester-card"><div class="student-semester-head"><strong>${e(sem)} Semester</strong><div class="student-semester-meta"><span>SGPA: <b>${Number(r.sgpa||0).toFixed(2)}</b></span><span>Result: <b>${e(r.result||'—')}</b></span><span>Credits: <b>${e(r.credits??'—')}</b></span></div></div><div class="table-wrap"><table class="student-semester-table"><thead><tr><th>Code</th><th>Subject</th><th>Internal</th><th>External</th><th>Total</th><th>Grade</th></tr></thead><tbody>${marks.map(([id,m])=>{const sub=subjectFor(id);return `<tr><td><b>${e(sub?.code||id)}</b></td><td>${e(sub?.name||'Subject')}</td><td>${e(m.internal??'—')}</td><td>${e(m.external??'—')}</td><td>${e(m.total??'—')}</td><td><b>${e(m.grade??'—')}</b></td></tr>`}).join('')||'<tr><td colspan="6">No subject marks available.</td></tr>'}</tbody></table></div></div>`
    }).join('')
  }
  function activeExams(student){
    const sem=`${student.year}-${student.sem}`;
    return(state.exams||[]).filter(x=>ACTIVE_EXAM_STATUSES.includes(String(x.status||'').trim().toUpperCase())&&(x.branch==='ALL'||x.branch===student.branch)&&x.semester===sem).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
  }
  function hallTicketHtml(student){
    const exams=activeExams(student);if(!exams.length)return '<div class="student-hall-unavailable"><b>No active hall ticket</b><br><small>Your hall ticket will appear here only when the Examination Section publishes/activates an examination matching your branch and semester.</small></div>';
    const exam=exams[0],subjects=(state.subjects||[]).filter(s=>s.branch===student.branch&&s.semester===exam.semester),college=state.settings?.collegeName||'College',centre=exam.centre||'Main Campus Examination Centre';
    return `<div class="student-hall-card" id="studentActiveHallTicket"><div class="student-hall-title"><h3>${e(college.toUpperCase())}</h3><p>Examination Section</p><div class="student-hall-label">HALL TICKET</div></div><table class="student-hall-info"><tr><td>Hall Ticket</td><td><b>${e(student.hall)}</b></td><td>Student</td><td><b>${e(student.name)}</b></td></tr><tr><td>Branch</td><td>${e(student.branch)}</td><td>Year / Semester</td><td>${e(student.year)} / ${e(student.sem)}</td></tr><tr><td>Regulation</td><td>${e(student.regulation||'')}</td><td>Examination</td><td>${e(exam.name)}</td></tr><tr><td>Date</td><td>${e(typeof formatDate==='function'?formatDate(exam.date):exam.date||'')}</td><td>Session</td><td>${e(exam.session||'')}</td></tr><tr><td>Centre</td><td colspan="3">${e(centre)}</td></tr></table><table class="student-hall-subjects"><thead><tr><th>S.No</th><th>Subject Code</th><th>Subject Name</th></tr></thead><tbody>${subjects.map((s,i)=>`<tr><td>${i+1}</td><td>${e(s.code)}</td><td>${e(s.name)}</td></tr>`).join('')||'<tr><td colspan="3">No subjects configured.</td></tr>'}</tbody></table><div class="student-hall-actions"><button class="btn btn-outline" id="printStudentHallTicket" type="button">Print Hall Ticket</button></div></div>`
  }
  function renderPortal(){
    ensurePortalView();const body=document.getElementById('studentPortalBody'),student=studentForSession();if(!body)return;
    if(!student){body.innerHTML='<div class="card"><div class="empty-state">Student account could not be matched to an active student record.</div></div>';return}
    const fee=Number(student.feeDue)||0,entries=resultEntries(student.id),latest=entries.length?entries[entries.length-1][1]:null;
    body.innerHTML=`<div class="card student-profile-card"><div class="student-photo-box">${student.photo?`<img class="student-photo" src="${e(student.photo)}" alt="${e(student.name)}">`:'<div class="student-photo-placeholder">ST</div>'}<span class="badge green">${e(student.status||'Active')}</span></div><div><div class="card-head"><div><h3>${e(student.name)}</h3><p>${e(student.hall)} · ${e(student.branch)}</p></div></div><div class="student-detail-grid">${detailsHtml(student)}</div></div></div><div class="student-portal-stats"><div class="student-portal-stat"><small>Current Semester</small><b>${e(student.year)}-${e(student.sem)}</b></div><div class="student-portal-stat"><small>Latest SGPA</small><b>${latest?Number(latest.sgpa||0).toFixed(2):'—'}</b></div><div class="student-portal-stat"><small>Fee Due</small><b class="${fee>0?'student-fee-due':'student-fee-clear'}">${money(fee)}</b></div></div><div class="card"><div class="card-head"><div><h3>Semester-wise Marks</h3><p>Published results available in your student record.</p></div></div>${resultsHtml(student)}</div><div class="card"><div class="card-head"><div><h3>Active Examination Hall Ticket</h3><p>Visible only for a Published/Active examination matching your branch and semester.</p></div></div>${hallTicketHtml(student)}</div>`;
    document.getElementById('printStudentHallTicket')?.addEventListener('click',()=>{document.body.classList.add('student-hall-print');const done=()=>document.body.classList.remove('student-hall-print');window.addEventListener('afterprint',done,{once:true});window.print();setTimeout(done,1500)})
  }

  function enforceStudentPortal(session=window.CampusSession){
    const isStudent=session?.role==='student';document.body.classList.toggle('student-portal-only',!!isStudent);
    ensurePortalView();const nav=document.querySelector('[data-view="studentportal"]');if(nav)nav.classList.toggle('role-hidden',!isStudent);
    if(isStudent){nav?.classList.remove('role-hidden');if(typeof navigate==='function')navigate(PORTAL_VIEW);renderPortal()}else if(document.querySelector('.view.active')?.id===PORTAL_VIEW&&typeof navigate==='function')navigate('dashboard')
  }

  styles();wrapSaveData();installStudentEditor();ensurePortalView();
  window.StudentPortal={onLogin:enforceStudentPortal,render:renderPortal,syncResults:syncResultHistory};
  setTimeout(()=>enforceStudentPortal(window.CampusSession),0);setTimeout(()=>enforceStudentPortal(window.CampusSession),700);setTimeout(()=>enforceStudentPortal(window.CampusSession),1500);
})();