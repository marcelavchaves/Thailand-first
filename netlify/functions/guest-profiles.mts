import {announce} from '../lib/updates';
import type {Config} from '@netlify/functions';
import {getStore} from '@netlify/blobs';
import {hasTDSession,sameOrigin} from '../lib/td-auth';
import sharp from 'sharp';
import {rosterData,type RosterData} from '../lib/safe-roster';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export default async function handler(request:Request, context:{waitUntil?:(promise:Promise<unknown>)=>void}){try{
 const store=getStore({name:'guest-profiles',consistency:'strong'});
 const td=(await hasTDSession(request));
 const roster=await store.getWithMetadata('roster',{type:'json'});
 const effective=rosterData(roster?.data as RosterData|undefined);
 const ids=effective.guests.map(g=>g.id);
 const revealed=effective.revealed;
 if(request.method==='GET'){
  if(!td&&!revealed)return reply({});
  const entries=await Promise.all(ids.map(async(id)=>{const item=await store.getWithMetadata(`guest/${id}`,{type:'json'});const p=item?.data as any||{};return [id,{intro:p.intro||'',photo:p.photo||null,...(td?{pending:p.pending||'',revision:item?.etag||null}:{})}];}));return reply(Object.fromEntries(entries));
 }
 if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
 if(!td&&!revealed)return reply({error:'Guest profiles will be available when your tour director reveals the list.'},403);
 if(!sameOrigin(request))return reply({error:'Open this action in the app.'},403);
 const raw=await request.text();if(raw.length>800000)return reply({error:'Photo is too large.'},413);
 let b;try{b=JSON.parse(raw);}catch{return reply({error:'Invalid request.'},400);}
 if(!ids.includes(b.id)||!['submit','intro','photo','approve','reject'].includes(b.action))return reply({error:'Invalid guest or action.'},400);
 if(b.action!=='submit'&&!td)return reply({error:'Sign in with Chervil’s TD Login.'},401);
 const item=await store.getWithMetadata(`guest/${b.id}`,{type:'json'});const p=item?.data as any||{};
 if(td&&b.action!=='submit'&&(b.revision||null)!==(item?.etag||null))return reply({error:'This profile changed. Refresh before saving again.'},409);
 if(b.action==='submit'||b.action==='intro'){
  if(typeof b.intro!=='string'||!b.intro.trim()||b.intro.length>600)return reply({error:'Write an introduction of 1–600 characters.'},400);
  if(b.action==='submit'){if(p.pending)return reply({error:'An introduction is already awaiting Chervil’s review.'},409);p.pending=b.intro.trim();}
  else p.intro=b.intro.trim();
 }
 if(b.action==='approve'){if(!p.pending)return reply({error:'No introduction to approve.'},400);p.intro=p.pending;delete p.pending;}
 if(b.action==='reject')delete p.pending;
 if(b.action==='photo'){
  if(b.photo===null)p.photo=null;
  else{if(typeof b.photo!=='string'||!b.photo.startsWith('data:image/jpeg;base64,'))return reply({error:'Choose a supported photograph.'},400);
   try{const bytes=await sharp(Buffer.from(b.photo.split(',')[1],'base64'),{limitInputPixels:16000000}).rotate().resize(640,640,{fit:'inside',withoutEnlargement:true}).jpeg({quality:80}).toBuffer();p.photo='data:image/jpeg;base64,'+bytes.toString('base64');}catch{return reply({error:'The photo could not be processed.'},400);}}
 }
 const saved=await store.setJSON(`guest/${b.id}`,p,item?{onlyIfMatch:item.etag}:{onlyIfNew:true});
 if(!saved.modified)return reply({error:'This profile changed. Refresh and try again.'},409);
 if(td&&b.action!=='submit'&&b.action!=='reject') {
  const action=b.action==='approve'?`Approved traveler ${b.id}’s introduction`:b.action==='photo'?(b.photo?`Updated traveler ${b.id}’s photo`:`Removed traveler ${b.id}’s photo`):`Updated traveler ${b.id}’s introduction`;
  await announce({action,section:'Info · Meet Your Fellow Travelers',url:'/?tab=info'},context);
 }
 return reply({ok:true});
}catch{return reply({error:'Guest profiles are temporarily unavailable.'},500);}}
export const config:Config={path:'/api/guest-profiles',rateLimit:{windowLimit:30,windowSize:60,aggregateBy:['ip','domain']}};
