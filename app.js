const STORAGE_KEY = "campusExamData_v1";

const seedData = {
  students: [
    {id:1, hall:"232T1A0101", name:"APPECHARLA NANDINI", branch:"CIVIL", year:"III", sem:"II", regulation:"R23", status:"Active"},
    {id:2, hall:"232T1A0507", name:"AKSHAYA REDDY", branch:"CSE", year:"III", sem:"II", regulation:"R23", status:"Active"},
    {id:3, hall:"232T1A0412", name:"KIRAN KUMAR", branch:"ECE", year:"III", sem:"II", regulation:"R23", status:"Active"},
    {id:4, hall:"232T1A0215", name:"SNEHA", branch:"EEE", year:"III", sem:"II", regulation:"R23", status:"Active"},
    {id:5, hall:"232T1A0318", name:"VISHNU VARDHAN", branch:"MECH", year:"III", sem:"II", regulation:"R23", status:"Active"}
  ],
  subjects: [
    {id:1, code:"23CE601", name:"Design of Reinforced Concrete Structures", branch:"CIVIL", semester:"III-II", credits:3, internal:30, external:70},
    {id:2, code:"23CE602", name:"Geotechnical Engineering", branch:"CIVIL", semester:"III-II", credits:3, internal:30, external:70},
    {id:3, code:"23CS601", name:"Artificial Intelligence", branch:"CSE", semester:"III-II", credits:3, internal:30, external:70},
    {id:4, code:"23CS602", name:"Web Technologies", branch:"CSE", semester:"III-II", credits:3, internal:30, external:70},
    {id:5, code:"23EC601", name:"Digital Signal Processing", branch:"ECE", semester:"III-II", credits:3, internal:30, external:70},
    {id:6, code:"23EE601", name:"Power Systems-II", branch:"EEE", semester:"III-II", credits:3, internal:30, external:70},
    {id:7, code:"23ME601", name:"Heat Transfer", branch:"MECH", semester:"III-II", credits:3, internal:30, external:70}
  ],
  exams: [
    {id:1, name:"B.Tech III-II Regular Examinations", type:"Regular", branch:"ALL", semester:"III-II", date:"2026-09-14", session:"FN 10:00 AM", status:"Scheduled"},
    {id:2, name:"B.Tech III-II Supplementary Examinations", type:"Supplementary", branch:"ALL", semester:"III-II", date:"2026-10-05", session:"AN 2:00 PM", status:"Draft"}
  ],
  results: {},
  settings: {
    collegeName:"ABC College of Engineering",
    academicYear:"2026-27",
    defaultRegulation:"R23",
    failSgpaZero:true
  }
};

let state = loadData();
let modalMode = null;
let currentReport = [];

