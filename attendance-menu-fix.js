(function(){
  const VIEW='studentattendance';
  const SCRIPT='student-attendance-module.js?v=20260818-0635';

  function currentRole(){
    return window.CampusSession?.role || window.CampusRoles?.getRole?.() || localStorage.getItem('campusExamRole_v1') || '';
  }

  function ensureAttendanceScript(){
    if(window.StudentAttendanceModule || document.querySelector('script[data-student-attendance-module]')) return;
    const s=document.createElement('script');
    s.src=SCRIPT;
    s.dataset.studentAttendanceModule='true';
    document.body.appendChild(s);
  }

  function ensureMenu(){
    const nav=document.querySelector('.nav');
    if(!nav)return;
    let btn=document.querySelector(`.nav-link[data-view="${VIEW}"]`);
    if(!btn){
      btn=document.createElement('button');
      btn.type='button';
      btn.className='nav-link';
      btn.dataset.view=VIEW;
      btn.innerHTML='<span>☑</span>Students Attendance';
      const students=document.querySelector('.nav-link[data-view="students"]');
      if(students && students.parentElement===nav) students.insertAdjacentElement('afterend',btn);
      else nav.appendChild(btn);
      btn.addEventListener('click',()=>{
        ensureAttendanceScript();
        if(typeof navigate==='function')navigate(VIEW);
        window.StudentAttendanceModule?.refresh?.();
      });
    }
    const visible=['admin','faculty'].includes(currentRole());
    btn.classList.remove('role-hidden');
    btn.style.setProperty('display',visible?'flex':'none','important');
    btn.setAttribute('aria-hidden',visible?'false':'true');
  }

  function run(){ensureAttendanceScript();ensureMenu()}
  run();
  let count=0;const timer=setInterval(()=>{run();if(++count>=30)clearInterval(timer)},500);
  window.addEventListener('storage',run);
  document.addEventListener('click',ev=>{if(ev.target.closest('#logoutBtn,#sidebarLogoutBtn,.login-btn'))setTimeout(run,100)});
  window.AttendanceMenuFix={refresh:run};
})();