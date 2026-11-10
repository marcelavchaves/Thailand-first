import type {Config} from '@netlify/functions';
import {randomUUID,createDecipheriv} from 'node:crypto';
import {safeIdentityUser,safeSession,safeStore,normalizeEmail,type SafeAccount} from '../lib/safe-auth';
import {safeDates,validateActivities,type PersonalActivity} from '../../lib/safe-plans';
type Share={id:string;version:string;ownerKey:string;ownerId:string;senderEmail:string;recipientEmail:string;recipientSubject?:string;recipientAccountId?:string;kind:'document'|'plan';itemId:string;date?:string;permission:'view'|'edit';status:'pending'|'accepted'|'revoked'|'declined';created:string};
type Ledger={shares:Share[]};
type Doc={id:string;name:string;type:string;size:number;created:string};
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie'}});
const idPattern=/^[a-f0-9-]{36}$/i;
async function resource(share:Share){
 const record=await safeStore('accounts').getWithMetadata(share.ownerKey,{type:'json'}),owner=record?.data as SafeAccount|undefined;
 if(!owner||owner.id!==share.ownerId)return null;
 if(share.kind==='document'){
  const index=await safeStore('documents').getWithMetadata(owner.id+'/index',{type:'json'});
  const document=((index?.data as any)?.documents as Doc[]|undefined)?.find(d=>d.id===share.itemId);
  return document?{owner,document,title:document.name}:null;
 }
 const plans=await safeStore('plans').getWithMetadata(owner.id+'/'+share.date,{type:'json'}),activities=(plans?.data as any)?.activities as PersonalActivity[]|undefined;
 const activity=activities?.find(a=>a.id===share.itemId);
 return activity?{owner,activity,title:activity.title,activities:activities!,revision:plans!.etag}:null;
}
export default async function handler(request:Request){try{
 if(!['GET','POST','PUT'].includes(request.method))return reply({error:'Method not allowed.'},405);
 if(request.method!=='GET'&&request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Open sharing from the app.'},403);
 const user=await safeIdentityUser(request),account=user?await safeSession(request,user):null;
 if(!user||!account)return reply({error:'Sign in to Traveler Safe first.'},401);
 const store=safeStore('sharing'),url=new URL(request.url);
 if(request.method==='GET'){
  const record=await store.getWithMetadata('ledger',{type:'json'}),shares=((record?.data as Ledger|undefined)?.shares||[]),id=url.searchParams.get('id');
  if(id){
   const share=shares.find(s=>s.id===id),owner=share?.ownerId===account.id;
   const allowed=share&&(owner||share.status==='accepted'&&share.recipientAccountId===account.id);
   if(!share||!allowed||!owner&&share.status!=='accepted')return reply({error:'This shared item is unavailable.'},404);
   const item=await resource(share);if(!item)return reply({error:'The owner removed this item.'},404);
   if(url.searchParams.get('download')==='1'){
    if(share.kind!=='document'||!item.document)return reply({error:'This item is not a document.'},400);
    const stored=await safeStore('documents').get(share.ownerId+'/file/'+share.itemId,{type:'arrayBuffer'});if(!stored)return reply({error:'Document unavailable.'},404);
    const bytes=Buffer.from(stored),decipher=createDecipheriv('aes-256-gcm',Buffer.from(item.owner.key,'hex'),bytes.subarray(0,12));decipher.setAuthTag(bytes.subarray(12,28));
    const plain=Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]);
    return new Response(plain,{headers:{'Content-Type':item.document.type,'Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(item.document.name),'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
   }
   return reply({kind:share.kind,date:share.date,permission:owner?'edit':share.permission,fromEmail:share.senderEmail,activity:item.activity,document:item.document,revision:item.revision});
  }
  const outgoing=shares.filter(s=>s.ownerId===account.id),incoming=shares.filter(s=>s.ownerId!==account.id&&(s.status==='pending'&&s.recipientEmail===user.email&&(!s.recipientSubject||s.recipientSubject===user.id)||s.status==='accepted'&&s.recipientAccountId===account.id));
  async function summarize(share:Share){
   const item=await resource(share);
   return {id:share.id,version:share.version,kind:share.kind,date:share.date,permission:share.permission,status:share.status,created:share.created,fromEmail:share.senderEmail,toEmail:share.recipientEmail,title:item?.title||'Item no longer available',available:!!item};
  }
  return reply({incoming:await Promise.all(incoming.map(summarize)),outgoing:await Promise.all(outgoing.map(summarize))});
 }
 const raw=await request.text();if(raw.length>16000)return reply({error:'Request too large.'},413);
 let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid sharing request.'},400);}
 if(!body||typeof body!=='object')return reply({error:'Invalid sharing request.'},400);
 if(request.method==='PUT'){
  if(typeof body.id!=='string'||!idPattern.test(body.id))return reply({error:'Invalid shared plan.'},400);
  const ledger=await store.getWithMetadata('ledger',{type:'json'}),share=(ledger?.data as Ledger|undefined)?.shares.find(s=>s.id===body.id);
  if(!share||share.status!=='accepted'||share.kind!=='plan'||share.permission!=='edit'||share.recipientAccountId!==account.id||share.ownerId===account.id)return reply({error:'You do not have permission to edit this shared plan.'},403);
  const item=await resource(share);if(!item?.activity)return reply({error:'The owner removed this plan.'},404);
  if(body.revision!==item.revision)return reply({error:'This plan changed. Reload it before saving.'},409);
  let activity:PersonalActivity;try{activity=validateActivities(share.date,[{...body.activity,id:share.itemId}])[0];}catch(e){return reply({error:e instanceof Error?e.message:'Check the plan details.'},400);}
  const latest=await store.getWithMetadata('ledger',{type:'json'}),current=(latest?.data as Ledger|undefined)?.shares.find(s=>s.id===share.id);
  if(!current||current.status!=='accepted'||current.permission!=='edit'||current.recipientAccountId!==account.id)return reply({error:'Sharing permission changed. Reload your Safe.'},403);
  const saved=await safeStore('plans').setJSON(share.ownerId+'/'+share.date,{activities:item.activities!.map(a=>a.id===share.itemId?activity:a)},{onlyIfMatch:item.revision!});
  if(!saved.modified)return reply({error:'This plan changed. Reload before saving.'},409);
  return reply({saved:true,activity,revision:saved.etag});
 }
 if(!['create','accept','decline','revoke'].includes(body.action))return reply({error:'Invalid sharing action.'},400);
 let created:Share|undefined;
 if(body.action==='create'){
  const email=normalizeEmail(body.email);
  if(!email||email===user.email)return reply({error:'Enter another guest’s valid sign-in email.'},400);
  if(!['document','plan'].includes(body.kind)||typeof body.itemId!=='string'||!idPattern.test(body.itemId))return reply({error:'Choose a saved document or plan.'},400);
  if(!['view','edit'].includes(body.permission)||body.kind==='document'&&body.permission!=='view')return reply({error:'Documents can be shared for viewing only.'},400);
  if(body.kind==='plan'&&(typeof body.date!=='string'||!safeDates.includes(body.date)))return reply({error:'Choose a plan from your calendar.'},400);
  created={id:randomUUID(),version:randomUUID(),ownerKey:account.username,ownerId:account.id,senderEmail:user.email,recipientEmail:email,kind:body.kind,itemId:body.itemId,...(body.kind==='plan'?{date:body.date}:{}),permission:body.permission,status:'pending',created:new Date().toISOString()};
  if(!await resource(created))return reply({error:'This item is no longer in your Safe. Reload before sharing.'},404);
 }
 for(let attempt=0;attempt<4;attempt++){
  const record=await store.getWithMetadata('ledger',{type:'json'}),ledger=(record?.data||{shares:[]}) as Ledger;
  let next:Share[];
  if(created){
   if(ledger.shares.length>=5000||ledger.shares.filter(s=>s.ownerId===account.id&&['pending','accepted'].includes(s.status)).length>=100)return reply({error:'Sharing limit reached. Stop an existing share before adding another.'},400);
   if(ledger.shares.some(s=>s.ownerId===account.id&&s.recipientEmail===created!.recipientEmail&&s.kind===created!.kind&&s.itemId===created!.itemId&&s.date===created!.date&&['pending','accepted'].includes(s.status)))return reply({error:'This item is already shared or awaiting acceptance for that email.'},409);
   next=[...ledger.shares,created];
  }else{
   const share=ledger.shares.find(s=>s.id===body.id);if(!share)return reply({error:'This invitation is unavailable.'},404);
   const owner=share.ownerId===account.id,pendingRecipient=share.status==='pending'&&share.recipientEmail===user.email&&(!share.recipientSubject||share.recipientSubject===user.id),acceptedRecipient=share.status==='accepted'&&share.recipientAccountId===account.id;
   if(body.action==='revoke'?!owner:!pendingRecipient&&!acceptedRecipient)return reply({error:'This action is not available to your account.'},403);
   if(body.version!==share.version)return reply({error:'This invitation changed. Refresh sharing and try again.'},409);
   if(body.action==='accept'&&(!pendingRecipient||owner))return reply({error:'Accept this invitation from a different Safe.'},400);
   if(!['pending','accepted'].includes(share.status))return reply({error:'This sharing invitation is no longer active.'},409);
   if(body.action==='accept'&&!await resource(share))return reply({error:'The owner removed this item.'},404);
   const updated:Share={...share,version:randomUUID(),status:body.action==='accept'?'accepted':body.action==='revoke'?'revoked':'declined',...(body.action==='accept'?{recipientSubject:user.id,recipientAccountId:account.id}:{})};
   next=ledger.shares.map(s=>s.id===share.id?updated:s);
  }
  if((await store.setJSON('ledger',{shares:next},record?{onlyIfMatch:record.etag}:{onlyIfNew:true})).modified)return reply({ok:true,...(created?{id:created.id}:{})});
 }
 return reply({error:'Sharing changed in another window. Please try again.'},409);
}catch{return reply({error:'Sharing is temporarily unavailable. Please try again.'},503);}}
export const config:Config={path:'/api/safe-sharing',rateLimit:{windowLimit:90,windowSize:60,aggregateBy:['ip','domain']}};