function loadData(){
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(seedData);
  } catch {
    return structuredClone(seedData);
  }
}
function saveData(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function esc(v=""){
  return String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function toast(msg){
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>el.classList.remove("show"), 2200);
}
function nextId(items){ return Math.max(0,...items.map(x=>Number(x.id)||0))+1; }
function formatDate(v){
  if(!v) return "—";
  const d = new Date(v+"T00:00:00");
  return d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
}
function badge(text){
  const c = /active|published|pass|scheduled/i.test(text) ? "green" : /fail|cancel/i.test(text) ? "red" : "orange";
  return `<span class="badge ${c}">${esc(text)}</span>`;
}

function navigate(view){
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===view));
  document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  const button = document.querySelector(`.nav-link[data-view="${view}"]`);
  document.getElementById("pageTitle").textContent = button ? button.textContent.trim() : "Dashboard";
  document.getElementById("sidebar").classList.remove("open");
  if(view==="dashboard") renderDashboard();
  if(view==="students") renderStudents();
  if(view==="subjects") renderSubjects();
  if(view==="exams") renderExams();
  if(view==="marks") populateStudentSelects();
  if(view==="halltickets") populateHallSelects();
  if(view==="settings") loadSettings();
}
document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
document.querySelectorAll("[data-jump]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.jump)));

document.getElementById("menuBtn").addEventListener("click",()=>document.getElementById("sidebar").classList.toggle("open"));
document.getElementById("themeBtn").addEventListener("click",()=>{
  document.body.classList.toggle("dark");
  localStorage.setItem("campusExamTheme", document.body.classList.contains("dark")?"dark":"light");
});
if(localStorage.getItem("campusExamTheme")==="dark") document.body.classList.add("dark");

function renderDashboard(){
  const results = Object.values(state.results);
  const passed = results.filter(r=>r.result==="PASS").length;
  const failed = results.filter(r=>r.result==="FAIL").length;
  const stats = [
    ["♙",state.students.length,"Students"],
    ["▤",state.subjects.length,"Subjects"],
    ["◫",state.exams.length,"Examinations"],
    ["✓",results.length,"Results Processed"]
  ];
  document.getElementById("statsGrid").innerHTML = stats.map(s=>`
    <div class="stat-card"><div class="stat-top"><span class="stat-icon">${s[0]}</span>${badge("Live")}</div><h3>${s[1]}</h3><p>${s[2]}</p></div>
  `).join("");

  document.getElementById("upcomingExamList").innerHTML = state.exams.slice(0,4).map(e=>`
    <div class="stack-item">
      <div><strong>${esc(e.name)}</strong><small>${formatDate(e.date)} · ${esc(e.session)}</small></div>${badge(e.status)}
    </div>`).join("") || `<div class="empty-state">No examinations scheduled.</div>`;

  const total = Math.max(results.length,1);
  const overview = [
    ["Processed",results.length, Math.min(100,results.length*20)],
    ["Passed",passed, Math.round((passed/total)*100)],
    ["Failed",failed, Math.round((failed/total)*100)]
  ];
  document.getElementById("resultOverview").innerHTML = overview.map(([label,count,pct])=>`
    <div><div class="progress-label"><span>${label}</span><b>${count}</b></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div></div>
  `).join("");
}

/* STUDENTS */
function renderStudents(){
  const q = document.getElementById("studentSearch").value.trim().toLowerCase();
  const branch = document.getElementById("branchFilter").value;
  const items = state.students.filter(s=>(!q || `${s.hall} ${s.name}`.toLowerCase().includes(q)) && (!branch || s.branch===branch));
  document.getElementById("studentTableBody").innerHTML = items.map(s=>`
    <tr>
      <td><b>${esc(s.hall)}</b></td><td>${esc(s.name)}</td><td>${esc(s.branch)}</td><td>${esc(s.year)}</td><td>${esc(s.sem)}</td>
      <td>${esc(s.regulation)}</td><td>${badge(s.status)}</td>
      <td><button class="table-action" onclick="editStudent(${s.id})">Edit</button> <button class="table-action danger" onclick="deleteStudent(${s.id})">Delete</button></td>
    </tr>`).join("") || `<tr><td colspan="8" class="empty-state">No students found.</td></tr>`;
}
document.getElementById("studentSearch").addEventListener("input",renderStudents);
document.getElementById("branchFilter").addEventListener("change",renderStudents);
document.getElementById("addStudentBtn").addEventListener("click",()=>openStudentModal());
window.editStudent = id => openStudentModal(state.students.find(x=>x.id===id));
window.deleteStudent = id => {
  if(confirm("Delete this student record?")){
    state.students = state.students.filter(x=>x.id!==id); delete state.results[id]; saveData(); renderStudents(); toast("Student deleted");
  }
};

function openStudentModal(s=null){
  modalMode = {type:"student", id:s?.id || null};
  openModal(s ? "Edit Student" : "Add Student", `
    <div class="form-grid">
      <label>Hall Ticket No<input class="input" name="hall" required value="${esc(s?.hall||"")}"></label>
      <label>Student Name<input class="input" name="name" required value="${esc(s?.name||"")}"></label>
      <label>Branch<select class="input" name="branch">${["CIVIL","CSE","ECE","EEE","MECH"].map(x=>`<option ${s?.branch===x?"selected":""}>${x}</option>`).join("")}</select></label>
      <label>Year<select class="input" name="year">${["I","II","III","IV"].map(x=>`<option ${s?.year===x?"selected":""}>${x}</option>`).join("")}</select></label>
      <label>Semester<select class="input" name="sem">${["I","II"].map(x=>`<option ${s?.sem===x?"selected":""}>${x}</option>`).join("")}</select></label>
      <label>Regulation<input class="input" name="regulation" value="${esc(s?.regulation||state.settings.defaultRegulation)}"></label>
      <label>Status<select class="input" name="status">${["Active","Detained","Completed"].map(x=>`<option ${s?.status===x?"selected":""}>${x}</option>`).join("")}</select></label>
    </div>`);
}

/* SUBJECTS */
function renderSubjects(){
  document.getElementById("subjectTableBody").innerHTML = state.subjects.map(s=>`
    <tr><td><b>${esc(s.code)}</b></td><td>${esc(s.name)}</td><td>${esc(s.branch)}</td><td>${esc(s.semester)}</td><td>${s.credits}</td><td>${s.internal}</td><td>${s.external}</td>
    <td><button class="table-action" onclick="editSubject(${s.id})">Edit</button> <button class="table-action danger" onclick="deleteSubject(${s.id})">Delete</button></td></tr>
  `).join("") || `<tr><td colspan="8" class="empty-state">No subjects configured.</td></tr>`;
}
document.getElementById("addSubjectBtn").addEventListener("click",()=>openSubjectModal());
window.editSubject=id=>openSubjectModal(state.subjects.find(x=>x.id===id));
window.deleteSubject=id=>{
  if(confirm("Delete this subject?")){state.subjects=state.subjects.filter(x=>x.id!==id);saveData();renderSubjects();toast("Subject deleted")}
};
function openSubjectModal(s=null){
  modalMode={type:"subject",id:s?.id||null};
  openModal(s?"Edit Subject":"Add Subject",`
    <div class="form-grid">
      <label>Subject Code<input class="input" name="code" required value="${esc(s?.code||"")}"></label>
      <label>Subject Name<input class="input" name="name" required value="${esc(s?.name||"")}"></label>
      <label>Branch<select class="input" name="branch">${["CIVIL","CSE","ECE","EEE","MECH"].map(x=>`<option ${s?.branch===x?"selected":""}>${x}</option>`).join("")}</select></label>
      <label>Semester<input class="input" name="semester" value="${esc(s?.semester||"III-II")}"></label>
      <label>Credits<input class="input" type="number" min="1" max="10" name="credits" value="${s?.credits||3}"></label>
      <label>Internal Marks<input class="input" type="number" name="internal" value="${s?.internal||30}"></label>
      <label>External Marks<input class="input" type="number" name="external" value="${s?.external||70}"></label>
    </div>`);
}

/* EXAMS */
function renderExams(){
  document.getElementById("examTableBody").innerHTML = state.exams.map(e=>`
    <tr><td><b>${esc(e.name)}</b></td><td>${esc(e.type)}</td><td>${esc(e.branch)}</td><td>${esc(e.semester)}</td><td>${formatDate(e.date)}</td><td>${esc(e.session)}</td><td>${badge(e.status)}</td>
    <td><button class="table-action" onclick="editExam(${e.id})">Edit</button> <button class="table-action danger" onclick="deleteExam(${e.id})">Delete</button></td></tr>
  `).join("") || `<tr><td colspan="8" class="empty-state">No examinations created.</td></tr>`;
}
document.getElementById("addExamBtn").addEventListener("click",()=>openExamModal());
window.editExam=id=>openExamModal(state.exams.find(x=>x.id===id));
window.deleteExam=id=>{
  if(confirm("Delete this examination?")){state.exams=state.exams.filter(x=>x.id!==id);saveData();renderExams();toast("Examination deleted")}
};
function openExamModal(e=null){
  modalMode={type:"exam",id:e?.id||null};
  openModal(e?"Edit Examination":"Create Examination",`
    <div class="form-grid">
      <label>Examination Name<input class="input" name="name" required value="${esc(e?.name||"")}"></label>
      <label>Type<select class="input" name="type">${["Regular","Supplementary","Mid-I","Mid-II","Lab"].map(x=>`<option ${e?.type===x?"selected":""}>${x}</option>`).join("")}</select></label>
      <label>Branch<select class="input" name="branch">${["ALL","CIVIL","CSE","ECE","EEE","MECH"].map(x=>`<option ${e?.branch===x?"selected":""}>${x}</option>`).join("")}</select></label>
      <label>Semester<input class="input" name="semester" value="${esc(e?.semester||"III-II")}"></label>
      <label>Date<input class="input" type="date" name="date" required value="${esc(e?.date||"")}"></label>
      <label>Session<input class="input" name="session" value="${esc(e?.session||"FN 10:00 AM")}"></label>
      <label>Status<select class="input" name="status">${["Draft","Scheduled","Published","Completed"].map(x=>`<option ${e?.status===x?"selected":""}>${x}</option>`).join("")}</select></label>
    </div>`);
}

/* MODAL */
function openModal(title, body){
  document.getElementById("modalTitle").textContent=title;
  document.getElementById("modalBody").innerHTML=body;
  document.getElementById("modalBackdrop").hidden=false;
}
function closeModal(){document.getElementById("modalBackdrop").hidden=true;modalMode=null}
document.getElementById("closeModalBtn").addEventListener("click",closeModal);
document.getElementById("cancelModalBtn").addEventListener("click",closeModal);
document.getElementById("modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")closeModal()});
document.getElementById("modalForm").addEventListener("submit",e=>{
  e.preventDefault();
  const fd=Object.fromEntries(new FormData(e.currentTarget).entries());
  if(modalMode.type==="student"){
    const record={id:modalMode.id||nextId(state.students),...fd};
    const duplicate=state.students.find(x=>x.hall.toLowerCase()===fd.hall.toLowerCase() && x.id!==record.id);
    if(duplicate){toast("Hall ticket number already exists");return}
    if(modalMode.id) state.students=state.students.map(x=>x.id===record.id?record:x); else state.students.push(record);
    renderStudents();
  }
  if(modalMode.type==="subject"){
    const record={id:modalMode.id||nextId(state.subjects),...fd,credits:Number(fd.credits),internal:Number(fd.internal),external:Number(fd.external)};
    if(modalMode.id) state.subjects=state.subjects.map(x=>x.id===record.id?record:x); else state.subjects.push(record);
    renderSubjects();
  }
  if(modalMode.type==="exam"){
    const record={id:modalMode.id||nextId(state.exams),...fd};
    if(modalMode.id) state.exams=state.exams.map(x=>x.id===record.id?record:x); else state.exams.push(record);
    renderExams();
  }
  saveData(); closeModal(); toast("Saved successfully"); populateStudentSelects(); populateHallSelects();
});

