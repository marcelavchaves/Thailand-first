import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {getStore} from '@netlify/blobs';
import {getIdentityConfig} from '@netlify/identity';
import {assignedGuest} from './safe-roster';
export const safeStore=(name:string)=>getStore({name:'traveler-safe-'+name,consistency:'strong'});
export const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
export type SafeAccount={id:string;username:string;safeId:string;guestId:string;nickname:string;key:string;version:string;auth:'identity'};
export type SafeIdentity={id:string;email:string};
export type SafeAccess={safeId:string;guestId:string;emails:string[];subjects:Record<string,string>};
export type SafeAccessSettings={safes:Record<string,SafeAccess>;invitations?:Record<string,{safeId:string;guestId:string;expiresAt:number}>};
export const normalizeEmail=(value:unknown)=>typeof value==='string'&&value.trim().length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())?value.trim().toLowerCase():null;
// Verify the visitor's token explicitly. Never treat an Identity operator token as a guest.
export async function safeIdentityUser(request:Request):Promise<SafeIdentity|null>{
 const raw=request.headers.get('cookie')?.match(/(?:^|;\s*)nf_jwt=([^;]+)/)?.[1];if(!raw)return null;
 let token;try{token=decodeURIComponent(raw);}catch{return null;}
 if(token.length>16000||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token))return null;
 const config=getIdentityConfig();if(!config?.url)return null;
 const r=await fetch(config.url.replace(/\/$/,'')+'/user',{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(5000)});
 if(r.status===401||r.status===403)return null;if(!r.ok)throw Error('Sign-in verification is temporarily unavailable.');
 const user=await r.json(),email=normalizeEmail(user.email);if(typeof user.id!=='string'||!user.id||!email||!(user.confirmed_at||user.email_confirmed_at))return null;
 return {id:user.id,email};
}
export async function safeSession(request:Request,verified?:SafeIdentity|null):Promise<SafeAccount|null>{
 const user=verified===undefined?await safeIdentityUser(request):verified;if(!user)return null;
 for(let attempt=0;attempt<3;attempt++){
  const accessStore=safeStore('access'),record=await accessStore.getWithMetadata('assignments',{type:'json'}),settings=record?.data as SafeAccessSettings|undefined;
  const matches=Object.values(settings?.safes||{}).filter(s=>s.emails.includes(user.email));if(matches.length!==1)return null;
  const access=matches[0],guest=await assignedGuest(access.safeId);if(!guest||guest.id!==access.guestId)return null;
  if(access.subjects[user.email]&&access.subjects[user.email]!==user.id)return null;
  if(!access.subjects[user.email]){
   const next={...settings,safes:{...settings!.safes,[access.safeId]:{...access,subjects:{...access.subjects,[user.email]:user.id}}}};
   if(!(await accessStore.setJSON('assignments',next,{onlyIfMatch:record!.etag})).modified)continue;
  }
  const accounts=safeStore('accounts'),name=access.safeId.toLowerCase(),saved=await accounts.getWithMetadata(name,{type:'json'}),old=saved?.data as any;
  if(old&&(old.guestId&&old.guestId!==guest.id||old.safeId&&old.safeId!==access.safeId))return null;
  if(old&&(!old.id||!/^[a-f0-9]{64}$/.test(old.key)))throw Error('This Safe needs assistance.');
  if(old?.auth==='identity')return old as SafeAccount;
  // Preserve the original document owner ID and encryption key during migration.
  const account:SafeAccount={id:old?.id||randomUUID(),username:name,safeId:access.safeId,guestId:guest.id,nickname:old?.nickname||'',key:old?.key||randomBytes(32).toString('hex'),version:randomUUID(),auth:'identity'};
  if(!(await accounts.setJSON(name,account,saved?{onlyIfMatch:saved.etag}:{onlyIfNew:true})).modified)continue;
  return account;
 }
 throw Error('Your Safe changed. Please try again.');
}
