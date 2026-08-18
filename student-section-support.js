(function(){
  const SECTIONS=['A','B','C','D','E','F'];
  const e=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const sectionOf=s=>String(s?.section||'A').trim().toUpperCase()||'A';

  function migrateStudents(){
    if(!Array.isArray(window.state?.students))return;
    let changed=false;
    state.students.forEach(s=>{if(!String(s.section||'').trim()){s.section='A';changed=true}else{s.section=sectionOf(s)}});
    if(changed&&typeof saveData==='function')saveData();
  }

  function sectionOptions(selected='A'){
    const values=[...new Set([...SECTIONS,...(state?.students||[]).map(sectionOf)])].sort();
    return values.map(x=>`<option value="${e(x)}" ${x===sectionOf({section:selected})?'selected':''}>${e(x)}</option>`).join('');
  }

  function injectSectionIntoStudentModal(){
    const body=document.getElementById('modalBody'),title=document.getElementById('modalTitle');
    if(!body||!title||!/student/i.test(title.textContent||'')||body.querySelector('[name="section"]'))return;
    const formGrid=body.querySelector('.form-grid');if(!formGrid)return;
    const hall=formGrid.querySelector('[name="hall"]')?.value||'';
    const student=(state.students||[]).find(s=>String(s.hall).toLowerCase()===String(hall).toLowerCase());
    const label=document.createElement('label');
    label.innerHTML=`Section<select class="input" name="section">${sectionOptions(student?.section||'A')}</select>`;
    const sem=formGrid.querySelector('[name="sem"]')?.closest('label');
    if(sem?.nextSibling)formGrid.insertBefore(label,sem.nextSibling);else formGrid.appendChild(label);
  }

  function ensureSectionFilter(){
    const filters=document.querySelector('#students .filters');if(!filters||document.getElementById('sectionFilter'))return;
    const sel=document.createElement('select');sel.className='input';sel.id='sectionFilter';sel.innerHTML='<option value="">All Sections</option>'+SECTIONS.map(x=>`<option value="${x}">Section ${x}</option>`).join('');
    const branch=document.getElementById('branchFilter');if(branch?.nextSibling)filters.insertBefore(sel,branch.nextSibling);else filters.appendChild(sel);
    sel.addEventListener('change',applySectionFilter);
  }

  function ensureStudentTableSection(){
    const table=document.querySelector('#students table'),head=table?.querySelector('thead tr'),body=document.getElementById('studentTableBody');if(!head||!body)return;
    if(!head.querySelector('[data-section-head]')){
      const th=document.createElement('th');th.dataset.sectionHead='1';th.textContent='Section';
      const yearHead=[...head.children].find(x=>x.textContent.trim()==='Year');head.insertBefore(th,yearHead||head.lastElementChild);
    }
    [...body.rows].forEach(row=>{
      if(row.querySelector('[data-section-cell]'))return;
      const hall=row.cells[0]?.textContent.trim()||'';const student=(state.students||[]).find(s=>String(s.hall)===hall);
      const td=document.createElement('td');td.dataset.sectionCell='1';td.innerHTML=`<b>${e(sectionOf(student))}</b>`;
      const yearCell=row.cells[3];row.insertBefore(td,yearCell||row.lastElementChild);
    });
    applySectionFilter();
  }

  function applySectionFilter(){
    const wanted=document.getElementById('sectionFilter')?.value||'',body=document.getElementById('studentTableBody');if(!body)return;
    [...body.rows].forEach(row=>{
      if(row.querySelector('.empty-state'))return;
      const hall=row.cells[0]?.textContent.trim()||'';const student=(state.students||[]).find(s=>String(s.hall)===hall);
      row.style.display=!wanted||sectionOf(student)===wanted?'':'none';
    });
  }

  function patchBulkUpload(){
    if(typeof window.rowToStudent==='function'&&!window.__sectionRowPatched){
      const original=window.rowToStudent;
      window.rowToStudent=function(row,index){
        const result=original(row,index),raw=typeof getColumnValue==='function'?getColumnValue(row,['Section','Sec','Class Section']):'';
        result.student.section=String(raw||'A').trim().toUpperCase();
        if(!/^[A-Z0-9-]{1,8}$/.test(result.student.section))result.errors.push('Invalid section');
        return result;
      };
      window.__sectionRowPatched=true;
    }
    if(typeof window.renderBulkPreview==='function'&&!window.__sectionPreviewPatched){
      window.renderBulkPreview=function(){
        const policy=document.getElementById('duplicatePolicy').value,valid=bulkParsedStudents.filter(r=>!r.errors.length),invalid=bulkParsedStudents.filter(r=>r.errors.length),dups=valid.filter(r=>r.duplicateId),fresh=valid.filter(r=>!r.duplicateId);
        const s=document.getElementById('bulkUploadSummary');s.hidden=false;s.innerHTML=`<div class="summary-box"><small>Total Rows</small><b>${bulkParsedStudents.length}</b></div><div class="summary-box"><small>New Students</small><b>${fresh.length}</b></div><div class="summary-box"><small>Existing Hall Tickets</small><b>${dups.length}</b></div><div class="summary-box"><small>Invalid Rows</small><b>${invalid.length}</b></div>`;
        document.getElementById('bulkPreviewWrap').hidden=false;document.getElementById('bulkPreviewText').textContent=`${bulkFileName} · previewing first ${Math.min(50,bulkParsedStudents.length)} of ${bulkParsedStudents.length} rows · ALL valid rows will be imported`;
        const h=document.querySelector('#bulkPreviewWrap thead tr');if(h&&!h.querySelector('[data-bulk-section-head]')){const th=document.createElement('th');th.dataset.bulkSectionHead='1';th.textContent='Section';const sem=[...h.children].find(x=>x.textContent.trim()==='Semester');h.insertBefore(th,sem?.nextSibling||null)}
        document.getElementById('bulkPreviewBody').innerHTML=bulkParsedStudents.slice(0,50).map(r=>{let v='<span class="validation-ok">Ready</span>';if(r.errors.length)v=`<span class="validation-error">${e(r.errors.join(', '))}</span>`;else if(r.duplicateId)v=`<span class="validation-update">Will ${policy==='update'?'update':'skip'}</span>`;const x=r.student;return`<tr><td>${r.index}</td><td><b>${e(x.hall)}</b></td><td>${e(x.name)}</td><td>${e(x.branch)}</td><td>${e(x.year)}</td><td>${e(x.sem)}</td><td>${e(x.section||'A')}</td><td>${e(x.regulation)}</td><td>${e(x.status)}</td><td>${v}</td></tr>`}).join('');
        const count=valid.filter(r=>!r.duplicateId||policy==='update').length,btn=document.getElementById('importStudentsBtn');btn.disabled=!count;btn.textContent=count?`Import ${count} Student${count===1?'':'s'}`:'Import Students';
      };
      window.__sectionPreviewPatched=true;
    }
    const req=document.querySelector('#bulkModalBackdrop .upload-guide p');if(req)req.textContent='Hall Ticket, Name, Branch, Year, Semester, Section, Regulation, Status';
  }

  function csvCell(v){const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
  function downloadSectionTemplate(ev){
    const btn=ev.target.closest('#downloadStudentTemplateBtn,#downloadTemplateInsideBtn');if(!btn)return;
    ev.preventDefault();ev.stopImmediatePropagation();
    const rows=[['Hall Ticket','Name','Branch','Year','Semester','Section','Regulation','Status'],['232T1A0101','SAMPLE STUDENT','CIVIL','III','II','A','R23','Active'],['232T1A0501','ANOTHER STUDENT','CSE','III','II','B','R23','Active']];
    const blob=new Blob([rows.map(r=>r.map(csvCell).join(',')).join('\n')],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='student_bulk_upload_template.csv';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},0);
  }

  function enhanceStudentPortal(){
    const body=document.getElementById('studentPortalBody');if(!body)return;
    const student=window.CampusSession?.role==='student'?(state.students||[]).find(x=>Number(x.id)===Number(window.CampusSession.studentId)):null;if(!student)return;
    const grid=body.querySelector('.student-detail-grid');if(!grid||grid.querySelector('[data-student-section-detail]'))return;
    const item=document.createElement('div');item.className='student-detail-item';item.dataset.studentSectionDetail='1';item.innerHTML=`<small>Section</small><b>${e(sectionOf(student))}</b>`;
    const yearItem=[...grid.children].find(x=>x.querySelector('small')?.textContent.trim()==='Year');grid.insertBefore(item,yearItem||null);
  }

  function refresh(){ensureSectionFilter();ensureStudentTableSection();injectSectionIntoStudentModal();patchBulkUpload();enhanceStudentPortal()}
  migrateStudents();
  document.addEventListener('click',downloadSectionTemplate,true);
  const obs=new MutationObserver(()=>refresh());obs.observe(document.body,{childList:true,subtree:true});
  document.getElementById('studentSearch')?.addEventListener('input',()=>setTimeout(applySectionFilter,0));
  document.getElementById('branchFilter')?.addEventListener('change',()=>setTimeout(applySectionFilter,0));
  setTimeout(refresh,0);setTimeout(refresh,500);
  window.StudentSections={refresh,sectionOf};
})();