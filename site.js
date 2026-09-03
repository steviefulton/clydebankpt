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
    });
  }

  // Enquiry form: composes a WhatsApp message and opens the chat. No server needed.
  var form = document.getElementById('wa-form');
  if (form) {
    try {
      var p = new URLSearchParams(location.search).get('p');
      var map = {'8week': '8-Week Package (£205)', '1to1': 'One-to-one PT, 5 weeks (£295)', 'classes': 'Group classes'};
      if (p && map[p]) form.elements['package'].value = map[p];
    } catch (e) {}
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var name = form.elements['name'].value.trim();
      var goal = form.elements['goal'].value.trim();
      var pkg = form.elements['package'].value;
      var msg = 'Hi Stevie, I\'m ' + (name || 'interested') + '. I\'d like to book a free consult.';
      if (pkg) msg += ' I\'m interested in: ' + pkg + '.';
      if (goal) msg += ' My goal: ' + goal;
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
      var done = document.getElementById('wa-done');
      if (done) { done.hidden = false; }
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
  function applyFilter(){
    panels.forEach(function(p){
      var shown = 0;
      p.querySelectorAll('li').forEach(function(li){ var ok = kind === 'all' || li.getAttribute('data-kind') === kind; li.hidden = !ok; if (ok) shown++; });
      var empty = p.querySelector('.tt-empty');
      if (!empty) { empty = document.createElement('p'); empty.className = 'tt-empty'; empty.textContent = 'Nothing of this type on this day. Try another day.'; p.appendChild(empty); }
      empty.hidden = shown > 0;
    });
  }
  tabs.forEach(function(t){ t.addEventListener('click', function(){ show(+t.getAttribute('data-day')); }); });
  filters.forEach(function(f){ f.addEventListener('click', function(){ kind = f.getAttribute('data-kind'); filters.forEach(function(x){ x.classList.toggle('is-on', x === f); }); applyFilter(); }); });
  var jsDay = new Date().getDay(); // 0 Sun .. 6 Sat
  var start = jsDay === 0 ? 0 : jsDay - 1; if (start > 5) start = 5;
  show(start);
})();

(function(){
  var vids = document.querySelectorAll('video[data-src]');
  var ig = document.getElementById('instagram');
  var igLoaded = false;
  function loadIg(){
    if (igLoaded) return; igLoaded = true;
    var sc = document.createElement('script'); sc.async = true; sc.src = 'https://www.instagram.com/embed.js'; document.body.appendChild(sc);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        var el = en.target;
        if (el.tagName === 'VIDEO') {
          if (en.isIntersecting) { if (!el.src) { el.src = el.getAttribute('data-src'); } el.play().catch(function(){}); }
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
  var el = document.getElementById('tt-status');
  if (!el) return;
  var sched = {"1":[[1060,1120,"HIIT","class"]],"2":[[360,420,"HIIT","class"],[420,480,"Personal Training","pt"],[480,540,"Personal Training","pt"],[540,600,"Personal Training","pt"],[600,660,"Personal Training","pt"],[960,1020,"Personal Training","pt"],[1060,1120,"Barbell & Dumbbell","class"]],"3":[[360,420,"Barbell & Dumbbell","class"],[420,480,"Personal Training","pt"],[480,540,"Personal Training","pt"],[540,600,"Personal Training","pt"],[600,660,"Personal Training","pt"],[960,1020,"Personal Training","pt"],[1060,1120,"Functional Fitness","class"]],"4":[[360,420,"Personal Training","pt"],[420,480,"Personal Training","pt"],[480,540,"Personal Training","pt"],[540,600,"Personal Training","pt"],[600,660,"Personal Training","pt"],[1020,1080,"Personal Training","pt"],[1080,1140,"Personal Training","pt"]],"5":[[360,420,"Functional Fitness","class"],[420,480,"Personal Training","pt"],[480,540,"Personal Training","pt"],[540,600,"Personal Training","pt"],[600,660,"Personal Training","pt"]],"6":[[420,480,"Personal Training","pt"],[480,540,"Personal Training","pt"],[540,600,"Full Body Workout","class"]]}; // generated from data/site.json at build time
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
  document.body.appendChild(b);
  var on = false;
  window.addEventListener('scroll', function(){ var s = window.scrollY > 1200; if (s !== on) { on = s; b.classList.toggle('show', s); } }, {passive:true});
  b.addEventListener('click', function(e){ e.preventDefault(); window.scrollTo({top:0, behavior:'smooth'}); });
})();
(function(){
  var a = document.querySelector('.callbar a[data-label]'); if (!a) return;
  var p = location.pathname; var t = 'WhatsApp';
  if (p.indexOf('8-week') > -1) t = 'Ask about £205'; else if (p.indexOf('one-to-one') > -1) t = 'Ask about 1-to-1'; else if (p.indexOf('classes') > -1 || p.indexOf('timetable') > -1) t = 'Book a free week';
  var svg = a.querySelector('svg'); a.textContent = ''; if (svg) a.appendChild(svg); a.appendChild(document.createTextNode(t));
})();

(function(){
  function send(name, params){ try { if (window.gtag) gtag('event', name, params || {}); } catch (e) {} }
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
      if (d <= 0) { el.textContent = 'Started this week. Message Stevie to join late. '; return; }
      var days = Math.floor(d / 86400000), hrs = Math.floor((d % 86400000) / 3600000);
      el.textContent = (days > 0 ? days + (days === 1 ? ' day ' : ' days ') + hrs + 'h to go. ' : hrs + ' hours to go. ');
    });
  }
  tick(); setInterval(tick, 60000);
})();

