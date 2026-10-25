/* منصة وصاب التعليمية العلمية — Firebase REST bridge
 * Uses Firebase Authentication + Cloud Firestore REST APIs.
 * No service-account credentials are stored in the client.
 */
(() => {
  const CONFIG = {
    apiKey: 'AIzaSyD82jb8QqHHfnKgvB1kMzMrcHFa9Hk1lWU',
    projectId: 'wsab-science',
    projectNumber: '277420479876'
  };
  const AUTH = `https://identitytoolkit.googleapis.com/v1`;
  const FS = `https://firestore.googleapis.com/v1/projects/${CONFIG.projectId}/databases/(default)/documents`;
  const SESSION_KEY = 'wsab_firebase_session_v1';

  const readSession = () => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  };
  const writeSession = (s) => localStorage.setItem(SESSION_KEY, JSON.stringify(s));

  async function authRequest(endpoint, body) {
    const r = await fetch(`${AUTH}/${endpoint}?key=${encodeURIComponent(CONFIG.apiKey)}`, {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error?.message || 'Firebase Authentication error');
    return j;
  }

  async function anonymousLogin() {
    const existing = readSession();
    if (existing?.idToken && existing?.localId) return existing;
    const j = await authRequest('accounts:signUp', {returnSecureToken:true});
    const s = {idToken:j.idToken, refreshToken:j.refreshToken, localId:j.localId, expiresAt:Date.now() + Number(j.expiresIn || 3600) * 1000};
    writeSession(s); return s;
  }

  async function passwordLogin(email, password) {
    const j = await authRequest('accounts:signInWithPassword', {email, password, returnSecureToken:true});
    const s = {idToken:j.idToken, refreshToken:j.refreshToken, localId:j.localId, email:j.email, expiresAt:Date.now() + Number(j.expiresIn || 3600) * 1000};
    writeSession(s); return s;
  }

  async function passwordSignup(email, password) {
    const j = await authRequest('accounts:signUp', {email, password, returnSecureToken:true});
    const s = {idToken:j.idToken, refreshToken:j.refreshToken, localId:j.localId, email:j.email, expiresAt:Date.now() + Number(j.expiresIn || 3600) * 1000};
    writeSession(s); return s;
  }

  async function refreshSession() {
    const s = readSession();
    if (!s) return null;
    if (s.expiresAt && s.expiresAt > Date.now() + 60000) return s;
    if (!s.refreshToken) return null;
    const r = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(CONFIG.apiKey)}`, {
      method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:`grant_type=refresh_token&refresh_token=${encodeURIComponent(s.refreshToken)}`
    });
    const j = await r.json();
    if (!r.ok) { localStorage.removeItem(SESSION_KEY); return null; }
    const next = {...s, idToken:j.id_token, refreshToken:j.refresh_token || s.refreshToken, expiresAt:Date.now() + Number(j.expires_in || 3600) * 1000};
    writeSession(next); return next;
  }

  function toFirestoreValue(v) {
    if (v === null) return {nullValue:null};
    if (typeof v === 'boolean') return {booleanValue:v};
    if (typeof v === 'number') return Number.isInteger(v) ? {integerValue:String(v)} : {doubleValue:v};
    if (Array.isArray(v)) return {arrayValue:{values:v.map(toFirestoreValue)}};
    if (typeof v === 'object') return {mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,toFirestoreValue(x)]))}};
    return {stringValue:String(v)};
  }

  function fromFirestoreValue(v) {
    if (!v) return null;
    if ('nullValue' in v) return null;
    if ('booleanValue' in v) return v.booleanValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return Number(v.doubleValue);
    if ('stringValue' in v) return v.stringValue;
    if ('timestampValue' in v) return v.timestampValue;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromFirestoreValue);
    if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k,x])=>[k,fromFirestoreValue(x)]));
    return null;
  }

  async function fsPut(path, data) {
    const s = await refreshSession() || await anonymousLogin();
    const r = await fetch(`${FS}/${path}`, {
      method:'PATCH', headers:{'Content-Type':'application/json','Authorization':`Bearer ${s.idToken}`},
      body:JSON.stringify({fields:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,toFirestoreValue(v)]))})
    });
    const j = await r.json(); if (!r.ok) throw new Error(j?.error?.message || 'Firestore write failed'); return j;
  }

  async function fsGet(path) {
    const s = await refreshSession() || await anonymousLogin();
    const r = await fetch(`${FS}/${path}`, {headers:{'Authorization':`Bearer ${s.idToken}`}});
    if (r.status === 404) return null;
    const j = await r.json(); if (!r.ok) throw new Error(j?.error?.message || 'Firestore read failed');
    return Object.fromEntries(Object.entries(j.fields || {}).map(([k,v])=>[k,fromFirestoreValue(v)]));
  }

  // Only sync app data; never sync the Gemini API key or local-only settings.
  async function syncLocalState() {
    const raw = JSON.parse(localStorage.getItem('wsab_science_v1') || 'null');
    if (!raw) throw new Error('لا توجد بيانات محلية للمزامنة');
    const safe = {
      lessons:raw.lessons || [], books:raw.books || [], students:raw.students || [],
      grades:raw.grades || [], schedule:raw.schedule || [], tests:raw.tests || [],
      activities:(raw.activities || []).slice(0,100), self:raw.self || [], syncedAt:new Date().toISOString()
    };
    const s = await refreshSession() || await anonymousLogin();
    await fsPut(`users/${encodeURIComponent(s.localId)}/workspace`, safe);
    return s;
  }

  async function restoreCloudState() {
    const s = await refreshSession() || await anonymousLogin();
    const data = await fsGet(`users/${encodeURIComponent(s.localId)}/workspace`);
    if (!data) throw new Error('لا توجد نسخة سحابية لهذا الحساب');
    const local = JSON.parse(localStorage.getItem('wsab_science_v1') || '{}');
    localStorage.setItem('wsab_science_v1', JSON.stringify({...local, ...data}));
    return data;
  }

  window.WsabFirebase = {CONFIG, anonymousLogin, passwordLogin, passwordSignup, refreshSession, syncLocalState, restoreCloudState};

  // Small cloud controls are added without changing the existing UI structure.
  function mountCloudControls() {
    const actions = document.querySelector('.top .actions');
    if (!actions || document.getElementById('wsabCloudBtn')) return;
    const wrap = document.createElement('div'); wrap.className='actions'; wrap.style.display='contents';
    const sync = document.createElement('button'); sync.id='wsabCloudBtn'; sync.className='btn ghost'; sync.textContent='☁️ مزامنة';
    const restore = document.createElement('button'); restore.className='btn'; restore.textContent='☁️ استعادة';
    const login = document.createElement('button'); login.className='btn'; login.textContent='👤 دخول سحابي';
    sync.onclick = async () => { try { await syncLocalState(); alert('تمت مزامنة بيانات المنصة مع Firebase.'); } catch(e) { alert('تعذر المزامنة: '+e.message); } };
    restore.onclick = async () => { try { await restoreCloudState(); alert('تمت استعادة النسخة السحابية. أعد تحميل الصفحة لتحديث البيانات.'); } catch(e) { alert('تعذر الاستعادة: '+e.message); } };
    login.onclick = async () => {
      const email = prompt('البريد الإلكتروني للمعلم/الحساب:'); if (!email) return;
      const password = prompt('كلمة المرور:'); if (!password) return;
      try { await passwordLogin(email,password); alert('تم تسجيل الدخول سحابياً.'); } catch(e) { alert('تعذر تسجيل الدخول: '+e.message); }
    };
    wrap.append(sync,restore,login); actions.append(wrap);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountCloudControls); else mountCloudControls();
})();
