import type {Config} from '@netlify/functions';
import {randomBytes} from 'node:crypto';
import {hasTDSession,sameOrigin} from '../lib/td-auth';
import {assignedGuest} from '../lib/safe-roster';
import {safeStore,safeIdentityUser,digest,type SafeAccessSettings} from '../lib/safe-auth';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie','Referrer-Policy':'no-referrer'}});
export default async function handler(request:Request){try{
 if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
 if(!sameOrigin(request))return reply({error:'Open this action in Wondercase.'},403);
 const raw=await request.text();if(raw.length>2000)return reply({error:'Invalid invitation.'},400);
 let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid request.'},400);}
 if(!body||!['create','revoke','claim'].includes(body.action))return reply({error:'Invalid action.'},400);
 const td=body.action!=='claim';if(td&&!await hasTDSession(request))return reply({error:'Sign in to TD Suitcase.'},401);
 const user=td?null:await safeIdentityUser(request);if(!td&&!user)return reply({error:'Sign in with a verified email or Google first.'},401);
 if(!td&&(typeof body.token!=='string'||!/^[-_A-Za-z0-9]{43}$/.test(body.token)))return reply({error:'This invitation is invalid or expired. Ask Xavier for a new private link.'},400);
 const store=safeStore('access');
 for(let attempt=0;attempt<4;attempt++){
  const record=await store.getWithMetadata('assignments',{type:'json'}),settings=(record?.data||{safes:{}}) as SafeAccessSettings;
  const invitations={...settings.invitations};const now=Date.now();
  for(const [key,value] of Object.entries(invitations))if(value.expiresAt<=now)delete invitations[key];
  let result:object;
  if(td){
   if(typeof body.safeId!=='string')return reply({error:'Choose a guest Safe.'},400);
   const guest=await assignedGuest(body.safeId);if(!guest)return reply({error:'This guest is no longer on the list.'},404);
   for(const [key,value] of Object.entries(invitations))if(value.safeId===guest.safeId)delete invitations[key];
   if(body.action==='create'){
    const token=randomBytes(32).toString('base64url'),expiresAt=now+7*86400000;
    invitations[digest(token)]={safeId:guest.safeId!,guestId:guest.id,expiresAt};
    result={url:new URL('/traveler-safe',request.url).origin+'/traveler-safe#safe_invite='+token,expiresAt};
   }else result={revoked:true};
  }else{
   const key=digest(body.token),invite=invitations[key];if(!invite)return reply({error:'This invitation has been used, revoked or expired. Ask Xavier for a new private link.'},410);
   const guest=await assignedGuest(invite.safeId);if(!guest||guest.id!==invite.guestId)return reply({error:'This invitation is no longer valid.'},410);
   const matches=Object.values(settings.safes).filter(s=>s.emails.includes(user!.email)||Object.values(s.subjects).includes(user!.id));
   if(matches.some(s=>s.safeId!==invite.safeId||s.guestId!==invite.guestId))return reply({error:'This account already belongs to another Safe. Sign out and use your own account.'},409);
   const prior=settings.safes[invite.safeId];if(prior&&prior.guestId!==invite.guestId)return reply({error:'This Safe needs Xavier’s assistance.'},409);
   if(prior?.subjects[user!.email]&&prior.subjects[user!.email]!==user!.id)return reply({error:'This email belongs to another account. Ask Xavier for help.'},409);
   const emails=[...new Set([...(prior?.emails||[]),user!.email])];if(emails.length>4)return reply({error:'This Safe already has four members. Ask Xavier for help.'},409);
   settings.safes={...settings.safes,[invite.safeId]:{safeId:invite.safeId,guestId:guest.id,emails,subjects:{...prior?.subjects,[user!.email]:user!.id}}};
   delete invitations[key];result={connected:true,safeId:invite.safeId};
  }
  if((await store.setJSON('assignments',{...settings,invitations},record?{onlyIfMatch:record.etag}:{onlyIfNew:true})).modified)return reply(result);
 }
 return reply({error:'Safe access changed. Please try again.'},409);
}catch{return reply({error:'Unable to process this invitation. Please try again.'},503);}}
export const config:Config={path:'/api/safe-invitations',rateLimit:{windowLimit:30,windowSize:60,aggregateBy:['ip','domain']}};
