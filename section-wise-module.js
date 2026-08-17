(function(){
  const STORAGE_KEY='campusExamData_v1';
  const SECTIONS=['A','B','C','D','E','F','G','H','I','J'];
  let parsedSectionRows=[];

  function e(v=''){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function msg(t){if(typeof toast==='function')toast(t);else alert(t)}
  function normalizeSection(v){const x=String(v??'').trim().toUpperCase().replace(/^SECTION\s*/,'');return SECTIONS.includes(x)?x:''}
  function sectionOptions(value='',allLabel='All Sections'){return `<option value="">${allLabel}</option>`+SECTIONS.map(x=>`<option value="${x}" ${x===value?'selected':''}>Section ${x}</option>`).join('')}
  function getData(){if(typeof state!=='undefined'&&state)return state;try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||{students:[]}}catch{return{students:[]}}}
  function save(){if(typeof saveData==='function')saveData();else localStorage.setItem(STORAGE_KEY,JSON.stringify(getData()))}
  function branches(){const d=getData(),master=Array.isArray(d.branches)?d.branches.filter(x=>(x.status||'Active')==='Active').map(x=>x.code):[],used=(d.students||[]).map(x=>x.branch);return [...new Set([...master,...used].filter(Boolean))].sort()}
  function branchOptions(all=true){return `${all?'<option value="">All Branches</option>':''}`+branches().map(x=>`<option value="${e(x)}">${e(x)}</option>`).join('')}
  function studentByHall(h){const key=String(h||'').trim().toUpperCase();return (getData().students||[]).find(s=>String(s.hall||'').trim().toUpperCase()===key)}

  function styles(){
    if(document.getElementById('section-wise-styles'))return;
    const s=document.createElement('style');s.id='section-wise-styles';s.textContent=`
      .section-manage-modal{width:min(1050px,96vw)}.section-top-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.section-top-grid label{display:grid;gap:6px;font-size:12px;font-weight:800}.section-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.section-count-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:14px 0}.section-count-grid>div{border:1px solid var(--line);background:var(--surface-2);border-radius:12px;padding:9px;text-align:center}.section-count-grid small{display:block;color:var(--muted)}.section-count-grid b{font-size:17px}.section-upload{margin-top:14px;padding-top:14px;border-top:1px solid var(--line)}.section-drop{border:2px dashed #93c5fd;border-radius:16px;padding:20px;text-align:center;display:grid;gap:5px;cursor:pointer;background:rgba(59,130,246,.04)}.section-drop.dragover{border-color:var(--primary);background:rgba(59,130,246,.09)}.section-preview{max-height:300px;margin-top:12px}.section-ok{color:var(--success);font-weight:800}.section-bad{color:var(--danger);font-weight:800}.student-section-badge{display:inline-flex;min-width:28px;justify-content:center;padding:4px 7px;border-radius:999px;background:var(--surface-2);border:1px solid var(--line);font-size:11px;font-weight:900}.exam-section-select{min-width:140px}@media(max-width:800px){.section-top-grid{grid-template-columns:1fr 1fr}.section-count-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:520px){.section-top-grid{grid-template-columns:1fr}.section-count-grid{grid-template-columns:repeat(2,1fr)}}
    `;document.head.appendChild(s)
  }

  function canManageStudents(){return window.CampusRoles?.can?window.CampusRoles.can('students','bulk')||window.CampusRoles.can('students','update'):true}

  function ensureStudentButton(){
    const toolbar=document.querySelector('#students .toolbar-buttons')||document.querySelector('#students .section-toolbar .button-row');
    if(!toolbar||document.getElementById('sectionManageBtn'))return;
    const b=document.createElement('button');b.type='button';b.id='sectionManageBtn';b.className='btn btn-outline';b.textContent='Sections A–J';
    b.addEventListener('click',()=>{if(!canManageStudents())return msg('You do not have permission to manage student sections');openSectionManager()});
    toolbar.insertBefore(b,toolbar.firstChild)
  }

  function buildSectionManager(){
    if(document.getElementById('sectionManagerBackdrop'))return;
    const d=document.createElement('div');d.className='modal-backdrop';d.id='sectionManagerBackdrop';d.hidden=true;d.innerHTML=`
      <div class="modal section-manage-modal" role="dialog" aria-modal="true">
        <div class="modal-head"><div><h3>Student Section Management</h3><p class="modal-subtitle">Assign Sections A–J or bulk upload section mapping using Hall Ticket numbers.</p></div><button class="icon-btn" id="closeSectionManager" type="button">✕</button></div>
        <div class="modal-body">
          <div class="section-top-grid">
            <label>Branch<select class="input" id="sectionBranch"></select></label>
            <label>Year<select class="input" id="sectionYear"><option value="">Select Year</option><option>I</option><option>II</option><option>III</option><option>IV</option></select></label>
            <label>Semester<select class="input" id="sectionSemester"><option value="">Select Semester</option><option>I</option><option>II</option></select></label>
            <label>Assign Section<select class="input" id="sectionTarget">${sectionOptions('','Select Section')}</select></label>
          </div>
          <div class="section-actions"><button class="btn btn-primary" id="assignMatchingSection" type="button">Assign Matching Students</button><button class="btn btn-outline" id="clearMatchingSection" type="button">Clear Matching Section</button></div>
          <div class="section-count-grid" id="sectionCounts"></div>
          <div class="section-upload">
            <div class="card-head compact"><div><h3>Bulk Section Upload</h3><p>Columns: Hall Ticket, Section. Valid sections are A to J.</p></div><button class="btn btn-outline" id="downloadSectionTemplate" type="button">Download Template</button></div>
            <label class="section-drop" id="sectionDrop"><input id="sectionFile" type="file" accept=".csv,.xlsx,.xls" hidden><b>Choose CSV / Excel file</b><small>or drag and drop here</small></label>
            <div id="sectionPreviewWrap" hidden><div class="table-wrap section-preview"><table><thead><tr><th>#</th><th>Hall Ticket</th><th>Student</th><th>Section</th><th>Validation</th></tr></thead><tbody id="sectionPreviewBody"></tbody></table></div></div>
          </div>
        </div>
        <div class="modal-actions"><button class="btn btn-outline" id="cancelSectionManager" type="button">Close</button><button class="btn btn-primary" id="importSectionsBtn" type="button" disabled>Import Sections</button></div>
      </div>`;
    document.body.appendChild(d);
    const close=()=>{d.hidden=true;parsedSectionRows=[]};
    document.getElementById('closeSectionManager').onclick=close;document.getElementById('cancelSectionManager').onclick=close;
    document.getElementById('assignMatchingSection').onclick=assignMatching;document.getElementById('clearMatchingSection').onclick=clearMatching;
    document.getElementById('downloadSectionTemplate').onclick=downloadTemplate;document.getElementById('importSectionsBtn').onclick=importSections;
    const input=document.getElementById('sectionFile'),drop=document.getElementById('sectionDrop');input.onchange=()=>readSectionFile(input.files?.[0]);
    ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,x=>{x.preventDefault();drop.classList.add('dragover')}));['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,x=>{x.preventDefault();drop.classList.remove('dragover')}));drop.addEventListener('drop',x=>readSectionFile(x.dataTransfer.files?.[0]));
  }

  function openSectionManager(){
    buildSectionManager();const d=document.getElementById('sectionManagerBackdrop');d.hidden=false;document.getElementById('sectionBranch').innerHTML='<option value="">Select Branch</option>'+branchOptions(false);document.getElementById('sectionYear').value='';document.getElementById('sectionSemester').value='';document.getElementById('sectionTarget').value='';document.getElementById('sectionFile').value='';document.getElementById('sectionPreviewWrap').hidden=true;document.getElementById('importSectionsBtn').disabled=true;renderSectionCounts()
  }

  function matchingStudents(){const b=document.getElementById('sectionBranch')?.value||'',y=document.getElementById('sectionYear')?.value||'',sem=document.getElementById('sectionSemester')?.value||'';return (getData().students||[]).filter(s=>(s.status||'Active')==='Active'&&(!b||s.branch===b)&&(!y||s.year===y)&&(!sem||s.sem===sem))}
  function requireGroup(){const b=document.getElementById('sectionBranch').value,y=document.getElementById('sectionYear').value,sem=document.getElementById('sectionSemester').value;if(!b||!y||!sem){msg('Select Branch, Year and Semester first');return false}return true}
  function assignMatching(){if(!requireGroup())return;const sec=normalizeSection(document.getElementById('sectionTarget').value);if(!sec)return msg('Select Section A to J');const list=matchingStudents();if(!list.length)return msg('No active students found for the selected group');if(!confirm(`Assign ${list.length} matching student${list.length===1?'':'s'} to Section ${sec}?`))return;const ids=new Set(list.map(x=>Number(x.id)));getData().students=(getData().students||[]).map(s=>ids.has(Number(s.id))?{...s,section:sec}:s);save();afterStudentChange();msg(`${list.length} student${list.length===1?'':'s'} assigned to Section ${sec}`)}
  function clearMatching(){if(!requireGroup())return;const list=matchingStudents();if(!list.length)return msg('No active students found for the selected group');if(!confirm(`Clear section assignment for ${list.length} matching student${list.length===1?'':'s'}?`))return;const ids=new Set(list.map(x=>Number(x.id)));getData().students=(getData().students||[]).map(s=>ids.has(Number(s.id))?{...s,section:''}:s);save();afterStudentChange();msg(`${list.length} section assignment${list.length===1?'':'s'} cleared`)}

  function renderSectionCounts(){const students=getData().students||[],box=document.getElementById('sectionCounts');if(!box)return;const cards=SECTIONS.map(sec=>`<div><small>Section ${sec}</small><b>${students.filter(s=>normalizeSection(s.section)===sec).length}</b></div>`).join('');const un=students.filter(s=>!normalizeSection(s.section)).length;box.innerHTML=cards+`<div><small>Unassigned</small><b>${un}</b></div>`}
  function downloadTemplate(){const rows=[['Hall Ticket','Section'],['232T1A0101','A'],['232T1A0102','A'],['232T1A0103','B']],csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='student_section_upload_template.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  function parseCsv(text){const rows=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(q&&text[i+1]==='"'){cell+='"';i++}else q=!q}else if(ch===','&&!q){row.push(cell);cell=''}else if((ch==='\n'||ch==='\r')&&!q){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);cell='';if(row.some(v=>String(v).trim()))rows.push(row);row=[]}else cell+=ch}row.push(cell);if(row.some(v=>String(v).trim()))rows.push(row);if(!rows.length)return[];const h=rows[0].map(x=>String(x).trim().toLowerCase());return rows.slice(1).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]??''])))}
  function rowValue(row,names){const keys=Object.keys(row||{});for(const n of names){const k=keys.find(x=>x.trim().toLowerCase()===n.toLowerCase());if(k)return row[k]}return''}
  async function readSectionFile(file){if(!file)return;try{let rows=[],ext=file.name.split('.').pop().toLowerCase();if(ext==='csv')rows=parseCsv(await file.text());else if(['xlsx','xls'].includes(ext)){if(typeof XLSX==='undefined')throw new Error('Excel reader unavailable');const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''})}else throw new Error('Choose CSV, XLSX or XLS');if(!rows.length)throw new Error('No section rows found');if(rows.length>5000)throw new Error('Maximum 5,000 rows per upload');parsedSectionRows=rows.map((r,i)=>{const hall=String(rowValue(r,['Hall Ticket','Hall Ticket No','HT No','Roll No'])||'').trim().toUpperCase(),section=normalizeSection(rowValue(r,['Section','Class Section'])),student=studentByHall(hall),errors=[];if(!hall)errors.push('Hall Ticket missing');else if(!student)errors.push('Student not found');if(!section)errors.push('Section must be A–J');return{i:i+1,hall,section,student,errors}});renderSectionPreview()}catch(err){msg(err.message||'Could not read section file')}}
  function renderSectionPreview(){const wrap=document.getElementById('sectionPreviewWrap'),body=document.getElementById('sectionPreviewBody'),valid=parsedSectionRows.filter(x=>!x.errors.length);wrap.hidden=false;body.innerHTML=parsedSectionRows.slice(0,150).map(r=>`<tr><td>${r.i}</td><td><b>${e(r.hall)}</b></td><td>${e(r.student?.name||'—')}</td><td>${r.section?`Section ${e(r.section)}`:'—'}</td><td>${r.errors.length?`<span class="section-bad">${e(r.errors.join(', '))}</span>`:'<span class="section-ok">Ready</span>'}</td></tr>`).join('');const b=document.getElementById('importSectionsBtn');b.disabled=!valid.length;b.textContent=valid.length?`Import ${valid.length} Section Assignment${valid.length===1?'':'s'}`:'Import Sections'}
  function importSections(){const valid=parsedSectionRows.filter(x=>!x.errors.length);if(!valid.length)return;const map=new Map(valid.map(r=>[r.hall,r.section]));let count=0;getData().students=(getData().students||[]).map(s=>{const sec=map.get(String(s.hall||'').trim().toUpperCase());if(!sec)return s;count++;return{...s,section:sec}});save();parsedSectionRows=[];document.getElementById('sectionManagerBackdrop').hidden=true;afterStudentChange();msg(`${count} student section assignment${count===1?'':'s'} imported`)}

  function addSectionToStudentEditor(){
    if(window.__sectionStudentEditorWrapped)return;
    const original=window.openStudentModal;if(typeof original!=='function')return;
    window.openStudentModal=function(student=null){original(student);setTimeout(()=>{const grid=document.querySelector('#modalBody .form-grid');if(!grid||grid.querySelector('[name="section"]'))return;const label=document.createElement('label');label.innerHTML=`Section<select class="input" name="section">${sectionOptions(normalizeSection(student?.section),'Unassigned')}</select>`;const status=grid.querySelector('[name="status"]')?.closest('label');grid.insertBefore(label,status||null)},0)};
    window.editStudent=id=>window.openStudentModal((getData().students||[]).find(x=>Number(x.id)===Number(id)));
    window.updateStudentRecord=id=>window.openStudentModal((getData().students||[]).find(x=>Number(x.id)===Number(id)));
    window.__sectionStudentEditorWrapped=true
  }

  function decorateStudentTable(){
    const table=document.querySelector('#students table');if(!table)return;const head=table.querySelector('thead tr');if(head&&!head.querySelector('[data-section-col]')){const th=document.createElement('th');th.dataset.sectionCol='1';th.textContent='Section';const status=[...head.children].find(x=>x.textContent.trim()==='Status');head.insertBefore(th,status||head.lastElementChild)}
    document.querySelectorAll('#studentTableBody tr').forEach(tr=>{if(tr.querySelector('[data-section-cell]')||tr.querySelector('.student-empty-filter'))return;const hall=tr.querySelector('b')?.textContent?.trim(),student=studentByHall(hall);if(!student)return;const td=document.createElement('td');td.dataset.sectionCell='1';td.innerHTML=normalizeSection(student.section)?`<span class="student-section-badge">${e(normalizeSection(student.section))}</span>`:'—';const cells=[...tr.children],status=cells.find(x=>/Active|Detained|Completed/i.test(x.textContent));tr.insertBefore(td,status||tr.lastElementChild)})
  }
  function wrapStudentRender(){if(window.__sectionStudentRenderWrapped||typeof renderStudents!=='function')return;const original=renderStudents;renderStudents=function(){original();decorateStudentTable()};window.__sectionStudentRenderWrapped=true;decorateStudentTable()}

  function afterStudentChange(){renderSectionCounts();if(typeof renderStudents==='function')renderStudents();decorateStudentTable();refreshExamSectionSummaries();if(window.StudentPortal?.render)window.StudentPortal.render()}

  function filteredBySection(students,section){const sec=normalizeSection(section);return sec?students.filter(s=>normalizeSection(s.section)===sec):students}
  function tempGlobalStudents(section){const sec=normalizeSection(section);if(!sec||typeof state==='undefined')return null;const original=state.students;state.students=filteredBySection(original||[],sec);return()=>{state.students=original}}
  function tempLocalStudents(section){const sec=normalizeSection(section);if(!sec)return null;const raw=localStorage.getItem(STORAGE_KEY);try{const d=JSON.parse(raw)||{};d.students=filteredBySection(d.students||[],sec);localStorage.setItem(STORAGE_KEY,JSON.stringify(d))}catch{return null}return()=>{if(raw===null)localStorage.removeItem(STORAGE_KEY);else localStorage.setItem(STORAGE_KEY,raw)}}
  function patchButtonWithTemp(button,sectionGetter,mode){if(!button||button.dataset.sectionPatched)return;button.dataset.sectionPatched='1';let restore=null;button.addEventListener('click',()=>{restore=mode==='global'?tempGlobalStudents(sectionGetter()):tempLocalStudents(sectionGetter());if(restore)setTimeout(()=>{if(restore){restore();restore=null}},50)},true);button.addEventListener('click',()=>{if(restore){restore();restore=null}},false)}

  function ensureHallSection(){
    const grid=document.querySelector('#halltickets .hall-filter-grid');if(!grid)return false;
    if(!document.getElementById('hallSectionFilter')){const label=document.createElement('label');label.innerHTML=`Section<select class="input exam-section-select" id="hallSectionFilter">${sectionOptions()}</select>`;grid.appendChild(label);document.getElementById('hallSectionFilter').addEventListener('change',updateHallSummary)}
    const note=document.getElementById('bulkHallInfoNote');if(note)note.textContent='Select Branch, Year, Semester and Section as needed, choose the examination, then generate hall tickets for all matching active students. Two hall tickets are arranged on each A4 page.';
    patchButtonWithTemp(document.getElementById('generateHallBtn'),()=>document.getElementById('hallSectionFilter')?.value||'','global');
    ['hallBranchFilter','hallYearFilter','hallSemesterFilter'].forEach(id=>{const x=document.getElementById(id);if(x&&!x.dataset.sectionSummary){x.dataset.sectionSummary='1';x.addEventListener('change',updateHallSummary)}});updateHallSummary();return true
  }
  function hallMatching(){const d=getData(),b=document.getElementById('hallBranchFilter')?.value||'',y=document.getElementById('hallYearFilter')?.value||'',sem=document.getElementById('hallSemesterFilter')?.value||'',sec=normalizeSection(document.getElementById('hallSectionFilter')?.value);return(d.students||[]).filter(s=>(s.status||'Active')==='Active'&&(!b||s.branch===b)&&(!y||s.year===y)&&(!sem||s.sem===sem)&&(!sec||normalizeSection(s.section)===sec))}
  function updateHallSummary(){const list=hallMatching(),count=list.length;const a=document.getElementById('bulkHallStudentCount'),b=document.getElementById('bulkHallTicketCount'),c=document.getElementById('bulkHallPageCount');if(a)a.textContent=count;if(b)b.textContent=count;if(c)c.textContent=Math.ceil(count/2);const s=document.getElementById('hallFilterSummary'),sec=normalizeSection(document.getElementById('hallSectionFilter')?.value);if(s)s.textContent=`${count} active student${count===1?'':'s'} match Branch / Year / Semester${sec?` / Section ${sec}`:''}.`}

  function ensureSeatSection(){
    const form=document.querySelector('#seating .seat-form');if(!form)return false;
    if(!document.getElementById('seatSectionFilter')){const cap=document.getElementById('seatCapacity')?.closest('label'),label=document.createElement('label');label.innerHTML=`Section<select class="input exam-section-select" id="seatSectionFilter">${sectionOptions()}</select>`;cap?.after(label)}
    const get=()=>document.getElementById('seatSectionFilter')?.value||'';['seatLoadA','seatLoadB','seatAutoSplit'].forEach(id=>patchButtonWithTemp(document.getElementById(id),get,'local'));
    const help=document.querySelector('#seating .seat-help');if(help)help.textContent='Choose a Section to load only that section from Student Master. Hall A / Hall B branch loading and Auto Split will respect the selected Section. Leave All Sections to use the full active student list.';return true
  }

  function attendanceMatching(){const d=getData(),b=document.getElementById('attBranch')?.value||'',y=document.getElementById('attYear')?.value||'',sem=document.getElementById('attSemester')?.value||'',sec=normalizeSection(document.getElementById('attSection')?.value);return(d.students||[]).filter(s=>(s.status||'Active')==='Active'&&(!b||s.branch===b)&&(!y||s.year===y)&&(!sem||s.sem===sem)&&(!sec||normalizeSection(s.section)===sec))}
  function updateAttendanceStats(){const list=attendanceMatching(),abs=new Set(String(document.getElementById('attAbsent')?.value||'').split(/[\s,;]+/).map(x=>x.trim().toUpperCase()).filter(Boolean)),absCount=list.filter(x=>abs.has(String(x.hall||'').toUpperCase())).length,rows=Number(document.getElementById('attRowsPerPage')?.value||24),boxes=document.querySelectorAll('#attStatus b');if(boxes.length===4){boxes[0].textContent=list.length;boxes[1].textContent=absCount;boxes[2].textContent=Math.max(0,list.length-absCount);boxes[3].textContent=list.length?Math.ceil(list.length/rows):0}}
  function ensureAttendanceSection(){
    const form=document.querySelector('#attendance .attendance-form');if(!form)return false;
    if(!document.getElementById('attSection')){const sem=document.getElementById('attSemester')?.closest('label'),label=document.createElement('label');label.innerHTML=`Section<select class="input exam-section-select" id="attSection">${sectionOptions()}</select>`;sem?.after(label);document.getElementById('attSection').addEventListener('change',updateAttendanceStats)}
    patchButtonWithTemp(document.getElementById('attGenerate'),()=>document.getElementById('attSection')?.value||'','local');
    ['attBranch','attYear','attSemester','attRowsPerPage','attAbsent'].forEach(id=>{const x=document.getElementById(id);if(x&&!x.dataset.sectionStats){x.dataset.sectionStats='1';x.addEventListener(id==='attAbsent'?'input':'change',updateAttendanceStats)}});
    const note=document.querySelector('#attendance .attendance-note');if(note)note.textContent='Students are loaded from Student Master using Branch, Year, Semester and Section. Booklet S.No can be entered directly in the preview before exporting.';updateAttendanceStats();return true
  }

  function refreshExamSectionSummaries(){updateHallSummary();updateAttendanceStats()}
  function patchAll(){styles();ensureStudentButton();buildSectionManager();addSectionToStudentEditor();wrapStudentRender();decorateStudentTable();ensureHallSection();ensureSeatSection();ensureAttendanceSection();if(window.CampusRoles?.applyAccess)window.CampusRoles.applyAccess()}

  patchAll();let tries=0;const timer=setInterval(()=>{patchAll();tries++;if(tries>=20)clearInterval(timer)},500);
  document.querySelector('[data-view="students"]')?.addEventListener('click',()=>setTimeout(()=>{ensureStudentButton();decorateStudentTable()},0));
  document.querySelector('[data-view="halltickets"]')?.addEventListener('click',()=>setTimeout(ensureHallSection,0));
  document.querySelector('[data-view="seating"]')?.addEventListener('click',()=>setTimeout(ensureSeatSection,0));
  document.querySelector('[data-view="attendance"]')?.addEventListener('click',()=>setTimeout(ensureAttendanceSection,0));
  window.SectionWiseModule={sections:SECTIONS,refresh:patchAll,normalizeSection};
})();