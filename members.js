// Sanctuary Fitness members area: the training log (ROADMAP-5 round 5). Public code, private data: everything is saved on
// this phone only (localStorage) and nothing is sent anywhere unless the member taps a WhatsApp button. Runs after the
// gate decrypts the page (the 'sf:open' event) and finds the shells in the members HTML.
(function(){
  function $(id){ return document.getElementById(id); }
  function get(k, d){ try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v === null ? d : v; } catch (e) { return d; } }
  function set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function today(){ return new Date().toISOString().slice(0, 10); }
  function fmt(d){ var p = d.split('-'); return p[2] + '/' + p[1]; }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function wa(text){ var a = document.querySelector('#dash a[href^="https://wa.me/"]') || document.querySelector('a[href^="https://wa.me/"]'); var base = a ? a.getAttribute('href').split('?')[0] : 'https://wa.me/'; return base + '?text=' + encodeURIComponent(text); }
  function weekNo(){ var h = document.querySelector('#thisweek h2'); var m = h && h.textContent.match(/Week (\d) of 8/); return m ? +m[1] : 0; }

  // C76 session log
  function sessions(){
    var f = $('sl-form'), list = $('sl-list'); if (!f) return;
    var rows = get('sf_sessions', []);
    function render(){
      list.innerHTML = '';
      rows.slice().reverse().slice(0, 12).forEach(function(r){ var li = document.createElement('li'); li.textContent = fmt(r.d) + ' · ' + r.k + ' · felt ' + r.f + '/5' + (r.n ? ' · ' + r.n : ''); list.appendChild(li); });
      var wk = rows.filter(function(r){ return (Date.now() - new Date(r.d).getTime()) < 7 * 864e5; }).length;
      $('sl-week').textContent = wk ? (wk + ' session' + (wk === 1 ? '' : 's') + ' in the last seven days') : 'Nothing logged in the last seven days';
      $('sl-wa').href = wa('Hi Stevie, my week from the members log: ' + (rows.slice(-6).map(function(r){ return fmt(r.d) + ' ' + r.k + ' (' + r.f + '/5)'; }).join(', ') || 'nothing logged yet') + '.');
      attendance();
    }
    f.addEventListener('submit', function(e){ e.preventDefault(); var d = Object.fromEntries(new FormData(f).entries()); if (!d.d) d.d = today(); rows.push({d: d.d, k: d.k, f: +d.f || 3, n: (d.n || '').slice(0, 80)}); set('sf_sessions', rows); f.reset(); f.d.value = today(); render(); if (window.gtag) gtag('event', 'members_session_log'); });
    f.d.value = today(); render();
  }

  // C79 attendance calendar: a dot per logged session, streak in weeks
  function attendance(){
    var box = $('att-cal'); if (!box) return;
    var rows = get('sf_sessions', []); var days = {}; rows.forEach(function(r){ days[r.d] = (days[r.d] || 0) + 1; });
    var out = '', d = new Date(); d.setDate(d.getDate() - 55);
    for (var i = 0; i < 56; i++) { var k = d.toISOString().slice(0, 10); out += '<i class="' + (days[k] ? 'on' : '') + '" title="' + k + (days[k] ? ': trained' : '') + '"></i>'; d.setDate(d.getDate() + 1); }
    box.innerHTML = out;
    var wk = 0, now = new Date(); for (var w = 0; w < 8; w++) { var any = rows.some(function(r){ var t = new Date(r.d).getTime(); return t <= now.getTime() - w * 7 * 864e5 && t > now.getTime() - (w + 1) * 7 * 864e5; }); if (!any) break; wk++; }
    $('att-streak').textContent = wk ? wk + ' week' + (wk === 1 ? '' : 's') + ' in a row with a session' : 'Log a session and the streak starts.';
  }

  // C77/C78 lift log with best-ever and a small graph per lift
  var LIFTS = ['Squat', 'Deadlift', 'Bench', 'Overhead press', 'Row'];
  function lifts(){
    var f = $('ll-form'), out = $('ll-out'); if (!f) return;
    var log = get('sf_lifts', {});
    function best(name){ var a = log[name] || []; return a.reduce(function(m, r){ return r.w > m ? r.w : m; }, 0); }
    function graph(a){
      if (a.length < 2) return '';
      var w = 220, h = 48, mx = Math.max.apply(null, a.map(function(r){ return r.w; })), mn = Math.min.apply(null, a.map(function(r){ return r.w; })); if (mx === mn) mx = mn + 1;
      var pts = a.map(function(r, i){ return (i / (a.length - 1) * (w - 6) + 3).toFixed(1) + ',' + (h - 4 - (r.w - mn) / (mx - mn) * (h - 8)).toFixed(1); }).join(' ');
      return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" aria-hidden="true"><polyline fill="none" stroke="currentColor" stroke-width="2" points="' + pts + '"/></svg>';
    }
    function render(){
      out.innerHTML = LIFTS.map(function(n){ var a = log[n] || []; var last = a[a.length - 1]; return '<div class="ll-card"><b>' + n + '</b><span>' + (a.length ? 'Best ' + best(n) + 'kg · last ' + last.w + 'kg × ' + last.r + ' on ' + fmt(last.d) : 'Nothing logged yet') + '</span>' + graph(a) + '</div>'; }).join('');
    }
    f.addEventListener('submit', function(e){ e.preventDefault(); var d = Object.fromEntries(new FormData(f).entries()); var wv = +d.w, r = +d.r; if (!wv || !r) return; (log[d.l] = log[d.l] || []).push({d: today(), w: wv, r: r}); if (log[d.l].length > 60) log[d.l].shift(); set('sf_lifts', log); var b = best(d.l); $('ll-msg').textContent = wv >= b ? 'New best on ' + d.l + ': ' + wv + 'kg. Post it to the wall if you want.' : 'Logged. Best on ' + d.l + ' is still ' + b + 'kg.'; $('ll-wa').href = wa('WALL - new PB: ' + d.l + ' ' + wv + 'kg x ' + r); $('ll-wa').hidden = wv < b; f.w.value = ''; f.r.value = ''; render(); });
    render();
  }

  // C80 rest timer and the home programme timer
  function timers(){
    var box = $('rest'); if (!box) return;
    var disp = $('rest-disp'), t = null, end = 0;
    function tick(){ var left = Math.max(0, Math.round((end - Date.now()) / 1000)); disp.textContent = Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2); if (left <= 0) { clearInterval(t); t = null; disp.textContent = 'Go'; if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } }
    box.querySelectorAll('[data-sec]').forEach(function(b){ b.addEventListener('click', function(){ end = Date.now() + (+b.getAttribute('data-sec')) * 1000; if (t) clearInterval(t); tick(); t = setInterval(tick, 250); }); });
    $('rest-stop').addEventListener('click', function(){ if (t) clearInterval(t); t = null; disp.textContent = '0:00'; });
  }

  // C90/C91/C92 steps, sleep, water: one row a day, seven-day averages
  function daily(){
    var f = $('dl-form'); if (!f) return;
    var log = get('sf_daily', {});
    function render(){
      var keys = Object.keys(log).sort().slice(-7); var n = keys.length;
      function avg(k){ var v = keys.map(function(d){ return +log[d][k] || 0; }).filter(Boolean); return v.length ? Math.round(v.reduce(function(a, b){ return a + b; }, 0) / v.length * 10) / 10 : 0; }
      $('dl-out').textContent = n ? ('Last ' + n + ' day' + (n === 1 ? '' : 's') + ': steps ' + avg('s').toLocaleString() + ' a day, sleep ' + avg('z') + ' hours, water ' + avg('w') + ' glasses.') : 'Nothing logged yet.';
      var t = log[today()] || {}; f.s.value = t.s || ''; f.z.value = t.z || ''; $('dl-water').textContent = t.w || 0;
    }
    f.addEventListener('input', function(){ var t = log[today()] || {}; t.s = +f.s.value || 0; t.z = +f.z.value || 0; log[today()] = t; set('sf_daily', log); render(); });
    $('dl-glass').addEventListener('click', function(){ var t = log[today()] || {}; t.w = (t.w || 0) + 1; log[today()] = t; set('sf_daily', log); render(); });
    $('dl-unglass').addEventListener('click', function(){ var t = log[today()] || {}; t.w = Math.max(0, (t.w || 0) - 1); log[today()] = t; set('sf_daily', log); render(); });
    render();
  }

  // C110 hydration reminder: opt-in, on this phone only. A line on the page while it is open, and the phone's own
  // notification only after the member taps to allow it. No server, no push, nothing scheduled anywhere else.
  function hydrate(){
    var cb = $('dl-remind'); if (!cb) return;
    var note = $('dl-remind-note'), allow = $('dl-remind-allow'), line = $('dl-nudge'), timer = null;
    var can = typeof Notification !== 'undefined';
    function nudge(){
      line.hidden = false; line.textContent = 'Time for a glass of water. Tap + glass when you have had it.';
      if (can && Notification.permission === 'granted') { try { new Notification('Sanctuary: have a glass of water'); } catch (e) {} }
      if (navigator.vibrate) navigator.vibrate(120);
    }
    function paint(){
      var on = !!get('sf_water_remind', false); cb.checked = on;
      note.textContent = on
        ? 'On. A line appears here every ninety minutes while this page is open on your phone. Nothing is sent from anywhere else.'
        : 'Off. Turn it on and a line appears on this page every ninety minutes while it is open.';
      allow.hidden = !(on && can && Notification.permission === 'default');
      if (on && can && Notification.permission === 'granted') note.textContent += ' Your phone will buzz too.';
      if (timer) { clearInterval(timer); timer = null; }
      if (on) timer = setInterval(nudge, 90 * 60 * 1000);
      if (!on) { line.hidden = true; }
    }
    cb.addEventListener('change', function(){ set('sf_water_remind', cb.checked); paint(); if (window.gtag) gtag('event', 'members_water_remind', {on: cb.checked}); });
    allow.addEventListener('click', function(){ if (!can) return; Notification.requestPermission().then(function(){ paint(); }); });
    paint();
  }

  // C93 weekly review, C94 halfway, C95 finish: written from the phone's logs, sent by one tap
  function review(){
    var f = $('rv-form'); if (!f) return;
    var wk = weekNo(); var tag = wk === 4 ? ' (halfway check)' : wk === 8 ? ' (week eight)' : '';
    $('rv-title').textContent = 'Weekly review' + tag + (wk ? ', week ' + wk : '');
    if (wk === 8) $('rv-eight').hidden = false;
    f.addEventListener('submit', function(e){
      e.preventDefault(); var d = Object.fromEntries(new FormData(f).entries());
      var ses = get('sf_sessions', []).filter(function(r){ return (Date.now() - new Date(r.d).getTime()) < 7 * 864e5; }).length;
      var tr = get('sf_tracker_v1', {rows: []}); var done = (tr.rows || []).filter(function(r){ return r.w; }); var last = done[done.length - 1] || {};
      var msg = 'Hi Stevie, weekly review' + tag + (wk ? ' week ' + wk : '') + '. Sessions: ' + ses + '. Went well: ' + (d.good || '-') + '. Hard: ' + (d.hard || '-') + '. Food out of 10: ' + (d.food || '-') + '. Sleep: ' + (d.sleep || '-') + '. One change next week: ' + (d.change || '-') + '.' + (last.w ? ' Latest weight ' + last.w + 'kg' + (last.c ? ', waist ' + last.c + 'cm' : '') + '.' : '');
      if (wk === 8 && tr.rows && tr.rows[0] && last.w) { var w0 = +tr.w0 || +tr.rows[0].w; var c0 = +tr.c0 || +tr.rows[0].c; if (w0) msg += ' Week 1 to week 8: weight ' + w0 + ' to ' + last.w + 'kg' + (c0 && last.c ? ', waist ' + c0 + ' to ' + last.c + 'cm' : '') + '.'; }
      $('rv-wa').href = wa(msg); $('rv-wa').hidden = false; $('rv-preview').textContent = msg; set('sf_review_last', {wk: wk, at: Date.now()});
      if (window.gtag) gtag('event', 'members_review', {week: wk});
    });
  }

  function init(){ if (!document.getElementById('log')) return; if (document.getElementById('log').dataset.ready) return; document.getElementById('log').dataset.ready = '1'; sessions(); lifts(); timers(); daily(); hydrate(); review(); }
  document.addEventListener('sf:open', init); init();
})();

