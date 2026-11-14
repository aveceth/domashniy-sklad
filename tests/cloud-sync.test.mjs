import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCloudSync,CLOUD_DIRTY,CLOUD_ENABLED,CLOUD_LAST} from '../cloud-sync.js';

function harness({online=true, upload=async()=>{}}={}) {
  const data = new Map(); const timers=[]; let text=''; const notifications=[];
  const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
  const sync=createCloudSync({storage,online:()=>online,configured:()=>true,authenticated:()=>true,
    getSnapshot:async()=>({products:[]}),upload,status:v=>{text=v},notify:v=>notifications.push(v),
    schedule:(fn,ms)=>{const x={fn,ms,stopped:false};timers.push(x);return x},
    cancel:x=>{x.stopped=true},now:()=>new Date('2026-11-14T08:00:00Z')});
  return {sync,storage,timers,notifications,get text(){return text}};
}

test('без включения резервного копирования изменения остаются локальными',async()=>{
  const h=harness();h.sync.queue();assert.equal(h.storage.getItem(CLOUD_DIRTY),'1');
  assert.equal(h.timers.length,0);await h.sync.flush();assert.equal(h.storage.getItem(CLOUD_LAST),null);
});
test('успешная отправка обновляет время и очищает несохранённые изменения',async()=>{
  let n=0;const h=harness({upload:async()=>{n++}});h.sync.markSaved();h.sync.queue();
  await h.sync.flush();assert.equal(n,1);assert.equal(h.storage.getItem(CLOUD_DIRTY),null);
  assert.equal(h.storage.getItem(CLOUD_ENABLED),'1');assert.ok(h.text.includes('Последнее сохранение'));
});
test('ошибка отправки оставляет изменения и планирует новую попытку',async()=>{
  const h=harness({upload:async()=>{throw Error('offline')}});h.sync.markSaved();h.sync.queue();
  await h.sync.flush();assert.equal(h.storage.getItem(CLOUD_DIRTY),'1');
  assert.equal(h.notifications.length,1);assert.ok(h.timers.some(x=>x.ms===5000));
});
test('новые изменения во время запроса не теряются',async()=>{
  let complete;const h=harness({upload:()=>new Promise(resolve=>{complete=resolve})});
  h.sync.markSaved();h.sync.queue();const sending=h.sync.flush();
  await Promise.resolve();await Promise.resolve();h.sync.queue();complete();await sending;
  assert.equal(h.storage.getItem(CLOUD_DIRTY),'1');
});
test('ручное сохранение не стирает изменения, добавленные после его начала',()=>{
  const h=harness();h.sync.markSaved();const revision=h.sync.revision();h.sync.queue();
  h.sync.markSaved(revision);assert.equal(h.storage.getItem(CLOUD_DIRTY),'1');
});
test('выход и восстановление отключают автосохранение',()=>{
  const h=harness();h.sync.markSaved();h.sync.queue();h.sync.beforeRestore();
  assert.equal(h.sync.isEnabled(),false);assert.equal(h.storage.getItem(CLOUD_DIRTY),null);
  assert.equal(h.storage.getItem(CLOUD_ENABLED),null);
});
