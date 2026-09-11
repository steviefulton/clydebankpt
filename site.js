(function(){
  var WA_NUMBER = '447376941421';

  var burger = document.querySelector('.burger');
  var menu = document.getElementById('mobile-menu');
  if (burger && menu) {
    if (menu.parentNode !== document.body) { document.body.appendChild(menu); }
    burger.addEventListener('click', function(){
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.textContent = open ? 'Close' : 'Menu';
      document.body.classList.toggle('menu-open', open);
    });
    menu.addEventListener('click', function(e){
      if (e.target.closest('a')) { menu.classList.remove('open'); burger.setAttribute('aria-expanded','false'); burger.textContent = 'Menu'; document.body.classList.remove('menu-open'); }
    });    // A15: Escape closes and returns focus; opening moves focus to the first link
    function closeMenu(){ menu.classList.remove('open'); burger.setAttribute('aria-expanded','false'); burger.textContent = 'Menu'; document.body.classList.remove('menu-open'); }
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && menu.classList.contains('open')) { closeMenu(); burger.focus(); } });
    burger.addEventListener('click', function(){ if (menu.classList.contains('open')) { var f = menu.querySelector('a'); if (f) setTimeout(function(){ f.focus(); }, 60); } });
  }

  // Enquiry form: composes a WhatsApp message and opens the chat. No server needed.
  var form = document.getElementById('wa-form');
  if (form) {
    try {
      var p = new URLSearchParams(location.search).get('p');
      var map = {'8week': '8-Week Package (£205)', '1to1': 'One-to-one PT, 5 weeks (£295)', 'classes': 'Group classes'};
      if (p && map[p]) form.elements['package'].value = map[p];
    } catch (e) {}
    var DRAFT = 'sf_enquiry_draft';
    var filled = function(){
      return form.elements['name'].value.trim() || form.elements['goal'].value.trim() || form.elements['package'].value;
    };
    // The draft stays on this phone. Nothing is sent anywhere until the person presses a button.
    var restore = function(){
      try {
        var d = JSON.parse(localStorage.getItem(DRAFT) || 'null');
        if (!d || !d.name && !d.goal && !d.pkg) return;
        if (d.at && Date.now() - d.at > 1000 * 60 * 60 * 24 * 14) { localStorage.removeItem(DRAFT); return; }
        var n = document.createElement('p');
        n.className = 'form-nudge';
        n.innerHTML = 'You started a message here and did not send it. <button type="button" class="btn btn-ghost" id="draft-restore">Put it back</button> <button type="button" class="btn btn-ghost" id="draft-drop">Start again</button>';
        form.insertBefore(n, form.firstChild);
        document.getElementById('draft-restore').addEventListener('click', function(){
          form.elements['name'].value = d.name || '';
          form.elements['goal'].value = d.goal || '';
          if (d.pkg) form.elements['package'].value = d.pkg;
          n.remove();
          if (window.gtag) gtag('event', 'enquiry_form_resumed', {page: location.pathname});
        });
        document.getElementById('draft-drop').addEventListener('click', function(){ try { localStorage.removeItem(DRAFT); } catch (e) {} n.remove(); });
      } catch (e) {}
    };
    restore();
    var save = function(){
      try { localStorage.setItem(DRAFT, JSON.stringify({name: form.elements['name'].value, goal: form.elements['goal'].value, pkg: form.elements['package'].value, at: Date.now()})); } catch (e) {}
    };
    var abandonTimer = null, abandonSent = false, sent = false;
    var touched = function(){
      save();
      if (abandonTimer) clearTimeout(abandonTimer);
      if (abandonSent || sent) return;
      abandonTimer = setTimeout(function(){
        if (sent || abandonSent || !filled()) return;
        abandonSent = true;
        if (window.gtag) gtag('event', 'enquiry_form_abandoned', {page: location.pathname, filled: filled() ? 1 : 0});
      }, 30000);
    };
    form.addEventListener('input', touched);
    form.addEventListener('change', touched);

    form.addEventListener('submit', function(e){
      e.preventDefault();
      var name = form.elements['name'].value.trim();
      var goal = form.elements['goal'].value.trim();
      var pkg = form.elements['package'].value;
      var msg = 'Hi Stevie, I\'m ' + (name || 'interested') + '. I\'d like to book a free consult.';
      if (pkg) msg += ' I\'m interested in: ' + pkg + '.';
      if (goal) msg += ' My goal: ' + goal;
      msg += ' (via clydebankpt.com' + location.pathname + ')';
      sent = true;
      if (abandonTimer) clearTimeout(abandonTimer);
      try { localStorage.removeItem(DRAFT); sessionStorage.setItem('sf_sent_msg', msg); } catch (e) {}
      var email = e.submitter && e.submitter.dataset && e.submitter.dataset.send === 'email';
      if (window.gtag) gtag('event', 'enquiry_form', {package: pkg || 'unspecified', method: email ? 'email' : 'whatsapp', page: location.pathname});
      if (email) { location.href = 'mailto:sanctuary@clydebankpt.com?subject=' + encodeURIComponent('Free consult (via clydebankpt.com' + location.pathname + ')') + '&body=' + encodeURIComponent(msg); return; }
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
      var done = document.getElementById('wa-done');
      if (done) { done.hidden = false; }
      setTimeout(function(){ location.href = '/thanks/'; }, 900);
    });
  }
})();

(function(){
  var root = document.getElementById('ttx');
  if (!root) return;
  var tabs = root.querySelectorAll('.tt-tab');
  var panels = root.querySelectorAll('.tt-panel');
  var filters = root.querySelectorAll('.tt-filter');
  var label = document.getElementById('tt-today-label');
  var names = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var kind = 'all';
  function show(d){
    tabs.forEach(function(t){ var on = t.getAttribute('data-day') == d; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.classList.toggle('is-on', on); });
    panels.forEach(function(p){ p.hidden = p.getAttribute('data-day') != d; });
    if (label) label.textContent = names[d];
    applyFilter();
  }
  // ROADMAP-4 A17: swipe between days on a phone
  (function(){ var wrap = root.querySelector('.tt-panels'); if (!wrap) return; var x0 = null, y0 = null;
    wrap.addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, {passive: true});
    wrap.addEventListener('touchend', function(e){ if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null; if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
      var cur = 0; tabs.forEach(function(t, i){ if (t.getAttribute('aria-selected') === 'true') cur = i; }); var next = dx < 0 ? Math.min(tabs.length - 1, cur + 1) : Math.max(0, cur - 1); if (next !== cur) tabs[next].click(); }, {passive: true}); })();
  function applyFilter(){
    panels.forEach(function(p){
      var shown = 0;
      p.querySelectorAll('li').forEach(function(li){ var ok = kind === 'all' || li.getAttribute('data-kind') === kind || li.getAttribute('data-when') === kind; li.hidden = !ok; if (ok) shown++; });
      var empty = p.querySelector('.tt-empty');
      if (!empty) { empty = document.createElement('p'); empty.className = 'tt-empty'; empty.textContent = 'Nothing of this type on this day. Try another day.'; p.appendChild(empty); }
      empty.hidden = shown > 0;
    });
  }
  tabs.forEach(function(t){ t.addEventListener('click', function(){ show(+t.getAttribute('data-day')); }); });
  filters.forEach(function(f){ f.addEventListener('click', function(){ kind = f.getAttribute('data-kind'); filters.forEach(function(x){ x.classList.toggle('is-on', x === f); }); try { localStorage.setItem('sf_tt_kind', kind); } catch (e) {} applyFilter(); }); });
  try { var savedKind = localStorage.getItem('sf_tt_kind'); if (savedKind) { filters.forEach(function(x){ if (x.getAttribute('data-kind') === savedKind) { kind = savedKind; filters.forEach(function(y){ y.classList.toggle('is-on', y === x); }); } }); } } catch (e) {}
  var jsDay = new Date().getDay(); // 0 Sun .. 6 Sat
  var start = jsDay === 0 ? 0 : jsDay - 1; if (start > 5) start = 5;
  show(start);
})();

(function(){
  var vids = document.querySelectorAll('video[data-src]');
  var ig = document.getElementById('instagram');
  var igLoaded = false;
  function loadIg(){
    if (igLoaded || document.documentElement.classList.contains('save-data')) return; igLoaded = true;
    var sc = document.createElement('script'); sc.async = true; sc.src = 'https://www.instagram.com/embed.js'; document.body.appendChild(sc);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        var el = en.target;
        if (el.tagName === 'VIDEO') {
          if (en.isIntersecting && !document.documentElement.classList.contains('save-data')) { if (!el.src) { el.src = el.getAttribute('data-src'); } el.play().catch(function(){}); }
          else { el.pause(); }
        } else if (en.isIntersecting) { loadIg(); io.unobserve(el); }
      });
    }, {rootMargin: '200px 0px'});
    vids.forEach(function(v){ io.observe(v); });
    if (ig) io.observe(ig);
  } else {
    vids.forEach(function(v){ v.src = v.getAttribute('data-src'); v.setAttribute('autoplay', ''); });
    loadIg();
  }
})();

