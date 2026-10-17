import type {Config} from '@netlify/functions';import {safeSession,safeStore} from '../lib/safe-auth';import {safeDates,validateActivities} from '../../lib/safe-plans';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie'}});
export default async function handler(request:Request){try{const account=await safeSession(request);if(!account)return reply({error:'Unlock Traveler Safe first.'},401);
 const date=new URL(request.url).searchParams.get('date');if(!date||!safeDates.includes(date))return reply({error:'Choose a day from October 1–18.'},400);
 const store=safeStore('plans'),key=`${account.id}/${date}`;const record=await store.getWithMetadata(key,{type:'json'});
 if(request.method==='GET')return reply({activities:(record?.data as any)?.activities||[],revision:record?.etag||null});
 if(request.method!=='POST')return reply({error:'Method not allowed.'},405);if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Open this action from the app.'},403);
 const raw=await request.text();if(raw.length>20000)return reply({error:'Plan is too large.'},413);let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid request.'},400);}
 if((body?.revision||null)!==(record?.etag||null))return reply({error:'These plans changed on another device. Reload before saving.'},409);
 let activities;try{activities=validateActivities(date,body.activities);}catch(e){return reply({error:e instanceof Error?e.message:'Check activities.'},400);}
 const saved=await store.setJSON(key,{activities},record?{onlyIfMatch:record.etag}:{onlyIfNew:true});if(!saved.modified)return reply({error:'These plans changed on another device. Reload before saving.'},409);return reply({activities,revision:saved.etag});
 }catch{return reply({error:'Your plans are temporarily unavailable.'},503);}}
export const config:Config={path:'/api/safe-plans',rateLimit:{windowLimit:100,windowSize:60,aggregateBy:['ip','domain']}};
