import {SUPABASE_URL,SUPABASE_ANON_KEY} from './cloud-config.js';
const KEY='home-pantry-cloud-auth-v1';
export const cloudConfigured=()=>Boolean(SUPABASE_URL&&SUPABASE_ANON_KEY);

function endpoint(path) {
  return SUPABASE_URL.replace(/\/+$/, '') + path;
}

function session(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
export const signedIn=()=>Boolean(session()?.refresh_token);
export function signOut(){localStorage.removeItem(KEY)}
async function authRequest(path,body){const res=await fetch(endpoint('/auth/v1/'+path),{method:'POST',headers:{'apikey':SUPABASE_ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.msg||data.error_description||data.message||'Ошибка авторизации');return data}
export async function signIn(email,password){if(!cloudConfigured())throw new Error('Сначала настройте cloud-config.js');const result=await authRequest('token?grant_type=password',{email,password});localStorage.setItem(KEY,JSON.stringify(result));return result}
export async function signUp(email,password){if(!cloudConfigured())throw new Error('Сначала настройте cloud-config.js');const result=await authRequest('signup',{email,password});if(result.access_token)localStorage.setItem(KEY,JSON.stringify(result));return result}
async function token(){let data=session();if(!data)throw Error('Войдите в аккаунт');if(Date.now()/1000<(data.expires_at||0)-90)return data.access_token;const next=await authRequest('token?grant_type=refresh_token',{refresh_token:data.refresh_token});localStorage.setItem(KEY,JSON.stringify(next));return next.access_token}
async function request(method,path,body){const access=await token();const response=await fetch(endpoint('/rest/v1/'+path),{method,headers:{'apikey':SUPABASE_ANON_KEY,'Authorization':'Bearer '+access,'Content-Type':'application/json',...(method==='POST'?{'Prefer':'resolution=merge-duplicates,return=representation'}:{})},body:body===undefined?undefined:JSON.stringify(body)});if(!response.ok){const result=await response.json().catch(()=>({}));throw Error(result.message||('Ошибка облака: '+response.status))}return response.status===204?null:response.json()}
async function userId(){const access=await token();const response=await fetch(endpoint('/auth/v1/user'),{headers:{'apikey':SUPABASE_ANON_KEY,'Authorization':'Bearer '+access}});if(!response.ok)throw Error('Не удалось получить пользователя');return (await response.json()).id}
export async function uploadBackup(snapshot){const user_id=await userId();return request('POST','pantry_backups?on_conflict=user_id',[{user_id,data:snapshot,updated_at:new Date().toISOString()}])}
export async function downloadBackup(){const result=await request('GET','pantry_backups?select=data,updated_at&limit=1');return result[0]||null}

// Регистрация подписки происходит только по нажатию пользователя.
export async function savePushSubscription(subscription, timezone){
 const user_id=await userId();
 const entry={user_id,endpoint:subscription.endpoint,p256dh:subscription.keys.p256dh,auth:subscription.keys.auth,timezone,enabled:true,updated_at:new Date().toISOString()};
 return request('POST','push_subscriptions?on_conflict=endpoint',[entry]);
}
export async function disablePushSubscription(endpoint){
 const user_id=await userId();
 return request('PATCH','push_subscriptions?user_id=eq.'+encodeURIComponent(user_id)+'&endpoint=eq.'+encodeURIComponent(endpoint),{enabled:false});
}
