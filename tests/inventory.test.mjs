import {test} from 'node:test';
import assert from 'node:assert/strict';
import {priorityDate,byPriorityDate,isDemoPurchase} from '../inventory-utils.js';

test('ранняя граница только для автоматически рассчитанного срока',()=>{
 assert.equal(priorityDate({isEstimated:true,expiryMinDate:'2026-11-15',expiryDate:'2026-11-20'}),'2026-11-15');
 assert.equal(priorityDate({isEstimated:false,expiryMinDate:'2026-11-15',expiryDate:'2026-11-20'}),'2026-11-20');
 assert.equal(priorityDate({}),null);
});
test('сортировка по раннему ориентиру, без даты в конце',()=>{
 const p=[{name:'Нет срока'},{name:'Позже',expiryDate:'2026-11-19'},{name:'Огурцы',isEstimated:true,expiryMinDate:'2026-11-14',expiryDate:'2026-11-23'}];
 assert.deepEqual(p.sort(byPriorityDate).map(x=>x.name),['Огурцы','Позже','Нет срока']);
});
test('исключаем только размеченные или точно совпадающие демонстрационные события',()=>{
 const p={name:'Молоко',isDemo:true,purchaseDate:'2026-11-13',createdAt:1000,unitPrice:50};
 const e={type:'purchase',name:'Молоко',date:'2026-11-13',createdAt:1100,amount:100,quantity:2};
 assert.equal(isDemoPurchase(e,[p]),true);
 assert.equal(isDemoPurchase({...e,createdAt:50000},[p]),false);
 assert.equal(isDemoPurchase({...e,isDemo:false},[p]),false);
 assert.equal(isDemoPurchase({...e,isDemo:true},[]),true);
 assert.equal(isDemoPurchase({...e,amount:101},[p]),false);
});
