import {createHash} from 'node:crypto';
import {getStore} from '@netlify/blobs';
import type {Config} from '@netlify/functions';
import sharp from 'sharp';
const MAX=4*1024*1024;
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export default async function handler(request:Request){try{
 const url=new URL(request.url),day=Number(url.searchParams.get('day')),id=url.searchParams.get('id')||'',slot=Number(url.searchParams.get('slot'));
 if(!Number.isInteger(day)||day<5||day>20||! /^[a-zA-Z0-9-]{1,80}$/.test(id))return reply({error:'Memory not found.'},404);
 const memories=getStore({name:'traveler-memories',consistency:'strong'}),files=getStore({name:'memory-attachments',consistency:'strong'});
 const parent=await memories.get(`day/${day}/${id}`,{type:'json'});
 if(!parent)return reply({error:'Memory not found.'},404);
 const prefix=`${day}/${id}/`,key=prefix+slot;
 if(request.method==='GET'){
  if(!url.searchParams.has('slot')){
   const items=await Promise.all([1,2,3].map(async n=>{const item=await files.getMetadata(prefix+n);return item?{slot:n,name:item.metadata.name,type:item.metadata.type,size:item.metadata.size}:null;}));
   return reply({attachments:items.filter(Boolean)});
  }
  if(![1,2,3].includes(slot))return reply({error:'Attachment not found.'},404);
  const item=await files.getWithMetadata(key,{type:'arrayBuffer'});
  if(!item)return reply({error:'Attachment not found.'},404);
  const type=String(item.metadata.type),name=String(item.metadata.name);
  return new Response(item.data,{headers:{'Content-Type':type,'Content-Disposition':`${type==='application/pdf'?'attachment':'inline'}; filename*=UTF-8''${encodeURIComponent(name)}`,'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Cache-Control':'no-store'}});
 }
 if(!['POST','DELETE'].includes(request.method))return reply({error:'Method not allowed.'},405);
 if(request.headers.get('origin')!==url.origin)return reply({error:'Open this action in the app.'},403);
 const token=request.headers.get('x-journal-token')||'';
 if(token.length<32||createHash('sha256').update(token).digest('hex')!==parent.ownerHash)return reply({error:'Only the traveler who posted this memory can change its attachments.'},403);
 if(![1,2,3].includes(slot))return reply({error:'Choose one of the three attachment spaces.'},400);
 if(request.method==='DELETE'){await files.delete(key);return reply({ok:true});}
 if(Number(request.headers.get('content-length'))>MAX)return reply({error:'Each uploaded file must be 4 MB or smaller.'},413);
 let bytes=Buffer.from(await request.arrayBuffer());if(!bytes.length||bytes.length>MAX)return reply({error:'Each uploaded file must be 4 MB or smaller.'},413);
 let name:string;try{name=decodeURIComponent(request.headers.get('x-file-name')||'attachment');}catch{return reply({error:'Invalid filename.'},400);}
 name=name.replace(/[\u0000-\u001f\u007f/\\]/g,'_').slice(0,120)||'attachment';
 let type=request.headers.get('content-type')?.split(';')[0]||'';
 if(type==='application/pdf'){
  if(bytes.subarray(0,5).toString()!=='%PDF-')return reply({error:'Choose a valid PDF.'},400);
  if(!name.toLowerCase().endsWith('.pdf'))name+='.pdf';
 }else if(['image/jpeg','image/png','image/webp'].includes(type)){
  try{bytes=await sharp(bytes,{limitInputPixels:25000000}).rotate().resize(1600,1600,{fit:'inside',withoutEnlargement:true}).jpeg({quality:82}).toBuffer();type='image/jpeg';name=name.replace(/\.[^.]+$/,'')+'.jpg';}catch{return reply({error:'This photo could not be processed. Choose a JPG, PNG or WebP.'},400);}
 }else return reply({error:'Choose a JPG, PNG, WebP photo or PDF.'},415);
 const saved=await files.set(key,Uint8Array.from(bytes).buffer,{onlyIfNew:true,metadata:{name,type,size:bytes.length}});
 if(!saved.modified)return reply({error:'This attachment space is already filled. Refresh and try again.'},409);
 if(!await memories.get(`day/${day}/${id}`)){await files.delete(key);return reply({error:'This memory was deleted. The file was not kept.'},404);}
 return reply({ok:true},201);
}catch{return reply({error:'The attachment could not be saved. Please try again.'},500);}}
export const config:Config={path:'/api/memory-attachments',rateLimit:{windowLimit:90,windowSize:60,aggregateBy:['ip','domain']}};
