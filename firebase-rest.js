/* منصة وصاب التعليمية العلمية — Firebase REST bridge + presence */
(() => {
  const CONFIG={apiKey:'AIzaSyD82jb8QqHHfnKgvB1kMzMrcHFa9Hk1lWU',projectId:'wsab-science',projectNumber:'277420479876'};
  const AUTH='https://identitytoolkit.googleapis.com/v1';
  const FS=`https://firestore.googleapis.com/v1/projects/${CONFIG.projectId}/databases/(default)/documents`;
  const SESSION_KEY='wsab_firebase_session_v1';
  const PROFILE_KEY='wsab_user_profile_v1';
  const readSession=()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}};
  const writeSession=s=>localStorage.setItem(SESSION_KEY,JSON.stringify(s));
  const readProfile=()=>{try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'null')}catch{return null}};
  async function authRequest(endpoint,body){const r=await fetch(`${AUTH}/${endpoint}?key=${encodeURIComponent(CONFIG.apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw new Error(j?.error?.message||'Firebase Authentication error');return j}
  async function passwordLogin(email,password){const j=await authRequest('accounts:signInWithPassword',{email,password,returnSecureToken:true});const s={idToken:j.idToken,refreshToken:j.refreshToken,localId:j.localId,email:j.email,expiresAt:Date.now()+Number(j.expiresIn||3600)*1000};writeSession(s);return s}
  async function passwordSignup(email,password){const j=await authRequest('accounts:signUp',{email,password,returnSecureToken:true});const s={idToken:j.idToken,refreshToken:j.refreshToken,localId:j.localId,email:j.email,expiresAt:Date.now()+Number(j.expiresIn||3600)*1000};writeSession(s);return s}
  async function anonymousLogin(){const e=readSession();if(e?.idToken&&e?.localId)return e;const j=await authRequest('accounts:signUp',{returnSecureToken:true});const s={idToken:j.idToken,refreshToken:j.refreshToken,localId:j.localId,expiresAt:Date.now()+Number(j.expiresIn||3600)*1000};writeSession(s);return s}
  async function refreshSession(){const s=readSession();if(!s)return null;if(s.expiresAt>Date.now()+60000)return s;if(!s.refreshToken)return null;const r=await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(CONFIG.apiKey)}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:`grant_type=refresh_token&refresh_token=${encodeURIComponent(s.refreshToken)}`});const j=await r.json();if(!r.ok){localStorage.removeItem(SESSION_KEY);return null}const n={...s,idToken:j.id_token,refreshToken:j.refresh_token||s.refreshToken,expiresAt:Date.now()+Number(j.expires_in||3600)*1000};writeSession(n);return n}
  const toV=v=>v===null?{nullValue:null}:typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?(Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v}):Array.isArray(v)?{arrayValue:{values:v.map(toV)}}:typeof v==='object'?{mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,toV(x)]))}}:{stringValue:String(v)};
  const fromV=v=>!v?null:'nullValue'in v?null:'booleanValue'in v?v.booleanValue:'integerValue'in v?Number(v.integerValue):'doubleValue'in v?Number(v.doubleValue):'stringValue'in v?v.stringValue:'timestampValue'in v?v.timestampValue:'arrayValue'in v?(v.arrayValue.values||[]).map(fromV):'mapValue'in v?Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,x])=>[k,fromV(x)])):null;
  async function fsPut(path,data){const s=await refreshSession()||await anonymousLogin();const r=await fetch(`${FS}/${path}`,{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':`Bearer ${s.idToken}`},body:JSON.stringify({fields:Object.fromEntries(Object.entries(data).filter(([,v])=>v!==undefined).map(([k,v])=>[k,toV(v)]))})});const j=await r.json();if(!r.ok)throw new Error(j?.error?.message||'Firestore write failed');return j}
  async function fsGet(path){const s=await refreshSession()||await anonymousLogin();const r=await fetch(`${FS}/${path}`,{headers:{Authorization:`Bearer ${s.idToken}`}});if(r.status===404)return null;const j=await r.json();if(!r.ok)throw new Error(j?.error?.message||'Firestore read failed');return Object.fromEntries(Object.entries(j.fields||{}).map(([k,v])=>[k,fromV(v)]))}
  async function fsList(path){const s=await refreshSession()||await anonymousLogin();const r=await fetch(`${FS}/${path}?pageSize=100`,{headers:{Authorization:`Bearer ${s.idToken}`}});if(r.status===404)return [];const j=await r.json();if(!r.ok)throw new Error(j?.error?.message||'Firestore list failed');return (j.documents||[]).map(d=>({name:d.name,data:Object.fromEntries(Object.entries(d.fields||{}).map(([k,v])=>[k,fromV(v)]))}));}
  async function syncLocalState(){const base=JSON.parse(localStorage.getItem('wsab_science_v1')||'{}');const features=JSON.parse(localStorage.getItem('wsabFeatureStateV1')||'{}');const safe={lessons:base.lessons||[],books:base.books||[],students:[...(base.students||[]),...(features.students||[])],grades:base.grades||[],schedule:base.schedule||[],tests:base.tests||[],activities:(base.activities||[]).slice(0,100),self:base.self||[],featureState:features,syncedAt:new Date().toISOString()};const s=await refreshSession()||await anonymousLogin();await fsPut(`users/${encodeURIComponent(s.localId)}/workspace`,safe);return s}
  async function restoreCloudState(){const s=await refreshSession()||await anonymousLogin();const data=await fsGet(`users/${encodeURIComponent(s.localId)}/workspace`);if(!data)throw new Error('لا توجد نسخة سحابية لهذا الحساب');const local=JSON.parse(localStorage.getItem('wsab_science_v1')||'{}');localStorage.setItem('wsab_science_v1',JSON.stringify({...local,...data}));if(data.featureState)localStorage.setItem('wsabFeatureStateV1',JSON.stringify(data.featureState));return data}

  const presenceState={timer:null,started:false,lastDate:null};
  const dayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const nowIso=()=>new Date().toISOString();
  async function heartbeatPresence(force=false){
    const s=await refreshSession();const p=readProfile();
    if(!s?.localId||!p?.role||p.role==='guest')return null;
    const now=Date.now(),date=dayKey(),uid=encodeURIComponent(s.localId),name=String(p.displayName||s.email||'طالب');
    const onlineUntil=new Date(now+150000).toISOString();
    const base={uid:s.localId,name,role:p.role,lastSeen:nowIso(),onlineUntil,dateKey:date,app:'wsab-science'};
    await fsPut(`presence/${uid}`,base);
    if(p.role==='student'){
      const old=await fsGet(`presenceDays/${date}/users/${uid}`);
      await fsPut(`presenceDays/${date}/users/${uid}`,{...base,firstSeen:old?.firstSeen||nowIso()});
    }
    presenceState.lastDate=date;
    return base;
  }
  async function startPresence(){
    if(presenceState.started)return;
    const p=readProfile();if(!p?.role||p.role==='guest')return;
    presenceState.started=true;
    try{await heartbeatPresence(true)}catch(e){console.warn('Presence heartbeat:',e.message)}
    presenceState.timer=setInterval(()=>heartbeatPresence().catch(e=>console.warn('Presence heartbeat:',e.message)),60000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')heartbeatPresence().catch(()=>{})});
    window.addEventListener('focus',()=>heartbeatPresence().catch(()=>{}));
  }
  async function listTodayPresence(){const date=dayKey();return fsList(`presenceDays/${date}/users`)}
  async function listCurrentPresence(){const list=await fsList('presence');const now=Date.now();return list.map(x=>({...x.data,online:Boolean(x.data?.onlineUntil&&Date.parse(x.data.onlineUntil)>now)}));}
  window.WsabFirebase={CONFIG,anonymousLogin,passwordLogin,passwordSignup,refreshSession,readSession,fsPut,fsGet,fsList,syncLocalState,restoreCloudState,startPresence,heartbeatPresence,listTodayPresence,listCurrentPresence};

  function presencePanel(){
    const profile=readProfile();if(!profile||!['teacher','school'].includes(profile.role))return;
    const target=document.getElementById(profile.role==='teacher'?'teacher':'school');if(!target||document.getElementById('wsabPresencePanel'))return;
    const box=document.createElement('div');box.className='card';box.id='wsabPresencePanel';box.style.marginTop='14px';box.innerHTML='<div class="section-title" style="margin:0 0 10px"><h3>🟢 حضور الطلاب المباشر</h3><button class="btn ghost" id="wsabPresenceRefresh">🔄 تحديث</button></div><div class="grid3"><div class="stat"><span>🟢 متصل الآن</span><span class="num" id="wsabOnlineCount">0</span></div><div class="stat"><span>🟡 دخل اليوم</span><span class="num" id="wsabTodayCount">0</span></div><div class="stat"><span>⏱️ آخر نشاط</span><span class="num" id="wsabLastActivity">—</span></div></div><div id="wsabPresenceList" style="margin-top:12px"></div><small class="muted">الحالة تعتمد على نبضة اتصال دورية، ولا يتم تسجيل الموقع الجغرافي.</small>';
    target.appendChild(box);
    const render=async()=>{const list=await window.WsabFirebase.listCurrentPresence();const today=await window.WsabFirebase.listTodayPresence();const students=list.filter(x=>x.role==='student');const online=students.filter(x=>x.online);document.getElementById('wsabOnlineCount').textContent=online.length;document.getElementById('wsabTodayCount').textContent=today.length;const times=students.map(x=>Date.parse(x.lastSeen||0)).filter(Number.isFinite);document.getElementById('wsabLastActivity').textContent=times.length?new Date(Math.max(...times)).toLocaleTimeString('ar-YE',{hour:'2-digit',minute:'2-digit'}):'—';const rows=students.sort((a,b)=>Number(b.online)-Number(a.online)||Date.parse(b.lastSeen||0)-Date.parse(a.lastSeen||0)).map(x=>`<div class="stat" style="padding:10px 0;border-bottom:1px solid var(--line)"><span>${x.online?'🟢':'⚪'} ${String(x.name||'طالب')}</span><small class="muted">${x.online?'متصل الآن':'آخر ظهور '+(x.lastSeen?new Date(x.lastSeen).toLocaleTimeString('ar-YE',{hour:'2-digit',minute:'2-digit'}):'غير معروف')}</small></div>`).join('');document.getElementById('wsabPresenceList').innerHTML=rows||'<div class="muted">لا توجد بيانات حضور طلاب بعد.</div>';};document.getElementById('wsabPresenceRefresh').onclick=()=>render().catch(e=>alert('تعذر تحميل الحضور: '+e.message));render().catch(()=>{});
  }

  function mount(){const actions=document.querySelector('.top .actions');if(actions&&!document.getElementById('wsabCloudBtn')){const sync=document.createElement('button');sync.id='wsabCloudBtn';sync.className='btn ghost';sync.textContent='☁️ مزامنة';const restore=document.createElement('button');restore.className='btn';restore.textContent='☁️ استعادة';const login=document.createElement('button');login.className='btn';login.textContent='👤 حساب المعلم';sync.onclick=async()=>{try{await syncLocalState();alert('تمت مزامنة بيانات المنصة مع Firebase.')}catch(e){alert('تعذر المزامنة: '+e.message)}};restore.onclick=async()=>{try{await restoreCloudState();alert('تمت الاستعادة من السحابة. أعد تحميل الصفحة.')}catch(e){alert('تعذر الاستعادة: '+e.message)}};login.onclick=async()=>{const mode=confirm('اضغط موافق لتسجيل الدخول، وإلغاء لإنشاء حساب جديد.');const email=prompt('البريد الإلكتروني:');if(!email)return;const password=prompt('كلمة المرور:');if(!password)return;try{if(mode)await passwordLogin(email,password);else await passwordSignup(email,password);alert('تم تجهيز الحساب السحابي بنجاح.')}catch(e){alert('تعذر العملية: '+e.message)}};actions.append(sync,restore,login)}
    startPresence().catch(()=>{});setInterval(()=>{startPresence().catch(()=>{});presencePanel()},3000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
