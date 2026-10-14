const CACHE='zstunting-v2';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./logo.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url);
  if(u.hostname.endsWith('supabase.co')) return;
  e.respondWith(fetch(r).then(res=>{
    if(res.ok && (u.origin===location.origin || /unpkg|jsdelivr|cdnjs|tile\.openstreetmap/.test(u.hostname))){
      const cp=res.clone(); caches.open(CACHE).then(c=>c.put(r,cp));
    }
    return res;
  }).catch(()=>caches.match(r).then(m=>m||caches.match('./index.html'))));
});
