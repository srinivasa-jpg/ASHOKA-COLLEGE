(function(){
  const ROLE_KEY='campusExamRole_v1';
  const ROLES={
    admin:{label:'Admin',icon:'★',desc:'Full system access',views:['dashboard','students','branches','semesters','subjects','examsection','exams','halltickets','seating','attendance','marks','reports','settings','roles']},
    exam:{label:'Exam Section',icon:'▣',desc:'Examination operations and reports',views:['dashboard','students','subjects','examsection','exams','halltickets','seating','attendance','marks','reports']},
    faculty:{label:'Faculty',icon:'♟',desc:'Student/subject reference and marks processing',views:['dashboard','students','subjects','marks']},
    student:{label:'Students',icon:'♙',desc:'Limited student-facing access',views:['dashboard','halltickets','marks']}
  };
  let currentRole=localStorage.getItem(ROLE_KEY)||'admin';
  if(!ROLES[currentRole])currentRole='admin';

  function e(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function msg(t){if(typeof toast==='function')toast(t);else alert(t)}

  function styles(){
    if(document.getElementById('role-module-styles'))return;
    const s=document.createElement('style');s.id='role-module-styles';s.textContent=`
      .role-switcher{display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--surface);border-radius:12px;padding:6px 9px}.role-switcher label{font-size:11px;color:var(--muted);font-weight:800}.role-switcher select{border:0;background:transparent;color:var(--text);font-weight:800;outline:none;max-width:135px}.role-chip{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:5px 9px;background:var(--surface-2);border:1px solid var(--line);font-size:12px;font-weight:800}.roles-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}.role-card{border:1px solid var(--line);background:var(--surface);border-radius:16px;padding:16px;text-align:left;color:var(--text)}.role-card.active{outline:2px solid var(--primary);border-color:transparent}.role-card .role-icon{font-size:22px}.role-card b,.role-card small{display:block}.role-card b{margin-top:8px}.role-card small{color:var(--muted);margin-top:4px;line-height:1.4}.role-perm-table td,.role-perm-table th{text-align:left}.perm-yes{font-weight:900;color:var(--success)}.perm-no{font-weight:900;color:var(--muted)}.role-readonly-note{margin:0 0 14px;padding:10px 12px;border-radius:12px;background:var(--surface-2);border:1px solid var(--line);font-size:12px;font-weight:700}.role-hidden{display:none!important}
      @media(max-width:950px){.roles-grid{grid-template-columns:1fr 1fr}}@media(max-width:600px){.roles-grid{grid-template-columns:1fr}.role-switcher label{display:none}}
    `;document.head.appendChild(s);
  }

  function ensureRolesView(){
    const content=document.querySelector('.content');if(!content||document.getElementById('roles'))return;
    const sec=document.createElement('section');sec.className='view';sec.id='roles';sec.innerHTML=`
      <div class="section-toolbar"><div><h3>Roles & Permissions</h3><p>Role-based access for the examination management application.</p></div><span class="role-chip" id="roleCurrentChip"></span></div>
      <div class="roles-grid" id="rolesGrid"></div>
      <div class="card"><div class="card-head"><div><h3>Permission Matrix</h3><p>This static prototype controls interface access. Secure authentication requires a backend.</p></div></div><div class="table-wrap"><table class="role-perm-table"><thead><tr><th>Module</th><th>Admin</th><th>Exam Section</th><th>Faculty</th><th>Students</th></tr></thead><tbody id="rolePermissionBody"></tbody></table></div></div>`;
    content.appendChild(sec);
  }

  function ensureRolesNav(){
    const nav=document.querySelector('.nav');if(!nav||document.querySelector('[data-view="roles"]'))return;
    const btn=document.createElement('button');btn.className='nav-link';btn.dataset.view='roles';btn.innerHTML='<span>♜</span>Roles';
    const settings=document.querySelector('[data-view="settings"]');nav.insertBefore(btn,settings||null);
    btn.addEventListener('click',()=>{if(currentRole!=='admin'){msg('Roles are available to Admin only');return}navigate('roles');renderRoles()});
  }

  function ensureSwitcher(){
    const actions=document.querySelector('.topbar-actions');if(!actions||document.getElementById('roleSwitcher'))return;
    const wrap=document.createElement('div');wrap.className='role-switcher';wrap.id='roleSwitcher';wrap.innerHTML=`<label>Role</label><select id="activeRoleSelect">${Object.entries(ROLES).map(([k,r])=>`<option value="${k}">${e(r.label)}</option>`).join('')}</select>`;
    actions.insertBefore(wrap,actions.firstChild);
    const sel=document.getElementById('activeRoleSelect');sel.value=currentRole;sel.addEventListener('change',()=>setRole(sel.value));
  }

  function renderRoles(){
    const grid=document.getElementById('rolesGrid'),chip=document.getElementById('roleCurrentChip');if(!grid)return;
    chip.textContent=`Current Role: ${ROLES[currentRole].label}`;
    grid.innerHTML=Object.entries(ROLES).map(([k,r])=>`<button type="button" class="role-card ${k===currentRole?'active':''}" data-role-card="${k}"><span class="role-icon">${r.icon}</span><b>${e(r.label)}</b><small>${e(r.desc)}</small></button>`).join('');
    grid.querySelectorAll('[data-role-card]').forEach(b=>b.addEventListener('click',()=>setRole(b.dataset.roleCard)));
    const modules=[['Dashboard','dashboard'],['Students','students'],['Branches','branches'],['Semesters','semesters'],['Subjects','subjects'],['Examinations','exams'],['Hall Tickets','halltickets'],['Seating Plan','seating'],['Exam Attendance','attendance'],['Marks & Results','marks'],['Reports','reports'],['Settings','settings'],['Roles','roles']];
    document.getElementById('rolePermissionBody').innerHTML=modules.map(([label,v])=>`<tr><td><b>${label}</b></td>${['admin','exam','faculty','student'].map(k=>`<td class="${ROLES[k].views.includes(v)?'perm-yes':'perm-no'}">${ROLES[k].views.includes(v)?'✓':'—'}</td>`).join('')}</tr>`).join('');
  }

  function updateProfile(){
    const profile=document.querySelector('.sidebar-footer .profile');if(!profile)return;
    const strong=profile.querySelector('strong'),span=profile.querySelector('span'),avatar=profile.querySelector('.avatar');
    const r=ROLES[currentRole];if(strong)strong.textContent=r.label;if(span)span.textContent=r.desc;if(avatar)avatar.textContent=r.label.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
  }

  function readonlyStudentMode(){
    const studentMode=currentRole==='student';
    const marks=document.getElementById('marks');
    if(marks){
      let note=document.getElementById('studentRoleReadOnlyNote');
      if(studentMode&&!note){note=document.createElement('div');note.id='studentRoleReadOnlyNote';note.className='role-readonly-note';note.textContent='Student role is read-only in Marks & Results. Marks entry, save and bulk upload are disabled.';marks.querySelector('.section-toolbar')?.after(note)}
      if(!studentMode&&note)note.remove();
      marks.querySelectorAll('input.mark-input,#saveMarksBtn,#bulkMarksBtn,#downloadMarksTemplateBtn').forEach(el=>{el.disabled=studentMode;el.classList.toggle('role-hidden',studentMode&&el.id==='bulkMarksBtn')});
    }
    const hall=document.getElementById('halltickets');
    if(hall){
      // Student role can view/print hall tickets, but bulk-generation controls are not exposed.
      hall.querySelectorAll('#generateHallBtn,#hallBranchFilter,#hallYearFilter,#hallSemesterFilter,#hallExamSelect,#examCentre').forEach(el=>el.disabled=studentMode);
    }
  }

  function applyAccess(){
    const allowed=new Set(ROLES[currentRole].views);
    document.querySelectorAll('.nav-link[data-view]').forEach(btn=>{
      const v=btn.dataset.view;btn.classList.toggle('role-hidden',!allowed.has(v));
    });
    const examWrap=document.getElementById('examModuleNav');if(examWrap){const hasExam=['exams','halltickets','seating','attendance','marks'].some(v=>allowed.has(v));examWrap.classList.toggle('role-hidden',!hasExam)}
    document.querySelectorAll('[data-jump]').forEach(btn=>{const v=btn.dataset.jump;btn.classList.toggle('role-hidden',v&&!allowed.has(v))});
    updateProfile();readonlyStudentMode();
    const active=document.querySelector('.view.active')?.id;if(active&&!allowed.has(active))navigate('dashboard');
    if(document.getElementById('roles'))renderRoles();
  }

  function setRole(role){
    if(!ROLES[role])return;currentRole=role;localStorage.setItem(ROLE_KEY,role);const sel=document.getElementById('activeRoleSelect');if(sel)sel.value=role;applyAccess();msg(`Role changed to ${ROLES[role].label}`);
  }

  styles();ensureRolesView();ensureRolesNav();ensureSwitcher();renderRoles();applyAccess();
  // Dynamic seating/attendance/exam navigation finishes shortly after initial load.
  setTimeout(()=>{ensureRolesNav();applyAccess()},500);
  setTimeout(()=>applyAccess(),1200);
})();