(function(){
  // ROADMAP-4 C123: /timetable/#barbell etc. opens the first day with that class and highlights it
  (function(){ var h = (location.hash || '').slice(1).toLowerCase(); if (!h || !document.querySelector('.tt-panels')) return;
    var want = {hiit: 'hiit', barbell: 'barbell', functional: 'functional', 'full-body': 'full body', saturday: 'full body'}[h]; if (!want) return;
    var rows = Array.prototype.filter.call(document.querySelectorAll('.tt-panel li.c'), function(li){ return (li.textContent || '').toLowerCase().indexOf(want) >= 0; }); if (!rows.length) return;
    rows.forEach(function(li){ li.classList.add('hit'); });
    var day = rows[0].closest('.tt-panel').getAttribute('data-day'); var tab = document.querySelector('.tt-tab[data-day="' + day + '"]'); if (tab) tab.click();
    setTimeout(function(){ rows[0].scrollIntoView({block: 'center'}); }, 150); })();
  var el = document.getElementById('tt-status');
  // ROADMAP-4 C94: 'Next class: HIIT at 5:40pm today, in 3h 20m' on home and the timetable
  (function(){ var nc = document.getElementById('next-class'); if (!nc) return; var sch = {"1":[[1060,1110,"HIIT","class"]],"2":[[360,410,"HIIT","class"],[360,410,"Personal Training","pt"],[420,470,"Personal Training","pt"],[480,530,"Personal Training","pt"],[540,590,"Personal Training","pt"],[600,650,"Personal Training","pt"],[960,1010,"Personal Training","pt"],[1060,1110,"Barbell & Dumbbell","class"]],"3":[[360,410,"Barbell & Dumbbell","class"],[360,410,"Personal Training","pt"],[420,470,"Personal Training","pt"],[480,530,"Personal Training","pt"],[540,590,"Personal Training","pt"],[600,650,"Personal Training","pt"],[960,1010,"Personal Training","pt"],[1060,1110,"Functional Fitness","class"]],"4":[[360,410,"Personal Training","pt"],[420,470,"Personal Training","pt"],[480,530,"Personal Training","pt"],[540,590,"Personal Training","pt"],[600,650,"Personal Training","pt"],[1020,1070,"Personal Training","pt"],[1080,1130,"Personal Training","pt"]],"5":[[360,410,"Functional Fitness","class"],[360,410,"Personal Training","pt"],[420,470,"Personal Training","pt"],[480,530,"Personal Training","pt"],[540,590,"Personal Training","pt"],[600,650,"Personal Training","pt"]],"6":[[420,470,"Personal Training","pt"],[480,530,"Personal Training","pt"],[540,590,"Full Body Workout","class"]]}; var names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    function hm(x){ var h = Math.floor(x/60), mm = x%60; var ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + (mm ? ':' + (mm<10?'0':'') + mm : '') + ap; }
    function paint(){ var now = new Date(); var d = now.getDay(); var m = now.getHours()*60 + now.getMinutes();
      for (var i = 0; i < 7; i++) { var dd = (d + i) % 7; var slots = (sch[dd] || []).filter(function(s){ return s[3] === 'class' && (i > 0 || s[0] > m); }); if (slots.length) { var s = slots[0]; var mins = i*1440 + s[0] - m; var when = i === 0 ? 'today' : i === 1 ? 'tomorrow' : names[dd]; var inTxt = mins < 60 ? mins + ' min' : mins < 1440 ? Math.floor(mins/60) + 'h ' + (mins%60) + 'm' : ''; nc.textContent = 'Next class: ' + s[2] + ' at ' + hm(s[0]) + ' ' + when + (inTxt ? ', in ' + inTxt : '') + '.'; nc.hidden = false; return; } }
      nc.hidden = true; }
    paint(); setInterval(paint, 60000); })();
  if (!el) return;
  var sched = {"1":[[1060,1110,"HIIT","class"]],"2":[[360,410,"HIIT","class"],[360,410,"Personal Training","pt"],[420,470,"Personal Training","pt"],[480,530,"Personal Training","pt"],[540,590,"Personal Training","pt"],[600,650,"Personal Training","pt"],[960,1010,"Personal Training","pt"],[1060,1110,"Barbell & Dumbbell","class"]],"3":[[360,410,"Barbell & Dumbbell","class"],[360,410,"Personal Training","pt"],[420,470,"Personal Training","pt"],[480,530,"Personal Training","pt"],[540,590,"Personal Training","pt"],[600,650,"Personal Training","pt"],[960,1010,"Personal Training","pt"],[1060,1110,"Functional Fitness","class"]],"4":[[360,410,"Personal Training","pt"],[420,470,"Personal Training","pt"],[480,530,"Personal Training","pt"],[540,590,"Personal Training","pt"],[600,650,"Personal Training","pt"],[1020,1070,"Personal Training","pt"],[1080,1130,"Personal Training","pt"]],"5":[[360,410,"Functional Fitness","class"],[360,410,"Personal Training","pt"],[420,470,"Personal Training","pt"],[480,530,"Personal Training","pt"],[540,590,"Personal Training","pt"],[600,650,"Personal Training","pt"]],"6":[[420,470,"Personal Training","pt"],[480,530,"Personal Training","pt"],[540,590,"Full Body Workout","class"]]}; // generated from data/site.json at build time
  var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var now = new Date(); var d = now.getDay(); var m = now.getHours()*60 + now.getMinutes();
  var slots = sched[d] || []; var open = null; var next = null; var nextDay = null;
  slots.forEach(function(s){ if (!open && m >= s[0] && m < s[1]) open = s; if (!next && s[0] > m) next = s; });
  if (!open && !next) { for (var i = 1; i <= 7 && !next; i++) { var dd = (d + i) % 7; if ((sched[dd] || []).length) { next = sched[dd][0]; nextDay = i === 1 ? 'tomorrow' : dayNames[dd]; } } }
  function hm(x){ var h = Math.floor(x/60), mm = x%60; var ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + (mm ? ':' + (mm<10?'0':'') + mm : '') + ap; }
  function label(s){ return (s[3] === 'class' ? s[2] : 'Personal Training') + ' at ' + hm(s[0]); }
  el.textContent = open ? 'Running now: ' + label(open) + ' · ' : (next ? 'Next: ' + label(next) + (nextDay ? ' ' + nextDay : ' today') + ' · ' : '');
  el.classList.toggle('is-open', !!open);
})();
(function(){
  var b = document.createElement('a'); b.href = '#top'; b.className = 'totop'; b.setAttribute('aria-label', 'Back to top'); b.textContent = '↑';
  // ROADMAP-6 A44: inside a landmark, not loose in the body. axe's region rule flagged .totop on
  // every page it scanned, light and dark, because a bare anchor on <body> belongs to nothing.
  var wrap = document.createElement('nav'); wrap.className = 'totop-wrap'; wrap.setAttribute('aria-label', 'Back to top');
  wrap.appendChild(b); document.body.appendChild(wrap);
  var on = false;
  window.addEventListener('scroll', function(){ var s = window.scrollY > 1200; if (s !== on) { on = s; b.classList.toggle('show', s); } }, {passive:true});
  b.addEventListener('click', function(e){ e.preventDefault(); window.scrollTo({top:0, behavior:'smooth'}); });
})();
(function(){
  var a = document.querySelector('.callbar a[data-label]'); if (!a) return;
  var p = location.pathname; var t = 'WhatsApp';
  if (p.indexOf('8-week') > -1) t = 'Ask about £205'; else if (p.indexOf('one-to-one') > -1) t = 'Ask about 1-to-1'; else if (p.indexOf('classes') > -1 || p.indexOf('timetable') > -1) t = 'Book a free consult';
  var svg = a.querySelector('svg'); a.textContent = ''; if (svg) a.appendChild(svg); a.appendChild(document.createTextNode(t));
})();

(function(){
  var heroV = '';
  try {
    var hs = document.getElementById('hero-sub');
    if (hs) {
      heroV = localStorage.getItem('sf_hero') || (Math.random() < 0.5 ? 'A' : 'B');
      try { localStorage.setItem('sf_hero', heroV); } catch (e) {}
      if (heroV === 'B' && hs.getAttribute('data-b')) hs.textContent = hs.getAttribute('data-b');
    }
  } catch (e) {}
  function send(name, params){ try { params = params || {}; if (heroV) params.variant = heroV; if (window.gtag) gtag('event', name, params); } catch (e) {} }
  if (heroV) send('hero_view', {page: location.pathname});
  document.addEventListener('click', function(e){
    var a = e.target.closest('a'); if (!a) return;
    var h = a.getAttribute('href') || '';
    if (h.indexOf('wa.me') > -1) send('whatsapp_click', {location: a.closest('section') ? (a.closest('section').id || a.closest('section').className) : (a.closest('.callbar') ? 'callbar' : a.closest('.nav') ? 'nav' : 'other'), page: location.pathname});
    else if (h.indexOf('tel:') === 0) send('call_click', {page: location.pathname});
    else if (h.indexOf('mailto:') === 0) send('email_click', {page: location.pathname});
    else if (h.indexOf('/calendar/') > -1) send('calendar_add', {file: h});
    else if (h.indexOf('instagram.com') > -1 || h.indexOf('facebook.com') > -1) send('social_click', {url: h});
  }, {passive: true});
  var f = document.getElementById('wa-form');
  if (f) f.addEventListener('submit', function(){ send('enquiry_form', {package: f.elements['package'].value || 'unspecified', page: location.pathname}); });
  var seen = false;
  window.addEventListener('scroll', function(){ if (!seen && window.scrollY > document.body.scrollHeight * 0.6) { seen = true; send('scroll_60', {page: location.pathname}); } }, {passive: true});
})();

(function(){
  var els = document.querySelectorAll('.cd[data-start]'); if (!els.length) return;
  function tick(){
    var now = Date.now();
    els.forEach(function(el){
      var t = new Date(el.getAttribute('data-start')).getTime(); var d = t - now;
      // ROADMAP-6 E210: a page that is not rebuilt kept saying "this week" however many weeks passed.
      if (d <= 0) {
        var since = Math.floor(-d / 86400000);
        el.textContent = since <= 7 ? 'Started this week. Message Stevie to join late. '
          : (since < 56 ? 'That block is under way. Message Stevie for the next start date. '
                        : 'Message Stevie for the next start date. ');
        return;
      }
      var days = Math.floor(d / 86400000), hrs = Math.floor((d % 86400000) / 3600000);
      el.textContent = (days > 0 ? days + (days === 1 ? ' day to go. ' : ' days to go. ') : (hrs > 0 ? hrs + (hrs === 1 ? ' hour to go. ' : ' hours to go. ') : 'Starts today. '));
    });
  }
  tick(); setInterval(tick, 60000);
})();

(function(){
  var root=document.documentElement;
  try{ var th=localStorage.getItem('sf_theme'); if(th) root.setAttribute('data-theme',th); if(localStorage.getItem('sf_text')==='big') root.classList.add('big-text'); if(localStorage.getItem('sf_data')==='1'){ root.classList.add('save-data'); var pb=document.querySelector('.pref[data-pref=data]'); if(pb) pb.textContent='Save data: on'; } }catch(e){}
  document.querySelectorAll('.pref').forEach(function(b){ b.addEventListener('click',function(){
    if(b.dataset.pref==='theme'){ var cur=root.getAttribute('data-theme'); var dark=cur?cur==='dark':!window.matchMedia('(prefers-color-scheme: light)').matches; var next=dark?'light':'dark'; root.setAttribute('data-theme',next); try{localStorage.setItem('sf_theme',next);}catch(e){} }
    else if(b.dataset.pref==='data'){ root.classList.toggle('save-data'); try{localStorage.setItem('sf_data',root.classList.contains('save-data')?'1':'');}catch(e){} b.textContent=root.classList.contains('save-data')?'Save data: on':'Save data'; }
    else { root.classList.toggle('big-text'); try{localStorage.setItem('sf_text',root.classList.contains('big-text')?'big':'');}catch(e){} }
  }); });
  var f=document.querySelector('input.filter'); if(!f) return;
  var items=[].slice.call(document.querySelectorAll('.guide-card, .faq-page details, .faq details'));
  f.addEventListener('input',function(){ var q=f.value.trim().toLowerCase(); items.forEach(function(el){ var hide=q.length>1 && el.textContent.toLowerCase().indexOf(q)<0; el.style.display=hide?'none':''; }); });
})();

// Callback picker: builds the WhatsApp and email links from the two selects.
(function(){
  var t=document.getElementById('cb-time'), a=document.getElementById('cb-about'), w=document.getElementById('cb-wa'), e=document.getElementById('cb-email');
  if(!t||!a||!w||!e) return;
  function upd(){
    var msg='Hi Stevie, can you call me back? Best time is '+t.value.toLowerCase()+'. It is about: '+a.value+'. (via clydebankpt.com/contact)';
    w.href='https://wa.me/447376941421?text='+encodeURIComponent(msg);
    e.href='mailto:sanctuary@clydebankpt.com?subject='+encodeURIComponent('Call me back')+'&body='+encodeURIComponent(msg+String.fromCharCode(10,10)+'My number: ');
  }
  t.addEventListener('change',upd); a.addEventListener('change',upd); upd();
})();

