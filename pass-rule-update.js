(function(){
  const PASS_TOTAL = 40;
  const PASS_EXTERNAL = 25;
  let bulkRows = [];

  function escPass(v=''){
    return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }
  function notifyPass(t){ if(typeof toast==='function') toast(t); else alert(t); }

  function gradeByRule(total, external){
    total=Number(total)||0;
    external=Number(external)||0;
    if(total < PASS_TOTAL || external < PASS_EXTERNAL) return ['F',0];
    if(total>=90)return['S',10];
    if(total>=80)return['A',9];
    if(total>=70)return['B',8];
    if(total>=60)return['C',7];
    if(total>=50)return['D',6];
    return['E',5];
  }

  // Keep this available globally for any later modules.
  window.gradeFromTotal = function(total, external){
    // When external is not supplied, preserve only the total-based grade.
    // Result processing in this file always supplies external and enforces both conditions.
    if(external === undefined || external === null){
      total=Number(total)||0;
      if(total>=90)return['S',10];
      if(total>=80)return['A',9];
      if(total>=70)return['B',8];
      if(total>=60)return['C',7];
      if(total>=50)return['D',6];
      if(total>=40)return['E',5];
      return['F',0];
    }
    return gradeByRule(total,external);
  };

  function addRuleNotice(){
    const marks=document.getElementById('marks');
    if(!marks || document.getElementById('passRuleNotice')) return;
    const toolbar=marks.querySelector('.section-toolbar');
    const notice=document.createElement('div');
    notice.id='passRuleNotice';
    notice.style.cssText='margin:-6px 0 16px;padding:11px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surface-2);font-size:13px;font-weight:800;color:var(--text)';
    notice.innerHTML='Pass Rule: <b>Total Marks ≥ 40</b> and <b>External Marks ≥ 25</b>. If either condition is not satisfied, the subject result is <b style="color:var(--danger)">FAIL (F)</b>.';
    toolbar?.after(notice);

    const gradeNote=document.querySelector('#settings .grade-note');
    if(gradeNote && !document.getElementById('externalPassRuleNote')){
      const p=document.createElement('p');p.id='externalPassRuleNote';p.style.gridColumn='1/-1';p.innerHTML='<b>Pass rule:</b> Total ≥ 40 and External ≥ 25';gradeNote.appendChild(p);
    }
  }

  window.recalcMarks = function(){
    let weighted=0,credits=0,failed=false;
    document.querySelectorAll('#marksTableBody tr[data-subject-id]').forEach(row=>{
      const iv=Number(row.querySelector('.internal-mark')?.value||0);
      const ev=Number(row.querySelector('.external-mark')?.value||0);
      const total=iv+ev;
      const [grade,gp]=gradeByRule(total,ev);
      const c=Number(row.dataset.credits)||0;
      const totalCell=row.querySelector('.total-cell'), gradeCell=row.querySelector('.grade-cell'), gpCell=row.querySelector('.gp-cell');
      if(totalCell) totalCell.textContent=total;
      if(gradeCell){gradeCell.textContent=grade;gradeCell.style.color=grade==='F'?'var(--danger)':'';gradeCell.title=grade==='F'&&ev<PASS_EXTERNAL?'External marks below 25':grade==='F'?'Total marks below 40':''}
      if(gpCell) gpCell.textContent=gp;
      weighted+=gp*c;credits+=c;if(grade==='F')failed=true;
    });
    let sgpa=credits?weighted/credits:0;
    if(state.settings?.failSgpaZero&&failed)sgpa=0;
    const sg=document.getElementById('sgpaValue'),rs=document.getElementById('resultValue'),cr=document.getElementById('creditsValue');
    if(sg)sg.textContent=credits?sgpa.toFixed(2):'—';
    if(rs){rs.textContent=credits?(failed?'FAIL':'PASS'):'—';rs.style.color=failed?'var(--danger)':'var(--success)'}
    if(cr)cr.textContent=credits||'—';
  };

  function installManualSaveRule(){
    const btn=document.getElementById('saveMarksBtn');if(!btn||btn.dataset.passRuleInstalled)return;
    btn.dataset.passRuleInstalled='true';
    btn.addEventListener('click',function(e){
      e.preventDefault();e.stopImmediatePropagation();
      const studentId=Number(document.getElementById('marksStudentSelect')?.value);
      if(!studentId){notifyPass('Select and load a student first');return}
      const marks={};let weighted=0,credits=0,failed=false;
      document.querySelectorAll('#marksTableBody tr[data-subject-id]').forEach(row=>{
        const subjectId=Number(row.dataset.subjectId),c=Number(row.dataset.credits)||0;
        const internal=Number(row.querySelector('.internal-mark')?.value||0),external=Number(row.querySelector('.external-mark')?.value||0);
        const total=internal+external,[grade,gp]=gradeByRule(total,external);
        marks[subjectId]={internal,external,total,grade,gp,pass:grade!=='F'};
        weighted+=gp*c;credits+=c;if(grade==='F')failed=true;
      });
      if(!credits){notifyPass('No subjects to save');return}
      let sgpa=weighted/credits;if(state.settings?.failSgpaZero&&failed)sgpa=0;
      state.results[studentId]={studentId,semester:document.getElementById('marksSemesterSelect')?.value||'',marks,sgpa:Number(sgpa.toFixed(2)),result:failed?'FAIL':'PASS',credits,updatedAt:new Date().toISOString(),passRule:{total:PASS_TOTAL,external:PASS_EXTERNAL}};
      saveData();if(typeof renderDashboard==='function')renderDashboard();window.recalcMarks();notifyPass('Result saved with Total ≥ 40 and External ≥ 25 pass rule');
    },true);
  }

  function recalculateSavedResults(){
    let changed=0;
    Object.values(state.results||{}).forEach(result=>{
      const marks=result.marks||{};let weighted=0,credits=0,failed=false;
      Object.entries(marks).forEach(([subjectId,m])=>{
        const subject=(state.subjects||[]).find(s=>Number(s.id)===Number(subjectId));
        if(!subject)return;
        const internal=Number(m.internal)||0,external=Number(m.external)||0,total=internal+external,[grade,gp]=gradeByRule(total,external),c=Number(subject.credits)||0;
        m.internal=internal;m.external=external;m.total=total;m.grade=grade;m.gp=gp;m.pass=grade!=='F';
        weighted+=gp*c;credits+=c;if(grade==='F')failed=true;
      });
      if(credits){let sgpa=weighted/credits;if(state.settings?.failSgpaZero&&failed)sgpa=0;const nextResult=failed?'FAIL':'PASS';if(result.result!==nextResult||Number(result.sgpa)!==Number(sgpa.toFixed(2)))changed++;result.result=nextResult;result.sgpa=Number(sgpa.toFixed(2));result.credits=credits;result.passRule={total:PASS_TOTAL,external:PASS_EXTERNAL};}
    });
    if(changed){saveData();if(typeof renderDashboard==='function')renderDashboard();}
  }

  function norm(v){return String(v??'').trim().toLowerCase().replace(/[_\-./]/g,' ').replace(/\s+/g,' ')}
  function col(row,names){const x={};Object.keys(row||{}).forEach(k=>x[norm(k)]=row[k]);for(const n of names){if(Object.prototype.hasOwnProperty.call(x,norm(n)))return x[norm(n)]}return''}
  function parseCsv(text){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(ch===','&&!quoted){row.push(cell);cell=''}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);cell='';if(row.some(v=>String(v).trim()))rows.push(row);row=[]}else cell+=ch}row.push(cell);if(row.some(v=>String(v).trim()))rows.push(row);if(!rows.length)return[];const h=rows[0].map(x=>String(x).trim());return rows.slice(1).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]??''])))}

  function parseBulkRow(row,index){
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
    const [grade,gp]=gradeByRule(total,external);
    return{index:index+1,hall,semester,code,internal,external,total,grade,gp,student,subject,errors,pass:grade!=='F'};
  }

  function renderBulkPreview(fileName){
    const valid=bulkRows.filter(r=>!r.errors.length),invalid=bulkRows.filter(r=>r.errors.length),students=new Set(valid.map(r=>r.student.id)),subjects=new Set(valid.map(r=>r.subject.id));
    const sm=document.getElementById('marksBulkSummary');if(sm){sm.hidden=false;sm.innerHTML=`<div><small>Total Rows</small><b>${bulkRows.length}</b></div><div><small>Valid</small><b>${valid.length}</b></div><div><small>Invalid</small><b>${invalid.length}</b></div><div><small>Students</small><b>${students.size}</b></div><div><small>Subjects</small><b>${subjects.size}</b></div>`}
    const wrap=document.getElementById('marksPreviewWrap');if(wrap)wrap.hidden=false;
    const body=document.getElementById('marksPreviewBody');if(body)body.innerHTML=bulkRows.slice(0,100).map(r=>`<tr><td>${r.index}</td><td><b>${escPass(r.hall)}</b></td><td>${escPass(r.student?.name||'—')}</td><td>${escPass(r.semester)}</td><td>${escPass(r.code)}${r.subject?` — ${escPass(r.subject.name)}`:''}</td><td>${Number.isFinite(r.internal)?r.internal:'—'}</td><td>${Number.isFinite(r.external)?r.external:'—'}</td><td>${r.total}</td><td style="color:${r.grade==='F'?'var(--danger)':'inherit'}">${r.grade}</td><td>${r.errors.length?`<span class="marks-invalid">${escPass(r.errors.join(', '))}</span>`:`<span class="${r.grade==='F'?'marks-update':'marks-valid'}">${r.grade==='F'?(r.external<PASS_EXTERNAL?'FAIL: External < 25':'FAIL: Total < 40'):'Ready / PASS'}</span>`}</td></tr>`).join('');
    const btn=document.getElementById('importBulkMarks');if(btn){btn.disabled=!valid.length;btn.textContent=valid.length?`Import ${valid.length} Valid Mark Row${valid.length===1?'':'s'}`:'Import Marks'}
  }

  async function handleBulkFile(file){
    if(!file)return;try{
      let rows=[],ext=file.name.split('.').pop().toLowerCase();
      if(ext==='csv')rows=parseCsv(await file.text());
      else if(['xlsx','xls'].includes(ext)){if(typeof XLSX==='undefined')throw new Error('Excel reader is not available');const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''})}
      else throw new Error('Choose CSV, XLSX or XLS file');
      if(!rows.length)throw new Error('No marks rows found');if(rows.length>10000)throw new Error('Maximum 10,000 mark rows per upload');
      bulkRows=rows.map(parseBulkRow);renderBulkPreview(file.name);
      const dz=document.getElementById('marksDropZone');dz?.querySelectorAll('.marks-file-chip').forEach(x=>x.remove());if(dz){const c=document.createElement('span');c.className='marks-file-chip';c.textContent=`Selected: ${file.name}`;dz.appendChild(c)}
    }catch(err){notifyPass(err.message||'Could not read marks file')}
  }

  function importBulk(){
    const valid=bulkRows.filter(r=>!r.errors.length);if(!valid.length){notifyPass('No valid marks to import');return}
    const groups=new Map();valid.forEach(r=>{const key=`${r.student.id}|${r.semester}`;if(!groups.has(key))groups.set(key,{student:r.student,semester:r.semester,rows:[]});groups.get(key).rows.push(r)});
    let saved=0;
    groups.forEach(g=>{
      const semesterSubjects=(state.subjects||[]).filter(s=>s.branch===g.student.branch&&s.semester===g.semester);
      const previous=state.results[g.student.id];let marks=previous&&previous.semester===g.semester?{...(previous.marks||{})}:{};
      g.rows.forEach(r=>{marks[r.subject.id]={internal:r.internal,external:r.external,total:r.total,grade:r.grade,gp:r.gp,pass:r.pass}});
      let weighted=0,credits=0,failed=false;
      semesterSubjects.forEach(s=>{const m=marks[s.id];if(!m)return;const internal=Number(m.internal)||0,external=Number(m.external)||0,total=internal+external,[grade,gp]=gradeByRule(total,external),c=Number(s.credits)||0;m.total=total;m.grade=grade;m.gp=gp;m.pass=grade!=='F';weighted+=gp*c;credits+=c;if(grade==='F')failed=true});
      if(!credits)return;
      let sgpa=weighted/credits;if(state.settings?.failSgpaZero&&failed)sgpa=0;
      state.results[g.student.id]={studentId:g.student.id,semester:g.semester,marks,sgpa:Number(sgpa.toFixed(2)),result:failed?'FAIL':'PASS',credits,updatedAt:new Date().toISOString(),source:'bulk-upload',passRule:{total:PASS_TOTAL,external:PASS_EXTERNAL}};saved++;
    });
    saveData();if(typeof renderDashboard==='function')renderDashboard();document.getElementById('bulkMarksBackdrop').hidden=true;bulkRows=[];notifyPass(`Bulk marks imported for ${saved} student result${saved===1?'':'s'} using Total ≥ 40 and External ≥ 25 rule`);
  }

  function replaceBulkListeners(){
    const input=document.getElementById('marksBulkFile'),dz=document.getElementById('marksDropZone'),importBtn=document.getElementById('importBulkMarks');
    if(input&&!input.dataset.passRuleInstalled){const clone=input.cloneNode(true);clone.dataset.passRuleInstalled='true';input.replaceWith(clone);clone.addEventListener('change',()=>handleBulkFile(clone.files?.[0]));}
    if(dz&&!dz.dataset.passRuleInstalled){dz.dataset.passRuleInstalled='true';dz.addEventListener('drop',e=>{e.preventDefault();e.stopImmediatePropagation();dz.classList.remove('dragover');handleBulkFile(e.dataTransfer.files?.[0])},true);}
    if(importBtn&&!importBtn.dataset.passRuleInstalled){importBtn.dataset.passRuleInstalled='true';importBtn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();importBulk()},true);}
    const guide=document.querySelector('#bulkMarksBackdrop .marks-upload-guide p');if(guide)guide.textContent='Hall Ticket, Semester, Subject Code, Internal, External — Pass requires Total ≥ 40 and External ≥ 25';
  }

  function init(){addRuleNotice();installManualSaveRule();recalculateSavedResults();replaceBulkListeners();
    const observer=new MutationObserver(()=>{addRuleNotice();installManualSaveRule();replaceBulkListeners()});observer.observe(document.body,{childList:true,subtree:true});
  }
  init();
})();