(function(){
  var root=document.documentElement;
  try{ var th=localStorage.getItem('sf_theme'); if(th) root.setAttribute('data-theme',th); if(localStorage.getItem('sf_text')==='big') root.classList.add('big-text'); }catch(e){}
  document.querySelectorAll('.pref').forEach(function(b){ b.addEventListener('click',function(){
    if(b.dataset.pref==='theme'){ var cur=root.getAttribute('data-theme'); var dark=cur?cur==='dark':!window.matchMedia('(prefers-color-scheme: light)').matches; var next=dark?'light':'dark'; root.setAttribute('data-theme',next); try{localStorage.setItem('sf_theme',next);}catch(e){} }
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
  var send='wa';
  f.querySelectorAll('button[data-send]').forEach(function(b){ b.addEventListener('click', function(){ send=b.getAttribute('data-send'); }); });
  f.addEventListener('submit', function(e){
    e.preventDefault();
    var d=new FormData(f), lines=['Health questionnaire for Sanctuary Fitness'];
    lines.push('Name: '+(d.get('name')||'')); lines.push('DOB: '+(d.get('dob')||'')); lines.push('Mobile: '+(d.get('phone')||''));
    var yes=[]; f.querySelectorAll('fieldset.pq').forEach(function(fs,i){ var v=fs.querySelector('input:checked'); if(v&&v.value==='Yes') yes.push(String(i+1)); });
    lines.push('Answered YES to questions: '+(yes.length?yes.join(', '):'none'));
    if(d.get('notes')) lines.push('Notes: '+d.get('notes'));
    lines.push('Emergency contact: '+(d.get('ec_name')||'')+' ('+(d.get('ec_rel')||'')+') '+(d.get('ec_phone')||''));
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
(function(){
  var g=document.querySelector('.habit-grid'); if(!g) return;
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
})();

// Photo compare (local only): two file inputs -> side by side plus an opacity overlay. Nothing leaves the device.
(function(){
  var a=document.getElementById('pc-a'), b=document.getElementById('pc-b'); if(!a||!b) return;
  var stage=document.getElementById('pc-stage'), ia=document.getElementById('pc-img-a'), ib=document.getElementById('pc-img-b'), oa=document.getElementById('pc-ov-a'), ob=document.getElementById('pc-ov-b'), r=document.getElementById('pc-range');
  function load(inp, img, ov){ var f=inp.files && inp.files[0]; if(!f) return; var url=URL.createObjectURL(f); img.src=url; ov.src=url; stage.hidden=false; }
  a.addEventListener('change', function(){ load(a, ia, oa); });
  b.addEventListener('change', function(){ load(b, ib, ob); });
  r.addEventListener('input', function(){ ob.style.opacity = (r.value/100); });
})();

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