// Health questionnaire: builds a WhatsApp or email message from the form. Nothing is sent to a server.
(function(){
  var f=document.getElementById('parq'); if(!f) return;
  var send='email';
  f.querySelectorAll('button[data-send]').forEach(function(b){ b.addEventListener('click', function(){ send=b.getAttribute('data-send'); }); });
  f.addEventListener('submit', function(e){
    e.preventDefault();
    var d=new FormData(f), lines=['Health questionnaire for Sanctuary Fitness'];
    lines.push('Name: '+(d.get('name')||'')); lines.push('DOB: '+(d.get('dob')||'')); lines.push('Mobile: '+(d.get('phone')||''));
    var yes=[]; f.querySelectorAll('fieldset.pq').forEach(function(fs,i){ var v=fs.querySelector('input:checked'); if(v&&v.value==='Yes') yes.push(String(i+1)); });
    lines.push('Answered YES to questions: '+(yes.length?yes.join(', '):'none'));
    if(d.get('notes')) lines.push('Notes: '+d.get('notes'));
    lines.push('Emergency contact: '+(d.get('ec_name')||'')+' ('+(d.get('ec_rel')||'')+') '+(d.get('ec_phone')||''));
    lines.push('Photo and results consent: '+(d.get('photo_consent')||'not answered')); lines.push('Monthly email: '+(d.get('newsletter')?'Yes':'No')); lines.push('Terms read and agreed: yes ('+new Date().toLocaleDateString('en-GB')+')');
    lines.push('Confirmed true by me. (via clydebankpt.com/health-questionnaire)');
    var msg=lines.join(String.fromCharCode(10));
    if(send==='email') location.href='mailto:sanctuary@clydebankpt.com?subject='+encodeURIComponent('Health questionnaire: '+(d.get('name')||''))+'&body='+encodeURIComponent(msg);
    else window.open('https://wa.me/447376941421?text='+encodeURIComponent(msg),'_blank','noopener');
  });
})();

// Drink calculator: sums units and calories from the per-week inputs.
(function(){
  var out=document.getElementById('alc-out'); if(!out) return;
  var ins=document.querySelectorAll('input.alc'), u=document.getElementById('alc-units'), k=document.getElementById('alc-kcal'), n=document.getElementById('alc-note'), wa=document.getElementById('alc-wa');
  function upd(){
    var units=0, kcal=0;
    ins.forEach(function(i){ var v=parseFloat(i.value)||0; units+=v*parseFloat(i.getAttribute('data-u')); kcal+=v*parseInt(i.getAttribute('data-k'),10); });
    u.textContent=Math.round(units*10)/10; k.textContent=Math.round(kcal);
    try{ localStorage.setItem('sf_alcohol', JSON.stringify({units:Math.round(units*10)/10, kcal:Math.round(kcal), at:Date.now()})); }catch(e){}
    var msg;
    if(kcal===0) msg='Type your week above.';
    else if(units<=14) msg='Under the 14-unit guideline. '+Math.round(kcal)+' kcal is about '+(kcal/250).toFixed(1)+' extra days of food over the week; worth knowing, not worth panicking about.';
    else msg='Over the 14-unit guideline. '+Math.round(kcal)+' kcal a week from drink is roughly '+Math.round(kcal/3500*8*100)/100+' lb of fat loss per 8-week block going the other way. One swap fixes half of it.';
    n.textContent=msg;
    if(wa) wa.href='https://wa.me/447376941421?text='+encodeURIComponent('Hi Stevie, my normal week is about '+Math.round(units)+' units and '+Math.round(kcal)+' kcal from drink. Can we build the plan around that? (via clydebankpt.com/tools/alcohol)');
  }
  ins.forEach(function(i){ i.addEventListener('input',upd); i.addEventListener('change',upd); }); upd();
})();

// Daily habit ticks on the tracker page, kept on the phone for seven days.
function sfHabits(){
  var g=document.querySelector('.habit-grid'); if(!g||g.dataset.ready) return; g.dataset.ready='1';
  var names=g.getAttribute('data-habits').split('|'), KEY='sf_habits_v1', today=new Date().toISOString().slice(0,10), data={};
  try{ data=JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ data={}; }
  Object.keys(data).forEach(function(d){ if((new Date(today)-new Date(d))/86400000>7) delete data[d]; });
  var day=data[today]||{};
  names.forEach(function(n,i){
    var l=document.createElement('label'); l.className='habit'; var c=document.createElement('input'); c.type='checkbox'; c.checked=!!day[i];
    c.addEventListener('change',function(){ day[i]=c.checked; data[today]=day; try{ localStorage.setItem(KEY,JSON.stringify(data)); }catch(e){} week(); });
    l.appendChild(c); l.appendChild(document.createTextNode(' '+n)); g.appendChild(l);
  });
  var w=document.getElementById('habit-week');
  function week(){ var days=Object.keys(data).length, ticks=0; Object.keys(data).forEach(function(d){ Object.keys(data[d]).forEach(function(k){ if(data[d][k]) ticks++; }); });
    w.textContent=days?('Last '+days+' day'+(days===1?'':'s')+': '+ticks+' of '+(days*names.length)+' ticks.'):'Nothing ticked yet this week.'; }
  week();
}
sfHabits(); document.addEventListener('sf:open', sfHabits);

// Photo compare (local only): two file inputs -> side by side plus an opacity overlay. Nothing leaves the device.
function sfPhotoCompare(){
  var a=document.getElementById('pc-a'), b=document.getElementById('pc-b'); if(!a||!b||a.dataset.ready) return; a.dataset.ready='1';
  var stage=document.getElementById('pc-stage'), ia=document.getElementById('pc-img-a'), ib=document.getElementById('pc-img-b'), oa=document.getElementById('pc-ov-a'), ob=document.getElementById('pc-ov-b'), r=document.getElementById('pc-range');
  function load(inp, img, ov){ var f=inp.files && inp.files[0]; if(!f) return; var url=URL.createObjectURL(f); img.src=url; ov.src=url; stage.hidden=false; }
  a.addEventListener('change', function(){ load(a, ia, oa); });
  b.addEventListener('change', function(){ load(b, ib, ob); });
  r.addEventListener('input', function(){ ob.style.opacity = (r.value/100); });
}
sfPhotoCompare(); document.addEventListener('sf:open', sfPhotoCompare);

// Shopping list: ticked recipes -> merged ingredient list -> WhatsApp link and copy button.
(function(){
  var boxes=document.querySelectorAll('input.sl'); if(!boxes.length) return;
  var out=document.getElementById('sl-text'), wa=document.getElementById('sl-wa'), cp=document.getElementById('sl-copy'); var NL=String.fromCharCode(10);
  function build(){
    var items={}, meals=[];
    boxes.forEach(function(c){ if(!c.checked) return; meals.push(c.parentNode.querySelector('b').textContent); c.getAttribute('data-ing').split('|').forEach(function(i){ var k=i.toLowerCase(); items[k]=(items[k]||0)+1; }); });
    var keys=Object.keys(items).sort();
    if(!keys.length){ out.textContent='Tick a meal above.'; wa.href='https://wa.me/?text='; return ''; }
    var lines=keys.map(function(k){ return (items[k]>1? k+' (x'+items[k]+')' : k); });
    out.innerHTML='<b>Meals:</b> '+meals.join(', ')+'<br><br>'+lines.map(function(l){ return '&#9744; '+l.charAt(0).toUpperCase()+l.slice(1); }).join('<br>');
    var text='Shopping list ('+meals.join(', ')+'):'+NL+lines.map(function(l){ return '- '+l; }).join(NL)+NL+NL+'clydebankpt.com/tools/shopping-list';
    wa.href='https://wa.me/?text='+encodeURIComponent(text); return text;
  }
  boxes.forEach(function(c){ c.addEventListener('change', build); });
  cp.addEventListener('click', function(){ var t=build(); if(!t) return; try{ navigator.clipboard.writeText(t).then(function(){ cp.textContent='Copied'; setTimeout(function(){ cp.textContent='Copy the list'; },1500); }); }catch(e){} });
})();

// Offline copy of the pages people open most (roadmap B102/B103). Network first; the worker only answers when the network fails.
if ('serviceWorker' in navigator) { window.addEventListener('load', function(){ navigator.serviceWorker.register('/sw.js').catch(function(){}); }); }

// Roadmap A50: which sections get seen (one event per section per page view) and how far people scroll.
(function(){
  if (!('IntersectionObserver' in window)) return;
  function send(name, params){ try { if (window.gtag) gtag('event', name, params || {}); } catch (e) {} }
  var secs = Array.prototype.slice.call(document.querySelectorAll('main section[id], main section[class]')).filter(function(s){ return s.id || s.className; });
  var seen = {};
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (!en.isIntersecting) return;
      var k = en.target.id || en.target.className.split(' ')[0];
      if (seen[k]) return; seen[k] = 1; io.unobserve(en.target);
      send('section_view', {section: k, page: location.pathname});
    });
  }, {threshold: 0.4});
  secs.forEach(function(s){ io.observe(s); });
  var marks = [25, 50, 75, 100], hit = {};
  window.addEventListener('scroll', function(){
    var h = document.documentElement; var pct = Math.round((h.scrollTop + window.innerHeight) / h.scrollHeight * 100);
    marks.forEach(function(m){ if (pct >= m && !hit[m]) { hit[m] = 1; send('scroll_depth', {percent: m, page: location.pathname}); } });
  }, {passive: true});
})();

// Roadmap A68: recipe of the week, rotates every Monday through the recipe bank.
(function(){
  var el = document.getElementById('row-name'); if (!el) return;
  var R = [["Chicken fajita tray","15 min","520 kcal","48g","Chicken breast strips, peppers, onion, fajita spice, wraps. Tray, 200\u00b0C, 15 minutes. Yoghurt on top, not sour cream."],["Ten-minute prawn rice","10 min","480 kcal","34g","Microwave rice, frozen prawns, frozen peas, egg, soy, chilli. One pan, one wok if you have it."],["Turkey chilli, four portions","30 min","450 kcal","42g","Turkey mince, tin tomatoes, kidney beans, onion, chilli, cumin. Freezes. Rice or jacket on the side."],["Big breakfast eggs","8 min","420 kcal","30g","Three eggs, two slices wholemeal toast, tomatoes, a handful of spinach wilted in the pan."],["Greek yoghurt bowl","3 min","350 kcal","30g","200g Greek yoghurt 0%, 40g oats, berries, a spoon of peanut butter. The default breakfast for a reason."],["Salmon and new potatoes","20 min","550 kcal","36g","Salmon fillet, boiled new potatoes, broccoli, lemon, black pepper. Nothing to it."],["Tuna pasta, no cream","15 min","520 kcal","38g","Wholewheat pasta, tin tuna, sweetcorn, cherry tomatoes, light mayo, black pepper."],["Beef stir-fry","15 min","500 kcal","40g","Lean beef strips, frozen stir-fry veg, soy, garlic, ginger, microwave rice."],["Chicken curry, four portions","35 min","480 kcal","40g","Chicken thighs, onion, curry paste, tin tomatoes, light coconut milk, spinach at the end. Rice or naan, not both."],["Cottage cheese toast","5 min","380 kcal","28g","Two slices wholemeal, 150g cottage cheese, sliced tomato, pepper. Weird until you try it."],["Lentil and chorizo soup","30 min","420 kcal","24g","Red lentils, a little chorizo, carrot, onion, stock. A pot lasts three days."],["Steak and eggs","12 min","520 kcal","50g","Rump steak, two eggs, mushrooms, a tomato. Saturday post-class."],["Chicken Caesar wrap","8 min","450 kcal","38g","Cooked chicken, lettuce, parmesan, light Caesar dressing, one large wrap."],["Overnight oats","5 min","400 kcal","25g","Oats, milk, a scoop of protein, berries. Made the night before the @@EARLY_TIME@@ class."],["Jacket potato and tuna","6 min microwave","480 kcal","36g","Tuna, light mayo, sweetcorn, on a jacket. Side salad. Office lunch sorted."],["Egg fried rice, proper","12 min","450 kcal","26g","Cold rice, three eggs, peas, spring onion, soy. Add chicken for more protein."],["Chicken and halloumi tray","25 min","560 kcal","48g","Chicken breast, halloumi, peppers, courgette, olive oil, oregano. 200\u00b0C."],["Cod in the bag","20 min","380 kcal","34g","Cod, cherry tomatoes, lemon, herbs, folded in foil. Serve with rice."],["Beef and bean burrito bowl","15 min","550 kcal","42g","Lean mince, black beans, rice, salsa, a little cheese, lettuce. No tortilla, less mess."],["Protein pancakes","10 min","400 kcal","32g","One banana, two eggs, a scoop of protein, 30g oats blended. Fry in batches."],["Chicken noodle soup","25 min","420 kcal","35g","Chicken, stock, noodles, carrot, sweetcorn, spring onion. Sick day or cold night."],["Turkey burgers","20 min","480 kcal","40g","Turkey mince, egg, breadcrumbs, spices. Bun, salad, done. Makes four."],["Smoked mackerel salad","5 min","450 kcal","28g","Smoked mackerel, new potatoes, rocket, beetroot, horseradish. No cooking."],["Prawn linguine","15 min","500 kcal","32g","Wholewheat linguine, prawns, garlic, chilli, cherry tomatoes, a squeeze of lemon."],["Tofu and veg stir-fry","15 min","420 kcal","24g","Firm tofu, frozen veg, soy, sesame, rice. The vegetarian default."],["Chicken tikka skewers","20 min","380 kcal","42g","Chicken breast in yoghurt and tikka spice, grilled. Salad and a wholemeal pitta."],["Quick beef ragu","30 min","520 kcal","38g","Lean mince, tin tomatoes, onion, garlic, oregano, wholewheat pasta. Doubles for tomorrow."],["Baked beans on toast, upgraded","6 min","420 kcal","24g","Half a tin of beans, two poached eggs, two slices wholemeal. Cheap, fast, decent."],["Chicken and sweet potato","30 min","500 kcal","45g","Chicken breast, sweet potato wedges, green beans. The meal-prep classic."],["Protein porridge","5 min","380 kcal","28g","50g oats, milk, half a scoop of protein stirred in after cooking, a sliced banana."]];
  var d = new Date(); var jan = new Date(d.getFullYear(), 0, 1); var week = Math.floor(((d - jan) / 86400000 + jan.getDay() + 6) / 7);
  var r = R[week % R.length];
  el.textContent = r[0];
  document.getElementById('row-desc').textContent = r[4];
  document.getElementById('row-meta').textContent = r[1] + ' · ' + r[2] + ' · ' + r[3] + ' protein';
})();