// Dashboard, section nav, search, new dots, collapse (ROADMAP-5 round 3), moved here from the encrypted page
function sfMembersDash(){
  var root = document.getElementById('members'); var dashEl = document.getElementById('dash'); if (!root || !dashEl || dashEl.dataset.ready) return; dashEl.dataset.ready = '1';
  var secs = Array.prototype.filter.call(root.querySelectorAll('section[id]'), function(s){ return s.id !== 'dash'; });
  function label(s){ var h = s.querySelector('h2'); var t = h ? h.textContent.replace(/[.:].*$/, '').trim() : s.id.replace(/-/g, ' ').replace(/^./, function(c){ return c.toUpperCase(); }); var e = s.querySelector('.eyebrow'); var et = e ? e.textContent.trim() : ''; if (t.length > 26 && et && et.length < 26 && !/^members/i.test(et)) t = et; return t.length > 26 ? t.slice(0, 24) + '…' : t; }
  function hash(str){ var h = 0; for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; } return String(h); }
  // C62: sticky nav with where-you-are and C64: new dots
  var nav = document.getElementById('m-nav'); var ul = nav.querySelector('ul');
  var LABELS = {welcome: 'Start', today: 'Today', 'first-week': 'First week', 'parq-members': 'Questionnaire', 'pt-booking': 'Book PT', thisweek: 'This week', bookfit: 'BookFit app', nutrition: 'Nutrition', plan: 'Meal plan', log: 'Log', planb: 'Ill or away', admin: 'Your block', plans: 'Files', updates: 'Updates', wall: 'Wall', 'when-life-happens': 'Bad week', pblog: 'PBs', measure: 'Measure days', 'members-faq': 'Questions', feedback: 'Tell Stevie', 'home-programme': 'Home days', dash: 'Top'};
  var PRIMARY = ['thisweek', 'parq-members', 'pt-booking', 'bookfit', 'nutrition', 'plan', 'log', 'plans', 'wall', 'admin'];
  secs.forEach(function(s){
    var li = document.createElement('li'); var a = document.createElement('a'); a.href = '#' + s.id; a.textContent = LABELS[s.id] || label(s); li.appendChild(a); if (PRIMARY.indexOf(s.id) < 0) { li.className = 'more-item'; li.hidden = true; }
    if (s.id === 'updates' || s.id === 'wall' || s.id === 'plans') {
      var key = 'sf_m_seen_' + s.id, now = hash(s.textContent.replace(/\s+/g, ' ')), seen = null;
      try { seen = localStorage.getItem(key); } catch (e) {}
      if (seen && seen !== now) { var d = document.createElement('span'); d.className = 'dot'; d.title = 'Changed since your last visit'; a.appendChild(d); a.classList.add('is-new'); }
      a.addEventListener('click', function(){ try { localStorage.setItem(key, now); } catch (e) {} a.classList.remove('is-new'); var dd = a.querySelector('.dot'); if (dd) dd.remove(); });
      if (!seen) { try { localStorage.setItem(key, now); } catch (e) {} }
    }
    ul.appendChild(li);
  });
  var moreLi = document.createElement('li'); var moreBtn = document.createElement('a'); moreBtn.href = '#dash'; moreBtn.textContent = 'More'; moreBtn.className = 'more-btn'; moreLi.appendChild(moreBtn); ul.appendChild(moreLi);
  moreBtn.addEventListener('click', function(e){ e.preventDefault(); var open = moreBtn.classList.toggle('open'); ul.querySelectorAll('li.more-item').forEach(function(li){ li.hidden = !open; }); moreBtn.textContent = open ? 'Less' : 'More'; });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries){ entries.forEach(function(en){ if (en.isIntersecting) { ul.querySelectorAll('a').forEach(function(a){ a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); }); } }); }, {rootMargin: '-40% 0px -55% 0px'});
    secs.forEach(function(s){ io.observe(s); });
  }
  // C65: tap a heading to collapse, remembered on this phone
  var collapsed = []; try { collapsed = JSON.parse(localStorage.getItem('sf_m_collapsed') || '[]'); } catch (e) {}
  secs.forEach(function(s){
    var h = s.querySelector('h2'); if (!h) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'm-toggle'; b.setAttribute('aria-expanded', collapsed.indexOf(s.id) < 0 ? 'true' : 'false'); b.textContent = collapsed.indexOf(s.id) < 0 ? 'Hide' : 'Show';
    h.appendChild(b); if (collapsed.indexOf(s.id) >= 0) s.classList.add('m-collapsed');
    b.addEventListener('click', function(){ var on = s.classList.toggle('m-collapsed'); b.setAttribute('aria-expanded', on ? 'false' : 'true'); b.textContent = on ? 'Show' : 'Hide'; var i = collapsed.indexOf(s.id); if (on && i < 0) collapsed.push(s.id); if (!on && i >= 0) collapsed.splice(i, 1); try { localStorage.setItem('sf_m_collapsed', JSON.stringify(collapsed)); } catch (e) {} });
  });
  // C63: search filters the sections
  var q = document.getElementById('m-q'), qn = document.getElementById('m-qn');
  q.addEventListener('input', function(){
    var terms = q.value.toLowerCase().split(/\s+/).filter(function(w){ return w.length > 1; }); var shown = 0;
    secs.forEach(function(s){
      var t = s.textContent.toLowerCase(); var hit = !terms.length || terms.every(function(w){ return t.indexOf(w) >= 0; });
      s.hidden = !hit; if (hit) shown++;
      if (terms.length && hit) { s.classList.remove('m-collapsed'); s.querySelectorAll('details').forEach(function(d){ var dt = d.textContent.toLowerCase(); d.open = terms.every(function(w){ return dt.indexOf(w) >= 0; }); }); }
    });
    qn.textContent = terms.length ? (shown + ' of ' + secs.length + ' sections match') : '';
    nav.hidden = terms.length > 0;
  });
  // C61: the dashboard, from the page and the phone's own logs
  var dash = document.getElementById('m-dash'); var cards = [];
  var wk = root.querySelector('#thisweek h2'); if (wk) cards.push(['This week', wk.textContent.replace(/\s*(Hide|Show)\s*$/, '').trim(), '#thisweek']);
  var today = root.querySelector('#today'); if (today) { var tp = today.querySelector('p'); var tt = tp ? tp.textContent.trim() : today.textContent.trim(); cards.push(['Today', tt.split(/(?<=[.!])\s/)[0].slice(0, 120), '#today']); }
  var streak = 0; try { var hb = JSON.parse(localStorage.getItem('sf_habits_v1') || '{}'); var d = new Date(); for (var i = 0; i < 60; i++) { var k = d.toISOString().slice(0, 10); var v = hb[k]; var any = v && (Array.isArray(v) ? v.some(Boolean) : Object.keys(v).some(function(x){ return v[x]; })); if (!any) { if (i === 0) { d.setDate(d.getDate() - 1); continue; } break; } streak++; d.setDate(d.getDate() - 1); } } catch (e) {}
  cards.push(['Habit streak', streak ? streak + ' day' + (streak === 1 ? '' : 's') + ' with a tick' : 'No ticks yet. Five a day, on the tracker.', '/tools/8-week-tracker/#habits']);
  var now = root.querySelector('#thisweek .wrap > p:not(.eyebrow)'); if (now) cards.push(['One thing today', now.textContent.trim().split(/(?<=[.!])\s/)[0].slice(0, 140), '#thisweek']);
  dash.innerHTML = cards.map(function(c){ return '<a class="dcard" href="' + c[2] + '"><span class="eyebrow">' + c[0] + '</span><b></b></a>'; }).join('');
  Array.prototype.forEach.call(dash.querySelectorAll('.dcard b'), function(b, i){ b.textContent = cards[i][1]; });
  if (window.gtag) gtag('event', 'members_dash', {cards: cards.length, streak: streak});
}
document.addEventListener('sf:open', sfMembersDash); sfMembersDash();

