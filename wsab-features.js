(() => {
  const FEATURES = [
    ['teacherPortal','👨‍🏫 بوابة المعلم','إدارة الفصول والطلاب والواجبات والاختبارات'],
    ['studentPortal','🎓 بوابة الطالب','ملف الطالب والواجبات والاختبارات والتقدم'],
    ['schoolPlatform','🏫 منصة المدرسة','الفصول والمعلمون والإعلانات والتقارير'],
    ['semesterPlan','🗓️ الخطة الفصلية','خطة الوحدات والدروس والأهداف الأسبوعية'],
    ['attendance','🟢 الحضور والغياب','تسجيل حضور الطلاب وإخراج ملخص سريع'],
    ['smartGrader','🧠 المصحح الذكي','رفع صورة إجابة وإدخال الدرجة والملاحظات'],
    ['oralDraw','🎲 اختبار شفوي وسحب','اختيار طالب وسؤال عشوائياً'],
    ['selfAssessment','⭐ التقييم الذاتي','نموذج تقييم الطالب لفهمه وتقدمه'],
    ['examSolver','📝 حل نموذج اختبار','إدخال نموذج الأسئلة وحساب النتيجة'],
    ['reports','📈 التقارير والإحصائيات','تقارير الطلاب والفصول والاختبارات']
  ];
  const nav = document.getElementById('nav');
  const content = document.querySelector('.content');
  if (!nav || !content) return;

  const stateKey = 'wsabFeatureStateV1';
  const load = () => { try { return JSON.parse(localStorage.getItem(stateKey) || '{}'); } catch { return {}; } };
  const save = s => localStorage.setItem(stateKey, JSON.stringify(s));
  let state = load();
  state.students ||= [];
  state.attendance ||= {};
  state.semester ||= [];
  state.questions ||= [];
  state.self ||= {};

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const page = id => document.getElementById(id);
  const addNav = (id,label) => {
    if (nav.querySelector(`[data-page="${id}"]`)) return;
    const b=document.createElement('button'); b.dataset.page=id; b.textContent=label; nav.appendChild(b);
    b.addEventListener('click',()=>show(id));
  };
  const addPage = (id,title,html) => {
    if (page(id)) return page(id);
    const s=document.createElement('section'); s.className='page'; s.id=id; s.innerHTML=`<div class="section-title"><h3>${title}</h3></div>${html}`; content.appendChild(s); return s;
  };
  const show = id => {
    document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));
    document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===id));
    const t=document.getElementById('pageTitle'); if(t) t.textContent=document.querySelector(`#nav button[data-page="${id}"]`)?.textContent || id;
  };

  FEATURES.forEach(([id,label])=>addNav(id,label));

  addPage('teacherPortal','👨‍🏫 بوابة المعلم',`<div class="grid3">
    <div class="card"><b>الفصول</b><p class="muted">أنشئ فصلاً واربط به الطلاب.</p><div class="actions"><button class="btn primary" id="tpAddClass">➕ فصل</button></div><div id="tpClasses"></div></div>
    <div class="card"><b>واجب سريع</b><div class="form"><div class="field"><label>العنوان</label><input id="tpHwTitle"></div><div class="field"><label>التعليمات</label><textarea id="tpHwText"></textarea></div><button class="btn primary" id="tpSaveHw">💾 حفظ</button></div><div id="tpHwList"></div></div>
    <div class="card"><b>دخول المعلم</b><p class="muted">هذه الواجهة لا تخزن كلمة المرور. يمكن لاحقاً ربطها بحساب Firebase.</p><button class="btn" id="tpCloud">☁️ مزامنة الحساب</button><div id="tpCloudOut"></div></div>
  </div>`);

  addPage('studentPortal','🎓 بوابة الطالب',`<div class="grid3">
    <div class="card"><b>مرحباً بك يا طالب وصاب</b><p>تابع دروسك واختباراتك ودرجاتك من مكان واحد.</p><div class="chips"><span class="chip">الدروس</span><span class="chip">الاختبارات</span><span class="chip">الواجبات</span><span class="chip">التقدم</span></div></div>
    <div class="card"><b>ملف الطالب</b><div class="form"><div class="field"><label>الاسم</label><input id="spName"></div><div class="field"><label>الصف</label><input id="spGrade"></div><div class="field"><label>الشعبة</label><input id="spSection"></div><button class="btn primary" id="spSave">💾 حفظ الملف</button></div></div>
    <div class="card"><b>ملخص التقدم</b><div id="spProgress" class="output"></div></div>
  </div>`);

  addPage('schoolPlatform','🏫 منصة المدرسة',`<div class="grid3">
    <div class="card"><b>بيانات المدرسة</b><div class="form"><div class="field"><label>اسم المدرسة</label><input id="schName"></div><div class="field"><label>المدير</label><input id="schManager"></div><button class="btn primary" id="schSave">💾 حفظ</button></div></div>
    <div class="card"><b>إعلان مدرسي</b><textarea id="schNotice" placeholder="اكتب إعلاناً للطلاب والمعلمين"></textarea><button class="btn primary" id="schPublish">📢 نشر</button><div id="schNoticeOut"></div></div>
    <div class="card"><b>لوحة المدرسة</b><div id="schStats" class="output"></div></div>
  </div>`);

  addPage('semesterPlan','🗓️ الخطة الفصلية',`<div class="card"><div class="form grid3"><div class="field"><label>الأسبوع</label><input id="semWeek" placeholder="الأول"></div><div class="field"><label>الوحدة</label><input id="semUnit"></div><div class="field"><label>الدرس</label><input id="semLesson"></div><div class="field"><label>الهدف</label><input id="semGoal"></div><button class="btn primary" id="semAdd">➕ إضافة</button></div><div id="semList" style="margin-top:15px"></div></div>`);

  addPage('attendance','🟢 الحضور والغياب',`<div class="card"><div class="actions"><button class="btn primary" id="attAdd">➕ إضافة طالب</button><button class="btn" id="attToday">📅 تسجيل اليوم</button></div><div id="attTable" class="table-wrap" style="margin-top:12px"></div></div>`);

  addPage('smartGrader','🧠 المصحح الذكي',`<div class="grid3"><div class="card"><b>صورة ورقة الإجابة</b><input id="sgFile" type="file" accept="image/*"><p class="muted">يتم حفظ الصورة محلياً في الجلسة ولا تُرفع تلقائياً.</p></div><div class="card"><b>التصحيح</b><div class="form"><div class="field"><label>اسم الطالب</label><input id="sgStudent"></div><div class="field"><label>الدرجة</label><input id="sgScore" type="number" min="0"></div><div class="field"><label>ملاحظات</label><textarea id="sgNotes"></textarea></div><button class="btn primary" id="sgSave">💾 حفظ النتيجة</button></div></div><div class="card"><b>آخر النتائج</b><div id="sgResults"></div></div></div>`);

  addPage('oralDraw','🎲 اختبار شفوي وسحب',`<div class="grid3"><div class="card"><b>الطلاب</b><textarea id="odStudents" placeholder="اكتب كل طالب في سطر"></textarea><button class="btn" id="odSave">💾 حفظ</button></div><div class="card"><b>سؤال الشفوي</b><textarea id="odQuestion" placeholder="اكتب السؤال"></textarea><button class="btn primary" id="odDraw">🎲 اختر الآن</button></div><div class="card"><b>النتيجة</b><div id="odResult" class="output">اضغط اختيار الآن.</div></div></div>`);

  addPage('selfAssessment','⭐ التقييم الذاتي',`<div class="card"><h4>قيّم فهمك للدرس</h4><div class="form"><label><input type="radio" name="selfRate" value="1"> أحتاج شرحاً أكثر</label><label><input type="radio" name="selfRate" value="2"> أفهم الأساسيات</label><label><input type="radio" name="selfRate" value="3"> أفهم جيداً</label><label><input type="radio" name="selfRate" value="4"> أستطيع الشرح للآخرين</label><textarea id="selfNote" placeholder="ما النقطة التي تريد مراجعتها؟"></textarea><button class="btn primary" id="selfSave">⭐ حفظ التقييم</button></div><div id="selfOut" class="success hidden"></div></div>`);

  addPage('examSolver','📝 حل نموذج اختبار',`<div class="card"><div class="form"><div class="field"><label>اسم النموذج</label><input id="esTitle"></div><div class="field"><label>عدد الأسئلة</label><input id="esCount" type="number" min="1" value="10"></div><div class="field"><label>عدد الإجابات الصحيحة</label><input id="esCorrect" type="number" min="0" value="0"></div><button class="btn primary" id="esSolve">🧮 احسب النتيجة</button></div><div id="esOut" class="output" style="margin-top:12px"></div></div>`);

  addPage('reports','📈 التقارير والإحصائيات',`<div class="grid3"><div class="card"><b>الطلاب</b><div id="repStudents" class="output"></div></div><div class="card"><b>الحضور</b><div id="repAttendance" class="output"></div></div><div class="card"><b>التقييم الذاتي</b><div id="repSelf" class="output"></div></div></div>`);

  // teacher portal
  const renderTP=()=>{ const el=page('tpClasses'); if(!el)return; el.innerHTML=(state.classes||[]).map((x,i)=>`<div class="chip" style="margin:4px">${esc(x)} </div>`).join('')||'<span class="muted">لا توجد فصول بعد.</span>'; };
  page('tpAddClass')?.addEventListener('click',()=>{const n=prompt('اسم الفصل؟');if(n){state.classes||=[];state.classes.push(n);save(state);renderTP();}});
  page('tpSaveHw')?.addEventListener('click',()=>{state.homework||=[];state.homework.push({title:page('tpHwTitle').value,text:page('tpHwText').value,date:new Date().toLocaleDateString('ar-YE')});save(state);page('tpHwList').innerHTML=state.homework.map(x=>`<div class="question"><b>${esc(x.title)}</b><div>${esc(x.text)}</div><small>${esc(x.date)}</small></div>`).join('');});
  page('tpCloud')?.addEventListener('click',()=>document.getElementById('backupBtn')?.click()); renderTP();

  page('spSave')?.addEventListener('click',()=>{state.student={name:page('spName').value,grade:page('spGrade').value,section:page('spSection').value};save(state);renderStudent();});
  const renderStudent=()=>{const s=state.student||{}; if(page('spName')){page('spName').value=s.name||'';page('spGrade').value=s.grade||'';page('spSection').value=s.section||'';} page('spProgress').textContent=`الطالب: ${s.name||'غير محدد'}\nالصف: ${s.grade||'غير محدد'}\nعدد الطلاب المسجلين: ${state.students.length}\nعدد عناصر الخطة: ${state.semester.length}`;}; renderStudent();

  page('schSave')?.addEventListener('click',()=>{state.school={name:page('schName').value,manager:page('schManager').value};save(state);renderSchool();});
  page('schPublish')?.addEventListener('click',()=>{state.notice=page('schNotice').value;save(state);renderSchool();});
  const renderSchool=()=>{page('schName').value=state.school?.name||'';page('schManager').value=state.school?.manager||'';page('schNoticeOut').innerHTML=state.notice?`<div class="notice">${esc(state.notice)}</div>`:'';page('schStats').textContent=`الطلاب: ${state.students.length}\nالخطة الفصلية: ${state.semester.length}\nالواجبات: ${(state.homework||[]).length}`;}; renderSchool();

  page('semAdd')?.addEventListener('click',()=>{const x={week:page('semWeek').value,unit:page('semUnit').value,lesson:page('semLesson').value,goal:page('semGoal').value};if(!x.lesson)return;state.semester.push(x);save(state);renderSem();});
  const renderSem=()=>page('semList').innerHTML=state.semester.map((x,i)=>`<div class="question"><b>الأسبوع ${esc(x.week)} — ${esc(x.unit)}</b><div>${esc(x.lesson)}</div><small>${esc(x.goal)}</small></div>`).join('')||'<span class="muted">ابدأ بإضافة الخطة.</span>'; renderSem();

  page('attAdd')?.addEventListener('click',()=>{const n=prompt('اسم الطالب؟');if(n){state.students.push({name:n});save(state);renderAtt();renderReports();}});
  page('attToday')?.addEventListener('click',()=>{const d=new Date().toISOString().slice(0,10);state.attendance[d]=state.students.map(s=>({name:s.name,present:confirm(`هل حضر ${s.name}؟`)}));save(state);renderAtt();renderReports();});
  const renderAtt=()=>page('attTable').innerHTML=`<table class="table"><tr><th>الطالب</th><th>الحالة الأخيرة</th></tr>${state.students.map(s=>{let d=Object.keys(state.attendance).sort().pop();let r=(state.attendance[d]||[]).find(x=>x.name===s.name);return `<tr><td>${esc(s.name)}</td><td>${r?(r.present?'حاضر':'غائب'):'لم يسجل'}</td></tr>`}).join('')}</table>`; renderAtt();

  page('sgSave')?.addEventListener('click',()=>{state.grades||=[];state.grades.push({name:page('sgStudent').value,score:Number(page('sgScore').value||0),notes:page('sgNotes').value});save(state);renderSG();renderReports();});
  const renderSG=()=>page('sgResults').innerHTML=(state.grades||[]).slice(-8).reverse().map(x=>`<div class="question"><b>${esc(x.name)}</b> — ${x.score}<div>${esc(x.notes)}</div></div>`).join('')||'<span class="muted">لا توجد نتائج.</span>'; renderSG();

  page('odDraw')?.addEventListener('click',()=>{const names=page('odStudents').value.split('\n').map(x=>x.trim()).filter(Boolean);const q=page('odQuestion').value.trim();if(!names.length||!q){page('odResult').textContent='أدخل الطلاب والسؤال أولاً.';return;}page('odResult').textContent=`الطالب المختار: ${names[Math.floor(Math.random()*names.length)]}\n\nالسؤال:\n${q}`;});
  page('odSave')?.addEventListener('click',()=>{state.oralStudents=page('odStudents').value;save(state);});

  page('selfSave')?.addEventListener('click',()=>{const r=document.querySelector('input[name="selfRate"]:checked')?.value;state.self={rate:r||'0',note:page('selfNote').value};save(state);page('selfOut').textContent='تم حفظ تقييمك بنجاح.';page('selfOut').classList.remove('hidden');renderReports();});
  page('esSolve')?.addEventListener('click',()=>{const n=Math.max(1,Number(page('esCount').value)||1),c=Math.min(n,Math.max(0,Number(page('esCorrect').value)||0)),pct=Math.round(c/n*100);page('esOut').textContent=`${page('esTitle').value||'نموذج الاختبار'}\nالنتيجة: ${c} من ${n}\nالنسبة: ${pct}%\nالتقدير: ${pct>=90?'ممتاز':pct>=75?'جيد جداً':pct>=60?'جيد':'يحتاج إلى مراجعة'}`;});

  const renderReports=()=>{page('repStudents').textContent=`إجمالي الطلاب: ${state.students.length}\nالدرجات المسجلة: ${(state.grades||[]).length}`;const days=Object.keys(state.attendance).length;page('repAttendance').textContent=`أيام الحضور المسجلة: ${days}`;page('repSelf').textContent=state.self?.rate?`آخر تقييم: ${state.self.rate}/4\n${state.self.note||''}`:'لا يوجد تقييم بعد.';}; renderReports();

  // Add quick entry cards on dashboard without replacing existing content.
  const qt=document.getElementById('quickTools');
  if(qt){FEATURES.slice(0,8).forEach(([id,label,desc])=>{const b=document.createElement('button');b.className='tool';b.innerHTML=`<strong>${label}</strong><small>${desc}</small>`;b.addEventListener('click',()=>show(id));qt.appendChild(b);});}
})();