// Roadmap A66: body map.
(function(){
  var wrap = document.querySelector('.bm-wrap'); if (!wrap) return;
  function show(r){
    wrap.querySelectorAll('.bm-panel').forEach(function(p){ p.hidden = p.id !== 'bm-' + r; });
    wrap.querySelectorAll('.bm-region').forEach(function(p){ p.classList.toggle('on', p.getAttribute('data-r') === r); });
    wrap.querySelectorAll('.chip').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-r') === r); });
    var out = wrap.querySelector('.bm-out'); if (out && window.innerWidth < 760) out.scrollIntoView({behavior: 'smooth', block: 'start'});
    var wa = wrap.querySelector('.bm-out a[href^="https://wa.me/"]'); var lab = wrap.querySelector('.chip[data-r="' + r + '"]'); if (wa && lab) { var base = wa.getAttribute('href').split('?')[0]; wa.setAttribute('href', base + '?text=' + encodeURIComponent('SORE: Hi Stevie, my ' + lab.textContent.trim().toLowerCase() + ' is sore. The body map says you train around it. Can I still come this week?')); }
    if (window.gtag) gtag('event', 'body_map', {region: r});
  }
  wrap.addEventListener('click', function(e){ var t = e.target.closest('[data-r]'); if (t) show(t.getAttribute('data-r')); });
  wrap.addEventListener('keydown', function(e){ var t = e.target.closest('.bm-region'); if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); show(t.getAttribute('data-r')); } });
})();

// Roadmap A67: should you train tonight.
(function(){
  var out = document.getElementById('tn-out'); if (!out) return;
  var sched = {"1":[[1060,1110,"HIIT","class"]],"2":[[360,410,"HIIT","class"],[360,410,"Personal Training","pt"],[420,470,"Personal Training","pt"],[480,530,"Personal Training","pt"],[540,590,"Personal Training","pt"],[600,650,"Personal Training","pt"],[960,1010,"Personal Training","pt"],[1060,1110,"Barbell & Dumbbell","class"]],"3":[[360,410,"Barbell & Dumbbell","class"],[360,410,"Personal Training","pt"],[420,470,"Personal Training","pt"],[480,530,"Personal Training","pt"],[540,590,"Personal Training","pt"],[600,650,"Personal Training","pt"],[960,1010,"Personal Training","pt"],[1060,1110,"Functional Fitness","class"]],"4":[[360,410,"Personal Training","pt"],[420,470,"Personal Training","pt"],[480,530,"Personal Training","pt"],[540,590,"Personal Training","pt"],[600,650,"Personal Training","pt"],[1020,1070,"Personal Training","pt"],[1080,1130,"Personal Training","pt"]],"5":[[360,410,"Functional Fitness","class"],[360,410,"Personal Training","pt"],[420,470,"Personal Training","pt"],[480,530,"Personal Training","pt"],[540,590,"Personal Training","pt"],[600,650,"Personal Training","pt"]],"6":[[420,470,"Personal Training","pt"],[480,530,"Personal Training","pt"],[540,590,"Full Body Workout","class"]]}; var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  function hm(x){ var h = Math.floor(x/60), mm = x%60; var ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + (mm ? ':' + (mm<10?'0':'') + mm : '') + ap; }
  function nextClass(){
    var now = new Date(); var d = now.getDay(); var m = now.getHours()*60 + now.getMinutes();
    for (var i = 0; i < 7; i++) { var dd = (d + i) % 7; var slots = (sched[dd] || []).filter(function(s){ return s[3] === 'class' && (i > 0 || s[0] > m); }); if (slots.length) return {s: slots[0], when: i === 0 ? 'tonight' : (i === 1 ? 'tomorrow' : 'on ' + dayNames[dd])}; }
    return null;
  }
  var ids = ['tn-sleep', 'tn-stress', 'tn-energy'];
  function run(){
    ids.forEach(function(id){ document.getElementById(id + '-out').textContent = document.getElementById(id).value; });
    var sleep = +document.getElementById('tn-sleep').value, stress = +document.getElementById('tn-stress').value, energy = +document.getElementById('tn-energy').value, sore = document.getElementById('tn-sore').value;
    var nc = nextClass(); var nextEl = document.getElementById('tn-next');
    nextEl.textContent = nc ? 'Next on the timetable: ' + nc.s[2] + ' at ' + hm(nc.s[0]) + ' ' + nc.when + '.' : 'Nothing on the timetable just now.';
    var tl = document.getElementById('tn-list'); if (tl) { var now2 = new Date(), m2 = now2.getHours() * 60 + now2.getMinutes(); var left = (sched[now2.getDay()] || []).filter(function(s){ return s[0] > m2; }); tl.innerHTML = ''; left.slice(0, 6).forEach(function(s){ var li = document.createElement('li'); var mins = s[0] - m2; li.textContent = hm(s[0]) + ' ' + s[2] + (s[3] === 'class' ? '' : ' (booked)') + ' · in ' + (mins >= 60 ? Math.floor(mins / 60) + 'h ' : '') + (mins % 60) + 'm'; tl.appendChild(li); }); if (!left.length) { var li0 = document.createElement('li'); li0.className = 'muted'; li0.textContent = 'Nothing else on today.'; tl.appendChild(li0); } }
    var score = (sleep >= 7 ? 2 : sleep >= 5.5 ? 1 : 0) + (stress <= 2 ? 2 : stress <= 3 ? 1 : 0) + (energy >= 4 ? 2 : energy >= 3 ? 1 : 0);
    var v, n;
    if (score >= 5) { v = 'Come in and go for it.'; n = 'You are rested and switched on. This is the night to add weight or chase the finisher.'; }
    else if (score >= 3) { v = 'Come in, work at about 80%.'; n = 'Normal night. Train, leave one rep in the tank on the big lifts, skip nothing.'; }
    else if (score >= 1) { v = 'Come in, but dial it right down.'; n = 'Short sleep or a rough day. Lighter weights, the low-impact option in HIIT, no finisher. You will sleep better for it. Tell me at the door and I will scale the session for you.'; }
    else { v = 'Walk, eat, bed. Train tomorrow.'; n = 'Under five hours, fried and flat is the one combination where a session costs more than it gives. A 30-minute walk and an early night, then message me tomorrow.'; }
    if (sore !== 'none' && score >= 1) n += ' Sore ' + (sore === 'legs' ? 'legs' : sore === 'upper' ? 'shoulders or arms' : 'back') + ': we work around it, so still come. Say it before the warm-up.';
    document.getElementById('tn-verdict').textContent = v; document.getElementById('tn-note').textContent = n;
    var wa = document.getElementById('tn-wa'); if (wa && nc) { var base = wa.href.split('?text=')[0]; wa.href = base + '?text=' + encodeURIComponent('Hi Stevie, I am coming to ' + nc.s[2] + ' at ' + hm(nc.s[0]) + ' ' + nc.when + '. Slept ' + sleep + 'h, stress ' + stress + '/5, energy ' + energy + '/5' + (sore !== 'none' ? ', ' + sore + ' a bit sore' : '') + '.'); }
  }
  ids.concat(['tn-sore']).forEach(function(id){ document.getElementById(id).addEventListener('input', run); });
  run();
})();

