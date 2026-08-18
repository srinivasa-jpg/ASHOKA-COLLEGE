(function(){
  const ROLE_KEY='campusExamRole_v1';
  const PERM_KEY='campusExamPermissions_v3';
  const MODULES=[
    {key:'dashboard',label:'Dashboard',actions:['view']},
    {key:'studentportal',label:'Student Dashboard',actions:['view']},
    {key:'faculty',label:'Faculty',actions:['view','add','update','delete','bulk']},
    {key:'students',label:'Students',actions:['view','add','update','delete','bulk']},
    {key:'branches',label:'Branches',actions:['view','add','update','delete']},
    {key:'semesters',label:'Semesters',actions:['view','add','update','delete']},
    {key:'subjects',label:'Subjects',actions:['view','add','update','delete','bulk']},
    {key:'examsection',label:'Examination Section',actions:['view']},
    {key:'exams',label:'Examinations',actions:['view','add','update','delete']},
    {key:'halltickets',label:'Hall Tickets',actions:['view','bulk']},
    {key:'seating',label:'Seating Plan',actions:['view','bulk']},
    {key:'attendance',label:'Exam Attendance',actions:['view','bulk']},
    {key:'classattendance',label:'Class Attendance',actions:['view','update']},
    {key:'marks',label:'Marks & Results',actions:['view','update','bulk']},
    {key:'reports',label:'Reports',actions:['view','bulk']},
    {key:'settings',label:'Settings',actions:['view','update']},
    {key:'roles',label:'Roles & Permissions',actions:['view','update']}
  ];
  const ROLES={
    admin:{label:'Admin',desc:'Full system access'},
    exam:{label:'Exam Section',desc:'Examination operations and reports'},
    faculty:{label:'Faculty',desc:'Student, subject, attendance and marks access'},
    student:{label:'Students',desc:'Student dashboard, attendance, results, fee due and active hall ticket'}
  };
  const DEFAULTS={
    admin:{},
    exam:{dashboard:{view:true},faculty:{view:true},students:{view:true},subjects:{view:true},examsection:{view:true},exams:{view:true,add:true,update:true,delete:true},halltickets:{view:true,bulk:true},seating:{view:true,bulk:true},attendance:{view:true,bulk:true},marks:{view:true,update:true,bulk:true},reports:{view:true,bulk:true}},
    faculty:{dashboard:{view:true},students:{view:true},subjects:{view:true},classattendance:{view:true,update:true},marks:{view:true,update:true}},
    student:{studentportal:{view:true},classattendance:{view:true}}
  };
  MODULES.forEach(m=>{DEFAULTS.admin[m.key]={};m.actions.forEach(a=>DEFAULTS.admin[m.key][a]=true)});
  let currentRole=localStorage.getItem(ROLE_KEY)||'admin';if(!ROLES[currentRole])currentRole='admin';
  let editingRole='exam';
  function e(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function msg(t){if(typeof toast==='function')toast(t);else alert(t)}
  function clone(x){return JSON.parse(JSON.stringify(x))}
  function loadPermissions(){let stored={};try{stored=JSON.parse(localStorage.getItem(PERM_KEY)||'{}')||{}}catch{}const out=clone(DEFAULTS);['exam','faculty','student'].forEach(role=>{const src=stored[role]||{};MODULES.forEach(m=>{if(!out[role][m.key])out[role][m.key]={};m.actions.forEach(a=>{if(typeof src?.[m.key]?.[a]==='boolean')out[role][m.key][a]=src[m.key][a]})})});return out}
  let permissions=loadPermissions();
  function savePermissions(){localStorage.setItem(PERM_KEY,JSON.stringify(permissions))}
  function can(module,action='view',role=currentRole){if(role==='admin')return true;return !!permissions?.[role]?.[module]?.[action]}
  function ensureViewIfAction(role,module){if(role==='admin')return;const p=permissions[role][module]||{};if(Object.entries(p).some(([a,v])=>a!=='view'&&v))p.view=true}

  function styles(){if(document.getElementById('role-module-styles'))return;const s=document.createElement('style');s.id='role-module-styles';s.textContent=`
    .role-chip{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:5px 9px;background:var(--surface-2);border:1px solid var(--line);font-size:12px;font-weight:800}.roles-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}.role-card{border:1px solid var(--line);background:var(--surface);border-radius:16px;padding:16px;text-align:left;color:var(--text);cursor:pointer}.role-card.active{outline:2px solid var(--primary);border-color:transparent}.role-card.admin-card{cursor:default}.role-card b,.role-card small{display:block}.role-card small{color:var(--muted);margin-top:5px}.role-hidden{display:none!important}.role-readonly-note{margin:0 0 14px;padding:10px 12px;border-radius:12px;background:var(--surface-2);border:1px solid var(--line);font-size:12px;font-weight:700}.permission-editor-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}.permission-actions{display:flex;gap:8px;flex-wrap:wrap}.permission-table th,.permission-table td{text-align:center}.permission-table th:first-child,.permission-table td:first-child{text-align:left}.permission-check{width:18px;height:18px;accent-color:var(--primary)}.permission-na{color:var(--muted)}.permission-help{font-size:12px;color:var(--muted);margin-top:8px;line-height:1.5}body.student-portal-only .nav-link:not(.role-hidden){display:flex!important}body.student-portal-only #examModuleNav:not(.role-hidden){display:block!important}@media(max-width:900px){.roles-grid{grid-template-columns:1fr 1fr}}@media(max-width:600px){.roles-grid{grid-template-columns:1fr}}
  `;document.head.appendChild(s)}

  function ensureRolesView(){const content=document.querySelector('.content');if(!content||document.getElementById('roles'))return;const sec=document.createElement('section');sec.className='view';sec.id='roles';sec.innerHTML=`<div class="section-toolbar"><div><h3>Roles & Permissions</h3><p>Admin can edit module and action permissions for Exam Section, Faculty and Students.</p></div><span class="role-chip" id="roleCurrentChip"></span></div><div class="roles-grid" id="rolesGrid"></div><div class="card"><div class="permission-editor-head"><div><h3 id="permissionEditorTitle">Edit Permissions</h3><p class="muted" id="permissionEditorDesc"></p></div><div class="permission-actions"><button class="btn btn-outline" id="resetRolePermissions" type="button">Reset Default</button><button class="btn btn-primary" id="saveRolePermissions" type="button">Save Permissions</button></div></div><div class="table-wrap"><table class="permission-table"><thead><tr><th>Module</th><th>View</th><th>Add</th><th>Update</th><th>Delete</th><th>Bulk</th></tr></thead><tbody id="rolePermissionBody"></tbody></table></div><p class="permission-help">Checking Add, Update, Delete or Bulk automatically enables View. Admin permissions are permanently full-access to prevent administrator lockout. Student Dashboard is the default Student landing page.</p></div>`;content.appendChild(sec);document.getElementById('saveRolePermissions').addEventListener('click',saveEditor);document.getElementById('resetRolePermissions').addEventListener('click',resetEditor)}
  function ensureRolesNav(){const nav=document.querySelector('.nav');if(!nav||document.querySelector('[data-view="roles"]'))return;const b=document.createElement('button');b.className='nav-link';b.dataset.view='roles';b.innerHTML='<span>♜</span>Roles';const settings=document.querySelector('[data-view="settings"]');nav.insertBefore(b,settings||null);b.addEventListener('click',()=>{if(!can('roles','view'))return msg('You do not have permission to manage roles');navigate('roles');renderRoles()})}

  function roleCard(role,r){const access=MODULES.filter(m=>can(m.key,'view',role)).length;return `<button type="button" class="role-card ${role===editingRole?'active':''} ${role==='admin'?'admin-card':''}" data-edit-role="${role}"><b>${e(r.label)}</b><small>${e(r.desc)}</small><small>${access} module${access===1?'':'s'} visible${role==='admin'?' · Full access locked':''}</small></button>`}
  function renderRoles(){const grid=document.getElementById('rolesGrid');if(!grid)return;const chip=document.getElementById('roleCurrentChip');if(chip)chip.textContent=`Logged in as: ${ROLES[currentRole].label}`;grid.innerHTML=Object.entries(ROLES).map(([k,r])=>roleCard(k,r)).join('');grid.querySelectorAll('[data-edit-role]').forEach(b=>b.addEventListener('click',()=>{if(currentRole!=='admin')return;editingRole=b.dataset.editRole;renderRoles()}));renderPermissionEditor()}
  function renderPermissionEditor(){const body=document.getElementById('rolePermissionBody');if(!body)return;const role=editingRole,r=ROLES[role];document.getElementById('permissionEditorTitle').textContent=`${r.label} Permissions`;document.getElementById('permissionEditorDesc').textContent=role==='admin'?'Administrator access is full and locked.':'Select exactly what this role can view and manage.';const save=document.getElementById('saveRolePermissions'),reset=document.getElementById('resetRolePermissions');save.disabled=currentRole!=='admin'||role==='admin';reset.disabled=currentRole!=='admin'||role==='admin';const allActions=['view','add','update','delete','bulk'];body.innerHTML=MODULES.map(m=>`<tr><td><b>${e(m.label)}</b></td>${allActions.map(a=>{if(!m.actions.includes(a))return '<td class="permission-na">—</td>';const checked=can(m.key,a,role);return `<td><input class="permission-check" type="checkbox" data-perm-module="${m.key}" data-perm-action="${a}" ${checked?'checked':''} ${role==='admin'||currentRole!=='admin'?'disabled':''}></td>`}).join('')}</tr>`).join('');body.querySelectorAll('.permission-check').forEach(ch=>ch.addEventListener('change',()=>{if(ch.dataset.permAction!=='view'&&ch.checked){const v=body.querySelector(`[data-perm-module="${ch.dataset.permModule}"][data-perm-action="view"]`);if(v)v.checked=true}}))}
  function saveEditor(){if(currentRole!=='admin'||editingRole==='admin')return;MODULES.forEach(m=>{if(!permissions[editingRole][m.key])permissions[editingRole][m.key]={};m.actions.forEach(a=>{const el=document.querySelector(`[data-perm-module="${m.key}"][data-perm-action="${a}"]`);permissions[editingRole][m.key][a]=!!el?.checked});ensureViewIfAction(editingRole,m.key)});if(editingRole==='student')permissions.student.studentportal={view:true};savePermissions();applyAccess();renderRoles();msg(`${ROLES[editingRole].label} permissions saved`)}
  function resetEditor(){if(currentRole!=='admin'||editingRole==='admin')return;if(!confirm(`Reset ${ROLES[editingRole].label} permissions to default?`))return;permissions[editingRole]=clone(DEFAULTS[editingRole]);savePermissions();applyAccess();renderRoles();msg('Permissions reset to default')}

  function updateRoleProfile(){if(window.CampusSession)return;const p=document.querySelector('.sidebar-footer .profile');if(!p)return;const r=ROLES[currentRole],strong=p.querySelector('strong'),span=p.querySelector('span'),avatar=p.querySelector('.avatar');if(strong)strong.textContent=r.label;if(span)span.textContent=r.desc;if(avatar)avatar.textContent=r.label.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()}
  function applyActionControls(){
    const toggle=(id,ok)=>{const x=document.getElementById(id);if(x)x.classList.toggle('role-hidden',!ok)};
    toggle('addStudentBtn',can('students','add'));toggle('bulkStudentBtn',can('students','bulk'));toggle('downloadStudentTemplateBtn',can('students','bulk'));
    toggle('facultyAddBtn',can('faculty','add'));toggle('facultyBulkBtn',can('faculty','bulk'));toggle('facultyTemplateBtn',can('faculty','bulk'));
    toggle('addSubjectBtn',can('subjects','add'));toggle('addExamBtn',can('exams','add'));toggle('bulkMarksBtn',can('marks','bulk'));toggle('downloadMarksTemplateBtn',can('marks','bulk'));
    const saveMarks=document.getElementById('saveMarksBtn');if(saveMarks)saveMarks.disabled=!can('marks','update');document.querySelectorAll('#marks input.mark-input').forEach(x=>x.disabled=!can('marks','update'));
    const generateHall=document.getElementById('generateHallBtn');if(generateHall)generateHall.disabled=!can('halltickets','bulk');
    const saveSettings=document.getElementById('saveSettingsBtn');if(saveSettings)saveSettings.disabled=!can('settings','update');
    const reset=document.getElementById('resetDemoBtn');if(reset)reset.classList.toggle('role-hidden',currentRole!=='admin');
    if(typeof window.refreshStudentAdminControls==='function')window.refreshStudentAdminControls();
    if(typeof window.refreshFacultyPermissions==='function')window.refreshFacultyPermissions();
    window.ClassAttendance?.applyAccess?.();
  }
  function applyAccess(){const allowed=new Set(MODULES.filter(m=>can(m.key,'view')).map(m=>m.key));document.querySelectorAll('.nav-link[data-view]').forEach(btn=>btn.classList.toggle('role-hidden',!allowed.has(btn.dataset.view)));const examWrap=document.getElementById('examModuleNav');if(examWrap)examWrap.classList.toggle('role-hidden',!['exams','halltickets','seating','attendance','marks'].some(v=>allowed.has(v)));document.querySelectorAll('[data-jump]').forEach(btn=>{if(btn.dataset.jump)btn.classList.toggle('role-hidden',!allowed.has(btn.dataset.jump))});applyActionControls();updateRoleProfile();const active=document.querySelector('.view.active')?.id;if(active&&!allowed.has(active)&&typeof navigate==='function')navigate(currentRole==='student'&&allowed.has('studentportal')?'studentportal':'dashboard');renderRoles()}
  function setRole(role,silent=false){if(!ROLES[role])return;currentRole=role;localStorage.setItem(ROLE_KEY,role);applyAccess();if(!silent)msg(`Role changed to ${ROLES[role].label}`)}

  function loadExtras(){const loadLogin=()=>{if(document.querySelector('script[data-login-module]'))return;const l=document.createElement('script');l.src='login-module.js';l.dataset.loginModule='true';document.body.appendChild(l)};if(document.querySelector('script[data-faculty-module]')){loadLogin();return}const f=document.createElement('script');f.src='faculty-module.js';f.dataset.facultyModule='true';f.onload=loadLogin;f.onerror=loadLogin;document.body.appendChild(f)}

  styles();ensureRolesView();ensureRolesNav();renderRoles();applyAccess();window.CampusRoles={setRole,applyAccess,getRole:()=>currentRole,roles:ROLES,can,getPermissions:()=>permissions};setTimeout(()=>{ensureRolesNav();applyAccess()},500);loadExtras();
})();