// Round 8: tour, home-screen hint, print this week, week card links, circuit timer, ill/injured, holiday, form check
function sfMembersMore(){
  var root = document.getElementById('members'); var pbx = document.getElementById('planb'); if (!root || !pbx || pbx.dataset.more) return; pbx.dataset.more = '1';
  function get(k, d){ try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v === null ? d : v; } catch (e) { return d; } }
  function set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function wa(text){ var a = document.querySelector('#dash a[href^="https://wa.me/"]'); var base = a ? a.getAttribute('href').split('?')[0] : 'https://wa.me/'; return base + '?text=' + encodeURIComponent(text); }
  // C66 tour, once
  var tour = document.getElementById('m-tour');
  if (tour && !get('sf_m_tour_done', false) && get('sf_start_mode', 'start') === 'ongoing') { tour.hidden = false; document.getElementById('m-tour-done').addEventListener('click', function(){ tour.hidden = true; set('sf_m_tour_done', true); }); }
  // C70 print this week
  var pb = document.getElementById('m-tour-print');
  if (pb) pb.addEventListener('click', function(){ document.body.classList.add('print-week'); setTimeout(function(){ window.print(); document.body.classList.remove('print-week'); }, 50); });
  // C71 add to home screen hint, only when not already installed
  var hint = document.getElementById('m-home-hint');
  if (hint && !(matchMedia('(display-mode: standalone)').matches || navigator.standalone)) hint.hidden = false;
  // C67 the week card links to the right places
  var wkp = document.querySelector('#thisweek .wrap > p:not(.eyebrow)');
  if (wkp && !wkp.querySelector('a')) {
    var map = [[/health questionnaire/i, '#parq-members'], [/Nutrition Guide/, '#nutrition'], [/tracker/i, '/tools/8-week-tracker/'], [/timetable/i, '/timetable/'], [/coached sessions?/i, '#pt-booking']];
    var html = wkp.innerHTML; map.forEach(function(m){ html = html.replace(m[0], function(t){ return '<a href="' + m[1] + '">' + t + '</a>'; }); }); wkp.innerHTML = html;
  }
  // C81 circuit timer: 40 on, 20 off, six moves, three rounds
  var ct = document.getElementById('circuit');
  if (ct) {
    var disp = document.getElementById('ct-disp'), step = document.getElementById('ct-step'), moves = Array.prototype.map.call(document.querySelectorAll('#home-programme ol li'), function(li){ return li.textContent.replace(/\s+/g, ' ').trim(); });
    var i = 0, phase = 'work', end = 0, t = null, total = moves.length * 3;
    function label(){ var round = Math.floor(i / moves.length) + 1; step.textContent = (phase === 'work' ? 'Work: ' : 'Rest, next: ') + moves[i % moves.length] + ' · round ' + round + ' of 3'; }
    function tick(){ var left = Math.max(0, Math.round((end - Date.now()) / 1000)); disp.textContent = (phase === 'work' ? 'Go ' : 'Rest ') + left; if (left > 0) return; if (navigator.vibrate) navigator.vibrate(150); if (phase === 'work') { phase = 'rest'; end = Date.now() + 20000; } else { i++; if (i >= total) { stop(); disp.textContent = 'Done'; step.textContent = 'Three rounds. Walk it off, drink some water.'; if (window.gtag) gtag('event', 'members_circuit'); return; } phase = 'work'; end = Date.now() + 40000; } label(); }
    function stop(){ if (t) clearInterval(t); t = null; }
    document.getElementById('ct-start').addEventListener('click', function(){ stop(); i = 0; phase = 'work'; end = Date.now() + 40000; label(); tick(); t = setInterval(tick, 250); });
    document.getElementById('ct-next').addEventListener('click', function(){ if (!t) return; end = Date.now(); tick(); });
    document.getElementById('ct-stop').addEventListener('click', function(){ stop(); disp.textContent = 'Ready'; step.textContent = 'Three rounds of the six moves. Forty seconds on, twenty off, or go by reps and tap Next.'; });
  }
  // C88 ill or injured: a plain plan and the message
  var ill = document.getElementById('ill-form');
  if (ill) ill.addEventListener('submit', function(e){
    e.preventDefault(); var d = Object.fromEntries(new FormData(ill).entries()); var out;
    if (d.what === 'ill') out = d.how === 'days' ? 'Rest, fluids, sleep. Skip the sessions for a few days; nothing is lost. Come back to a class or a walk first, not a heavy session.' : d.how === 'week' ? 'Rest until you are well. Book your sessions for the week after and message Stevie so he knows. Walking when you can is enough.' : 'Two weeks or more: message Stevie now with the dates. The block runs to its dates, anything you cannot use stays as credit, and he will plan the way back in.';
    else out = d.light === 'yes' ? 'Keep coming. Tell Stevie before the session and he trains around it: swaps, lighter loads, no heroics. The body map in the tools shows the usual swaps.' : d.how === 'days' ? 'Rest it for a few days and message Stevie before your next session so he can plan around it. Walking is fine if it does not hurt.' : 'This needs a plan, not a guess. Message Stevie with what happened and what a GP or physio said. If it is two weeks or more, message Stevie now; he will plan the way back in and anything unused stays as credit.';
    document.getElementById('ill-out').textContent = out;
    var m = 'Hi Stevie, ' + (d.what === 'ill' ? 'I am ill' : 'I have an injury or niggle') + ', probably ' + {days: 'a few days', week: 'about a week', two: 'two weeks or more'}[d.how] + '. ' + (d.light === 'yes' ? 'I can still walk and do light work.' : 'I cannot do much just now.') + ' What should I do this week?';
    var a = document.getElementById('ill-wa'); a.href = wa(m); a.hidden = false; if (window.gtag) gtag('event', 'members_ill_plan', {what: d.what});
  });
  // C89 holiday: the dates and the plan
  var hol = document.getElementById('hol-form');
  if (hol) hol.addEventListener('submit', function(e){
    e.preventDefault(); var d = Object.fromEntries(new FormData(hol).entries()); if (!d.from || !d.to) return;
    var days = Math.round((new Date(d.to) - new Date(d.from)) / 864e5) + 1; if (days < 1) days = 1;
    var plan = days <= 4 ? 'A short one: walk every day, protein at every meal, and pick up where you left off.' : days <= 14 ? 'Walk every day (8,000 steps), the 15-minute circuit twice a week wherever you are staying, protein at every meal, drinks counted. Tell Stevie the dates before you go so he knows which sessions you will miss.' : 'Longer than two weeks: message Stevie before you go with the dates. The block runs to its dates and unused sessions stay as credit; keep the walks and the circuit going and restart with a class, not a heavy session.';
    document.getElementById('hol-out').textContent = days + ' day' + (days === 1 ? '' : 's') + ' away. ' + plan;
    var a = document.getElementById('hol-wa'); a.href = wa('Hi Stevie, I am away from ' + d.from + ' to ' + d.to + ' (' + days + ' days). ' + (days > 4 ? 'Can we plan around it? ' : '') + 'I will keep the walks and the circuit going.'); a.hidden = false;
    if (window.gtag) gtag('event', 'members_holiday_plan', {days: days});
  });
  // C86 form check
  var fc = document.getElementById('fc-wa'); if (fc) fc.href = wa('FORM CHECK: Hi Stevie, I am about to send a clip of my ... (which lift). What should I fix first?');
}
document.addEventListener('sf:open', sfMembersMore); sfMembersMore();