// Roadmap B74: meal builder.
(function(){
  var list = document.getElementById('mb-list'); if (!list) return;
  var F = [["Chicken breast, cooked",100,"g",165,31,0,3.6],["Chicken thigh, cooked, skinless",100,"g",209,26,0,11],["Turkey mince 2%, cooked",100,"g",150,30,0,3],["Beef mince 5%, cooked",100,"g",170,27,0,6],["Salmon fillet, cooked",100,"g",208,22,0,13],["Cod or haddock, cooked",100,"g",105,24,0,1],["Tuna, tinned in spring water, drained",100,"g",110,25,0,1],["Prawns, cooked",100,"g",99,24,0,1],["Egg, large",1,"egg",78,6.5,0.5,5.5],["Egg whites",100,"g",52,11,0.7,0.2],["Greek yoghurt 0%",100,"g",57,10,4,0.2],["Cottage cheese",100,"g",98,11,3,4],["Skyr",100,"g",63,11,4,0.2],["Semi-skimmed milk",100,"ml",47,3.5,4.8,1.7],["Whey protein scoop",1,"scoop",120,24,3,2],["Cheddar",30,"g",125,7.5,0,10.5],["Tofu, firm",100,"g",117,12,2,7],["Quorn pieces",100,"g",94,14,3,2.7],["Lentils, cooked",100,"g",116,9,20,0.4],["Chickpeas, tinned, drained",100,"g",139,7,22,2.5],["Kidney beans, tinned, drained",100,"g",100,7,15,0.7],["Baked beans",100,"g",80,5,13,0.4],["Basmati rice, cooked",100,"g",130,3,28,0.4],["Microwave rice pouch",1,"pouch",330,7,68,2.5],["Pasta, cooked",100,"g",131,5,25,1.1],["Potato, boiled",100,"g",87,2,20,0.1],["Jacket potato, medium",1,"potato",190,4.5,43,0.3],["Sweet potato, baked",100,"g",90,2,21,0.2],["Wholemeal bread, slice",1,"slice",90,4,15,1.2],["Wrap, tortilla",1,"wrap",190,5,32,4.5],["Oats",40,"g",150,5,24,3],["Banana, medium",1,"banana",105,1.3,27,0.4],["Apple, medium",1,"apple",95,0.5,25,0.3],["Berries",100,"g",45,1,9,0.3],["Broccoli, cooked",100,"g",35,2.4,7,0.4],["Mixed veg, frozen, cooked",100,"g",60,3,10,0.5],["Salad, big bowl",1,"bowl",30,2,5,0.3],["Peppers and onion, cooked",100,"g",40,1,8,0.5],["Avocado, half",1,"half",120,1.5,6,11],["Peanut butter",15,"g",90,4,3,7.5],["Olive oil",10,"ml",90,0,0,10],["Butter",10,"g",74,0,0,8],["Hummus",30,"g",90,2.4,4,7],["Fajita or curry sauce, jar",100,"g",90,1.5,10,5],["Protein bar",1,"bar",200,20,18,7],["Beer, pint of lager",1,"pint",210,1.5,15,0],["Wine, 175ml glass",1,"glass",160,0,4,0],["Chocolate, 4 squares",1,"serve",130,1.5,14,7.5]]; var plate = [];
  function n1(x){ return Math.round(x * 10) / 10; }
  function render(){
    list.innerHTML = plate.map(function(p, i){ var f = F[p.i]; return '<li><b>' + f[0] + '</b> × ' + p.q + ' <span class="muted">' + Math.round(f[3]*p.q) + ' kcal · ' + n1(f[4]*p.q) + 'g protein</span> <button type="button" class="chip mb-del" data-i="' + i + '" aria-label="Remove">×</button></li>'; }).join('');
    var k = 0, pr = 0, c = 0, fa = 0;
    plate.forEach(function(p){ var f = F[p.i]; k += f[3]*p.q; pr += f[4]*p.q; c += f[5]*p.q; fa += f[6]*p.q; });
    document.getElementById('mb-kcal').textContent = Math.round(k); document.getElementById('mb-p').textContent = Math.round(pr);
    document.getElementById('mb-c').textContent = Math.round(c); document.getElementById('mb-f').textContent = Math.round(fa);
    var t = +document.getElementById('mb-target').value, pt = +document.getElementById('mb-ptarget').value, msg = [];
    if (t) msg.push(Math.round(k) + ' of your ' + t + ' kcal for the day (' + Math.round(k / t * 100) + '%)');
    if (pt) msg.push(Math.round(pr) + ' of ' + pt + 'g protein');
    if (!plate.length) msg = ['Add something to the plate.'];
    document.getElementById('mb-vs').textContent = msg.join(' · ');
    var wa = document.getElementById('mb-wa');
    wa.href = 'https://wa.me/?text=' + encodeURIComponent('My plate: ' + plate.map(function(p){ return F[p.i][0] + ' x' + p.q; }).join(', ') + '. ' + Math.round(k) + ' kcal, ' + Math.round(pr) + 'g protein, ' + Math.round(c) + 'g carbs, ' + Math.round(fa) + 'g fat. (clydebankpt.com/tools/meal-builder)');
  }
  document.getElementById('mb-add').addEventListener('click', function(){ var i = +document.getElementById('mb-food').value, q = +document.getElementById('mb-qty').value || 1; plate.push({i: i, q: q}); render(); });
  document.getElementById('mb-clear').addEventListener('click', function(){ plate = []; render(); });
  list.addEventListener('click', function(e){ var b = e.target.closest('.mb-del'); if (b) { plate.splice(+b.getAttribute('data-i'), 1); render(); } });
  ['mb-target', 'mb-ptarget'].forEach(function(id){ document.getElementById(id).addEventListener('input', render); });
  render();
})();

// Roadmap B89: mood check-in. Nothing stored, nothing sent.
(function(){
  var r = document.getElementById('md'); if (!r) return;
  var T = {
    1: ['Today is about getting through it.', 'Forget the session. Ring one of the numbers below, or message me and I will ring you. There is no version of this where you are a bother.'],
    2: ['Come in if you can. Say nothing if you want.', 'Low days are the ones training helps most, and nobody in the gym will ask you a thing. A light session and a walk home. If it has been like this for a couple of weeks, the GP line below is the one to use.'],
    3: ['Flat is normal. Move anyway.', 'A session or a thirty-minute walk usually lifts a flat day a notch. Do the easy version and count it.'],
    4: ['Alright is a good day to train properly.', 'Use it. Add a bit to the bar or chase the finisher.'],
    5: ['Good. Bank it.', 'Note what made today good and do it again tomorrow. Then come in and lift something.']
  };
  function run(){ var v = +r.value; document.getElementById('md-out').textContent = v; document.getElementById('md-text').textContent = T[v][0]; document.getElementById('md-note').textContent = T[v][1]; document.getElementById('support').classList.toggle('on', v <= 2); }
  r.addEventListener('input', run); run();
  // ROADMAP-5 B45: a seven-day strip, on this phone only
  (function(){ var strip = document.createElement('div'); strip.className = 'md-strip'; strip.setAttribute('aria-label', 'Your last seven check-ins'); var note = document.getElementById('md-note'); if (!note) return; note.parentNode.insertBefore(strip, note.nextSibling);
    function load(){ try { return JSON.parse(localStorage.getItem('sf_mood') || '{}'); } catch (e) { return {}; } }
    function paint(){ var m = load(); strip.innerHTML = ''; var d = new Date(); d.setDate(d.getDate() - 6); for (var i = 0; i < 7; i++) { var k = d.toISOString().slice(0, 10); var v = m[k]; var b = document.createElement('button'); b.type = 'button'; b.className = 'md-day' + (v ? ' v' + v : ''); b.textContent = ['S','M','T','W','T','F','S'][d.getDay()]; b.title = k + (v ? ': ' + v + ' of 5' : ''); b.setAttribute('aria-label', b.title); (function(val){ b.addEventListener('click', function(){ if (val) { r.value = val; run(); } }); })(v); strip.appendChild(b); d.setDate(d.getDate() + 1); } }
    var saveBtn = document.createElement('button'); saveBtn.type = 'button'; saveBtn.className = 'nut-btn'; saveBtn.textContent = 'Keep today on this phone'; strip.parentNode.insertBefore(saveBtn, strip.nextSibling);
    saveBtn.addEventListener('click', function(){ var m = load(); m[new Date().toISOString().slice(0, 10)] = +r.value; var keys = Object.keys(m).sort(); while (keys.length > 60) { delete m[keys.shift()]; } try { localStorage.setItem('sf_mood', JSON.stringify(m)); } catch (e) {} paint(); if (window.sfToast) sfToast('Kept'); });
    paint(); })();
})();

// Roadmap C157: after a WhatsApp tap on /start, show the reviews line.
(function(){ var p=document.getElementById('st-after');
  document.querySelectorAll('a[href*="wa.me"]').forEach(function(a){ a.addEventListener('click', function(){
    if(p){ p.hidden=false; return; }
    if(document.querySelector('.sent-note')) return;
    var n=document.createElement('div'); n.className='sent-note'; n.setAttribute('role','status');
    n.innerHTML='<b>Sent?</b> I read every message myself and reply as soon as I am off the gym floor. If WhatsApp did not open, text or call <a href="tel:+447376941421">07376 941421</a>.<button type="button" class="x" aria-label="Close">\u00d7</button>';
    document.body.appendChild(n); n.querySelector('.x').addEventListener('click',function(){ n.remove(); });
    setTimeout(function(){ if(n.parentNode) n.remove(); }, 20000);
  }); }); })();

(function(){
  if (location.pathname.indexOf('/8-week-package') !== 0) return;
  try { if (sessionStorage.getItem('sf_nudge')) return; } catch (e) {}
  function send(name){ try { if (window.gtag) gtag('event', name, {page_path: location.pathname}); } catch (e) {} }
  setTimeout(function(){
    if (document.hidden) return;
    var n = document.createElement('div'); n.className = 'nudge'; n.setAttribute('role', 'status');
    n.innerHTML = '<p><b>Want the timetable on your phone?</b> Message me TIMETABLE and I\'ll send this week\'s times and the next start date.</p>' +
      '<a class="btn btn-red" href="https://wa.me/447376941421?text=TIMETABLE%20(via%20clydebankpt.com%2F8-week-package%20after%2040s)" target="_blank" rel="noopener">WhatsApp TIMETABLE</a>' +
      '<button type="button" class="x" aria-label="Close">\u00d7</button>';
    document.body.appendChild(n); send('nudge_view');
    function done(){ n.remove(); try { sessionStorage.setItem('sf_nudge', '1'); } catch (e) {} }
    n.querySelector('.x').addEventListener('click', done);
    n.querySelector('a').addEventListener('click', function(){ send('nudge_click'); done(); });
  }, 40000);
})();


// ROADMAP-4 C109: on a guide, after 60% of the page, one quiet note per session: want this coached?
(function(){
  if (location.pathname.indexOf('/guides/') !== 0 || location.pathname === '/guides/') return;
  try { if (sessionStorage.getItem('sf_guide_nudge')) return; } catch (e) {}
  var shown = false;
  window.addEventListener('scroll', function(){
    if (shown) return; var h = document.documentElement; if ((h.scrollTop + h.clientHeight) / h.scrollHeight < 0.6) return;
    shown = true; try { sessionStorage.setItem('sf_guide_nudge', '1'); } catch (e) {}
    var n = document.createElement('div'); n.className = 'sent-note'; n.setAttribute('role', 'status');
    n.innerHTML = '<b>Want this coached instead of read?</b> Message me START and we sort a free ten-minute consult. <a class="btn btn-red" style="margin-top:8px" href="https://wa.me/447376941421?text=START%20(via%20' + encodeURIComponent('clydebankpt.com' + location.pathname) + ')" target="_blank" rel="noopener">Message START</a><button type="button" class="x" aria-label="Close">\u00d7</button>';
    document.body.appendChild(n); n.querySelector('.x').addEventListener('click', function(){ n.remove(); });
    try { if (window.gtag) gtag('event', 'guide_nudge_view', {page_path: location.pathname}); } catch (e) {}
    setTimeout(function(){ if (n.parentNode) n.remove(); }, 25000);
  }, {passive: true});
})();

// ROADMAP-4 C108: outside 6am to 9pm the Call buttons become Message buttons (nobody answers a phone mid-class or asleep)
(function(){
  var h = new Date().getHours(); if (h >= 6 && h < 21) return;
  document.querySelectorAll('.hero .actions a[href^="tel:"], .cta-band a[href^="tel:"], .mobile-cta a[href^="tel:"]').forEach(function(a){
    a.href = 'https://wa.me/447376941421?text=' + encodeURIComponent('Hi Stevie, can you call me back? Best time is ');
    a.textContent = 'Message me, I call you back'; a.target = '_blank'; a.rel = 'noopener';
  });
})();

// ROADMAP-4 H468: outbound clicks to the app stores, Instagram, Facebook, Google Maps
(function(){
  document.addEventListener('click', function(e){
    var a = e.target.closest('a[href^="http"]'); if (!a) return;
    var m = /apps\.apple|play\.google|instagram\.com|facebook\.com|maps\.apple|google\.com\/maps|tiktok\.com/.exec(a.href); if (!m) return;
    try { if (window.gtag) gtag('event', 'outbound_click', {site: m[0], page_path: location.pathname}); } catch (err) {}
  }, {passive: true});
})();

