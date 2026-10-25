/* منصة وصاب التعليمية العلمية — نظام الأدوار */
(() => {
  const PROFILE_KEY='wsab_user_profile_v1';
  const SESSION_KEY='wsab_firebase_session_v1';
  const ACCESS={guest:['dashboard','library','bank'],student:['dashboard','library','bank','student'],teacher:['dashboard','lesson','library','bank','grades','schedule','tests','teacher','student','school','semester','attendance','grader','oral','self','solver','reports'],school:['dashboard','library','bank','grades','schedule','tests','teacher','student','school','semester','attendance','grader','oral','self','solver','reports']};
  const LABEL={guest:'زائر',student:'طالب',teacher:'معلم',school:'إدارة المدرسة'};
  const readJson=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
  const writeJson=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const profile=()=>readJson(PROFILE_KEY),session=()=>readJson(SESSION_KEY),role=()=>profile()?.role||'guest';
  const allowed=id=>(ACCESS[role()]||ACCESS.guest).includes(id);
  function toV(v){return typeof v==='number'?{integerValue:String(v)}:typeof v==='boolean'?{booleanValue:v}:{stringValue:String(v)}}
  function fromV(v){return v?.stringValue??v?.integerValue??v?.booleanValue??null}
  async function firestore(path,method='GET',fields){
    const cfg=window.WsabFirebase?.CONFIG,s=session();if(!cfg||!s?.idToken||!s?.localId)return null;
    const url=`https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents/${path}`;
    const opt={method,headers:{Authorization:`Bearer ${s.idToken}`,'Content-Type':'application/json'}};
    if(fields)opt.body=JSON.stringify({fields:Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,toV(v)]))});
    const r=await fetch(url,opt);if(r.status===404)return null;const j=await r.json();if(!r.ok)throw new Error(j?.error?.message||'Firestore error');return j;
  }
  async function loadOrCreateProfile(){
    const s=session();if(!s?.localId)return null;const path=`users/${encodeURIComponent(s.localId)}/profile`;let j=await firestore(path),p=null;
    if(j?.fields)p=Object.fromEntries(Object.entries(j.fields).map(([k,v])=>[k,fromV(v)]));
    if(!p){p={email:s.email||'',displayName:(s.email||'طالب').split('@')[0],role:'student',createdAt:new Date().toISOString()};await firestore(path,'PATCH',p)}
    writeJson(PROFILE_KEY,p);return p;
  }
  function apply(){
    const r=role();document.querySelectorAll('.page').forEach(p=>p.style.display=allowed(p.id)?'':'none');document.querySelectorAll('#nav button[data-page]').forEach(b=>b.style.display=allowed(b.dataset.page)?'':'none');
    const badge=document.getElementById('wsabRoleBadge');if(badge)badge.textContent=`الدور: ${LABEL[r]||r}`;const user=document.getElementById('wsabUserName');if(user)user.textContent=profile()?.displayName||profile()?.email||'زائر';
    const active=document.querySelector('.page.active');if(active&&!allowed(active.id)){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById('dashboard')?.classList.add('active');const t=document.getElementById('pageTitle');if(t)t.textContent='لوحة التحكم'}
  }
  function mount(){
    if(!document.getElementById('wsabRoleBox')){const top=document.querySelector('.top .actions');if(top){const box=document.createElement('span');box.id='wsabRoleBox';box.className='btn ghost';box.style.cursor='default';box.innerHTML='<span id="wsabUserName">زائر</span> · <span id="wsabRoleBadge">الدور: زائر</span>';top.prepend(box)}}
    apply();const s=session();if(s?.localId)loadOrCreateProfile().then(apply).catch(()=>apply());let last='';setInterval(()=>{const sig=localStorage.getItem(SESSION_KEY)||'';if(sig!==last){last=sig;loadOrCreateProfile().then(apply).catch(()=>apply())}apply()},1200);
  }
  window.WsabRoles={profile,role,allowed,apply,loadOrCreateProfile,LABEL};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