// Round 9: the week planner and nutrition cards, from the guide's own data (inside the encrypted page)
function sfMembersPlan(){
  var sec = document.getElementById('plan'); if (!sec || sec.dataset.ready) return; sec.dataset.ready = '1';
  var D; try { D = JSON.parse(document.getElementById('plan-data').getAttribute('data-json')); } catch (e) { return; }
  function get(k, d){ try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v === null ? d : v; } catch (e) { return d; } }
  function set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], SLOTS = ['Breakfast', 'Lunch', 'Dinner'];
  var plan = get('sf_plan', {}), favs = get('sf_nut_favs', []), cooked = get('sf_cooked', []);
  // C107: the guide's vegetarian and vegan toggle filters the planner too, on the meal's own words
  function diet(){ return get('sf_nut_diet', 'all'); }
  function dietHide(text){ var m = diet(); if (m === 'all' || !D.diet) return false; var ws = m === 'vegan' ? D.diet.vegan : D.diet.veg;
    var t = ' ' + String(text).toLowerCase().replace(/[^a-z]+/g, ' ') + ' ';
    for (var i = 0; i < ws.length; i++) { if (t.indexOf(' ' + ws[i]) >= 0) return true; } return false; }
  function all(slot){ var out = []; ['quick', 'cook'].forEach(function(m){ (D.meals[m][slot] || []).forEach(function(x){ if (!dietHide(x[0] + ' ' + x[1])) out.push({n: x[0], d: x[1], m: m}); }); }); return out.sort(function(a, b){ var fa = favs.indexOf(a.n) >= 0, fb = favs.indexOf(b.n) >= 0; return fa === fb ? 0 : fa ? -1 : 1; }); }
  // C96 the grid
  var grid = document.getElementById('plan-grid');
  function render(){
    grid.innerHTML = '';
    DAYS.forEach(function(day){
      var col = document.createElement('div'); col.className = 'plan-day'; var h = document.createElement('b'); h.textContent = day; col.appendChild(h);
      SLOTS.forEach(function(slot){
        var key = day + ':' + slot; var sel = document.createElement('select'); sel.setAttribute('aria-label', day + ' ' + slot);
        var o0 = document.createElement('option'); o0.value = ''; o0.textContent = slot; sel.appendChild(o0);
        all(slot).forEach(function(x){ var o = document.createElement('option'); o.value = x.n; o.textContent = (favs.indexOf(x.n) >= 0 ? '★ ' : '') + x.n + (x.m === 'cook' ? ' (cook)' : ''); sel.appendChild(o); });
        sel.value = plan[key] || '';
        sel.addEventListener('change', function(){ if (sel.value) plan[key] = sel.value; else delete plan[key]; set('sf_plan', plan); cook(); });
        var star = document.createElement('button'); star.type = 'button'; star.className = 'nut-btn plan-star'; star.setAttribute('aria-label', 'Favourite this meal');
        function paintStar(){ star.textContent = sel.value && favs.indexOf(sel.value) >= 0 ? '★' : '☆'; star.hidden = !sel.value; }
        star.addEventListener('click', function(){ if (!sel.value) return; var i = favs.indexOf(sel.value); if (i >= 0) favs.splice(i, 1); else favs.push(sel.value); set('sf_nut_favs', favs); render(); });
        sel.addEventListener('change', paintStar); paintStar();
        var row = document.createElement('div'); row.className = 'plan-row'; row.appendChild(sel); row.appendChild(star); col.appendChild(row);
      });
      grid.appendChild(col);
    });
    cook();
    var dn = document.getElementById('plan-diet');
    if (dn) dn.textContent = diet() === 'all' ? '' : (diet() === 'vegan' ? 'Vegan is on in the guide, so the meals that name meat, fish, eggs or dairy are out of these lists.' : 'Vegetarian is on in the guide, so the meals that name meat or fish are out of these lists.');
  }
  document.addEventListener('sf:diet', function(){ render(); });
  // C97 what to cook this week, on top of the guide basket
  function cook(){
    var ul = document.getElementById('plan-cook'); ul.innerHTML = ''; var counts = {};
    Object.keys(plan).forEach(function(k){ counts[plan[k]] = (counts[plan[k]] || 0) + 1; });
    var names = Object.keys(counts).sort(function(a, b){ return counts[b] - counts[a]; });
    if (!names.length) { var li0 = document.createElement('li'); li0.className = 'muted'; li0.textContent = 'Nothing planned yet.'; ul.appendChild(li0); return; }
    names.forEach(function(n){ var li = document.createElement('li'); var meal = null; SLOTS.forEach(function(s){ all(s).forEach(function(x){ if (x.n === n) meal = x; }); }); li.textContent = n + ' × ' + counts[n] + (meal ? ': ' + meal.d : ''); ul.appendChild(li); });
  }
  document.getElementById('plan-quick').addEventListener('click', function(){ DAYS.forEach(function(day){ SLOTS.forEach(function(slot){ var q = (D.meals.quick[slot] || []).filter(function(x){ return !dietHide(x[0] + ' ' + x[1]); }); if (q.length) plan[day + ':' + slot] = q[(DAYS.indexOf(day) + SLOTS.indexOf(slot)) % q.length][0]; }); }); set('sf_plan', plan); render(); });
  document.getElementById('plan-favs').addEventListener('click', function(){ if (!favs.length) { alertLine('Star a few meals first.'); return; } DAYS.forEach(function(day){ SLOTS.forEach(function(slot){ var f = all(slot).filter(function(x){ return favs.indexOf(x.n) >= 0; }); if (f.length) plan[day + ':' + slot] = f[DAYS.indexOf(day) % f.length].n; }); }); set('sf_plan', plan); render(); });
  document.getElementById('plan-clear').addEventListener('click', function(){ plan = {}; set('sf_plan', plan); render(); });
  document.getElementById('plan-print').addEventListener('click', function(){ document.body.classList.add('print-plan'); setTimeout(function(){ window.print(); document.body.classList.remove('print-plan'); }, 50); });
  function alertLine(t){ var p = document.getElementById('plan-cooked'); p.textContent = t; }
  // C105 batch-cook Sunday, C112 cooked-it ticks
  var bl = document.getElementById('plan-batch');
  D.batch.forEach(function(x){ var li = document.createElement('li'); var lab = document.createElement('label'); var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = cooked.indexOf(x[0]) >= 0; cb.addEventListener('change', function(){ var i = cooked.indexOf(x[0]); if (cb.checked && i < 0) cooked.push(x[0]); if (!cb.checked && i >= 0) cooked.splice(i, 1); set('sf_cooked', cooked); paintCooked(); }); lab.appendChild(cb); lab.appendChild(document.createTextNode(' ' + x[0] + ': ' + x[1])); li.appendChild(lab); bl.appendChild(li); });
  function paintCooked(){ document.getElementById('plan-cooked').textContent = cooked.length ? 'Cooked ' + cooked.length + ' of the guide\u2019s meals this block.' : ''; }
  paintCooked();
  // C99 portions by appetite
  var app = get('sf_nut_app', null); var pt = document.getElementById('plan-portions'); var table = '<table class="plan-portions"><tr><th></th><th>Small</th><th>Moderate</th><th>Large</th></tr>';
  Object.keys(D.portions).forEach(function(k){ table += '<tr><th>' + k + '</th>' + D.portions[k].map(function(v, i){ return '<td class="' + (app !== null && +app === i ? 'me' : '') + '">' + v + '</td>'; }).join('') + '</tr>'; });
  pt.innerHTML = table + '</table>';
  // C100 protein target from the calculator
  var c = get('sf_calc', null); var tg = document.getElementById('plan-target');
  tg.innerHTML = c ? '<h3>Your numbers</h3><p><b>' + c.pro + 'g protein</b> a day, about ' + Math.round(c.pro / 4) + 'g at each of four meals, and ' + c.cal + ' kcal for ' + c.goal + '. From the calculator on this phone.</p>' : '<h3>Your numbers</h3><p>Run the <a href="/tools/calories/">calculator</a> once and your protein target shows here and on the meals.</p>';
  // C102 the 90/10 week so far
  var W = get('sf_nut_week', {}); var off = +W.off || 0; var day = new Date().getDay(); var tonight = (day === 5 || day === 6) ? 'Friday or Saturday night' : 'Tonight';
  document.getElementById('plan-9010').innerHTML = '<h3>90/10 this week</h3><p><b>' + off + ' of 2</b> off-plan meals used. ' + (off < 2 ? tonight + ' can be one of them if you want it.' : 'Both used: the next meal is a normal one, and nothing is ruined.') + '</p>';
  // C104 weekend, with the drink calculator's week if there is one
  var wl = document.getElementById('plan-weekend'); D.weekend.forEach(function(x){ var li = document.createElement('li'); li.innerHTML = '<b></b> '; li.querySelector('b').textContent = x[0]; li.appendChild(document.createTextNode(x[1])); wl.appendChild(li); });
  var a = get('sf_alcohol', null); document.getElementById('plan-drinks').textContent = a ? 'Your normal week on the drink calculator: ' + a.units + ' units, about ' + a.kcal + ' kcal.' : '';
  // C109 and C111: the 6am card on early days, in the guide's words
  var early = document.getElementById('plan-early'); var isEarly = [2, 3, 5].indexOf(day) >= 0 || [1, 2, 4].indexOf(day) >= 0 && new Date().getHours() >= 17;
  if (isEarly && D.early.length) { early.hidden = false; early.innerHTML = '<h3>6am class: what to eat</h3><ul class="plain small"></ul><p class="small muted"></p>'; D.early.slice(0, 4).forEach(function(x){ var li = document.createElement('li'); li.textContent = x[0] + ' ' + x[1]; early.querySelector('ul').appendChild(li); }); early.querySelector('p').textContent = D.caffeine || D.coffee; }
  render();
  if (window.gtag) gtag('event', 'members_plan_view', {planned: Object.keys(plan).length});
}
document.addEventListener('sf:open', sfMembersPlan); sfMembersPlan();