// ROADMAP-4 A21: native share on guides and the timetable, copy-link fallback
(function(){
  if (!/^\/(guides\/.+|timetable\/)/.test(location.pathname)) return;
  var host = document.querySelector('.byline') || document.querySelector('.tt-share');
  if (!host) return;
  var b = document.createElement('button'); b.type = 'button'; b.className = 'share-btn'; b.textContent = navigator.share ? 'Share this page' : 'Copy link';
  b.addEventListener('click', function(){
    var data = {title: document.title, url: location.href.split('#')[0]};
    try { if (window.gtag) gtag('event', 'share_click', {page_path: location.pathname}); } catch (e) {}
    if (navigator.share) { navigator.share(data).catch(function(){}); return; }
    try { navigator.clipboard.writeText(data.url).then(function(){ b.textContent = 'Link copied'; setTimeout(function(){ b.textContent = 'Copy link'; }, 2000); }); } catch (e) {}
  });
  host.insertAdjacentElement('afterend', b);
})();

// ROADMAP-4 A22: add-to-home-screen prompt on the members area and timetable, once, dismissable
(function(){
  if (!/^\/(members|timetable)\//.test(location.pathname)) return;
  try { if (localStorage.getItem('sf_install_dismissed')) return; } catch (e) {}
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    var n = document.createElement('div'); n.className = 'sent-note install-note'; n.setAttribute('role', 'status');
    n.innerHTML = '<b>Add Sanctuary to your home screen?</b> One tap to the timetable and the members area, works offline.<br><button type="button" class="btn btn-red add">Add</button><button type="button" class="btn btn-ghost no">Not now</button><button type="button" class="x" aria-label="Close">\u00d7</button>';
    document.body.appendChild(n);
    function bye(){ n.remove(); try { localStorage.setItem('sf_install_dismissed', '1'); } catch (err) {} }
    n.querySelector('.add').addEventListener('click', function(){ e.prompt(); try { if (window.gtag) gtag('event', 'install_prompt_accept'); } catch (err) {} bye(); });
    n.querySelector('.no').addEventListener('click', bye); n.querySelector('.x').addEventListener('click', bye);
  });
})();

// ROADMAP-4 C110: scroll depth (50, 90) and first red button seen, once per page view
(function(){
  if (!('IntersectionObserver' in window)) return;
  var sent = {};
  function ev(name, extra){ if (sent[name]) return; sent[name] = true; try { if (window.gtag) gtag('event', name, Object.assign({page_path: location.pathname}, extra || {})); } catch (e) {} }
  window.addEventListener('scroll', function(){
    var h = document.documentElement; var pct = (h.scrollTop + h.clientHeight) / h.scrollHeight;
    if (pct > 0.5) ev('scroll_50'); if (pct > 0.9) ev('scroll_90');
  }, {passive: true});
  var cta = document.querySelector('main .btn-red, .hero .btn-red');
  if (cta) { var io = new IntersectionObserver(function(en){ if (en[0].isIntersecting) { ev('cta_view'); io.disconnect(); } }); io.observe(cta); }
})();


// ROADMAP-4 A13: a plain message under the field instead of the browser bubble
(function(){
  document.querySelectorAll('form').forEach(function(f){
    f.setAttribute('novalidate', '');
    f.addEventListener('submit', function(e){
      var bad = Array.prototype.filter.call(f.querySelectorAll('input, select, textarea'), function(el){ return !el.checkValidity(); });
      f.querySelectorAll('.field-msg').forEach(function(m){ m.remove(); });
      if (!bad.length) return;
      e.preventDefault(); e.stopImmediatePropagation();
      bad.forEach(function(el){
        var m = document.createElement('p'); m.className = 'field-msg small'; m.setAttribute('role', 'alert');
        m.textContent = el.type === 'checkbox' ? 'Tick this box to send it.' : el.validity.valueMissing ? 'This one is needed.' : el.type === 'email' ? 'That does not look like an email address.' : el.type === 'tel' ? 'That does not look like a phone number.' : 'Check this one.';
        var host = el.closest('label') || el; host.insertAdjacentElement('afterend', m);
      });
      bad[0].focus();
    }, true);
  });
})();

// ROADMAP-4 C124: tap a class row on the timetable for a small card with what to bring and a button
(function(){
  var panels = document.querySelector('.tt-panels'); if (!panels) return;
  var wa = document.querySelector('a[href^="https://wa.me/"]'); var base = wa ? wa.getAttribute('href').split('?')[0] : null; if (!base) return;
  var rows = panels.querySelectorAll('li.c');
  var picks = []; try { picks = JSON.parse(localStorage.getItem('sf_tt_picks') || '[]'); } catch (e) {}
  var bar = document.createElement('div'); bar.className = 'tt-planbar'; bar.hidden = true; bar.innerHTML = '<p><b id="tt-plan-n"></b> <span id="tt-plan-list"></span></p><p class="chips-lg"><a class="btn btn-red" id="tt-plan-wa" target="_blank" rel="noopener" href="/start/">Send Stevie my first week</a><button type="button" class="btn btn-ghost" id="tt-plan-done">Done</button></p>'; panels.parentNode.insertBefore(bar, panels.nextSibling);
  var share = document.querySelector('.tt-share'); var planBtn = document.createElement('button'); planBtn.type = 'button'; planBtn.className = 'btn btn-ghost tt-plan-btn'; planBtn.textContent = 'Plan my first week';
  if (share) { share.appendChild(document.createTextNode(' · ')); share.appendChild(planBtn); }
  function key(li){ return li.closest('.tt-panel').querySelector('h3').textContent + ' ' + li.querySelector('.t').textContent + ' ' + li.querySelector('.n').textContent; }
  function paintPicks(){ var base = document.querySelector('a[href^="https://wa.me/"]'); var b = base ? base.getAttribute('href').split('?')[0] : 'https://wa.me/'; Array.prototype.forEach.call(rows, function(li){ li.classList.toggle('picked', picks.indexOf(key(li)) >= 0); }); document.getElementById('tt-plan-n').textContent = picks.length + ' of 3 picked'; document.getElementById('tt-plan-list').textContent = picks.join(' · '); document.getElementById('tt-plan-wa').href = b + '?text=' + encodeURIComponent('FIRST CLASS: Hi Stevie, my first week: ' + (picks.join(', ') || 'still picking') + '. Can I come to those? (via clydebankpt.com/timetable)'); }
  function pick(li){ var k = key(li); var i = picks.indexOf(k); if (i >= 0) picks.splice(i, 1); else { if (picks.length >= 3) picks.shift(); picks.push(k); } try { localStorage.setItem('sf_tt_picks', JSON.stringify(picks)); } catch (e) {} paintPicks(); }
  planBtn.addEventListener('click', function(){ var on = document.documentElement.classList.toggle('tt-plan'); bar.hidden = !on; planBtn.textContent = on ? 'Picking: tap three sessions' : 'Plan my first week'; paintPicks(); if (on && window.gtag) gtag('event', 'timetable_plan'); });
  bar.addEventListener('click', function(e){ if (e.target.id === 'tt-plan-done') planBtn.click(); });
  if (picks.length) paintPicks();
  Array.prototype.forEach.call(rows, function(li){
    // ROADMAP-6 A42: role="button" on an <li> overrides its listitem role, so axe reads the timetable's
    // <ul> as a list containing non-list-items (serious). The row is still a button to a screen reader,
    // but the list stays a list: the li keeps its role and carries the button semantics on itself only
    // where it is not a direct child of a list.
    li.setAttribute('tabindex', '0'); li.setAttribute('aria-expanded', 'false'); li.classList.add('tappable');
    if (!(li.parentElement && /^(UL|OL)$/.test(li.parentElement.tagName))) { li.setAttribute('role', 'button'); }
    function toggle(){
      var open = li.querySelector('.tt-card');
      if (open) { open.remove(); li.setAttribute('aria-expanded', 'false'); return; }
      Array.prototype.forEach.call(panels.querySelectorAll('.tt-card'), function(c){ c.parentNode.setAttribute('aria-expanded', 'false'); c.remove(); });
      var name = (li.querySelector('.n') || {}).textContent || 'the class'; var time = (li.querySelector('.t') || {}).textContent || '';
      var day = (li.closest('.tt-panel').querySelector('h3') || {}).textContent || '';
      var msg = 'FIRST CLASS: Hi Stevie, I would like to come along to ' + name + ' on ' + day + ' at ' + time + '. Is there a place? (via clydebankpt.com/timetable)';
      var card = document.createElement('div'); card.className = 'tt-card';
      card.innerHTML = '<p><b>' + name + '</b>, ' + day + ' ' + time + '. Coached, scaled to you, fifty minutes. Bring trainers with a firm sole, a water bottle and a layer for the walk out; the kit is here.</p>' +
        '<p class="tt-card-actions"><a class="btn btn-red" target="_blank" rel="noopener" href="' + base + '?text=' + encodeURIComponent(msg) + '">Come along to this one</a> <a class="btn btn-ghost" href="/first-visit/">Your first visit</a></p>';
      li.appendChild(card); li.setAttribute('aria-expanded', 'true');
      if (window.gtag) gtag('event', 'timetable_card', {class_name: name, day: day});
    }
    li.addEventListener('click', function(e){ if (e.target.closest('a')) return; if (document.documentElement.classList.contains('tt-plan')) { pick(li); return; } toggle(); });
    li.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });
})();

