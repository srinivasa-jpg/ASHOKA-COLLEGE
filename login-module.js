(function(){
  const SESSION_KEY='campusExamSession_v1',ROLE_KEY='campusExamRole_v1';
  function msg(t){if(typeof toast==='function')toast(t);else alert(t)}

  function styles(){
    if(document.getElementById('login-module-styles'))return;
    const s=document.createElement('style');s.id='login-module-styles';s.textContent=`
      .login-overlay{position:fixed;inset:0;z-index:99999;background:linear-gradient(135deg,#0f172a,#172554 55%,#1e3a8a);display:grid;place-items:center;padding:20px}.login-card{width:min(460px,96vw);background:#fff;color:#111;border-radius:22px;padding:28px;box-shadow:0 24px 70px rgba(0,0,0,.35)}.login-brand{display:flex;align-items:center;gap:12px;margin-bottom:20px}.login-mark{width:46px;height:46px;border-radius:14px;background:#1d4ed8;color:#fff;display:grid;place-items:center;font-weight:900}.login-card h2{margin:0;font-size:22px}.login-card p{margin:5px 0;color:#64748b;font-size:13px;line-height:1.5}.login-form{display:grid;gap:13px;margin-top:18px}.login-form label{display:grid;gap:6px;font-size:13px;font-weight:800}.login-form input{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:12px;padding:11px 12px;font-size:14px;outline:none}.login-form input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12)}.login-btn{border:0;border-radius:12px;padding:12px 14px;background:#2563eb;color:#fff;font-weight:900;cursor:pointer}.login-help{margin-top:16px;padding:12px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;font-size:12px;color:#475569;line-height:1.6}.login-help b{color:#0f172a}.login-error{min-height:18px;color:#b91c1c;font-size:12px;font-weight:800}.logout-btn{border:1px solid var(--line);background:var(--surface);color:var(--text);border-radius:10px;padding:8px 12px;font-weight:900;cursor:pointer}.logout-btn:hover{border-color:#fca5a5;color:var(--danger);background:rgba(220,38,38,.05)}.session-user{font-size:12px;color:var(--muted);font-weight:800;white-space:nowrap}.sidebar-logout{width:100%;margin-top:10px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#fff;border-radius:10px;padding:9px 11px;font-weight:800;cursor:pointer}.sidebar-logout:hover{background:rgba(239,68,68,.18);border-color:rgba(248,113,113,.45)}@media(max-width:650px){.session-user{display:none}.login-card{padding:22px}}
    `;document.head.appendChild(s)
  }

  function verify(login,password){
    const id=String(login||'').trim(),pass=String(password||'').trim();if(!id||!pass)return null;
    if(id.toLowerCase()==='admin0011'&&pass==='admin0011')return{role:'admin',loginId:'admin0011',name:'Administrator'};
    if(id.toLowerCase()==='exams0011'&&pass==='exams0011')return{role:'exam',loginId:'exams0011',name:'Exam Section'};
    const faculty=(state.faculty||[]).find(f=>String(f.facultyId||'').toLowerCase()===id.toLowerCase()&&(f.status||'Active')==='Active');
    if(faculty&&pass.toLowerCase()===String(faculty.facultyId).toLowerCase())return{role:'faculty',loginId:faculty.facultyId,name:faculty.name,facultyId:faculty.id,branch:faculty.branch};
    const student=(state.students||[]).find(s=>String(s.hall||'').toLowerCase()===id.toLowerCase()&&(s.status||'Active')==='Active');
    if(student&&pass.toLowerCase()===String(student.hall).toLowerCase())return{role:'student',loginId:student.hall,name:student.name,studentId:student.id,branch:student.branch,year:student.year,sem:student.sem};
    return null
  }

  function validSession(s){
    if(!s||!s.role||!s.loginId)return false;
    if(s.role==='admin')return s.loginId==='admin0011';
    if(s.role==='exam')return s.loginId==='exams0011';
    if(s.role==='faculty')return (state.faculty||[]).some(f=>Number(f.id)===Number(s.facultyId)&&(f.status||'Active')==='Active');
    if(s.role==='student')return (state.students||[]).some(st=>Number(st.id)===Number(s.studentId)&&(st.status||'Active')==='Active');
    return false
  }
  function getSession(){try{const s=JSON.parse(localStorage.getItem(SESSION_KEY));return validSession(s)?s:null}catch{return null}}

  function ensureStudentPortal(done){
    if(window.StudentPortal){done?.();return}
    const existing=document.querySelector('script[data-student-portal]');
    if(existing){existing.addEventListener('load',()=>done?.(),{once:true});return}
    const s=document.createElement('script');s.src='student-portal.js';s.dataset.studentPortal='true';s.onload=()=>done?.();document.body.appendChild(s)
  }
  function routeForSession(s){
    if(s?.role==='student')ensureStudentPortal(()=>{window.StudentPortal?.onLogin(s);if(typeof navigate==='function')navigate('studentportal');window.StudentPortal?.render()});
    else{window.StudentPortal?.onLogin(s);if(typeof navigate==='function')navigate('dashboard')}
  }

  function setIdentity(s){
    localStorage.setItem(SESSION_KEY,JSON.stringify(s));
    localStorage.setItem(ROLE_KEY,s.role);
    window.CampusSession=s;
    if(window.CampusRoles?.setRole)window.CampusRoles.setRole(s.role,true);
    updateTopbar(s);updateProfile(s)
  }

  function clearSession(){
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(ROLE_KEY);
    window.CampusSession=null;
    window.StudentPortal?.onLogin(null);
    document.getElementById('logoutBtn')?.remove();
    document.getElementById('sidebarLogoutBtn')?.remove();
    document.getElementById('sessionUser')?.remove();
    if(typeof navigate==='function')navigate('dashboard');
    showLogin()
  }

  function updateTopbar(s){
    const actions=document.querySelector('.topbar-actions');if(!actions)return;
    document.getElementById('roleSwitcher')?.remove();
    let user=document.getElementById('sessionUser');
    if(!user){user=document.createElement('span');user.id='sessionUser';user.className='session-user';actions.insertBefore(user,actions.firstChild)}
    user.textContent=`${s.name} · ${s.role==='exam'?'Exam Section':s.role.charAt(0).toUpperCase()+s.role.slice(1)}`;
    let out=document.getElementById('logoutBtn');
    if(!out){out=document.createElement('button');out.id='logoutBtn';out.className='logout-btn';out.type='button';out.textContent='Logout';out.title='Sign out of CampusExam';out.addEventListener('click',clearSession);actions.appendChild(out)}
  }

  function updateProfile(s){
    const footer=document.querySelector('.sidebar-footer'),p=footer?.querySelector('.profile');if(!p)return;
    const strong=p.querySelector('strong'),span=p.querySelector('span'),avatar=p.querySelector('.avatar');
    if(strong)strong.textContent=s.name;if(span)span.textContent=s.loginId;if(avatar)avatar.textContent=(s.name||s.loginId).split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
    let out=document.getElementById('sidebarLogoutBtn');
    if(!out&&footer){out=document.createElement('button');out.id='sidebarLogoutBtn';out.className='sidebar-logout';out.type='button';out.textContent='⇥ Logout';out.addEventListener('click',clearSession);footer.appendChild(out)}
  }

  function buildLogin(){
    if(document.getElementById('loginOverlay'))return;
    const d=document.createElement('div');d.id='loginOverlay';d.className='login-overlay';d.innerHTML=`<div class="login-card"><div class="login-brand"><div class="login-mark">CE</div><div><h2>CampusExam Login</h2><p>College Examination Management System</p></div></div><form class="login-form" id="loginForm"><label>Login ID<input id="loginId" autocomplete="username" placeholder="Enter login ID" required></label><label>Password<input id="loginPassword" type="password" autocomplete="current-password" placeholder="Enter password" required></label><div class="login-error" id="loginError"></div><button class="login-btn" type="submit">Login</button></form><div class="login-help"><b>Temporary prototype credentials</b><br>Admin: <b>admin0011</b><br>Exam Section: <b>exams0011</b><br>Faculty: use Faculty ID created in Faculty Master<br>Students: use student Roll/Hall Ticket number<br><br>For this prototype, the temporary password is the same as the Login ID.</div></div>`;
    document.body.appendChild(d);
    document.getElementById('loginForm').addEventListener('submit',ev=>{
      ev.preventDefault();
      const s=verify(document.getElementById('loginId').value,document.getElementById('loginPassword').value);
      if(!s){document.getElementById('loginError').textContent='Invalid login ID or password.';return}
      document.getElementById('loginError').textContent='';setIdentity(s);d.remove();routeForSession(s);msg(`Welcome ${s.name}`)
    })
  }

  function showLogin(){
    document.getElementById('logoutBtn')?.remove();document.getElementById('sidebarLogoutBtn')?.remove();document.getElementById('sessionUser')?.remove();
    buildLogin();const o=document.getElementById('loginOverlay');if(o)o.style.display='grid'
  }

  styles();document.getElementById('roleSwitcher')?.remove();
  ensureStudentPortal(()=>{
    const session=getSession();
    if(session){window.CampusSession=session;localStorage.setItem(ROLE_KEY,session.role);if(window.CampusRoles?.setRole)window.CampusRoles.setRole(session.role,true);updateTopbar(session);updateProfile(session);routeForSession(session)}else showLogin();
  });
  window.CampusLogin={logout:clearSession,getSession};
})();