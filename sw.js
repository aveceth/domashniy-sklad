const CACHE='home-pantry-static-v3';
const ASSETS=['./','./index.html','./styles.css','./app.js','./db.js','./expiry-rules.js','./cloud.js','./cloud-config.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>{
 // New worker waits until the user chooses "Обновить сейчас".
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('home-pantry-static-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req)));
});
self.addEventListener('push',event=>{
 let payload={title:'Домашний склад',body:'Проверьте продукты, срок которых заканчивается.'};
 try{payload={...payload,...(event.data?.json()||{})}}catch{}
 event.waitUntil(self.registration.showNotification(payload.title,{body:payload.body,icon:'./icons/icon-192.png',badge:'./icons/icon-192.png',tag:payload.tag||'pantry-expiry',data:{url:'./'}}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>list.length?list[0].focus():clients.openWindow(event.notification.data?.url||'./')));
});
