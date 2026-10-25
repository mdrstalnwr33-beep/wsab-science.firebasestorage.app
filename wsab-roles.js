/* منصة وصاب التعليمية العلمية — أدوار وصلاحيات الواجهة */
(() => {
  const ROLE_KEY='wsab_user_profile_v1';
  const ACCESS={
    guest:['dashboard','library','bank'],
    student:['dashboard','library','bank','student'],
    teacher:['dashboard','lesson','library','bank','grades','schedule','tests','teacher','student','school','semester','attendance','grader','oral','self','solver','reports'],
    school:['dashboard','library','bank','grades','schedule','tests','teacher','student','school','semester','attendance','grader','oral','self','solver','reports']
  };
  const TITLES={guest:'زائر',student:'طالب',teacher:'معلم',school:'إدارة المدرسة'};
  function getProfile(){try{return JSON.parse(localStorage.getItem(ROLE_KEY)||'null')}catch{return null}}
  function role(){return getProfile()?.role||'guest'}
  function allowed(id){return (ACCESS[role()]||ACCESS.guest).includes(id)}
  function apply(){
    const r=role();
    document.querySelectorAll('.page').forEach(p=>p.style.display=allowed(p.id)?'':'none');
    document.querySelectorAll('#nav button[data-page]').forEach(b=>{b.style.display=allowed(b.dataset.page)?'':'none'});
    const badge=document.getElementById('wsabRoleBadge');
    if(badge) badge.textContent=`الدور: ${TITLES[r]||r}`;
    const user=document.getElementById('wsabUserName');
    if(user) user.textContent=getProfile()?.displayName||getProfile()?.email||'زائر';
    const active=document.querySelector('.page.active');
    if(active&&!allowed(active.id)){
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
      document.getElementById('dashboard')?.classList.add('active');
      document.getElementById('pageTitle').textContent='لوحة التحكم';
    }
  }
  function mount(){
    if(document.getElementById('wsabRoleBox')) return;
    const top=document.querySelector('.top .actions');
    if(top){
      const box=document.createElement('span'); box.id='wsabRoleBox'; box.className='btn ghost'; box.style.cursor='default';
      box.innerHTML='<span id="wsabUserName">زائر</span> · <span id="wsabRoleBadge">الدور: زائر</span>';
      top.prepend(box);
    }
    apply();
    setInterval(apply,1000);
  }
  window.WsabRoles={getProfile,role,allowed,apply,TITLES};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
