import {createHash,randomUUID} from 'node:crypto';
import {getStore} from '@netlify/blobs';
import type {Config} from '@netlify/functions';
type Scores={overall:number};
type Rating={id:string;author:string;scores?:Scores;worked?:string;improve?:string;wished?:string;other?:string;stars?:number;comment?:string;createdAt:string;updatedAt:string;ownerHash:string};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
export default async function handler(request:Request){
 const token=request.headers.get('x-journal-token')||'';
 const hash=/^[a-zA-Z0-9-]{32,160}$/.test(token)?createHash('sha256').update(token).digest('hex'):'';
 const store=getStore({name:'app-ratings',consistency:'strong'});
 const visible=(r:Rating)=>{const legacy=typeof r.stars==='number'?r.stars:0;return {id:r.id,author:r.author,scores:{overall:r.scores?.overall??legacy},worked:r.worked??r.comment??'',improve:r.improve??'',wished:r.wished??'',other:r.other??'',createdAt:r.createdAt,updatedAt:r.updatedAt,isOwner:!!hash&&hash===r.ownerHash};};
 try{
  if(request.method==='GET'){
   const {blobs}=await store.list({prefix:'rating/'});
   const rows=await Promise.all(blobs.map(b=>store.get(b.key,{type:'json'}) as Promise<Rating|null>));
   return reply({entries:rows.filter((r):r is Rating=>!!r).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(visible)});
  }
  if(!['POST','PATCH','DELETE'].includes(request.method))return reply({error:'Method not allowed.'},405);
  if(!hash)return reply({error:'A secure device key is required.'},401);
  // The client cannot choose another person's record: all writes are scoped to its secret key.
  const key=`rating/${hash}`;const existing=await store.get(key,{type:'json'}) as Rating|null;
  if(request.method==='DELETE'){
   if(!existing||new URL(request.url).searchParams.get('id')!==existing.id)return reply({error:'Only your own rating can be deleted.'},403);
   await store.delete(key);return reply({ok:true});
  }
  const raw=await request.text();if(raw.length>20000)return reply({error:'Your feedback is too long.'},400);
  let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid rating.'},400);}
  if(!body||typeof body!=='object')return reply({error:'Invalid rating.'},400);
  if(request.method==='POST'&&existing)return reply({error:'You already have a rating. Please edit it instead.'},409);
  if(request.method==='PATCH'&&(!existing||body.id!==existing.id))return reply({error:'Only your own rating can be edited.'},403);
  const {author,scores,worked,improve,wished,other}=body;
  const validScore=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)&&Number.isInteger(value*2)&&value>=0&&value<=5;
  const textFields=[worked,improve,wished,other];
  if(typeof author!=='string'||!author.trim()||author.length>80||!scores||typeof scores!=='object'||!validScore(scores.overall)||!textFields.every(value=>typeof value==='string'&&value.length<=1200))return reply({error:'Choose 0–5 stars for your overall rating and keep each written response under 1,200 characters.'},400);
  const cleanScores:Scores={...existing?.scores,overall:scores.overall};
  const now=new Date().toISOString();const entry:Rating={id:existing?.id||randomUUID(),author:author.trim(),scores:cleanScores,worked:worked.trim(),improve:improve.trim(),wished:wished.trim(),other:other.trim(),createdAt:existing?.createdAt||now,updatedAt:now,ownerHash:hash};
  await store.setJSON(key,entry);return reply({entry:visible(entry)},existing?200:201);
 }catch{return reply({error:'Ratings are temporarily unavailable. Please try again; your draft is still here.'},503);}
}
export const config:Config={path:'/api/app-ratings'};
