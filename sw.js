// Keeps Tray Card Grocer on the phone: the page (fresh when online), and the photos, store shelves and store
// directory (kept once fetched; their addresses change when they are rebuilt).
const V = "tcg-page-15";
const DATA = "tcg-data-1";
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(["./", "img/atlas.webp"])).catch(() => {}).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("tcg-page-") && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const u = new URL(req.url); if (u.origin !== location.origin) return;
  if (req.mode === "navigate" || /\/(index\.html)?$/.test(u.pathname)){
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(V).then(x => x.put("./", c)); return r; })
      .catch(() => caches.match("./").then(r => r || caches.match(req))));
    return;
  }
  if (/\/(img|chains|stores)\//.test(u.pathname)){
    // versioned files (?v=) never change: from the phone once fetched. The rest show the kept copy at once and
    // quietly refresh it for next time, so a re-cut photo still reaches the phone.
    const versioned = u.searchParams.has("v");
    e.respondWith(caches.open(DATA).then(c => c.match(req).then(hit => {
      const get = () => fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; });
      if (hit){ if (!versioned) e.waitUntil(get().catch(() => {})); return hit; }
      return get();
    })));
  }
});
