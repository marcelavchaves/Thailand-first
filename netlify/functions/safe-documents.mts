import type {Config} from '@netlify/functions';import {randomUUID,randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';import sharp from 'sharp';import {safeSession,safeStore} from '../lib/safe-auth';
type Doc={id:string;name:string;type:string;size:number;created:string};
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie'}});
export default async function handler(request:Request){try{
 const account=await safeSession(request);if(!account)return reply({error:'Unlock Traveler Safe first.'},401);
 const store=safeStore('documents'),indexKey=`${account.id}/index`;const record=await store.getWithMetadata(indexKey,{type:'json'});const docs:Doc[]=(record?.data as any)?.documents||[];
 const id=new URL(request.url).searchParams.get('id');
 if(request.method==='GET'){
  if(!id)return reply({documents:docs,revision:record?.etag||null});const doc=docs.find(d=>d.id===id);if(!doc)return reply({error:'Document not found.'},404);
  const stored=await store.get(`${account.id}/file/${doc.id}`,{type:'arrayBuffer'});if(!stored)return reply({error:'Document not found.'},404);
  const encrypted=Buffer.from(stored);const decipher=createDecipheriv('aes-256-gcm',Buffer.from(account.key,'hex'),encrypted.subarray(0,12));decipher.setAuthTag(encrypted.subarray(12,28));const bytes=Buffer.concat([decipher.update(encrypted.subarray(28)),decipher.final()]);
  return new Response(bytes,{headers:{'Content-Type':doc.type,'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(doc.name)}`,'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
 }
 if(!['POST','DELETE'].includes(request.method))return reply({error:'Method not allowed.'},405);if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Open this action from the app.'},403);
 const raw=await request.text();if(raw.length>3000000)return reply({error:'Choose a file under 2 MB.'},413);let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid request.'},400);}
 if((body?.revision||null)!==(record?.etag||null))return reply({error:'Documents changed on another device. Reload and try again.'},409);
 if(request.method==='DELETE'){
  const doc=docs.find(d=>d.id===id);if(!doc)return reply({error:'Document not found.'},404);
  const saved=await store.setJSON(indexKey,{documents:docs.filter(d=>d.id!==id)},record?{onlyIfMatch:record.etag}:{onlyIfNew:true});if(!saved.modified)return reply({error:'Documents changed. Reload and try again.'},409);await store.delete(`${account.id}/file/${id}`);return reply({ok:true});
 }
 if(docs.length>=30)return reply({error:'This Safe holds up to 30 documents. Remove one before adding another.'},400);
 if(typeof body?.name!=='string'||!body.name.trim()||body.name.length>150||typeof body.data!=='string'||!['application/pdf','image/jpeg','image/png','image/webp'].includes(body.type))return reply({error:'Choose a PDF, JPEG, PNG or WebP file.'},400);
 let bytes=Buffer.from(body.data,'base64');if(!bytes.length||bytes.length>2*1024*1024)return reply({error:'Choose a file under 2 MB.'},413);let type=body.type;
 if(type==='application/pdf'){if(bytes.subarray(0,5).toString()!=='%PDF-')return reply({error:'This file is not a readable PDF.'},400);}
 else {try{bytes=await sharp(bytes,{limitInputPixels:16000000}).rotate().resize(2400,2400,{fit:'inside',withoutEnlargement:true}).jpeg({quality:88}).toBuffer();type='image/jpeg';}catch{return reply({error:'This image could not be opened.'},400);}}
 const doc:Doc={id:randomUUID(),name:body.name.trim().replace(/[\r\n\x00-\x1f\/\\]/g,'_'),type,size:bytes.length,created:new Date().toISOString()};if(type==='image/jpeg')doc.name=doc.name.replace(/\.[^.]+$/,'')+'.jpg';
 const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',Buffer.from(account.key,'hex'),iv);const encrypted=Buffer.concat([cipher.update(bytes),cipher.final()]);const key=`${account.id}/file/${doc.id}`;await store.set(key,Uint8Array.from(Buffer.concat([iv,cipher.getAuthTag(),encrypted])).buffer);
 const saved=await store.setJSON(indexKey,{documents:[...docs,doc]},record?{onlyIfMatch:record.etag}:{onlyIfNew:true});if(!saved.modified){await store.delete(key);return reply({error:'Documents changed on another device. Reload and try again.'},409);}return reply({ok:true});
 }catch{return reply({error:'Your documents are temporarily unavailable.'},503);}}
export const config:Config={path:'/api/safe-documents',rateLimit:{windowLimit:90,windowSize:60,aggregateBy:['ip','domain']}};
