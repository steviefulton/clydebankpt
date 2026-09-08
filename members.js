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

  function init(){ if (!document.getElementById('log')) return; if (document.getElementById('log').dataset.ready) return; document.getElementById('log').dataset.ready = '1'; sessions(); lifts(); timers(); daily(); review(); }
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
  secs.forEach(function(s){
    var li = document.createElement('li'); var a = document.createElement('a'); a.href = '#' + s.id; a.textContent = label(s); li.appendChild(a);
    if (s.id === 'updates' || s.id === 'wall' || s.id === 'plans') {
      var key = 'sf_m_seen_' + s.id, now = hash(s.textContent.replace(/\s+/g, ' ')), seen = null;
      try { seen = localStorage.getItem(key); } catch (e) {}
      if (seen && seen !== now) { var d = document.createElement('span'); d.className = 'dot'; d.title = 'Changed since your last visit'; a.appendChild(d); a.classList.add('is-new'); }
      a.addEventListener('click', function(){ try { localStorage.setItem(key, now); } catch (e) {} a.classList.remove('is-new'); var dd = a.querySelector('.dot'); if (dd) dd.remove(); });
      if (!seen) { try { localStorage.setItem(key, now); } catch (e) {} }
    }
    ul.appendChild(li);
  });
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
  var wk = root.querySelector('#thisweek h2'); if (wk) cards.push(['This week', wk.textContent.trim(), '#thisweek']);
  var today = root.querySelector('#today'); if (today) { var tp = today.querySelector('p'); var tt = tp ? tp.textContent.trim() : today.textContent.trim(); cards.push(['Today', tt.split(/(?<=[.!])\s/)[0].slice(0, 120), '#today']); }
  var streak = 0; try { var hb = JSON.parse(localStorage.getItem('sf_habits_v1') || '{}'); var d = new Date(); for (var i = 0; i < 60; i++) { var k = d.toISOString().slice(0, 10); var v = hb[k]; var any = v && (Array.isArray(v) ? v.some(Boolean) : Object.keys(v).some(function(x){ return v[x]; })); if (!any) { if (i === 0) { d.setDate(d.getDate() - 1); continue; } break; } streak++; d.setDate(d.getDate() - 1); } } catch (e) {}
  cards.push(['Habit streak', streak ? streak + ' day' + (streak === 1 ? '' : 's') + ' with a tick' : 'No ticks yet. Five a day, on the tracker.', '/tools/8-week-tracker/#habits']);
  var now = root.querySelector('#thisweek .wrap > p:not(.eyebrow)'); if (now) cards.push(['One thing today', now.textContent.trim().split(/(?<=[.!])\s/)[0].slice(0, 140), '#thisweek']);
  dash.innerHTML = cards.map(function(c){ return '<a class="dcard" href="' + c[2] + '"><span class="eyebrow">' + c[0] + '</span><b></b></a>'; }).join('');
  Array.prototype.forEach.call(dash.querySelectorAll('.dcard b'), function(b, i){ b.textContent = cards[i][1]; });
  if (window.gtag) gtag('event', 'members_dash', {cards: cards.length, streak: streak});
}
document.addEventListener('sf:open', sfMembersDash); sfMembersDash();