// Round 10: paperwork status, stopping, wobble, missed week, week eight, data export, report a problem
function sfMembersAdmin(){
  var sec = document.getElementById('admin'); if (!sec || sec.dataset.ready) return; sec.dataset.ready = '1';
  function get(k, d){ try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v === null ? d : v; } catch (e) { return d; } }
  function set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function wa(text){ var a = document.querySelector('#dash a[href^="https://wa.me/"]'); var base = a ? a.getAttribute('href').split('?')[0] : 'https://wa.me/'; return base + '?text=' + encodeURIComponent(text); }
  function weekNo(){ var h = document.querySelector('#thisweek h2'); var m = h && h.textContent.match(/Week (\d) of 8/); return m ? +m[1] : 0; }
  function fmt(t){ var d = new Date(t); return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear(); }
  var wk = weekNo();
  // C133: sent-status, recorded when the send buttons are tapped
  function mark(key){ set(key, Date.now()); status(); }
  var parq = document.getElementById('parq-members'); if (parq) parq.querySelectorAll('a[href^="https://wa.me/"], a[href^="mailto:"]').forEach(function(a){ a.addEventListener('click', function(){ mark('sf_parq_sent'); }); });
  var cons = document.getElementById('mconsent'); if (cons) cons.querySelectorAll('a[href^="mailto:"], a[href^="https://wa.me/"], button[type="submit"]').forEach(function(a){ a.addEventListener('click', function(){ mark('sf_consent_sent'); }); });
  function status(){
    var ul = document.getElementById('status-list'); ul.innerHTML = '';
    [['Health questionnaire, consent and terms', get('sf_parq_sent', null), '#parq-members'], ['Weekly review', (get('sf_review_last', {}) || {}).at, '#review']].forEach(function(x){
      var li = document.createElement('li'); var a = document.createElement('a'); a.href = x[2]; a.textContent = x[0]; li.appendChild(a); li.appendChild(document.createTextNode(x[1] ? ': sent ' + fmt(x[1]) : ': not sent yet')); li.className = x[1] ? 'done' : ''; ul.appendChild(li);
    });
    document.getElementById('status-med').hidden = wk !== 4;
  }
  status();
  // C137 stopping, C147 wobble, C148 missed a week, C143 report
  document.getElementById('stop-wa').href = wa('Hi Stevie, I am struggling to finish the block because ... Can we talk about what happens next?');
  document.getElementById('wobble-wa').href = wa('WOBBLE: Hi Stevie, I am about to skip this week and I know I should not. Talk me back in?');
  document.getElementById('missed-wa').href = wa('Hi Stevie, I missed a week. I am doing the three-step restart: one session, protein for two days, then booking the rest. Which session should I come to first?');
  document.getElementById('report-wa').href = wa('Hi Stevie, something on the members page is not working: ... (page: ' + location.pathname + ', phone: ' + (navigator.userAgent.match(/iPhone|Android|iPad/) || ['other'])[0] + ')');
  // C156-C158 week eight
  var fin = document.getElementById('finish-card');
  if (wk >= 8) {
    fin.hidden = false; var tr = get('sf_tracker_v1', {rows: []}); var done = (tr.rows || []).filter(function(r){ return r.w; }); var first = done[0] || {}, last = done[done.length - 1] || {};
    var w0 = +tr.w0 || +first.w || 0, c0 = +tr.c0 || +first.c || 0; var line = 'Eight weeks done. ';
    if (w0 && last.w) line += 'Weight ' + w0 + ' to ' + last.w + 'kg' + (c0 && last.c ? ', waist ' + c0 + ' to ' + last.c + 'cm' : '') + '. '; line += 'Make the certificate, leave a review if you want to, and tell Stevie what comes next.';
    document.getElementById('finish-line').textContent = line;
    document.getElementById('cert-btn').addEventListener('click', function(){
      var cv = document.getElementById('cert'), x = cv.getContext('2d'); x.fillStyle = '#0b0b0d'; x.fillRect(0, 0, 1080, 1080); x.fillStyle = '#b71c22'; x.fillRect(0, 0, 1080, 18);
      x.fillStyle = '#f4f1ec'; x.font = 'bold 96px Impact, Arial Black, sans-serif'; x.fillText('EIGHT WEEKS.', 80, 300); x.fillText('DONE.', 80, 410);
      x.font = '40px Arial, sans-serif'; x.fillStyle = '#c9c4bd'; var lines = ['Sanctuary Fitness, Clydebank', new Date().toLocaleDateString('en-GB')]; if (w0 && last.w) lines.push('Weight ' + w0 + ' to ' + last.w + ' kg' + (c0 && last.c ? ' · waist ' + c0 + ' to ' + last.c + ' cm' : '')); var s = get('sf_sessions', []).length; if (s) lines.push(s + ' sessions logged');
      lines.forEach(function(l, i){ x.fillText(l, 80, 560 + i * 70); }); x.fillStyle = '#b71c22'; x.font = 'bold 34px Arial, sans-serif'; x.fillText('clydebankpt.com', 80, 980);
      var out = document.getElementById('cert-out'); out.innerHTML = ''; var img = document.createElement('img'); img.src = cv.toDataURL('image/png'); img.alt = 'Your eight weeks certificate'; img.style.maxWidth = '100%'; img.style.borderRadius = '12px'; out.appendChild(img);
      var p = document.createElement('p'); p.className = 'small muted'; p.textContent = 'Long-press the image to save or share it. It never leaves your phone unless you send it.'; out.appendChild(p);
      if (window.gtag) gtag('event', 'members_certificate');
    });
  }
  // C140 export and import of this phone's data
  var box = document.getElementById('data-box'), msg = document.getElementById('data-msg');
  document.getElementById('data-copy').addEventListener('click', function(){
    var d = {}; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf('sf_') === 0 && k !== 'sf_members_pw') d[k] = localStorage.getItem(k); } } catch (e) {}
    var txt = 'SANCTUARY-DATA:' + btoa(unescape(encodeURIComponent(JSON.stringify(d))));
    try { navigator.clipboard.writeText(txt).then(function(){ msg.textContent = 'Copied. Paste it into a note or a message to yourself, then paste it back in on the new phone.'; }); } catch (e) { box.hidden = false; box.value = txt; msg.textContent = 'Copy the text below.'; }
  });
  document.getElementById('data-paste').addEventListener('click', function(){
    if (box.hidden) { box.hidden = false; box.value = ''; box.focus(); msg.textContent = 'Paste the copied text, then tap Paste data in again.'; return; }
    var v = box.value.trim(); if (v.indexOf('SANCTUARY-DATA:') !== 0) { msg.textContent = 'That is not a Sanctuary data block.'; return; }
    try { var d = JSON.parse(decodeURIComponent(escape(atob(v.slice(15))))); var n = 0; Object.keys(d).forEach(function(k){ if (k.indexOf('sf_') === 0 && k !== 'sf_members_pw') { localStorage.setItem(k, d[k]); n++; } }); msg.textContent = n + ' items restored. Reloading.'; setTimeout(function(){ location.reload(); }, 800); } catch (e) { msg.textContent = 'That block could not be read.'; }
  });
}
document.addEventListener('sf:open', sfMembersAdmin); sfMembersAdmin();

// Round 11 C131: files marked new (changed since last visit) and opened (tapped on this phone)
function sfMembersFiles(){
  var plans = document.getElementById('plans'); if (!plans || plans.dataset.files) return; plans.dataset.files = '1';
  var links = plans.querySelectorAll('a.m-file'); if (!links.length) return;
  var names = Array.prototype.map.call(links, function(a){ return a.textContent.trim(); }).join('|'); var seen = null, opened = [];
  try { seen = localStorage.getItem('sf_files_seen'); opened = JSON.parse(localStorage.getItem('sf_files_opened') || '[]'); } catch (e) {}
  links.forEach(function(a){
    var n = a.textContent.trim(); var tag = document.createElement('span'); tag.className = 'small muted file-tag';
    if (opened.indexOf(n) >= 0) tag.textContent = ' opened'; else if (seen && seen.indexOf(n) < 0) tag.textContent = ' new';
    a.parentNode.insertBefore(tag, a.nextSibling);
    a.addEventListener('click', function(){ if (opened.indexOf(n) < 0) opened.push(n); try { localStorage.setItem('sf_files_opened', JSON.stringify(opened)); } catch (e) {} tag.textContent = ' opened'; });
  });
  try { localStorage.setItem('sf_files_seen', names); } catch (e) {}
}
document.addEventListener('sf:open', sfMembersFiles); sfMembersFiles();

