import type {Config} from '@netlify/functions';
import {logout} from '@netlify/identity';
import {safeStore,safeSession,safeIdentityUser,type SafeAccount} from '../lib/safe-auth';
const reply=(body:unknown,status=200,cookie?:string)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie',...(cookie?{'Set-Cookie':cookie}:{})}});
const summary=(a:SafeAccount)=>({username:a.username,safeId:a.safeId,nickname:a.nickname,displayName:a.nickname||a.safeId||'My Safe'});
export default async function handler(request:Request){try{
 if(request.method==='GET'){const user=await safeIdentityUser(request),account=user?await safeSession(request,user):null;return reply({authenticated:!!account,identityAuthenticated:!!user,email:user?.email||null,...(account?summary(account):{username:null,safeId:null,nickname:''})});}
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Open Traveler Safe from the app.'},403);
 if(request.method==='DELETE'){await logout();return reply({ok:true},200,'__Host-kd_safe=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0');}
 if(request.method!=='PATCH')return reply({error:'Use email/password or Google to sign in. Safe PINs and recovery codes are no longer used.'},405);
 const account=await safeSession(request);if(!account)return reply({error:'Sign in to your Safe first.'},401);
 const raw=await request.text();if(raw.length>2000)return reply({error:'Invalid request.'},400);let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid request.'},400);}
 if(typeof body?.nickname!=='string'||body.nickname.trim().length>32)return reply({error:'Use a nickname of up to 32 characters.'},400);
 const store=safeStore('accounts'),record=await store.getWithMetadata(account.username,{type:'json'});if(!record)return reply({error:'Sign in again.'},401);
 const updated={...(record.data as SafeAccount),nickname:body.nickname.trim()};if(!(await store.setJSON(account.username,updated,{onlyIfMatch:record.etag})).modified)return reply({error:'Your Safe changed. Reload and try again.'},409);
 return reply({ok:true,...summary(updated)});
}catch{return reply({error:'Traveler Safe is temporarily unavailable.'},503);}}
export const config:Config={path:'/api/safe-session',rateLimit:{windowLimit:60,windowSize:60,aggregateBy:['ip','domain']}};
