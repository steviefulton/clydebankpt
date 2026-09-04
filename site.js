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
  if (p.indexOf('8-week') > -1) t = 'Ask about £205'; else if (p.indexOf('one-to-one') > -1) t = 'Ask about 1-to-1'; else if (p.indexOf('classes') > -1 || p.indexOf('timetable') > -1) t = 'Book a free consult';
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
      el.textContent = (days > 0 ? days + (days === 1 ? ' day to go. ' : ' days to go. ') : (hrs > 0 ? hrs + (hrs === 1 ? ' hour to go. ' : ' hours to go. ') : 'Starts today. '));
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
  }
  wrap.addEventListener('click', function(e){ var t = e.target.closest('[data-r]'); if (t) show(t.getAttribute('data-r')); });
  wrap.addEventListener('keydown', function(e){ var t = e.target.closest('.bm-region'); if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); show(t.getAttribute('data-r')); } });
})();

// Roadmap A67: should you train tonight.
(function(){
  var out = document.getElementById('tn-out'); if (!out) return;
  var sched = {"1":[[1060,1120,"HIIT","class"]],"2":[[360,420,"HIIT","class"],[420,480,"Personal Training","pt"],[480,540,"Personal Training","pt"],[540,600,"Personal Training","pt"],[600,660,"Personal Training","pt"],[960,1020,"Personal Training","pt"],[1060,1120,"Barbell & Dumbbell","class"]],"3":[[360,420,"Barbell & Dumbbell","class"],[420,480,"Personal Training","pt"],[480,540,"Personal Training","pt"],[540,600,"Personal Training","pt"],[600,660,"Personal Training","pt"],[960,1020,"Personal Training","pt"],[1060,1120,"Functional Fitness","class"]],"4":[[360,420,"Personal Training","pt"],[420,480,"Personal Training","pt"],[480,540,"Personal Training","pt"],[540,600,"Personal Training","pt"],[600,660,"Personal Training","pt"],[1020,1080,"Personal Training","pt"],[1080,1140,"Personal Training","pt"]],"5":[[360,420,"Functional Fitness","class"],[420,480,"Personal Training","pt"],[480,540,"Personal Training","pt"],[540,600,"Personal Training","pt"],[600,660,"Personal Training","pt"]],"6":[[420,480,"Personal Training","pt"],[480,540,"Personal Training","pt"],[540,600,"Full Body Workout","class"]]}; var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
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
    2: ['Come in if you can. Say nothing if you want.', 'Low days are the ones training helps most, and nobody in the room will ask you a thing. A light session and a walk home. If it has been like this for a couple of weeks, the GP line below is the one to use.'],
    3: ['Flat is normal. Move anyway.', 'A session or a thirty-minute walk usually lifts a flat day a notch. Do the easy version and count it.'],
    4: ['Alright is a good day to train properly.', 'Use it. Add a bit to the bar or chase the finisher.'],
    5: ['Good. Bank it.', 'Note what made today good and do it again tomorrow. Then come in and lift something.']
  };
  function run(){ var v = +r.value; document.getElementById('md-out').textContent = v; document.getElementById('md-text').textContent = T[v][0]; document.getElementById('md-note').textContent = T[v][1]; document.getElementById('support').classList.toggle('on', v <= 2); }
  r.addEventListener('input', run); run();
})();
