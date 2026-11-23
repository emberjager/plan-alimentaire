/* Hors connexion : on prend toujours la dernière version en ligne, sinon la copie gardée. */
const C="plan-v5";
self.addEventListener("install",e=>{ self.skipWaiting(); e.waitUntil(caches.open(C).then(c=>c.addAll(["./","index.html","app.css?v=5","js/data.js?v=5","js/logic.js?v=5","js/app.js?v=5","manifest.webmanifest","icon.svg"]).catch(()=>{}))); });
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url); if(e.request.method!=="GET"||u.origin!==location.origin) return;
  e.respondWith(fetch(e.request).then(r=>{ const cp=r.clone(); caches.open(C).then(c=>c.put(e.request,cp)); return r; }).catch(()=>caches.match(e.request).then(r=>r||caches.match("index.html"))));
});
