import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const env=(k:string)=>{const v=Deno.env.get(k);if(!v)throw Error(`Missing server secret ${k}`);return v};
const json=(status:number,value:unknown)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
function localParts(tz:string,now:Date){
 const p=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now);
 const v=Object.fromEntries(p.map(x=>[x.type,x.value]));return {day:`${v.year}-${v.month}-${v.day}`,hour:Number(v.hour)};
}
function daysUntil(date:string,base:string){const a=Date.parse(`${date}T12:00:00Z`),b=Date.parse(`${base}T12:00:00Z`);return Math.round((a-b)/86400000)}
Deno.serve(async(req)=>{
 if(req.method!=='POST')return json(405,{error:'POST only'});
 // Этот токен хранится только в Supabase Vault и Edge Function secrets.
 if(req.headers.get('x-cron-secret')!==env('CRON_SECRET'))return json(401,{error:'Unauthorized'});
 try{
  const db=createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'));
  webpush.setVapidDetails(env('VAPID_SUBJECT'),env('VAPID_PUBLIC_KEY'),env('VAPID_PRIVATE_KEY'));
  const requestBody=await req.json().catch(()=>({}));
  const testMode=requestBody?.test===true;
  const now=new Date();let sent=0,skipped=0,errors=0;
  const {data:subs,error:subError}=await db.from('push_subscriptions').select('*').eq('enabled',true);
  if(subError)throw subError;
  for(const sub of subs||[]){
   let local;
   try{local=localParts(sub.timezone||'UTC',now)}catch{errors++;continue}
   if(!testMode&&local.hour!==9){skipped++;continue}
   const {data:backup,error:backupError}=await db.from('pantry_backups').select('data').eq('user_id',sub.user_id).maybeSingle();
   if(backupError){errors++;continue}
   const products=Array.isArray(backup?.data?.products)?backup.data.products:[];
   const due=products.filter((p:any)=>{
     if(p.isDemo||!(Number(p.quantity)>0))return false;
     const target=p.isEstimated?(p.expiryMinDate||p.expiryDate):p.expiryDate;
     return typeof target==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(target)&&daysUntil(target,local.day)<=1;
   });
   if(!due.length&&!testMode){skipped++;continue}
   if(testMode){try{await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth}},JSON.stringify({title:'Домашний склад — тест',body:'Серверные push-уведомления работают.',tag:'push-test'}),{TTL:3600});sent++}catch(e){console.error(e);errors++}continue}
   const {data:claimed,error:claimError}=await db.from('push_delivery_log').upsert({endpoint:sub.endpoint,local_day:local.day},{onConflict:'endpoint,local_day',ignoreDuplicates:true}).select('endpoint');
   if(claimError){errors++;continue}
   if(!claimed?.length){skipped++;continue}
   try{
    const body=due.length===1?`${due[0].name}: пора проверить срок использования`:`Срочно проверьте продукты: ${due.slice(0,3).map((p:any)=>p.name).join(', ')}${due.length>3?' и ещё '+(due.length-3):''}`;
    await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth}},JSON.stringify({title:'Домашний продуктовый склад',body,tag:'expiry-'+local.day}),{TTL:3600,urgency:'normal'});
    sent++;
   }catch(e){
    await db.from('push_delivery_log').delete().eq('endpoint',sub.endpoint).eq('local_day',local.day);
    const status=(e as any)?.statusCode;
    if(status===404||status===410)await db.from('push_subscriptions').update({enabled:false}).eq('endpoint',sub.endpoint);
    console.error('Push delivery failed',status,(e as Error).message);errors++;
   }
  }
  return json(200,{sent,skipped,errors});
 }catch(e){console.error(e);return json(500,{error:'Server configuration or processing failed'})}
});
