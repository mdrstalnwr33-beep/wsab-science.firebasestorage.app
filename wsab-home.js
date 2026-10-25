(() => {
  const init = () => {
    const dashboard = document.getElementById('dashboard');
    if (!dashboard || document.getElementById('wsabHub')) return;

    const style = document.createElement('style');
    style.textContent = `
      #wsabHub{margin:18px 0 6px}
      .wsab-hub-head{display:flex;justify-content:space-between;gap:12px;align-items:end;margin:24px 0 12px}
      .wsab-hub-head h3{margin:0;font-size:21px}
      .wsab-hub-head p{margin:5px 0 0;color:var(--muted);font-size:13px}
      .wsab-hub-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
      .wsab-hub-card{border:1px solid var(--line);background:#fff;border-radius:16px;padding:15px;text-align:right;min-height:116px;box-shadow:var(--shadow);transition:.18s transform,.18s box-shadow;border-top:3px solid var(--hub-color,var(--accent))}
      .wsab-hub-card:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(15,23,42,.10)}
      .wsab-hub-card button{all:unset;display:block;width:100%;cursor:pointer}
      .wsab-hub-icon{font-size:26px;display:block;margin-bottom:8px}
      .wsab-hub-card strong{display:block;font-size:15px;margin-bottom:4px}
      .wsab-hub-card small{display:block;color:var(--muted);line-height:1.6}
      .wsab-hub-strip{display:grid;grid-template-columns:1.5fr repeat(3,1fr);gap:10px;margin-top:12px}
      .wsab-hub-mini{background:var(--soft);border-radius:14px;padding:13px;border:1px solid #d5eee9}
      .wsab-hub-mini b{display:block;color:var(--accent);margin-bottom:3px}
      .wsab-hub-mini span{font-size:12px;color:var(--muted)}
      @media(max-width:1000px){.wsab-hub-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.wsab-hub-strip{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:650px){.wsab-hub-grid,.wsab-hub-strip{grid-template-columns:1fr}.wsab-hub-head{display:block}}
    `;
    document.head.appendChild(style);

    const hub = document.createElement('section');
    hub.id = 'wsabHub';
    hub.innerHTML = `
      <div class="wsab-hub-head">
        <div><h3>🚀 مركز وصاب الذكي</h3><p>كل أدوات المنصة في مكان واحد — اختر ما تريد وابدأ مباشرة.</p></div>
        <span class="pill">منصة العلوم</span>
      </div>
      <div class="wsab-hub-grid">
        <div class="wsab-hub-card" style="--hub-color:#0f766e"><button data-open="تحضير"><span class="wsab-hub-icon">🤖</span><strong>مساعد المعلم الذكي</strong><small>تحضير الدرس، الأهداف، الأنشطة والأفكار بسرعة.</small></button></div>
        <div class="wsab-hub-card" style="--hub-color:#2563eb"><button data-open="المكتبة"><span class="wsab-hub-icon">📚</span><strong>المكتبة العلمية</strong><small>الكتب والملفات والموارد التعليمية.</small></button></div>
        <div class="wsab-hub-card" style="--hub-color:#7c3aed"><button data-open="الدروس"><span class="wsab-hub-icon">🧪</span><strong>بنك الدروس والاختبارات</strong><small>ملخصات، اختبارات رسمية، إلكترونية وواجبات.</small></button></div>
        <div class="wsab-hub-card" style="--hub-color:#0891b2"><button data-open="الاختبارات"><span class="wsab-hub-icon">📝</span><strong>محرر الاختبارات</strong><small>أنشئ أسئلة متعددة الأنواع واحفظها للطباعة أو النشر.</small></button></div>
        <div class="wsab-hub-card" style="--hub-color:#16a34a"><button data-open="الدرجات"><span class="wsab-hub-icon">📊</span><strong>الدرجات والحضور</strong><small>متابعة نتائج الطلاب والحضور في مكان واحد.</small></button></div>
        <div class="wsab-hub-card" style="--hub-color:#ea580c"><button data-open="الفصول"><span class="wsab-hub-icon">☁️</span><strong>الفصول السحابية</strong><small>إنشاء فصل، دعوة الطلاب ونشر الواجبات.</small></button></div>
        <div class="wsab-hub-card" style="--hub-color:#db2777"><button data-open="التصحيح"><span class="wsab-hub-icon">📷</span><strong>التصحيح الذكي</strong><small>مراجعة تسليمات الطلاب وإدخال الدرجات بسرعة.</small></button></div>
        <div class="wsab-hub-card" style="--hub-color:#ca8a04"><button data-open="الإحصائيات"><span class="wsab-hub-icon">📈</span><strong>إحصائيات وصاب</strong><small>نظرة سريعة على الإنجاز، النشاط والملفات.</small></button></div>
      </div>
      <div class="wsab-hub-strip">
        <div class="wsab-hub-mini"><b>🎯 رحلة الطالب</b><span>تعلم → حل → إرسال → تصحيح → متابعة التقدم</span></div>
        <div class="wsab-hub-mini"><b>👨‍🏫 للمعلم</b><span>تحضير وفصول واختبارات ودرجات</span></div>
        <div class="wsab-hub-mini"><b>🏫 للمدرسة</b><span>إدارة ومتابعة وإحصائيات</span></div>
        <div class="wsab-hub-mini"><b>⚡ سريع</b><span>واجهة واحدة للوصول إلى الخدمات</span></div>
      </div>`;

    const stats = document.getElementById('stats');
    if (stats) stats.insertAdjacentElement('afterend', hub); else dashboard.appendChild(hub);

    const aliases = {
      'تحضير':['تحضير جديد','تحضير'],
      'المكتبة':['المكتبة'],
      'الدروس':['دروس واختبارات','الدروس والاختبارات'],
      'الاختبارات':['محرر الاختبارات'],
      'الدرجات':['الدرجات والحضور'],
      'الفصول':['الفصول السحابية'],
      'التصحيح':['التصحيح'],
      'الإحصائيات':['إحصائيات']
    };
    const open = key => {
      const nav = document.getElementById('nav');
      const terms = aliases[key] || [key];
      const btn = [...(nav?.querySelectorAll('button') || [])].find(b => terms.some(t => (b.textContent || '').includes(t)));
      if (btn) { btn.click(); window.scrollTo({top:0,behavior:'smooth'}); return; }
      const fallback = [...document.querySelectorAll('.page')].find(p => p.id === key);
      if (fallback) fallback.classList.add('active');
    };
    hub.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => open(b.dataset.open)));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();