/* MARKS */
function populateStudentSelects(){
  const sel=document.getElementById("marksStudentSelect");
  sel.innerHTML=`<option value="">Select student</option>`+state.students.map(s=>`<option value="${s.id}">${esc(s.hall)} — ${esc(s.name)}</option>`).join("");
}
function gradeFromTotal(total){
  if(total>=90)return["S",10];
  if(total>=80)return["A",9];
  if(total>=70)return["B",8];
  if(total>=60)return["C",7];
  if(total>=50)return["D",6];
  if(total>=40)return["E",5];
  return["F",0];
}
document.getElementById("loadMarksBtn").addEventListener("click",loadMarks);
function loadMarks(){
  const studentId=Number(document.getElementById("marksStudentSelect").value);
  const semester=document.getElementById("marksSemesterSelect").value;
  const student=state.students.find(s=>s.id===studentId);
  if(!student){toast("Select a student");return}
  const subjects=state.subjects.filter(s=>s.branch===student.branch && s.semester===semester);
  document.getElementById("marksStudentTitle").textContent=`${student.hall} — ${student.name}`;
  document.getElementById("marksStudentMeta").textContent=`${student.branch} · ${semester} · ${student.regulation}`;
  const previous=state.results[studentId]?.marks||{};
  document.getElementById("marksTableBody").innerHTML=subjects.map(s=>{
    const p=previous[s.id]||{};
    return `<tr data-subject-id="${s.id}" data-credits="${s.credits}">
      <td><b>${esc(s.code)}</b></td><td>${esc(s.name)}</td><td>${s.credits}</td>
      <td><input class="input mark-input internal-mark" type="number" min="0" max="${s.internal}" value="${p.internal??""}"></td>
      <td><input class="input mark-input external-mark" type="number" min="0" max="${s.external}" value="${p.external??""}"></td>
      <td class="total-cell">${p.total??"—"}</td><td class="grade-cell">${p.grade??"—"}</td><td class="gp-cell">${p.gp??"—"}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="8" class="empty-state">No subjects found for ${student.branch} / ${semester}.</td></tr>`;
  document.querySelectorAll(".mark-input").forEach(i=>i.addEventListener("input",recalcMarks));
  recalcMarks();
}
function recalcMarks(){
  let weighted=0, credits=0, failed=false;
  document.querySelectorAll("#marksTableBody tr[data-subject-id]").forEach(row=>{
    const iv=Number(row.querySelector(".internal-mark").value||0);
    const ev=Number(row.querySelector(".external-mark").value||0);
    const total=iv+ev; const [grade,gp]=gradeFromTotal(total); const c=Number(row.dataset.credits);
    row.querySelector(".total-cell").textContent=total;
    row.querySelector(".grade-cell").textContent=grade;
    row.querySelector(".gp-cell").textContent=gp;
    weighted+=gp*c; credits+=c; if(grade==="F")failed=true;
  });
  let sgpa=credits?weighted/credits:0;
  if(state.settings.failSgpaZero && failed) sgpa=0;
  document.getElementById("sgpaValue").textContent=credits?sgpa.toFixed(2):"—";
  document.getElementById("resultValue").textContent=credits?(failed?"FAIL":"PASS"):"—";
  document.getElementById("creditsValue").textContent=credits||"—";
}
document.getElementById("saveMarksBtn").addEventListener("click",()=>{
  const studentId=Number(document.getElementById("marksStudentSelect").value);
  if(!studentId){toast("Select and load a student first");return}
  const marks={}; let weighted=0,credits=0,failed=false;
  document.querySelectorAll("#marksTableBody tr[data-subject-id]").forEach(row=>{
    const subjectId=Number(row.dataset.subjectId), c=Number(row.dataset.credits);
    const internal=Number(row.querySelector(".internal-mark").value||0), external=Number(row.querySelector(".external-mark").value||0);
    const total=internal+external,[grade,gp]=gradeFromTotal(total);
    marks[subjectId]={internal,external,total,grade,gp};
    weighted+=gp*c;credits+=c;if(grade==="F")failed=true;
  });
  if(!credits){toast("No subjects to save");return}
  let sgpa=weighted/credits;if(state.settings.failSgpaZero&&failed)sgpa=0;
  state.results[studentId]={studentId,semester:document.getElementById("marksSemesterSelect").value,marks,sgpa:Number(sgpa.toFixed(2)),result:failed?"FAIL":"PASS",credits,updatedAt:new Date().toISOString()};
  saveData(); renderDashboard(); toast("Result saved");
});

/* HALL TICKET */
function populateHallSelects(){
  document.getElementById("hallStudentSelect").innerHTML=`<option value="">Select student</option>`+state.students.map(s=>`<option value="${s.id}">${esc(s.hall)} — ${esc(s.name)}</option>`).join("");
  document.getElementById("hallExamSelect").innerHTML=`<option value="">Select examination</option>`+state.exams.map(e=>`<option value="${e.id}">${esc(e.name)}</option>`).join("");
}
document.getElementById("generateHallBtn").addEventListener("click",()=>{
  const student=state.students.find(s=>s.id===Number(document.getElementById("hallStudentSelect").value));
  const exam=state.exams.find(e=>e.id===Number(document.getElementById("hallExamSelect").value));
  if(!student||!exam){toast("Select student and examination");return}
  const semester=exam.semester;
  const subjects=state.subjects.filter(s=>s.branch===student.branch && s.semester===semester);
  const centre=document.getElementById("examCentre").value;
  document.querySelector("#hallTicketPreview .ticket-head h3").textContent=state.settings.collegeName.toUpperCase();
  document.getElementById("ticketBody").innerHTML=`
    <div class="ticket-grid">
      <div class="ticket-row"><small>Hall Ticket No.</small><b>${esc(student.hall)}</b></div>
      <div class="ticket-row"><small>Student Name</small><b>${esc(student.name)}</b></div>
      <div class="ticket-row"><small>Branch</small><b>${esc(student.branch)}</b></div>
      <div class="ticket-row"><small>Semester</small><b>${esc(semester)}</b></div>
      <div class="ticket-row"><small>Examination</small><b>${esc(exam.name)}</b></div>
      <div class="ticket-row"><small>Exam Centre</small><b>${esc(centre)}</b></div>
    </div>
    <div class="ticket-subjects">
      <table><thead><tr><th>Code</th><th>Subject</th></tr></thead><tbody>
      ${subjects.map(s=>`<tr><td>${esc(s.code)}</td><td>${esc(s.name)}</td></tr>`).join("")||`<tr><td colspan="2">No subjects configured.</td></tr>`}
      </tbody></table>
    </div>
    <p class="muted" style="margin-top:18px">Examination Date: ${formatDate(exam.date)} · ${esc(exam.session)}</p>
  `;
});
document.getElementById("printHallBtn").addEventListener("click",()=>window.print());

/* REPORTS */
document.querySelectorAll("[data-report]").forEach(b=>b.addEventListener("click",()=>renderReport(b.dataset.report)));
function renderReport(type){
  let title="",headers=[],rows=[];
  if(type==="students"){
    title="Student List";headers=["Hall Ticket","Name","Branch","Year","Semester","Regulation","Status"];
    rows=state.students.map(s=>[s.hall,s.name,s.branch,s.year,s.sem,s.regulation,s.status]);
  } else if(type==="results"){
    title="Result Report";headers=["Hall Ticket","Name","Branch","Semester","SGPA","Result"];
    rows=Object.values(state.results).map(r=>{const s=state.students.find(x=>x.id===r.studentId);return[s?.hall||"",s?.name||"",s?.branch||"",r.semester,r.sgpa,r.result]});
  } else if(type==="exams"){
    title="Examination Schedule";headers=["Exam","Type","Branch","Semester","Date","Session","Status"];
    rows=state.exams.map(e=>[e.name,e.type,e.branch,e.semester,formatDate(e.date),e.session,e.status]);
  } else if(type==="backlogs"){
    title="Backlog List";headers=["Hall Ticket","Name","Branch","Semester","Failed Subjects"];
    rows=Object.values(state.results).filter(r=>r.result==="FAIL").map(r=>{
      const s=state.students.find(x=>x.id===r.studentId);
      const failed=Object.entries(r.marks).filter(([,m])=>m.grade==="F").map(([id])=>state.subjects.find(x=>x.id===Number(id))?.code).filter(Boolean).join(", ");
      return[s?.hall||"",s?.name||"",s?.branch||"",r.semester,failed];
    });
  }
  currentReport=[headers,...rows];
  document.getElementById("reportTitle").textContent=title;
  document.getElementById("reportPreview").innerHTML=`
    <table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("")||`<tr><td colspan="${headers.length}" class="empty-state">No data available.</td></tr>`}</tbody></table>`;
}
function downloadCSV(filename, rows){
  const csv=rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}
document.getElementById("exportStudentsBtn").addEventListener("click",()=>{
  downloadCSV("students.csv",[["Hall Ticket","Name","Branch","Year","Semester","Regulation","Status"],...state.students.map(s=>[s.hall,s.name,s.branch,s.year,s.sem,s.regulation,s.status])]);
});
document.getElementById("exportReportBtn").addEventListener("click",()=>{
  if(!currentReport.length){toast("Choose a report first");return} downloadCSV("exam-report.csv",currentReport);
});

/* SETTINGS */
function loadSettings(){
  document.getElementById("collegeName").value=state.settings.collegeName;
  document.getElementById("academicYear").value=state.settings.academicYear;
  document.getElementById("defaultRegulation").value=state.settings.defaultRegulation;
  document.getElementById("failSgpaZero").checked=!!state.settings.failSgpaZero;
}
document.getElementById("saveSettingsBtn").addEventListener("click",()=>{
  state.settings={
    collegeName:document.getElementById("collegeName").value,
    academicYear:document.getElementById("academicYear").value,
    defaultRegulation:document.getElementById("defaultRegulation").value,
    failSgpaZero:document.getElementById("failSgpaZero").checked
  };
  saveData();toast("Settings saved");
});

document.getElementById("resetDemoBtn").addEventListener("click",()=>{
  if(confirm("Reset all locally stored demo data?")){
    state=structuredClone(seedData);saveData();renderAll();toast("Demo data reset");
  }
});

function renderAll(){
  renderDashboard();renderStudents();renderSubjects();renderExams();populateStudentSelects();populateHallSelects();loadSettings();
}
renderAll();
