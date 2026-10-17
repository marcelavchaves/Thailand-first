import type {Config} from '@netlify/functions';
import {randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import {safeStore,safeSession,safeCookie,username,validPin,pinHash,pinMatches,digest,type SafeAccount} from '../lib/safe-auth';
import {normalizeSafeId} from '../../lib/safe-ids';
import {assignedGuest} from '../lib/safe-roster';
const reply=(body:unknown,status=200,cookie?:string)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie',...(cookie?{'Set-Cookie':cookie}:{})}});
const summary=(account:SafeAccount)=>({username:account.username,safeId:account.safeId||null,nickname:account.nickname||'',displayName:account.nickname||account.safeId||account.username});
const nickname=(value:unknown)=>value===undefined?'':typeof value==='string'&&value.trim().length<=32?value.trim():null;
export default async function handler(request:Request){try{
 if(request.method==='GET'){const account=await safeSession(request);return reply({authenticated:!!account,...(account?summary(account):{username:null,safeId:null,nickname:''})});}
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Open Traveler Safe from the app.'},403);
 if(request.method==='DELETE')return reply({ok:true},200,await safeCookie(request));
 if(!['POST','PATCH'].includes(request.method))return reply({error:'Method not allowed.'},405);
 const raw=await request.text();if(raw.length>2000)return reply({error:'Invalid request.'},400);let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid request.'},400);}
 const store=safeStore('accounts');
 if(request.method==='PATCH'){
  const account=await safeSession(request);if(!account)return reply({error:'Unlock your Safe to change its nickname.'},401);
  const label=nickname(body?.nickname);if(label===null)return reply({error:'Use a nickname of up to 32 characters, or leave it blank.'},400);
  const record=await store.getWithMetadata(account.username,{type:'json'});const current=record?.data as SafeAccount|undefined;
  if(!current||current.version!==account.version)return reply({error:'Unlock your Safe again.'},401);
  const updated={...current,nickname:label};if(!(await store.setJSON(account.username,updated,{onlyIfMatch:record!.etag})).modified)return reply({error:'Your Safe changed in another window. Try again.'},409);
  return reply({ok:true,...summary(updated)});
 }
 const safeId=normalizeSafeId(body?.safeId??body?.username);
 // Existing username Safes remain accessible for their owners; new Safes require an assigned ID.
 const name=safeId?safeId.toLowerCase():body?.action==='register'?null:username(body?.username);
 if(!name||!validPin(body?.pin)||!['register','login','recover'].includes(body?.action))return reply({error:'Enter your assigned Safe ID (for example TG01) and a six-digit PIN.'},400);
 const record=await store.getWithMetadata(name,{type:'json'});const old=record?.data as SafeAccount|undefined;
 if(body.action==='register'){
  if(!safeId)return reply({error:'Activate your assigned Safe ID.'},400);
  const guest=await assignedGuest(safeId);if(!guest)return reply({error:'This Safe ID is not assigned. Check your Guest number with your tour director.'},400);
  if(old)return reply({error:'This Safe is already active. Unlock it or use Forgot PIN. Each guest has one assigned Safe.'},409);
  const label=nickname(body?.nickname);if(label===null)return reply({error:'Use a nickname of up to 32 characters, or leave it blank.'},400);
  const salt=randomBytes(32).toString('hex'),recoveryCode=randomBytes(24).toString('hex');
  const account:SafeAccount={id:randomUUID(),username:name,safeId,guestId:guest.id,nickname:label,salt,hash:await pinHash(body.pin,salt),key:randomBytes(32).toString('hex'),version:randomUUID(),recoveryHash:digest(recoveryCode),failures:0,lockedUntil:0};
  if(!(await store.setJSON(name,account,{onlyIfNew:true})).modified)return reply({error:'This Safe is already active. Unlock it instead.'},409);
  return reply({ok:true,...summary(account),recoveryCode},200,await safeCookie(request,account));
 }
 if(!old){await pinHash(body.pin,'00000000000000000000000000000000');return reply({error:'Check your Safe ID and PIN, or activate your assigned Safe if you have not used it yet.'},401);}
 if(old.lockedUntil>Date.now())return reply({error:'Too many attempts. Try again later.'},429);
 const recovering=body.action==='recover';
 const correct=recovering?typeof body.recoveryCode==='string'&&/^[a-f0-9]{48}$/.test(body.recoveryCode)&&timingSafeEqual(Buffer.from(digest(body.recoveryCode),'hex'),Buffer.from(old.recoveryHash,'hex')):await pinMatches(body.pin,old);
 if(!correct){const failures=(old.failures||0)+1;const lockedUntil=failures>=5?Date.now()+Math.min(24*3600000,15*60000*2**Math.floor((failures-5)/5)):0;const saved=await store.setJSON(name,{...old,failures,lockedUntil},{onlyIfMatch:record!.etag});if(!saved.modified)return reply({error:'Please try again.'},409);return reply({error:'Check your Safe ID and PIN or recovery code.'},401);}
 let account={...old,failures:0,lockedUntil:0},recoveryCode:string|undefined;
 if(recovering){const salt=randomBytes(32).toString('hex');recoveryCode=randomBytes(24).toString('hex');account={...account,salt,hash:await pinHash(body.pin,salt),version:randomUUID(),recoveryHash:digest(recoveryCode)};}
 if(!(await store.setJSON(name,account,{onlyIfMatch:record!.etag})).modified)return reply({error:'Your Safe changed in another window. Please try again.'},409);
 return reply({ok:true,...summary(account),...(recoveryCode?{recoveryCode}:{})},200,await safeCookie(request,account));
 }catch{return reply({error:'Traveler Safe is temporarily unavailable.'},503);}}
export const config:Config={path:'/api/safe-session',rateLimit:{windowLimit:20,windowSize:60,aggregateBy:['ip','domain']}};
