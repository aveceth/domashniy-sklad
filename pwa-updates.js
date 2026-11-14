// Регистрация и обновления PWA. Обновление выполняется по кнопке пользователя.
const $ = selector => document.querySelector(selector);
export function setupUpdates(){navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(reg=>{
 const promptUpdate=()=>{$('#updateBanner').classList.remove('hidden')};
 if(reg.waiting&&navigator.serviceWorker.controller)promptUpdate();
 reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)promptUpdate()})});
 $('#applyUpdate').addEventListener('click',()=>{if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});else location.reload()});
 const interval=setInterval(()=>{if(document.visibilityState==='visible')reg.update().catch(()=>{})},60*1000);
 window.addEventListener('pagehide',()=>clearInterval(interval),{once:true});reg.update().catch(()=>{});
 }).catch(err=>console.warn('PWA update failed',err));
 let reloading=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!reloading){reloading=true;location.reload()}});
}
