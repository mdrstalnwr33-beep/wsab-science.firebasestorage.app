/* منصة وصاب التعليمية العلمية — إدارة الفصول والطلاب والمهام */
(() => {
  const KEY='wsabManagementV1';
  const state=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{"classes":[],"assignments":[]}')}catch{return {classes:[],assignments:[]}}};
  const save=s=>localStorage.setItem(KEY,JSON.stringify(s));
  const el=(tag,attrs={},html='')=>{const x=document.createElement(tag);Object.entries(attrs).forEach(([k,v])=>x.setAttribute(k,v));x.innerHTML=html;return x};
  function addPage(){
    const content=document.querySelector('.content');if(!content||document.getElementById('management'))return;
    const page=el('section',{class:'page',id:'management'});
    page.innerHTML=`<div class="section-title"><h3>🎓 إدارة الفصول والطلاب</h3><span class="pill">للمعلم والإدارة</span></div><div class="grid3"><div class="card"><h3>➕ فصل جديد</h3><div class="form"><div class="field"><label>اسم الفصل</label><input id="wmClassName" placeholder="مثال: الصف التاسع / أ"></div><div class="field"><label>المادة</label><input id="wmSubject" placeholder="العلوم"></div><button class="btn primary" id="wmAddClass">إضافة الفصل</button></div></div><div class="card"><h3>👨‍🎓 إضافة طالب</h3><div class="form"><div class="field"><label>اسم الطالب</label><input id="wmStudentName"></div><div class="field"><label>الفصل</label><select id="wmStudentClass"></select></div><button class="btn primary" id="wmAddStudent">إضافة الطالب</button></div></div><div class="card"><h3>📝 تكليف سريع</h3><div class="form"><div class="field"><label>المهمة</label><input id="wmTask" placeholder="واجب الوحدة الأولى"></div><div class="field"><label>الفصل</label><select id="wmTaskClass"></select></div><button class="btn primary" id="wmAddTask">نشر المهمة</button></div></div></div><div class="section-title"><h3>الفصول والطلاب</h3></div><div class="card" id="wmClasses"></div><div class="section-title"><h3>آخر التكليفات</h3></div><div class="card" id="wmTasks"></div>`;
    content.appendChild(page);
  }
  function render(){
    const s=state();const cs=document.getElementById('wmClasses'),ts=document.getElementById('wmTasks');if(!cs||!ts)return;
    ['wmStudentClass','wmTaskClass'].forEach(id=>{const q=document.getElementById(id);if(q)q.innerHTML=s.classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')||'<option value="">لا توجد فصول</option>'});
    cs.innerHTML=s.classes.length?s.classes.map(c=>`<div class="question"><div class="q-head"><strong>${c.name}</strong><span class="pill">${c.subject}</span></div><div class="muted">الطلاب: ${(c.students||[]).length}</div><div class="chips">${(c.students||[]).map(n=>`<span class="chip">${n}</span>`).join('')||'<span class="muted">لم تتم إضافة طلاب بعد</span>'}</div></div>`).join(''):'<p class="muted">لم تتم إضافة فصول بعد.</p>';
    ts.innerHTML=s.assignments.length?s.assignments.slice().reverse().map(a=>`<div class="question"><strong>${a.title}</strong><div class="muted">${a.className} · ${new Date(a.at).toLocaleString('ar')}</div></div>`).join(''):'<p class="muted">لا توجد تكليفات.</p>';
  }
  function bind(){
    const s=state();document.getElementById('wmAddClass')?.addEventListener('click',()=>{const n=document.getElementById('wmClassName').value.trim(),sub=document.getElementById('wmSubject').value.trim()||'العلوم';if(!n)return alert('اكتب اسم الفصل');const x=state();x.classes.push({id:Date.now().toString(),name:n,subject:sub,students:[]});save(x);render()});
    document.getElementById('wmAddStudent')?.addEventListener('click',()=>{const n=document.getElementById('wmStudentName').value.trim(),id=document.getElementById('wmStudentClass').value;if(!n||!id)return alert('اختر الفصل واكتب اسم الطالب');const x=state(),c=x.classes.find(v=>v.id===id);if(c){c.students=c.students||[];c.students.push(n);save(x);render()}});
    document.getElementById('wmAddTask')?.addEventListener('click',()=>{const t=document.getElementById('wmTask').value.trim(),id=document.getElementById('wmTaskClass').value;if(!t||!id)return alert('اكتب المهمة واختر الفصل');const x=state(),c=x.classes.find(v=>v.id===id);x.assignments.push({title:t,className:c?.name||'',at:new Date().toISOString()});save(x);render()});
  }
  function mount(){addPage();const nav=document.getElementById('nav');if(nav&&!nav.querySelector('[data-page="management"]')){const b=el('button',{'data-page':'management'},'🎓 إدارة الفصول');nav.appendChild(b);b.addEventListener('click',()=>{document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById('management').classList.add('active');const t=document.getElementById('pageTitle');if(t)t.textContent='إدارة الفصول والطلاب';render()})}bind();render();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
