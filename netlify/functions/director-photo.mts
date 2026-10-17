import {announce} from '../lib/updates';
import type {Config} from '@netlify/functions';
import {getStore} from '@netlify/blobs';
import {hasTDSession,sameOrigin} from '../lib/td-auth';
import sharp from 'sharp';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export default async function handler(request:Request, context:{waitUntil?:(promise:Promise<unknown>)=>void}){try{
 if(!['GET','PUT'].includes(request.method))return reply({error:'Method not allowed.'},405);
 if(request.method==='PUT'){
  if(!sameOrigin(request))return reply({error:'Open this action in the app.'},403);
  if(!(await hasTDSession(request)))return reply({error:'Sign in as Xavier to change this photo.'},401);
 }
 const store=getStore({name:'director-profile',consistency:'strong'});
 const item=await store.getWithMetadata('xavier',{type:'json'});
 if(request.method==='GET')return reply({photo:item?.data?.photo||null,revision:item?.etag||null});
 if(Number(request.headers.get('content-length'))>800000)return reply({error:'Photo is too large.'},413);
 const raw=await request.text();if(raw.length>800000)return reply({error:'Photo is too large.'},413);
 let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid photo request.'},400);}
 if(!body||!(body.revision===null||typeof body.revision==='string')||!(body.photo===null||typeof body.photo==='string'))return reply({error:'Invalid photo request.'},400);
 if(body.revision!==(item?.etag||null))return reply({error:'The photo changed in another window. Please choose your photo again.'},409);
 let photo:string|null=null;
 if(body.photo!==null){
  if(!body.photo.startsWith('data:image/jpeg;base64,'))return reply({error:'Choose a supported photograph.'},400);
  try{const bytes=await sharp(Buffer.from(body.photo.split(',')[1],'base64'),{limitInputPixels:16000000}).rotate().resize(800,800,{fit:'inside',withoutEnlargement:true}).jpeg({quality:82}).toBuffer();photo='data:image/jpeg;base64,'+bytes.toString('base64');}catch{return reply({error:'The photo could not be processed.'},400);}
 }
 const saved=await store.setJSON('xavier',{photo,updatedAt:new Date().toISOString()},item?{onlyIfMatch:item.etag}:{onlyIfNew:true});
 if(!saved.modified)return reply({error:'The photo changed in another window. Please choose your photo again.'},409);
 await announce({action:photo?'Updated his profile photo':'Removed his profile photo',section:'Info',url:'/?tab=info'},context);
 return reply({photo,revision:saved.etag});
}catch{return reply({error:'The photo is temporarily unavailable. Please try again.'},500);}}
export const config:Config={path:'/api/director-photo',rateLimit:{windowLimit:40,windowSize:60,aggregateBy:['ip','domain']}};
