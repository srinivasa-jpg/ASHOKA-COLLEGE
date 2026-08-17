(function(){
  const STORAGE_KEY='campusExamData_v1';
  const SNAPSHOT_KEY='campusExamSeatingAttendance_v1';
  const SECTIONS=['A','B','C','D','E','F','G','H','I','J'];
  const BOOKLET_KEY='campusExamAttendanceBooklets_v1';

  function e(v=''){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function msg(t){if(typeof toast==='function')toast(t);else alert(t)}
  function norm(v){const x=String(v??'').trim().toUpperCase().replace(/^SECTION\s*/,'');return SECTIONS.includes(x)?x:''}
  function appData(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||{students:[]}}catch{return{students:[]}}}
  function getSnapshot(){try{return JSON.parse(localStorage.getItem(SNAPSHOT_KEY))||null}catch{return null}}
  function saveSnapshot(x){localStorage.setItem(SNAPSHOT_KEY,JSON.stringify(x))}
  function getBooklets(){try{return JSON.parse(localStorage.getItem(BOOKLET_KEY))||{}}catch{return{}}}
  function saveBooklets(x){localStorage.setItem(BOOKLET_KEY,JSON.stringify(x))}
  function fmtDate(v){if(!v)return'';const p=String(v).split('-');return p.length===3?`${p[2]}.${p[1]}.${p[0]}`:v}
  function safeSheet(v,i){return (String(v||`Room ${i+1}`).replace(/[\\/?*\[\]:]/g,'-').slice(0,31)||`Room ${i+1}`)}

  function styles(){
    if(document.getElementById('seat-att-sync-styles'))return;
    const s=document.createElement('style');s.id='seat-att-sync-styles';s.textContent=`
      .multi-section-label{grid-column:1/-1;display:grid;gap:7px;font-size:13px;font-weight:800}.multi-section-box{display:flex;gap:7px;flex-wrap:wrap;padding:10px;border:1px solid var(--line);border-radius:12px;background:var(--surface-2)}.multi-section-chip{display:inline-flex!important;align-items:center;gap:5px!important;padding:6px 9px;border:1px solid var(--line);border-radius:999px;background:var(--surface);font-size:12px!important;font-weight:800!important;cursor:pointer}.multi-section-chip input{accent-color:var(--primary)}.multi-section-hint{font-size:11px;color:var(--muted);font-weight:600}.attendance-source-banner{margin:10px 0;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface-2);font-size:12px;line-height:1.5}.attendance-source-banner b{color:var(--primary)}.seat-sync-note{margin:10px 0 0;padding:9px 11px;border-radius:11px;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.22);font-size:12px;font-weight:700}.seat-sync-note.pending{background:rgba(245,158,11,.08);border-color:rgba(245,158,11,.25)}
      @media(max-width:600px){.multi-section-box{gap:6px}.multi-section-chip{padding:6px 8px}}
    `;document.head.appendChild(s)
  }

  function multiHtml(prefix){
    return `<label class="multi-section-label" id="${prefix}MultiLabel"><span>Sections — select one or more</span><div class="multi-section-box" id="${prefix}MultiBox"><label class="multi-section-chip"><input type="checkbox" data-section-all checked>All Sections</label>${SECTIONS.map(x=>`<label class="multi-section-chip"><input type="checkbox" value="${x}" data-section-one>Section ${x}</label>`).join('')}</div><small class="multi-section-hint">Choose any combination such as A + B + C. “All Sections” uses every assigned section.</small></label>`
  }
  function selected(prefix){
    const box=document.getElementById(`${prefix}MultiBox`);if(!box)return[];
    if(box.querySelector('[data-section-all]')?.checked)return[];
    return [...box.querySelectorAll('[data-section-one]:checked')].map(x=>x.value).filter(Boolean)
  }
  function bindMulti(prefix,onChange){
    const box=document.getElementById(`${prefix}MultiBox`);if(!box||box.dataset.bound)return;box.dataset.bound='1';
    box.addEventListener('change',ev=>{
      const all=box.querySelector('[data-section-all]'),ones=[...box.querySelectorAll('[data-section-one]')];
      if(ev.target.matches('[data-section-all]')){if(all.checked)ones.forEach(x=>x.checked=false)}
      else if(ev.target.matches('[data-section-one]')){if(ev.target.checked)all.checked=false;if(!ones.some(x=>x.checked))all.checked=true}
      onChange?.()
    })
  }
  function hideOldSection(id){const x=document.getElementById(id);if(!x)return;if(x.value)x.value='';const label=x.closest('label');if(label)label.style.display='none';else x.style.display='none'}
  function sectionText(list){return list.length?list.map(x=>`Section ${x}`).join(', '):'All Sections'}

  function tempFilteredStorage(sections){
    if(!sections.length)return null;
    const raw=localStorage.getItem(STORAGE_KEY);if(raw===null)return null;
    try{const d=JSON.parse(raw)||{};d.students=(d.students||[]).filter(s=>sections.includes(norm(s.section)));localStorage.setItem(STORAGE_KEY,JSON.stringify(d));return()=>localStorage.setItem(STORAGE_KEY,raw)}catch{return null}
  }
  function patchTempButton(id,prefix){
    const b=document.getElementById(id);if(!b||b.dataset.multiSectionTemp)return;b.dataset.multiSectionTemp='1';
    b.addEventListener('click',()=>{const restore=tempFilteredStorage(selected(prefix));if(restore)setTimeout(restore,0)},true)
  }

  function ensureSeatMulti(){
    const form=document.querySelector('#seating .seat-form');if(!form)return false;
    hideOldSection('seatSectionFilter');
    if(!document.getElementById('seatMultiLabel')){
      const anchor=document.getElementById('seatCapacity')?.closest('label');
      const wrap=document.createElement('div');wrap.innerHTML=multiHtml('seat');const label=wrap.firstElementChild;anchor?.after(label)||form.appendChild(label)
    }
    bindMulti('seat',()=>updateSeatSyncNote());
    ['seatLoadA','seatLoadB','seatAutoSplit'].forEach(id=>patchTempButton(id,'seat'));
    const help=document.querySelector('#seating .seat-help');if(help)help.textContent='Select one or more Sections, then Load A / Load B or Auto Split. Generating the Seating Plan will simultaneously prepare room-wise Attendance sheets from the exact seating allocation.';
    ensureSeatSyncNote();bindSeatGenerate();return true
  }
  function ensureSeatSyncNote(){
    const actions=document.querySelector('#seating .seat-actions');if(!actions||document.getElementById('seatAttendanceSyncNote'))return;
    const p=document.createElement('div');p.id='seatAttendanceSyncNote';p.className='seat-sync-note pending';actions.after(p);updateSeatSyncNote()
  }
  function updateSeatSyncNote(done=false,snapshot=null){
    const p=document.getElementById('seatAttendanceSyncNote');if(!p)return;
    const sections=selected('seat');
    p.classList.toggle('pending',!done);
    p.textContent=done&&snapshot?`Attendance generated automatically from ${snapshot.rooms.length} seating room${snapshot.rooms.length===1?'':'s'} · ${sectionText(snapshot.sections||sections)}`:`Attendance will be generated automatically with the Seating Plan · ${sectionText(sections)}`
  }

  function parseSeatSnapshot(){
    const papers=[...document.querySelectorAll('#seatPreview .seat-paper')];if(!papers.length)return null;
    const d=appData(),byHall=new Map((d.students||[]).map(s=>[String(s.hall||'').trim().toUpperCase(),s]));
    const rooms=papers.map((paper,idx)=>{
      const room=paper.querySelector('.seat-room-box')?.textContent?.trim()||`Room ${idx+1}`;
      const candidates=[];
      paper.querySelectorAll('.seat-row').forEach(row=>{
        const label=row.querySelector('.seat-row-label')?.textContent||'';const lane=/Hall\s*No\.\s*B/i.test(label)?'B':'A';
        row.querySelectorAll('.seat-box').forEach(box=>{const hall=box.textContent.trim().toUpperCase();if(!hall)return;const s=byHall.get(hall)||{};candidates.push({hall,name:s.name||'',branch:s.branch||'',section:norm(s.section),lane})})
      });
      return{room,candidates}
    }).filter(x=>x.candidates.length);
    if(!rooms.length)return null;
    return{version:2,createdAt:new Date().toISOString(),college:document.getElementById('seatCollege')?.value.trim()||'',date:document.getElementById('seatDate')?.value||'',yearSem:document.getElementById('seatYearSem')?.value.trim()||'',subjects:document.getElementById('seatSubjects')?.value.trim()||'',capacity:Number(document.getElementById('seatCapacity')?.value||48),sections:selected('seat'),rooms}
  }
  function bindSeatGenerate(){
    const b=document.getElementById('seatGenerate');if(!b||b.dataset.attSync)return;b.dataset.attSync='1';
    b.addEventListener('click',()=>setTimeout(()=>{
      const snap=parseSeatSnapshot();if(!snap)return;
      saveSnapshot(snap);renderAttendanceFromSnapshot(snap);updateSeatSyncNote(true,snap);msg(`Seating Plan + ${snap.rooms.length} room-wise Attendance sheet${snap.rooms.length===1?'':'s'} generated`)
    },0))
  }

  function ensureAttendanceMulti(){
    const form=document.querySelector('#attendance .attendance-form');if(!form)return false;
    hideOldSection('attSection');
    if(!document.getElementById('attMultiLabel')){
      const anchor=document.getElementById('attSemester')?.closest('label');const wrap=document.createElement('div');wrap.innerHTML=multiHtml('att');const label=wrap.firstElementChild;anchor?.after(label)||form.appendChild(label)
    }
    bindMulti('att',refreshMultiAttendanceStats);patchTempButton('attGenerate','att');
    ['attBranch','attYear','attSemester','attRowsPerPage','attAbsent'].forEach(id=>{const x=document.getElementById(id);if(x&&!x.dataset.multiStats){x.dataset.multiStats='1';x.addEventListener(id==='attAbsent'?'input':'change',()=>setTimeout(refreshMultiAttendanceStats,0))}});
    ensureAttendanceSource();ensureUseSeatingButton();bindManualAttendance();bindAttendanceExports();refreshMultiAttendanceStats();return true
  }
  function ensureAttendanceSource(){
    const panel=document.querySelector('#attendance .attendance-panel');if(!panel||document.getElementById('attendanceSourceBanner'))return;
    const b=document.createElement('div');b.id='attendanceSourceBanner';b.className='attendance-source-banner';const actions=panel.querySelector('.attendance-actions');actions?.before(b);renderAttendanceSource(false)
  }
  function renderAttendanceSource(fromSeating,snapshot=getSnapshot()){
    const b=document.getElementById('attendanceSourceBanner');if(!b)return;
    if(fromSeating&&snapshot)b.innerHTML=`<b>Source: Seating Plan</b> · ${snapshot.rooms.length} room${snapshot.rooms.length===1?'':'s'} · ${sectionText(snapshot.sections||[])} · Attendance candidates exactly match the generated seating allocation.`;
    else b.innerHTML=`<b>Source: Attendance Filters</b> · Branch / Year / Semester / ${sectionText(selected('att'))}. Use “Latest Seating Plan” to restore the exact room-wise seating allocation.`
  }
  function ensureUseSeatingButton(){
    const actions=document.querySelector('#attendance .attendance-actions');if(!actions||document.getElementById('attUseSeating'))return;
    const b=document.createElement('button');b.type='button';b.className='btn btn-outline';b.id='attUseSeating';b.textContent='Use Latest Seating Plan';b.addEventListener('click',()=>{const snap=getSnapshot();if(!snap)return msg('Generate a Seating Plan first');renderAttendanceFromSnapshot(snap);msg('Attendance restored from latest Seating Plan')});actions.insertBefore(b,actions.firstChild)
  }
  function bindManualAttendance(){
    const b=document.getElementById('attGenerate');if(!b||b.dataset.multiManual)return;b.dataset.multiManual='1';b.addEventListener('click',()=>setTimeout(()=>{window.__attendanceSeatSource=false;renderAttendanceSource(false);refreshMultiAttendanceStats()},0))
  }
  function manualFilteredStudents(){
    const d=appData(),branch=document.getElementById('attBranch')?.value||'',year=document.getElementById('attYear')?.value||'',sem=document.getElementById('attSemester')?.value||'',sections=selected('att');
    return(d.students||[]).filter(s=>(s.status||'Active')==='Active'&&(!branch||s.branch===branch)&&(!year||s.year===year)&&(!sem||s.sem===sem)&&(!sections.length||sections.includes(norm(s.section))))
  }
  function absentSet(){return new Set(String(document.getElementById('attAbsent')?.value||'').split(/[\s,;]+/).map(x=>x.trim().toUpperCase()).filter(Boolean))}
  function refreshMultiAttendanceStats(){
    if(window.__attendanceSeatSource){const snap=getSnapshot();if(snap){updateSnapshotStats(snap);return}}
    const list=manualFilteredStudents(),abs=absentSet(),ac=list.filter(x=>abs.has(String(x.hall||'').toUpperCase())).length,rows=Number(document.getElementById('attRowsPerPage')?.value||24),boxes=document.querySelectorAll('#attStatus b');if(boxes.length===4){boxes[0].textContent=list.length;boxes[1].textContent=ac;boxes[2].textContent=Math.max(0,list.length-ac);boxes[3].textContent=list.length?Math.ceil(list.length/rows):0}renderAttendanceSource(false)
  }
  function updateSnapshotStats(snap){
    const halls=snap.rooms.flatMap(r=>r.candidates.map(c=>c.hall)),abs=absentSet(),ac=halls.filter(h=>abs.has(String(h).toUpperCase())).length,boxes=document.querySelectorAll('#attStatus b');if(boxes.length===4){boxes[0].textContent=halls.length;boxes[1].textContent=ac;boxes[2].textContent=Math.max(0,halls.length-ac);boxes[3].textContent=snap.rooms.length}
  }

  function renderAttendanceFromSnapshot(snap){
    if(!snap||!document.getElementById('attendance'))return false;
    const set=(id,v)=>{const x=document.getElementById(id);if(x)x.value=v??''};set('attCollege',snap.college);set('attDate',snap.date);set('attYearText',snap.yearSem);set('attSubjects',snap.subjects);set('attRooms',snap.rooms.map(x=>x.room).join(', '));
    const preview=document.getElementById('attPreview');if(!preview)return false;const abs=absentSet(),booklets=getBooklets();
    preview.innerHTML=snap.rooms.map((r,ri)=>{const ac=r.candidates.filter(c=>abs.has(c.hall.toUpperCase())).length,present=r.candidates.length-ac;return `<article class="attendance-paper" data-att-seat-room="${ri}"><h2 class="att-college">${e(snap.college)}</h2><table class="att-meta"><tr><td>Date of Examination:</td><td>${e(fmtDate(snap.date))}</td></tr><tr><td>Year & Semester:</td><td>${e(snap.yearSem)}</td></tr><tr><td>Name of the Subject(s):</td><td>${e(snap.subjects)}</td></tr></table><div class="att-title">Attendance</div><div class="att-room">Room Number <div class="att-room-box">${e(r.room)}</div></div><table class="att-table"><thead><tr><th>S.No</th><th>Hall Ticket No.</th><th>Booklet S.NO</th><th>Signature of the student</th></tr></thead><tbody>${r.candidates.map((c,i)=>{const isAbs=abs.has(c.hall.toUpperCase());return `<tr><td>${i+1}</td><td><b>${e(c.hall)}</b></td><td><input class="att-booklet" data-sync-booklet="${e(c.hall)}" value="${e(booklets[c.hall]||'')}"></td><td>${isAbs?'<span class="att-absent">ABSENT</span>':''}</td></tr>`}).join('')}</tbody></table><div class="att-counts"><div class="att-count-line"><div>Number of Candidates Registered:</div><div>${r.candidates.length}</div></div><div class="att-count-line"><div>Number of Candidates Absent:</div><div>${ac||''}</div></div><div class="att-count-line"><div>Number of Candidates Present:</div><div>${present}</div></div></div><div class="att-sign">Signature of the Invigilator(s)<div class="att-sign-nos"><span>1</span><span>2</span></div></div></article>`}).join('');
    preview.querySelectorAll('[data-sync-booklet]').forEach(inp=>inp.addEventListener('input',()=>{const b=getBooklets();b[inp.dataset.syncBooklet]=inp.value;saveBooklets(b)}));
    window.__attendanceSeatSource=true;updateSnapshotStats(snap);renderAttendanceSource(true,snap);return true
  }

  async function loadScript(src,test){if(test())return;await new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
  async function ensurePdf(){await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',()=>!!window.jspdf?.jsPDF)}
  async function ensureXlsx(){await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',()=>!!window.XLSX)}
  function bindAttendanceExports(){
    const pdf=document.getElementById('attendancePdf'),xls=document.getElementById('attendanceExcel');
    if(pdf&&!pdf.dataset.seatSyncExport){pdf.dataset.seatSyncExport='1';pdf.addEventListener('click',ev=>{if(!window.__attendanceSeatSource)return;ev.preventDefault();ev.stopImmediatePropagation();exportSeatAttendancePdf()},true)}
    if(xls&&!xls.dataset.seatSyncExport){xls.dataset.seatSyncExport='1';xls.addEventListener('click',ev=>{if(!window.__attendanceSeatSource)return;ev.preventDefault();ev.stopImmediatePropagation();exportSeatAttendanceExcel()},true)}
  }
  async function exportSeatAttendancePdf(){
    const snap=getSnapshot();if(!snap)return msg('Generate a Seating Plan first');try{await ensurePdf();const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'}),abs=absentSet(),booklets=getBooklets();snap.rooms.forEach((r,ri)=>{if(ri)doc.addPage();doc.setTextColor(0);doc.setFont('helvetica','bold');doc.setFontSize(14);doc.text(snap.college||"ASHOKA WOMEN'S ENGINEERING COLLEGE - 2T",105,13,{align:'center'});const x=10,y=21,w=190,lw=48,rh=8;for(let n=0;n<3;n++){doc.rect(x,y+n*rh,w,rh);doc.line(x+lw,y+n*rh,x+lw,y+(n+1)*rh)}doc.setFontSize(8);doc.text('Date of Examination:',x+2,y+5.2);doc.text('Year & Semester:',x+2,y+rh+5.2);doc.text('Name of the Subject(s):',x+2,y+rh*2+5.2);doc.setFont('helvetica','normal');doc.text(fmtDate(snap.date),x+lw+2,y+5.2);doc.setFontSize(7.2);doc.text(doc.splitTextToSize(snap.yearSem||'',137),x+lw+2,y+rh+4.8);doc.text(doc.splitTextToSize(snap.subjects||'',137),x+lw+2,y+rh*2+4.8);doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text('Attendance',105,51,{align:'center'});doc.setFontSize(8.5);doc.text('Room Number',15,61);doc.rect(46,55,23,9);doc.setFont('helvetica','normal');doc.text(String(r.room||''),57.5,61,{align:'center'});const tx=10,ty=68,col=[15,52,46,77],hh=8,rowH=Math.min(7.2,150/Math.max(r.candidates.length,1));let cx=tx;doc.setFontSize(7.3);doc.setFont('helvetica','bold');['S.No','Hall Ticket No.','Booklet S.NO','Signature of the student'].forEach((h,i)=>{doc.rect(cx,ty,col[i],hh);doc.text(h,cx+col[i]/2,ty+5.1,{align:'center'});cx+=col[i]});doc.setFont('helvetica','normal');r.candidates.forEach((c,i)=>{let xx=tx,yy=ty+hh+i*rowH,vals=[String(i+1),c.hall,String(booklets[c.hall]||''),abs.has(c.hall.toUpperCase())?'ABSENT':''];vals.forEach((v,j)=>{doc.rect(xx,yy,col[j],rowH);doc.text(String(v),xx+col[j]/2,yy+Math.min(4.8,rowH-.8),{align:'center'});xx+=col[j]})});const ac=r.candidates.filter(c=>abs.has(c.hall.toUpperCase())).length,pres=r.candidates.length-ac,cy=Math.min(249,ty+hh+r.candidates.length*rowH+10);doc.setFontSize(8);doc.text(`Registered: ${r.candidates.length}     Absent: ${ac}     Present: ${pres}`,105,cy,{align:'center'});doc.text('Signature of the Invigilator(s)',10,277)});doc.save(`Attendance_From_Seating_${snap.date||'Exam'}.pdf`);msg('Attendance PDF exported from Seating Plan')}catch(err){console.error(err);msg('Could not export Attendance PDF')}}
  async function exportSeatAttendanceExcel(){
    const snap=getSnapshot();if(!snap)return msg('Generate a Seating Plan first');try{await ensureXlsx();const wb=XLSX.utils.book_new(),abs=absentSet(),booklets=getBooklets();snap.rooms.forEach((r,ri)=>{const rows=[[snap.college],['Date of Examination:',fmtDate(snap.date)],['Year & Semester:',snap.yearSem],['Name of the Subject(s):',snap.subjects],[],['Attendance'],['Room Number',r.room],[],['S.No','Hall Ticket No.','Booklet S.NO','Signature / Status']];r.candidates.forEach((c,i)=>rows.push([i+1,c.hall,booklets[c.hall]||'',abs.has(c.hall.toUpperCase())?'ABSENT':'']));const ac=r.candidates.filter(c=>abs.has(c.hall.toUpperCase())).length;rows.push([],['Registered',r.candidates.length],['Absent',ac],['Present',r.candidates.length-ac]);const ws=XLSX.utils.aoa_to_sheet(rows);ws['!cols']=[{wch:12},{wch:22},{wch:18},{wch:28}];XLSX.utils.book_append_sheet(wb,ws,safeSheet(r.room,ri))});XLSX.writeFile(wb,`Attendance_From_Seating_${snap.date||'Exam'}.xlsx`);msg('Attendance Excel exported from Seating Plan')}catch(err){console.error(err);msg('Could not export Attendance Excel')}}

  function patchAll(){styles();ensureSeatMulti();ensureAttendanceMulti();const snap=getSnapshot();if(snap&&window.__attendanceSeatSource&&document.querySelector('#attendance .attendance-paper')==null)renderAttendanceFromSnapshot(snap)}
  styles();patchAll();let tries=0;const timer=setInterval(()=>{patchAll();tries++;if(tries>=30)clearInterval(timer)},500);
  document.querySelector('[data-view="seating"]')?.addEventListener('click',()=>setTimeout(ensureSeatMulti,0));
  document.querySelector('[data-view="attendance"]')?.addEventListener('click',()=>setTimeout(()=>{ensureAttendanceMulti();if(window.__attendanceSeatSource){const s=getSnapshot();if(s)renderAttendanceFromSnapshot(s)}},0));
  window.SeatingAttendanceSync={refresh:patchAll,getSnapshot,renderAttendance:()=>{const s=getSnapshot();return s?renderAttendanceFromSnapshot(s):false},selectedSections:prefix=>selected(prefix)};
})();