// Start-of-block checklist (Stevie 8 Sept): new members get the things to do in order; ongoing members see everything
function sfMembersStart(){
  var box = document.getElementById('m-start'); if (!box || box.dataset.ready) return; box.dataset.ready = '1';
  function get(k, d){ try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v === null ? d : v; } catch (e) { return d; } }
  function set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function wa(text){ var a = document.querySelector('#dash .chips-lg a[href^="https://wa.me/"]'); var base = a ? a.getAttribute('href').split('?')[0] : 'https://wa.me/'; return base + '?text=' + encodeURIComponent(text); }
  var ticks = get('sf_start_ticks', {}); var items = box.querySelectorAll('#m-start-list li'); var show = document.getElementById('m-start-show');
  var wk = (function(){ var h = document.querySelector('#thisweek h2'); var m = h && h.textContent.match(/Week (\d) of 8/); return m ? +m[1] : 0; })();
  // self-ticking from what the phone already knows
  if (get('sf_parq_sent', null)) ticks.parq = true; if (get('sf_calc', null)) ticks.calc = true; if (get('sf_consent_sent', null)) ticks.consent = true;
  if ((get('sf_tt_picks', []) || []).length >= 3) ticks.picks = true; if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) ticks.home = true;
  function paint(){
    var done = 0; items.forEach(function(li){ var k = li.getAttribute('data-k'); var cb = li.querySelector('input'); cb.checked = !!ticks[k]; li.classList.toggle('done', !!ticks[k]); if (ticks[k]) done++; });
    document.getElementById('m-start-progress').textContent = done + ' of ' + items.length + ' done' + (done === items.length ? '. You are set. Turn up.' : '');
    set('sf_start_ticks', ticks);
  }
  items.forEach(function(li){ var k = li.getAttribute('data-k'); li.querySelector('input').addEventListener('change', function(e){ ticks[k] = e.target.checked; paint(); }); });
  var ready = document.getElementById('m-start-wa'); ready.href = wa('READY: Hi Stevie, questionnaire sent, app downloaded, first three sessions picked. Anything else before day one?');
  ready.addEventListener('click', function(){ ticks.ready = true; paint(); });
  var parq = document.getElementById('parq-members'); if (parq) parq.querySelectorAll('a[href^="https://wa.me/"], a[href^="mailto:"]').forEach(function(a){ a.addEventListener('click', function(){ ticks.parq = true; paint(); }); });
  // shown by default until done, or until the block is past week one; the choice is remembered
  var allDone = Object.keys(ticks).filter(function(k){ return ticks[k]; }).length >= items.length;
  var mode = get('sf_start_mode', null); if (mode === null) mode = (allDone || wk > 1) ? 'ongoing' : 'start';
  function apply(){ box.hidden = mode !== 'start'; show.hidden = mode === 'start'; set('sf_start_mode', mode); var tour = document.getElementById('m-tour'); if (tour) { if (mode === 'start') tour.hidden = true; else if (!get('sf_m_tour_done', false)) tour.hidden = false; } }
  document.getElementById('m-start-hide').addEventListener('click', function(){ mode = 'ongoing'; apply(); });
  document.getElementById('m-start-again').addEventListener('click', function(){ mode = 'start'; ticks = {}; paint(); apply(); box.scrollIntoView({block: 'start'}); });
  paint(); apply();
  if (window.gtag) gtag('event', 'members_start_view', {mode: mode});
}
document.addEventListener('sf:open', sfMembersStart); sfMembersStart();

// ROADMAP-5 C119: shrink a photo on the phone before it is sent. Canvas only: the file never leaves the browser and
// nothing is uploaded. Gives back a JPEG data URL under the size asked for, or a plain error line.
function sfShrinkPhoto(file, maxKB, maxPx, cb){
  if (!file || !/^image\//.test(file.type)) { cb('That is not a photo.'); return; }
  var fr = new FileReader();
  fr.onerror = function(){ cb('That photo could not be read.'); };
  fr.onload = function(){
    var img = new Image();
    img.onerror = function(){ cb('That photo could not be read.'); };
    img.onload = function(){
      var w = img.naturalWidth, h = img.naturalHeight, scale = Math.min(1, maxPx / Math.max(w, h));
      var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * scale)); c.height = Math.max(1, Math.round(h * scale));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      var q = 0.82, url = c.toDataURL('image/jpeg', q);
      while (url.length * 0.75 > maxKB * 1024 && q > 0.35) { q -= 0.12; url = c.toDataURL('image/jpeg', q); }
      while (url.length * 0.75 > maxKB * 1024 && c.width > 320) {
        var c2 = document.createElement('canvas'); c2.width = Math.round(c.width * 0.75); c2.height = Math.round(c.height * 0.75);
        c2.getContext('2d').drawImage(c, 0, 0, c2.width, c2.height); c = c2; url = c.toDataURL('image/jpeg', q);
      }
      cb(null, {url: url, kb: Math.round(url.length * 0.75 / 1024), w: c.width, h: c.height, wasKB: Math.round(file.size / 1024)});
    };
    img.src = fr.result;
  };
  fr.readAsDataURL(file);
}

// C117 wall categories, C118 reactions counted on this phone, C119 the photo shrinker in the wall
function sfMembersWall(){
  var sec = document.getElementById('wall'); if (!sec || sec.dataset.ready) return; sec.dataset.ready = '1';
  function get(k, d){ try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v === null ? d : v; } catch (e) { return d; } }
  function set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  // C117: the chips filter the rendered items by their category tag
  var chips = document.getElementById('wall-chips'), list = document.getElementById('wall-list');
  if (chips && list) {
    var items = Array.prototype.slice.call(list.children);
    var filter = function(cat){
      items.forEach(function(li){ li.hidden = !(cat === 'all' || li.getAttribute('data-cat') === cat); });
      Array.prototype.forEach.call(chips.children, function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-cat') === cat)); });
      set('sf_wall_cat', cat);
    };
    Array.prototype.forEach.call(chips.children, function(b){ b.addEventListener('click', function(){ filter(b.getAttribute('data-cat')); }); });
    var start = get('sf_wall_cat', 'all');
    filter(chips.querySelector('[data-cat="' + start + '"]') ? start : 'all');
  }
  // C118: one tap, three options, kept on this phone only until the wall gets its own account
  if (list) {
    var counts = get('sf_wall_react', {});
    Array.prototype.forEach.call(list.querySelectorAll('.wall-react'), function(box){
      var id = box.getAttribute('data-id'); var mine = counts[id] || {};
      Array.prototype.forEach.call(box.querySelectorAll('button[data-r]'), function(b){
        var r = b.getAttribute('data-r'); var label = b.textContent;
        var paint = function(){ b.setAttribute('aria-pressed', String(!!mine[r])); b.textContent = mine[r] ? label + ' ✓' : label; };
        b.addEventListener('click', function(){ mine[r] = !mine[r]; counts[id] = mine; set('sf_wall_react', counts); paint(); if (window.gtag) gtag('event', 'members_wall_react', {kind: r}); });
        paint();
      });
    });
  }
  // C119: pick a photo, get a copy under 300KB to save or send
  var pick = document.getElementById('wall-photo'); if (!pick) return;
  var out = document.getElementById('wall-photo-out'), img = document.getElementById('wall-photo-img');
  var save = document.getElementById('wall-photo-save'), share = document.getElementById('wall-photo-share'); var made = null;
  pick.addEventListener('change', function(){
    var f = pick.files && pick.files[0]; if (!f) return;
    out.textContent = 'Shrinking it on your phone.';
    sfShrinkPhoto(f, 300, 1600, function(err, r){
      if (err) { out.textContent = err; return; }
      made = r; img.src = r.url; img.setAttribute('width', r.w); img.setAttribute('height', r.h); img.hidden = false;
      out.textContent = r.wasKB + 'KB became ' + r.kb + 'KB, ' + r.w + ' by ' + r.h + '. Still on your phone.';
      save.href = r.url; save.hidden = false; share.hidden = !navigator.share;
      if (window.gtag) gtag('event', 'members_photo_shrink');
    });
  });
  share.addEventListener('click', function(){
    if (!made || !navigator.share) return;
    fetch(made.url).then(function(r){ return r.blob(); }).then(function(b){
      var file = new File([b], 'sanctuary-photo.jpg', {type: 'image/jpeg'});
      if (navigator.canShare && navigator.canShare({files: [file]})) return navigator.share({files: [file]});
      return navigator.share({title: 'Sanctuary', text: 'A photo for the wall'});
    }).catch(function(){});
  });
}
document.addEventListener('sf:open', sfMembersWall); sfMembersWall();

// C74 members glossary: tap a gym word and the meaning opens in place, in the site glossary's own wording
function sfMembersGlossary(){
  var box = document.getElementById('m-terms'); if (!box || box.dataset.ready) return; box.dataset.ready = '1';
  var defs = {}; try { defs = JSON.parse(box.getAttribute('data-json') || '{}'); } catch (e) { return; }
  var card = null;
  var close = function(){ if (card) { card.parentNode.removeChild(card); card = null; } };
  document.addEventListener('click', function(e){
    var b = e.target.closest ? e.target.closest('button.m-term') : null;
    if (!b) { if (card && !card.contains(e.target)) close(); return; }
    e.preventDefault();
    var t = b.getAttribute('data-t'); if (!defs[t]) return;
    if (card && card.getAttribute('data-t') === t) { close(); return; }
    close();
    card = document.createElement('div'); card.className = 'm-term-card'; card.setAttribute('data-t', t);
    var n = document.createElement('b'); n.textContent = t;
    var d = document.createElement('span'); d.textContent = ' ' + defs[t];
    var f = document.createElement('a'); f.href = '/glossary/'; f.className = 'small'; f.textContent = 'The rest of the gym words';
    card.appendChild(n); card.appendChild(d); card.appendChild(document.createElement('br')); card.appendChild(f);
    var host = b.closest('p, li, dd') || b;  // the card opens under the line, so the sentence is not cut in half
    host.parentNode.insertBefore(card, host.nextSibling);
    if (window.gtag) gtag('event', 'members_term', {term: t});
  });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });
}
document.addEventListener('sf:open', sfMembersGlossary); sfMembersGlossary();