// ROADMAP-5 A5: reading progress line on guides (the back-to-top button already exists above)
(function(){
  var isGuide = location.pathname.indexOf('/guides/') === 0 && location.pathname !== '/guides/';
  if (!isGuide) return;
  var bar = document.createElement('div'); bar.className = 'readbar'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
  var ticking = false;
  function onScroll(){
    if (ticking) return; ticking = true;
    requestAnimationFrame(function(){
      var y = window.scrollY || document.documentElement.scrollTop; var total = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (total > 0 ? Math.min(100, Math.round(y / total * 100)) : 0) + '%'; ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, {passive: true}); onScroll();
})();

// ROADMAP-5 A6/A7/A8: site search in a dialog over a small index
(function(){
  var openers = document.querySelectorAll('[data-open-search]'); if (!openers.length || !window.fetch) return;
  var dlg = null, input = null, list = null, idx = null, cur = -1;
  var USEFUL = [['/start/', 'Start here'], ['/timetable/', 'Timetable'], ['/prices/', 'Prices'], ['/8-week-package/', '8-Week Package'], ['/one-to-one-personal-training/', 'One-to-one PT'], ['/guides/', 'Guides']];
  function build(){
    dlg = document.createElement('dialog'); dlg.className = 'sdlg'; dlg.setAttribute('aria-label', 'Search the site');
    dlg.innerHTML = '<form class="sform" role="search"><input type="search" name="q" placeholder="Search: timetable, prices, 6am, protein..." autocomplete="off" aria-label="Search"><button type="button" class="sclose" aria-label="Close">Close</button></form><ol class="sres" aria-live="polite"></ol><p class="small snone" hidden>Nothing matched. Most people want one of these:</p><p class="chips-lg snone-links" hidden></p>';
    document.body.appendChild(dlg);
    input = dlg.querySelector('input'); list = dlg.querySelector('.sres');
    dlg.querySelector('.snone-links').innerHTML = USEFUL.map(function(u){ return '<a class="btn btn-ghost" href="' + u[0] + '">' + u[1] + '</a>'; }).join('');
    dlg.querySelector('.sclose').addEventListener('click', close);
    dlg.querySelector('form').addEventListener('submit', function(e){ e.preventDefault(); var a = list.querySelector('a.active') || list.querySelector('a'); if (a) location.href = a.getAttribute('href'); });
    input.addEventListener('input', function(){ render(input.value); });
    dlg.addEventListener('keydown', function(e){
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      var as = list.querySelectorAll('a'); if (!as.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); cur = Math.min(as.length - 1, cur + 1); mark(as); }
      if (e.key === 'ArrowUp') { e.preventDefault(); cur = Math.max(0, cur - 1); mark(as); }
    });
    dlg.addEventListener('click', function(e){ if (e.target === dlg) close(); });
  }
  function mark(as){ as.forEach(function(a, i){ a.classList.toggle('active', i === cur); if (i === cur) a.focus(); }); }
  function norm(s){ return (s || '').toLowerCase().replace(/&amp;/g, '&'); }
  function score(e, terms){
    var t = norm(e.t), d = norm(e.d), h = norm(e.h.join(' ')), u = norm(e.u), s = 0;
    terms.forEach(function(w){ if (t.indexOf(w) >= 0) s += 4; if (u.indexOf(w) >= 0) s += 2; if (h.indexOf(w) >= 0) s += 2; if (d.indexOf(w) >= 0) s += 1; });
    return s;
  }
  function render(q){
    var terms = norm(q).split(/\s+/).filter(function(w){ return w.length > 1; });
    list.innerHTML = ''; cur = -1;
    var none = dlg.querySelectorAll('.snone, .snone-links');
    if (!terms.length || !idx) { none.forEach(function(n){ n.hidden = true; }); return; }
    var hits = idx.map(function(e){ return [score(e, terms), e]; }).filter(function(x){ return x[0] > 0; }).sort(function(a, b){ return b[0] - a[0]; }).slice(0, 8);
    none.forEach(function(n){ n.hidden = hits.length > 0; });
    hits.forEach(function(x){ var e = x[1]; var li = document.createElement('li'); li.innerHTML = '<a href="' + e.u + '"><b></b><span></span></a>'; li.querySelector('b').textContent = e.t; li.querySelector('span').textContent = e.d; list.appendChild(li); });
    if (window.gtag && terms.length) gtag('event', 'site_search', {search_term: terms.join(' '), results: hits.length});
  }
  function open(prefill){
    if (!dlg) build();
    if (!idx) { fetch('/search.json').then(function(r){ return r.json(); }).then(function(j){ idx = j; if (input.value) render(input.value); }).catch(function(){}); }
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    if (prefill) { input.value = prefill; render(prefill); }
    input.focus(); input.select();
  }
  function close(){ if (!dlg) return; if (dlg.open && typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); }
  openers.forEach(function(b){ b.addEventListener('click', function(){ open(''); }); });
  document.addEventListener('keydown', function(e){
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) { var t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return; e.preventDefault(); open(''); }
  });
  if (document.title.indexOf('Page not found') === 0 && /members/i.test(location.pathname)) { var seg = location.pathname.split('/').filter(Boolean).pop() || ''; location.replace('/members/' + (seg && seg !== 'members' ? '#' + seg : '')); return; }
  if (location.pathname === '/404' || document.title.indexOf('Page not found') === 0) { var seg = decodeURIComponent(location.pathname.replace(/[\/-]+/g, ' ')).trim(); if (seg) { setTimeout(function(){ open(seg); }, 300); } }
})();

// ROADMAP-5 round 6: recently viewed, next-step checklist, prices toggle, guides chips, you-are-here, form drafts
(function(){
  var path = location.pathname; var footer = document.querySelector('footer .wrap'); var title = (document.title || '').split(' | ')[0];
  function get(k, d){ try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v === null ? d : v; } catch (e) { return d; } }
  function set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  // A13 recently viewed (this phone only)
  if (footer && path.indexOf('/members') !== 0) {
    var recent = get('sf_recent', []).filter(function(r){ return r.p !== path; });
    var shown = recent.slice(0, 3);
    recent.unshift({p: path, t: title}); set('sf_recent', recent.slice(0, 6));
    if (shown.length) {
      var rv = document.createElement('div'); rv.className = 'recent'; rv.innerHTML = '<p class="eyebrow">You looked at</p><ul class="chips"></ul>';
      shown.forEach(function(r){ var li = document.createElement('li'); var a = document.createElement('a'); a.href = r.p; a.textContent = r.t; li.appendChild(a); rv.querySelector('ul').appendChild(li); });
      footer.insertBefore(rv, footer.firstChild);
    }
  }
  // A14 the three steps, ticked as you go
  if (footer && path.indexOf('/members') !== 0) {
    var steps = get('sf_steps', {});
    if (path === '/prices/') steps.prices = 1; if (path === '/timetable/') steps.timetable = 1;
    document.addEventListener('click', function(e){ var a = e.target.closest && e.target.closest('a[href^="https://wa.me/"]'); if (a) { steps.message = 1; set('sf_steps', steps); } });
    set('sf_steps', steps);
    var st = document.createElement('div'); st.className = 'steps3'; st.innerHTML = '<p class="eyebrow">Your next step</p><ol></ol>';
    [['prices', '/prices/', 'See the two prices'], ['timetable', '/timetable/', 'Pick a first class'], ['message', '/start/', 'Message Stevie']].forEach(function(s){ var li = document.createElement('li'); var a = document.createElement('a'); a.href = s[1]; a.textContent = s[2]; if (steps[s[0]]) li.className = 'done'; li.appendChild(a); st.querySelector('ol').appendChild(li); });
    footer.insertBefore(st, footer.firstChild);
  }
  // A17 prices toggle
  if (path === '/prices/') {
    var grid = document.querySelector('main .pk-grid'); var pks = grid ? grid.querySelectorAll('.pk') : [];
    if (pks.length >= 2) {
      var tg = document.createElement('p'); tg.className = 'chips-lg pk-toggle'; tg.innerHTML = '<button type="button" class="btn btn-ghost" data-pk="0">Classes and small groups</button><button type="button" class="btn btn-ghost" data-pk="1">Just me and the coach</button>';
      grid.parentNode.insertBefore(tg, grid);
      tg.querySelectorAll('button').forEach(function(b){ b.addEventListener('click', function(){ var i = +b.getAttribute('data-pk'); pks.forEach(function(p, j){ p.classList.toggle('pk-hi', j === i); }); pks[i].scrollIntoView({behavior: 'smooth', block: 'center'}); tg.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); }); });
    }
  }
  // A19 guides hub chips
  if (path === '/guides/') {
    var cards = document.querySelectorAll('.guide-card'); var topics = {};
    cards.forEach(function(c){ var e = c.querySelector('.eyebrow'); var t = e ? e.textContent.split('·')[0].trim() : ''; if (t) { c.setAttribute('data-topic', t); topics[t] = (topics[t] || 0) + 1; } });
    var keys = Object.keys(topics).filter(function(k){ return topics[k] >= 2; }).sort(); var host = document.querySelector('.guide-cards');
    if (host && keys.length > 1) {
      var ch = document.createElement('p'); ch.className = 'chips-lg guide-chips'; ch.innerHTML = '<button type="button" class="btn btn-ghost" data-topic="" aria-pressed="true">All</button>';
      keys.forEach(function(k){ var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-ghost'; b.setAttribute('data-topic', k); b.setAttribute('aria-pressed', 'false'); b.textContent = k + ' (' + topics[k] + ')'; ch.appendChild(b); });
      host.parentNode.insertBefore(ch, host);
      ch.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; var t = b.getAttribute('data-topic'); ch.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); cards.forEach(function(c){ c.hidden = !!t && c.getAttribute('data-topic') !== t; }); if (window.gtag) gtag('event', 'guides_filter', {topic: t || 'all'}); });
    }
  }
  // A27 you are here, in the phone menu
  var menu = document.getElementById('mobile-menu');
  if (menu && path !== '/') { var here = document.createElement('p'); here.className = 'mobile-here small muted'; here.textContent = 'You are on: ' + title; menu.insertBefore(here, menu.firstChild); }
  // A29 form drafts (not the members gate, not passwords)
  document.querySelectorAll('form[id]').forEach(function(f){
    if (f.id === 'gate' || f.closest('#members')) return;
    var key = 'sf_draft_' + path + '#' + f.id;
    var fields = Array.prototype.filter.call(f.querySelectorAll('input[name], textarea[name], select[name]'), function(el){ return ['password', 'file', 'submit', 'button', 'hidden'].indexOf(el.type) < 0; });
    if (!fields.length) return;
    var saved = get(key, null);
    if (saved) fields.forEach(function(el){ if (!(el.name in saved)) return; if (el.type === 'checkbox' || el.type === 'radio') { el.checked = saved[el.name] === el.value || saved[el.name] === true; } else if (!el.value) { el.value = saved[el.name]; } });
    f.addEventListener('input', function(){ var d = {}; fields.forEach(function(el){ if (el.type === 'checkbox') { if (el.checked) d[el.name] = el.value || true; } else if (el.type === 'radio') { if (el.checked) d[el.name] = el.value; } else if (el.value) d[el.name] = el.value; }); set(key, d); });
    f.addEventListener('submit', function(){ try { localStorage.removeItem(key); } catch (e) {} });
  });
})();

