// Service worker for clydebankpt.com (roadmap B102/B103): network first, cache as the fallback, so a deploy is
// never hidden behind a stale copy and the timetable, prices, protein sheet and recipes still open with no signal.
// The version is the build's site.js hash, so every deploy that changes the scripts swaps the cache.
var VERSION = 'sf-21d458c436';
// ROADMAP-6 A25: someone on the train with no signal who wants the price of the package or the address used to
// get the offline page. The three pages a person checks on the way in are now cached with the rest.
var PRECACHE = ['/', '/timetable/', '/prices/', '/start/', '/8-week-package/', '/contact/', '/first-visit/', '/protein/', '/recipes/', '/tools/', '/offline/', '/style.css', '/site.js', '/img/logo-192.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(PRECACHE).catch(function () {}); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        if (hit) return hit;
        if (req.mode === 'navigate') return caches.match('/offline/');
      });
    })
  );
});