// C103 food log photo: shrunk and kept on this phone. The words are what the check-in message carries; the photo is not.
function sfMembersFoodPhoto(){
  var log = document.getElementById('nut-log'); if (!log || log.dataset.ready) return; log.dataset.ready = '1';
  var key = function(){ var w = null; try { w = JSON.parse(localStorage.getItem('sf_nut_week') || 'null'); } catch (e) {} return (w && w.key) || 'week'; };
  var load = function(){ try { return JSON.parse(localStorage.getItem('sf_food_photos') || '{}'); } catch (e) { return {}; } };
  var save = function(o){ try { localStorage.setItem('sf_food_photos', JSON.stringify(o)); return true; } catch (e) { return false; } };
  var paint = function(){
    var all = load(), wk = all[key()] || {};
    Array.prototype.forEach.call(log.querySelectorAll('img[data-phimg]'), function(im){
      var d = im.getAttribute('data-phimg'); var del = log.querySelector('[data-phdel="' + d + '"]');
      if (wk[d]) { im.src = wk[d]; im.hidden = false; if (del) del.hidden = false; }
      else { im.removeAttribute('src'); im.hidden = true; if (del) del.hidden = true; }
    });
  };
  log.addEventListener('change', function(e){
    var inp = e.target.closest ? e.target.closest('input[data-ph]') : null; if (!inp) return;
    var d = inp.getAttribute('data-ph'); var f = inp.files && inp.files[0]; if (!f) return;
    sfShrinkPhoto(f, 90, 720, function(err, r){
      if (err) return;
      var wk = load()[key()] || {}; wk[d] = r.url;
      var all = {}; all[key()] = wk;  // this week only, so the phone never fills up
      if (!save(all)) { delete wk[d]; save(all); }
      inp.value = ''; paint();
      if (window.gtag) gtag('event', 'members_food_photo');
    });
  });
  log.addEventListener('click', function(e){
    var b = e.target.closest ? e.target.closest('[data-phdel]') : null; if (!b) return;
    var all = load(), wk = all[key()] || {}; delete wk[b.getAttribute('data-phdel')]; all[key()] = wk; save(all); paint();
  });
  new MutationObserver(paint).observe(log, {childList: true});
  paint();
}
document.addEventListener('sf:open', sfMembersFoodPhoto); sfMembersFoodPhoto();