// ROADMAP-5 round 7: toasts, count-up, stars, FAQ deep links and one-at-a-time, FAQ search across both pages, was-this-useful, glossary cards, copy address
(function(){
  var path = location.pathname; var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.sfToast = function(msg){ var t = document.querySelector('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(function(){ t.classList.remove('show'); }, 2200); };
  // B37 numbers count up once, B49 stars light up
  if ('IntersectionObserver' in window) {
    var nums = document.querySelectorAll('.badge .big, .rating b');
    var io = new IntersectionObserver(function(entries){ entries.forEach(function(en){ if (!en.isIntersecting) return; io.unobserve(en.target); var el = en.target; var node = el.firstChild; if (!node || node.nodeType !== 3) return; var raw = node.nodeValue.trim(); var m = raw.match(/^(\d+(?:\.\d+)?)$/); if (!m || reduce) return; var target = +m[1], dec = (m[1].split('.')[1] || '').length, t0 = performance.now(), done = false; (function step(now){ if (done) return; var k = Math.min(1, (now - t0) / 700); var v = target * (1 - Math.pow(1 - k, 3)); node.nodeValue = v.toFixed(dec); if (k < 1) requestAnimationFrame(step); else { done = true; node.nodeValue = m[1]; } })(t0); setTimeout(function(){ done = true; node.nodeValue = m[1]; }, 900); }); }, {threshold: 0.5});
    nums.forEach(function(n){ io.observe(n); });
    var so = new IntersectionObserver(function(entries){ entries.forEach(function(en){ if (en.isIntersecting) { en.target.classList.add('lit'); so.unobserve(en.target); } }); }, {threshold: 0.5});
    document.querySelectorAll('.stars').forEach(function(s){ so.observe(s); });
  }
  // B48: one open at a time inside a FAQ block, and the URL remembers the question
  document.querySelectorAll('details[id^="q-"]').forEach(function(d){
    d.addEventListener('toggle', function(){ if (!d.open) return; var box = d.parentNode; box.querySelectorAll('details[id^="q-"]').forEach(function(o){ if (o !== d && o.open) o.open = false; }); try { history.replaceState(null, '', '#' + d.id); } catch (e) {} });
  });
  if (location.hash && /^#q-/.test(location.hash)) { var t = document.getElementById(location.hash.slice(1)); if (t && t.tagName === 'DETAILS') { t.open = true; setTimeout(function(){ t.scrollIntoView({block: 'start'}); }, 50); } }
  // A21: search across the FAQ and the questions page
  if (path === '/faq/' || path === '/questions/') {
    var input = document.getElementById('faq-filter');
    if (!input) { var host = document.querySelector('main .questions') || document.querySelector('main .prose'); if (host) { var pf = document.createElement('p'); pf.innerHTML = '<input class="filter" id="faq-filter" type="search" placeholder="Search the questions, e.g. parking, price, kids" aria-label="Search questions">'; host.insertBefore(pf, host.firstChild); input = pf.querySelector('input'); } }
    if (input) {
      var idx = null, other = document.createElement('div'); other.className = 'faq-other'; other.hidden = true; input.parentNode.insertBefore(other, input.nextSibling);
      var local = path === '/faq/' ? Array.prototype.slice.call(document.querySelectorAll('main details')) : Array.prototype.slice.call(document.querySelectorAll('main dl.qa > div'));
      function run(){
        var terms = input.value.toLowerCase().split(/\s+/).filter(function(w){ return w.length > 1; });
        local.forEach(function(el){ var txt = el.textContent.toLowerCase(); el.hidden = !!terms.length && !terms.every(function(w){ return txt.indexOf(w) >= 0; }); });
        if (path === '/questions/') document.querySelectorAll('main .questions h2').forEach(function(h){ var dl = h.nextElementSibling; if (dl && dl.tagName === 'DL') h.hidden = !Array.prototype.some.call(dl.children, function(c){ return !c.hidden; }); });
        if (!terms.length || !idx) { other.hidden = true; return; }
        var here = path; var hits = idx.filter(function(e){ return e.u.indexOf(here) !== 0 && terms.every(function(w){ return (e.q + ' ' + e.a).toLowerCase().indexOf(w) >= 0; }); }).slice(0, 6);
        other.innerHTML = ''; if (!hits.length) { other.hidden = true; return; }
        var h3 = document.createElement('p'); h3.className = 'eyebrow'; h3.textContent = 'Also answered on ' + (here === '/faq/' ? 'the questions page' : 'the FAQ'); other.appendChild(h3);
        hits.forEach(function(e){ var d = document.createElement('details'); var s = document.createElement('summary'); s.textContent = e.q; var p = document.createElement('p'); p.textContent = e.a; var a = document.createElement('a'); a.href = e.u; a.textContent = 'Open it there'; p.appendChild(document.createTextNode(' ')); p.appendChild(a); d.appendChild(s); d.appendChild(p); other.appendChild(d); });
        other.hidden = false;
      }
      input.addEventListener('input', function(){ if (!idx && window.fetch) { fetch('/faq.json').then(function(r){ return r.json(); }).then(function(j){ idx = j; run(); }).catch(function(){}); } run(); });
    }
    // A22: was this what you were looking for
    var main = document.querySelector('main'); if (main && !document.querySelector('.useful')) { var u = document.createElement('section'); u.className = 'section useful'; u.innerHTML = '<div class="wrap"><p class="lede">Was this what you were looking for? <button type="button" class="btn btn-ghost" data-u="yes">Yes</button> <button type="button" class="btn btn-ghost" data-u="no">No</button></p></div>'; var cta = main.querySelector('.next-step') || main.lastElementChild; main.insertBefore(u, cta); u.addEventListener('click', function(e){ var b = e.target.closest('button[data-u]'); if (!b) return; if (window.gtag) gtag('event', 'faq_useful', {answer: b.getAttribute('data-u'), page_path: path}); u.querySelector('.lede').textContent = b.getAttribute('data-u') === 'yes' ? 'Good. Message Stevie when you are ready.' : 'Thanks. Message Stevie and ask; he replies himself.'; }); }
  }
  // B47: glossary cards in place
  var glinks = document.querySelectorAll('a[href^="/glossary/#"]');
  if (glinks.length && path !== '/glossary/' && window.fetch) {
    var gidx = null, card = null;
    function closeCard(){ if (card) { card.remove(); card = null; } }
    function show(a){
      var term = decodeURIComponent(a.getAttribute('href').split('#')[1] || '').toLowerCase();
      function slug(t){ return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
      var e = gidx.filter(function(x){ return slug(x.t) === term; })[0] || gidx.filter(function(x){ return slug(x.t).indexOf(term) === 0 || term.indexOf(slug(x.t)) === 0; })[0];
      if (!e) { location.href = a.getAttribute('href'); return; }
      closeCard(); card = document.createElement('div'); card.className = 'gcard'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', e.t);
      var b = document.createElement('b'); b.textContent = e.t; var p = document.createElement('p'); p.textContent = e.d; var w = document.createElement('p'); w.className = 'small'; var wa = document.createElement('a'); wa.href = e.h; wa.textContent = e.w; w.appendChild(wa); var f = document.createElement('p'); f.className = 'small'; f.innerHTML = '<a href="/glossary/">Full glossary</a> · <button type="button" class="nut-btn gclose">Close</button>';
      card.appendChild(b); card.appendChild(p); card.appendChild(w); card.appendChild(f); document.body.appendChild(card);
      var r = a.getBoundingClientRect(); if (innerWidth > 700) { card.style.top = (scrollY + r.bottom + 8) + 'px'; card.style.left = Math.min(r.left + scrollX, innerWidth - 340) + 'px'; } else { card.classList.add('sheet'); }
      card.querySelector('.gclose').addEventListener('click', closeCard);
      if (window.gtag) gtag('event', 'glossary_card', {term: e.t});
    }
    glinks.forEach(function(a){ a.addEventListener('click', function(ev){ ev.preventDefault(); if (gidx) { show(a); } else { fetch('/glossary.json').then(function(r){ return r.json(); }).then(function(j){ gidx = j; show(a); }).catch(function(){ location.href = a.getAttribute('href'); }); } }); });
    document.addEventListener('click', function(e){ if (card && !card.contains(e.target) && !e.target.closest('a[href^="/glossary/#"]')) closeCard(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeCard(); });
  }
  // B53: copy the address
  document.querySelectorAll('dt').forEach(function(dt){
    if (!/^(Address|Where)$/.test(dt.textContent.trim())) return; var dd = dt.nextElementSibling; if (!dd || dd.querySelector('.copy-addr')) return;
    var text = dd.textContent.replace(/\s+/g, ' ').trim(); var b = document.createElement('button'); b.type = 'button'; b.className = 'nut-btn copy-addr'; b.textContent = 'Copy address';
    b.addEventListener('click', function(){ try { navigator.clipboard.writeText(text).then(function(){ sfToast('Address copied'); }); } catch (e) { sfToast('Long-press the address to copy it'); } });
    dd.appendChild(document.createTextNode(' ')); dd.appendChild(b);
  });
})();

// ROADMAP-5 round 11: what's-new dots, town paragraph open on desktop, section counters on the sales pages
(function(){
  var path = location.pathname;
  function get(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }
  // B56 dots on Members and Guides when something changed since this phone last opened them
  if (window.fetch) {
    fetch('/whatsnew.json').then(function(r){ return r.json(); }).then(function(w){
      [['members', '/members/'], ['guides', '/guides/']].forEach(function(x){
        var cur = String(w[x[0]]), seen = get('sf_seen_' + x[0]);
        if (path.indexOf(x[1]) === 0) { set('sf_seen_' + x[0], cur); return; }
        if (seen && seen !== cur) document.querySelectorAll('.navlinks a[href="' + x[1] + '"], .mobile-menu a[href="' + x[1] + '"]').forEach(function(a){ if (!a.querySelector('.dot')) { var d = document.createElement('span'); d.className = 'dot'; d.title = 'Something new since your last visit'; a.appendChild(d); } });
        if (!seen) set('sf_seen_' + x[0], cur);
      });
    }).catch(function(){});
  }
  // B50 the town paragraph: closed on phones, open on desktop
  if (innerWidth > 900) document.querySelectorAll('details.local').forEach(function(d){ d.open = true; });
  // A11 section counters on the long sales pages
  if (['/8-week-package/', '/one-to-one-personal-training/', '/prices/'].indexOf(path) >= 0) {
    var secs = Array.prototype.filter.call(document.querySelectorAll('main > section'), function(s){ return s.querySelector('h2') && !/next-step|looking|useful|faq|today-strip/.test(s.className); });
    secs.forEach(function(s, i){ var h = s.querySelector('h2'); var c = document.createElement('span'); c.className = 'sec-count'; c.textContent = (i + 1) + ' of ' + secs.length; h.insertBefore(c, h.firstChild); });
  }
})();

// ROADMAP-5 B43: alc-cell readout beside each drink slider
document.addEventListener('input', function(e){ var t = e.target; if (t && t.classList && t.classList.contains('alc') && t.nextElementSibling && t.nextElementSibling.tagName === 'OUTPUT') t.nextElementSibling.textContent = t.value; });

// Stevie 8 Sept: wherever there is a WhatsApp button to Stevie, an email option sits beside it (same message)
function sfMailAlts(root){
  var scope = root || document; var email = 'sanctuary@clydebankpt.com';
  scope.querySelectorAll('main a.btn[href^="https://wa.me/44"], #members a.btn[href^="https://wa.me/44"]').forEach(function(a){
    if (a.dataset.mailAlt || a.dataset.nomail || a.closest('.callbar') || a.closest('.nav')) return; a.dataset.mailAlt = '1';
    var m = document.createElement('a'); m.className = 'mail-alt'; m.href = 'mailto:' + email; m.textContent = 'or email';
    m.addEventListener('click', function(){ var t = ''; try { t = decodeURIComponent((a.getAttribute('href').split('?text=')[1] || '').replace(/\+/g, ' ')); } catch (e) {} m.href = 'mailto:' + email + '?subject=' + encodeURIComponent('From clydebankpt.com') + '&body=' + encodeURIComponent(t || 'Hi Stevie, '); if (window.gtag) gtag('event', 'email_click', {alt: 1}); });
    a.parentNode.insertBefore(m, a.nextSibling);
  });
}
sfMailAlts(); document.addEventListener('sf:open', function(){ sfMailAlts(document.getElementById('members')); });


// ROADMAP-6 B98: on /thanks/, offer the message again. A person who thinks they have sent one and has not is
// the worst outcome on this page, so the button is there whenever there is a message to re-open.
(function(){
  if (location.pathname !== '/thanks/') return;
  var WA_NUMBER = '447376941421';
  try {
    var msg = sessionStorage.getItem('sf_sent_msg');
    var wrap = document.getElementById('thanks-resend'), a = document.getElementById('thanks-wa');
    if (!wrap || !a) return;
    if (msg) a.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
    wrap.hidden = false;
    if (window.gtag) gtag('event', 'thanks_view', {had_message: msg ? 1 : 0});
  } catch (e) {}
})();

// ROADMAP-6 A110: somebody who has read the prices or the 8-week page three times is the warmest traffic
// the site gets and saw exactly what a first-timer sees. One counter in localStorage on their own phone,
// one extra line on the third visit to a money page, nothing sent anywhere and nothing that needs a cookie
// banner: localStorage on this origin is not a cookie and is never read by anything but this script.
function sfReturnLine(){
  try {
    var money = ['/prices/', '/8-week-package/', '/one-to-one-personal-training/'];
    if (money.indexOf(location.pathname) < 0) return;
    var k = 'sf_visits', n = 0;
    try { n = parseInt(localStorage.getItem(k) || '0', 10) || 0; } catch (e) { return; }
    n += 1;
    try { localStorage.setItem(k, String(n)); } catch (e) {}
    if (n < 3) return;
    var main = document.getElementById('main'); if (!main) return;
    var first = main.querySelector('section'); if (!first) return;
    var p = document.createElement('p');
    p.className = 'return-line';
    p.innerHTML = 'Still thinking about it? The consult is ten minutes, it is free, and nothing is decided in it. ' +
                  '<a href="/start/">Start here</a>.';
    first.querySelector('.wrap') ? first.querySelector('.wrap').appendChild(p) : first.appendChild(p);
    if (window.gtag) gtag('event', 'return_visitor_line', {visits: n, page: location.pathname});
  } catch (e) {}
}
sfReturnLine();
