const DB_NAME = 'home-pantry-v1';
const VERSION = 1;
let database;
export function openDB() {
  if (database) return Promise.resolve(database);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath:'id' });
      if (!db.objectStoreNames.contains('events')) db.createObjectStore('events', { keyPath:'id' });
      if (!db.objectStoreNames.contains('shopping')) db.createObjectStore('shopping', { keyPath:'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath:'key' });
    };
    req.onsuccess = () => { database = req.result; resolve(database); };
    req.onerror = () => reject(req.error);
  });
}
export async function all(store) { const db=await openDB(); return new Promise((resolve,reject)=>{ const request=db.transaction(store).objectStore(store).getAll(); request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error); }); }
export async function put(store,value) { const db=await openDB(); return new Promise((resolve,reject)=>{ const request=db.transaction(store,'readwrite').objectStore(store).put(value); request.onsuccess=()=>resolve(); request.onerror=()=>reject(request.error); }); }
export async function remove(store,key) { const db=await openDB(); return new Promise((resolve,reject)=>{ const request=db.transaction(store,'readwrite').objectStore(store).delete(key); request.onsuccess=()=>resolve(); request.onerror=()=>reject(request.error); }); }
export async function clear(store) { const db=await openDB(); return new Promise((resolve,reject)=>{ const request=db.transaction(store,'readwrite').objectStore(store).clear(); request.onsuccess=()=>resolve(); request.onerror=()=>reject(request.error); }); }
export async function replaceAll(data) { const db=await openDB(); return new Promise((resolve,reject)=>{ const stores=['products','events','shopping','settings']; const tx=db.transaction(stores,'readwrite'); for(const store of stores){const os=tx.objectStore(store);os.clear();for(const item of data[store]||[])os.put(item);}tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error); }); }