// ROADMAP-6 round 23, items 160, 161, 163, 164, 166 and 172: the block a member is in, and the four moments
// in it worth saying something at. Everything here reads the phone's own tracker and habit logs and the page
// it is already inside; nothing is uploaded, nothing is fetched, and no number is invented. The password is
// shared across the crew (item 165), so this can only ever describe THIS PHONE's block, and it says so.
function sfMembersBlock(){
  var root = document.getElementById('members'); if (!root || root.dataset.blk) return; root.dataset.blk = '1';
  var dash = document.getElementById('m-dash'); if (!dash) return;

  function get(k, d){ try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v === null ? d : v; } catch (e) { return d; } }
  function set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function wa(text){ var a = document.querySelector('#dash a[href^="https://wa.me/"]'); var base = a ? a.getAttribute('href').split('?')[0] : 'https://wa.me/'; return base + '?text=' + encodeURIComponent(text); }
  function days(a, b){ return Math.floor((b - a) / 86400000); }
  var ORD = function(n){ var s = ['th','st','nd','rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  var MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function spoken(d){ return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()] + ' the ' + ORD(d.getDate()) + ' of ' + MON[d.getMonth()]; }

  // ---- item 160: which block this phone is in, and when it ends
  var tr = get('sf_tracker_v1', {}), rows = (tr && tr.rows) || [];
  var start = tr && tr.start ? new Date(tr.start + 'T00:00:00') : null;
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var week = null, end = null;
  if (start && !isNaN(start)) {
    end = new Date(start.getTime()); end.setDate(end.getDate() + 8 * 7 - 1);
    week = Math.floor(days(start, today) / 7) + 1;
  }
  var panels = [];
  function card(label, text, href){
    var a = document.createElement('a'); a.className = 'dcard'; a.href = href || '#dash';
    a.innerHTML = '<span class="eyebrow"></span><b></b>';
    a.querySelector('.eyebrow').textContent = label; a.querySelector('b').textContent = text;
    dash.appendChild(a);
  }
  if (week !== null && week >= 1 && week <= 8) {
    card('Your block', 'Week ' + week + ' of 8. Last day ' + spoken(end) + '.', '/tools/8-week-tracker/');
  } else if (week !== null && week > 8) {
    card('Your block', 'Finished ' + spoken(end) + '. Message Stevie about the next one.', '#thisweek');
  } else if (week !== null) {
    card('Your block', 'Starts ' + spoken(start) + '.', '/tools/8-week-tracker/');
  } else {
    card('Your block', 'Put your start date on the tracker and this says which week you are in.', '/tools/8-week-tracker/');
  }

  // ---- item 172: one line a week, from the block structure Stevie already published in the week-by-week guide
  var WEEKLY = [
    'Week 1 is numbers and nothing else. Get weighed and measured, get the plan written, and train easy.',
    'Week 2 is where the routine sets. Same sessions, same days, nothing clever.',
    'Week 3 is the first week it stops being new. Turning up on the dull week is the whole job.',
    'Week 4 is the halfway check. Weigh in, look at the tape, and change one thing rather than five.',
    'Week 5 is the other half of the halfway check: the change from last week, held for seven days.',
    'Week 6 is a drift week. Sessions get skipped here more than anywhere, so book them in now.',
    'Week 7 is the other drift week, and the one to be stubborn in. Next week is the measure.',
    'Week 8 is measured again: same tape, same spots, same conditions as week one.'
  ];
  if (week !== null && week >= 1 && week <= 8) {
    var w = document.createElement('section'); w.className = 'section'; w.id = 'blockweek';
    w.innerHTML = '<div class="wrap prose"><h2>Week ' + week + ' of your block</h2><p></p>'
      + '<p class="small">From the <a href="/guides/8-week-package-week-by-week/">week-by-week guide</a>. This is worked out on this phone from the start date on your tracker, so it is your week, not the gym’s.</p></div>';
    w.querySelector('p').textContent = WEEKLY[week - 1];
    var host = document.getElementById('dash');
    if (host && host.parentNode) host.parentNode.insertBefore(w, host.nextSibling);
  }

  // ---- item 161: at week 7, the proof, from this phone's own logged numbers. No price, no offer.
  function num(x){ var v = parseFloat(x); return isFinite(v) ? v : null; }
  if (week !== null && week >= 7) {
    var withW = rows.map(function(r, i){ return {i: i, r: r || {}}; }).filter(function(x){ return num(x.r.w) !== null; });
    var sessions = rows.reduce(function(a, r){ return a + (num(r && r.s) || 0); }, 0);
    var lines = [];
    if (withW.length >= 2) {
      var first = withW[0], last = withW[withW.length - 1];
      var base = num(tr.w0) !== null ? num(tr.w0) : num(first.r.w);
      var dw = num(last.r.w) - base;
      lines.push((dw <= 0 ? '' : '+') + dw.toFixed(1) + 'kg since week ' + (num(tr.w0) !== null ? '1' : (first.i + 1)));
      var cBase = num(tr.c0) !== null ? num(tr.c0) : num(first.r.c);
      var cLast = num(last.r.c);
      if (cBase !== null && cLast !== null) lines.push((cLast - cBase <= 0 ? '' : '+') + (cLast - cBase).toFixed(1) + 'cm on the waist');
    }
    if (sessions) lines.push(sessions + ' sessions logged');
    var p = document.createElement('section'); p.className = 'section alt'; p.id = 'renewal';
    p.innerHTML = '<div class="wrap prose"><h2>Week ' + week + ': what has actually changed</h2><p id="ren-l"></p>'
      + '<p>Renewal is a conversation, not a button. Message Stevie, tell him what you want the next eight weeks to do, and he will tell you what fits.</p>'
      + '<p><a class="btn btn-red" id="ren-wa" target="_blank" rel="noopener">Message Stevie about the next block</a></p>'
      + '<p class="small">Read off the tracker on this phone. If the numbers look wrong, they are the ones you typed in; the ones that count are the ones Stevie takes in week eight.</p></div>';
    p.querySelector('#ren-l').textContent = lines.length
      ? lines.join(' · ') + '. That is from your own rows, not an estimate.'
      : 'Nothing logged on this phone yet, so there is no proof to show you. The measurements Stevie took in week one are the ones that count either way.';
    p.querySelector('#ren-wa').href = wa('Hi Stevie, I am in week ' + week + '. Can we have a chat about the next block?'
      + (lines.length ? ' My tracker says: ' + lines.join(', ') + '.' : ''));
    root.appendChild(p);
  }

  // ---- item 166: eight weeks of logs live on one handset and nothing ever said so
  if (week !== null && week >= 8) {
    var ex = document.createElement('section'); ex.className = 'section'; ex.id = 'export-now';
    ex.innerHTML = '<div class="wrap prose"><h2>Save your block before you change phone</h2>'
      + '<p>Everything you have logged in here — sessions, lifts, tape, food, habits — is saved on this phone and nowhere else. That is deliberate: none of it is uploaded. It also means a new handset starts empty.</p>'
      + '<p>You are at the end of a block, which is the moment to take a copy.</p>'
      + '<p><a class="btn btn-red" href="#feedback">Take a copy now</a> <a class="btn btn-ghost" href="/tools/8-week-tracker/">Open the tracker</a></p></div>';
    root.appendChild(ex);
  }

  // ---- item 163: the streak about to break, which is the cheapest save there is
  var hb = get('sf_habits_v1', {});
  function iso(d){ return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function ticked(d){ var v = hb[iso(d)]; return !!(v && (Array.isArray(v) ? v.some(Boolean) : Object.keys(v).some(function(x){ return v[x]; }))); }
  var run = 0, cur = new Date(today.getTime());
  if (!ticked(cur)) cur.setDate(cur.getDate() - 1);
  while (run < 90 && ticked(cur)) { run++; cur.setDate(cur.getDate() - 1); }
  if (run >= 3 && !ticked(today)) {
    var s = document.createElement('section'); s.className = 'section alt'; s.id = 'streak-nudge';
    s.innerHTML = '<div class="wrap prose"><h2>' + run + ' days in a row, and today is blank</h2>'
      + '<p>One tick keeps it. It does not have to be a session: the habits are water, steps, protein, sleep and the one you set yourself.</p>'
      + '<p><a class="btn btn-red" href="/tools/8-week-tracker/#habits">Tick today</a></p></div>';
    root.insertBefore(s, root.firstChild ? root.firstChild.nextSibling : null);
  }

  // ---- item 164: the member who stopped opening it. Recorded on this phone, read on the next visit.
  var lastOpen = get('sf_m_lastopen', null);
  var away = lastOpen ? days(new Date(lastOpen), today) : null;
  if (away !== null && away >= 14) {
    var b = document.createElement('section'); b.className = 'section'; b.id = 'welcome-back';
    b.innerHTML = '<div class="wrap prose"><h2>That is ' + away + ' days since you last opened this</h2>'
      + '<p>Nothing has been lost and nothing is being counted against you. Your logs are still here on this phone and the timetable has not moved.</p>'
      + '<p>The way back in is one session, not a plan. Pick the next class that fits and tell Stevie you are coming.</p>'
      + '<p><a class="btn btn-red" id="wb-wa" target="_blank" rel="noopener">Tell Stevie you are coming back</a> <a class="btn btn-ghost" href="/timetable/">The timetable</a></p></div>';
    b.querySelector('#wb-wa').href = wa('Hi Stevie, I have been off it for a bit and want back in. Which session would you put me in this week?');
    root.insertBefore(b, root.firstChild ? root.firstChild.nextSibling : null);
  }
  set('sf_m_lastopen', iso(today));
  if (window.gtag) gtag('event', 'members_block', {week: week === null ? 0 : week, streak: run, away: away === null ? -1 : away});
}
document.addEventListener('sf:open', sfMembersBlock); sfMembersBlock();

// ROADMAP-6 round 24, items 168, 170, 171 and 175. Same rules as everything else in here: reads the page and
// this phone's own storage, writes nothing anywhere else, invents no number and makes no offer.
function sfMembersR24(){
  var root = document.getElementById('members'); if (!root || root.dataset.r24) return; root.dataset.r24 = '1';
  function get(k, d){ try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v === null ? d : v; } catch (e) { return d; } }
  function wa(text){ var a = document.querySelector('#dash a[href^="https://wa.me/"]'); var base = a ? a.getAttribute('href').split('?')[0] : 'https://wa.me/'; return base + '?text=' + encodeURIComponent(text); }

  // ---- item 171: the portion table follows the appetite column the member already picked in the guide
  var tbl = document.getElementById('fw-portions');
  if (tbl) {
    var NAMES = ['Small', 'Moderate', 'Large'];
    var paint = function(){
      var col = get('sf_nut_appetite', 1); if (col < 0 || col > 2) col = 1;
      Array.prototype.forEach.call(tbl.querySelectorAll('[data-col]'), function(td){
        td.classList.toggle('fw-on', +td.getAttribute('data-col') === col);
        td.classList.toggle('fw-off', +td.getAttribute('data-col') !== col);
      });
      var note = document.getElementById('fw-col');
      if (note) note.textContent = 'Your column is ' + NAMES[col] + '. Change it in the guide below and this follows it.';
    };
    paint();
    // the guide writes the column on tap; repaint when the page changes rather than polling forever
    var box = document.getElementById('nutrition');
    if (box) new MutationObserver(paint).observe(box, {subtree: true, attributes: true, attributeFilter: ['aria-selected', 'class']});
  }

  // ---- item 175: the two members-only tools were in a card halfway down and nowhere on the dashboard
  var dash = document.getElementById('m-dash');
  if (dash && !dash.querySelector('a[href="/tools/photo-compare/"]')) {
    [['Photo compare', 'Week 1 beside week 8, on this phone only.', '/tools/photo-compare/'],
     ['Progress tracker', 'Eight rows, then one tap sends the check-in.', '/tools/8-week-tracker/']].forEach(function(c){
      if (dash.querySelector('a[href="' + c[2] + '"]')) return;
      var a = document.createElement('a'); a.className = 'dcard'; a.href = c[2];
      a.innerHTML = '<span class="eyebrow"></span><b></b>';
      a.querySelector('.eyebrow').textContent = c[0]; a.querySelector('b').textContent = c[1];
      dash.appendChild(a);
    });
  }

  // ---- item 170: an injury is a reason to stop opening the app. The plan existed; the "and it counted"
  // did not. Logging the modified session uses the same counter the guide's My week panel already keeps.
  var illOut = document.getElementById('ill-out');
  if (illOut && !document.getElementById('ill-log')) {
    var wrap = document.createElement('p');
    wrap.innerHTML = '<button type="button" class="nut-btn" id="ill-log">I did the modified session</button> '
      + '<span class="small" id="ill-log-note">A session you changed is still a session. It counts on your week the same as any other.</span>';
    illOut.parentNode.insertBefore(wrap, illOut.nextSibling);
    document.getElementById('ill-log').addEventListener('click', function(){
      // the SAME store the guide's "I trained today" writes, keyed by the same Monday-start week, so a
      // modified session lands in the sessions count and the streak instead of a second, private tally.
      var wd = new Date(); var off = (wd.getDay() + 6) % 7; wd.setDate(wd.getDate() - off);
      var wk = wd.toISOString().slice(0, 10), all = get('sf_nut_sess', {});
      all[wk] = all[wk] || []; all[wk].push(new Date().toISOString().slice(0, 10));
      try { localStorage.setItem('sf_nut_sess', JSON.stringify(all)); } catch (e) {}
      var out = document.getElementById('nut-sess'); if (out) out.textContent = all[wk].length;
      document.getElementById('ill-log-note').textContent = 'Logged for today. Tell Stevie what you changed so next week is written round it.';
      if (window.gtag) gtag('event', 'members_session_log', {kind: 'modified'});
    });
  }

  // ---- item 168: the review ask, at the only moment it is honest to ask. Never incentivised, never before
  // the numbers exist. Shown once: a member who has been asked is not asked again by a script.
  var tr = get('sf_tracker_v1', {});
  var start = tr && tr.start ? new Date(tr.start + 'T00:00:00') : null;
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var week = (start && !isNaN(start)) ? Math.floor((today - start) / 86400000 / 7) + 1 : null;
  var asked = get('sf_m_review_asked', false);
  if (week !== null && week >= 8 && !asked) {
    var rv = document.createElement('section'); rv.className = 'section'; rv.id = 'review-ask';
    rv.innerHTML = '<div class="wrap prose"><h2>You are at the end of a block</h2>'
      + '<p>If it went the way you wanted, two minutes of your words does more for the next nervous person '
      + 'reading the reviews than anything Stevie can write himself. First name only, honest, good or bad.</p>'
      + '<p>If it did not go the way you wanted, say that to Stevie instead and he will want to know why.</p>'
      + '<p><a class="btn btn-red" href="/review/" id="rv-go">Leave a Google review</a> '
      + '<a class="btn btn-ghost" id="rv-talk" target="_blank" rel="noopener">Tell Stevie instead</a> '
      + '<button type="button" class="nut-btn" id="rv-no">Not just now</button></p>'
      + '<p class="small">Never paid for and never incentivised. Nothing changes for you either way.</p></div>';
    rv.querySelector('#rv-talk').href = wa('Hi Stevie, I have finished the block. Here is what I thought: ');
    root.insertBefore(rv, root.firstChild ? root.firstChild.nextSibling : null);
    var done = function(){ try { localStorage.setItem('sf_m_review_asked', 'true'); } catch (e) {} rv.remove(); };
    rv.querySelector('#rv-no').addEventListener('click', done);
    rv.querySelector('#rv-go').addEventListener('click', function(){ try { localStorage.setItem('sf_m_review_asked', 'true'); } catch (e) {} if (window.gtag) gtag('event', 'members_review'); });
  }
}
document.addEventListener('sf:open', sfMembersR24); sfMembersR24();
