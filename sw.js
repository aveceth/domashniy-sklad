const CACHE='home-pantry-static-v2';
const ASSETS=['./','./index.html','./styles.css','./app.js','./db.js','./expiry-rules.js','./cloud.js','./cloud-config.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));});

// При получении события Web Push уведомление отображается даже при закрытом приложении.
// Подписка и планировщик отправки требуют настроенного HTTPS-сервера с VAPID.
self.addEventListener('push',event=>{let payload={title:'Домашний склад',body:'Проверьте продукты с ближайшим сроком.'};try{payload={...payload,...event.data?.json()}}catch{}event.waitUntil(self.registration.showNotification(payload.title,{body:payload.body,icon:'./icons/icon-192.png',badge:'./icons/icon-192.png',tag:payload.tag||'pantry-expiry',data:{url:'./'}}))});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{if(list.length)return list[0].focus();return clients.openWindow(event.notification.data?.url||'./')}))});
