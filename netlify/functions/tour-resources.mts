import type {Config} from '@netlify/functions';
import {getStore} from '@netlify/blobs';
import {hasTDSession,sameOrigin} from '../lib/td-auth';
import {bookletUpload} from '../lib/booklet-upload';
import {BOOKLET_CHUNK_BYTES,bookletLayouts} from '../../lib/booklet-pages';
import {randomUUID} from 'node:crypto';
import {importedReleaseEntries} from '../../shared/tour-import.mjs';
const reply=(x:unknown,status=200)=>Response.json(x,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie'}});
export default async function handler(req:Request){try{
 const store=getStore({name:'tour-resources',consistency:'strong'});const td=(await hasTDSession(req));
 if(req.method==='GET'){
  const params=new URL(req.url).searchParams;const booklet=params.get('booklet');const id=params.get('file')||booklet;
  if(id){if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id))return reply({error:'Invalid document.'},400);const entry:any=await store.get('entry/'+id,{type:'json'});if(!entry||entry.deleted||(!entry.visible&&!td)||!entry.blob)return reply({error:'Coming soon'},404);if(booklet){if(entry.booklet!==true||entry.group!=='handouts'||entry.type!=='application/pdf')return reply({error:'Booklet unavailable.'},404);return reply({id,title:entry.title,preview:td&&!entry.visible,layout:entry.bookletLayout||'auto',size:entry.size||0,version:entry.updatedAt});}const file=await store.get(entry.blob,{type:'arrayBuffer'});if(!file)return reply({error:'File unavailable'},404);if(params.has('part')){const part=Number(params.get('part'));if(!entry.booklet||!Number.isInteger(part)||part<0||part*BOOKLET_CHUNK_BYTES>=file.byteLength)return reply({error:'Invalid PDF part.'},400);if(params.has('version')&&params.get('version')!==entry.updatedAt)return reply({error:'This booklet changed. Reopen it.'},409);const start=part*BOOKLET_CHUNK_BYTES;return new Response(new Uint8Array(file).slice(start,start+BOOKLET_CHUNK_BYTES),{headers:{'Content-Type':'application/octet-stream','Cache-Control':'no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});}return new Response(file,{headers:{'Content-Type':entry.type,'Cache-Control':'no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','Content-Disposition':'inline'}});}
  const {blobs}=await store.list({prefix:'entry/'});
  const stored=Object.fromEntries((await Promise.all(blobs.map(async b=>{const r=await store.getWithMetadata(b.key,{type:'json'});return r?[b.key.slice(6),{...(r.data as any),revision:r.etag}]:null;}))).filter(Boolean) as any);
  const entries=importedReleaseEntries(stored);
  return reply({items:Object.fromEntries(Object.entries(entries).filter(([,e])=>td||!e.booklet||e.visible&&!e.deleted).map(([id,e])=>[id,{id,booklet:e.booklet===true,bookletLayout:e.bookletLayout||'auto',type:e.type||null,title:e.title,group:e.group,visible:e.visible===true,deleted:e.deleted===true,file:!!e.blob,...(td?{revision:e.revision||null}:{})}]))});
 }
 if(req.method!=='PUT')return reply({error:'Method not allowed'},405);
 if(!sameOrigin(req))return reply({error:'Open this action from the app.'},403);
 if(!td)return reply({error:'Sign in as the tour director.'},401);
 const raw=await req.text();if(raw.length>4300000)return reply({error:'Choose a file smaller than 3 MB.'},413);let b;try{b=JSON.parse(raw);}catch{return reply({error:'Invalid request'},400);}
 if(['booklet-start','booklet-part','booklet-finish','booklet-cancel'].includes(b?.action))return await bookletUpload(b);
 if(!/^[a-zA-Z0-9_-]{1,100}$/.test(b.id)||typeof b.title!=='string'||!b.title.trim()||b.title.length>120||typeof b.group!=='string'||b.group.length>100||!['reveal','hide','upload','delete','restore','rename','booklet','booklet-layout'].includes(b.action)||!(b.revision===null||typeof b.revision==='string'))return reply({error:'Invalid resource details.'},400);
 const old:any=await store.get('entry/'+b.id,{type:'json'});const initial=importedReleaseEntries(old?{[b.id]:old}:{})[b.id]||old;const entry={...initial,id:b.id,title:b.title.trim(),group:initial?.group||b.group,visible:initial?.visible===true,deleted:initial?.deleted===true,updatedAt:new Date().toISOString()};
 let newBlob:string|undefined;
 if(b.action==='upload'){
 const u=b.upload;if(!u||!['application/pdf','image/jpeg','image/png','image/webp'].includes(u.type)||typeof u.data!=='string')return reply({error:'Upload a PDF, JPG, PNG or WebP.'},400);
 const bytes=Buffer.from(u.data,'base64');const valid=u.type==='application/pdf'?bytes.subarray(0,5).toString()==='%PDF-':u.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216:u.type==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
 if(!valid||bytes.length>3*1024*1024)return reply({error:'Choose a valid PDF or image smaller than 3 MB.'},400);
 newBlob='files/'+randomUUID();await store.set(newBlob,new Uint8Array(bytes).buffer);Object.assign(entry,{blob:newBlob,type:u.type,size:bytes.length,booklet:entry.group==='handouts'&&u.type==='application/pdf',visible:false,deleted:false});
 }
 if(b.action==='booklet'){if(entry.group!=='handouts'||entry.type!=='application/pdf'||!entry.blob||entry.deleted)return reply({error:'Upload a PDF to Handouts before creating a booklet.'},400);Object.assign(entry,{booklet:true,visible:false});}
 if(b.action==='booklet-layout'){if(!entry.booklet||entry.deleted||!entry.blob||!bookletLayouts.includes(b.layout))return reply({error:'Choose a page layout for this booklet.'},400);Object.assign(entry,{bookletLayout:b.layout,visible:false});}
 if(b.action==='reveal'){if(entry.deleted||b.id.startsWith('custom-')&&!entry.blob)return reply({error:'Upload content before revealing this document.'},400);entry.visible=true;}
 if(b.action==='hide')entry.visible=false;
 if(b.action==='restore')Object.assign(entry,{deleted:false,visible:false});
 if(b.action==='delete')Object.assign(entry,{deleted:true,visible:false,blob:null,type:null});
 const saved=await store.setJSON('entry/'+b.id,entry,b.revision===null?{onlyIfNew:true}:{onlyIfMatch:b.revision});
 if(!saved.modified){if(newBlob)await store.delete(newBlob);return reply({error:'This item changed in another window. Refresh and try again.'},409);}
 if(old?.blob&&old.blob!==entry.blob)await store.delete(old.blob);
 return reply({saved:true});
 }catch{return reply({error:'Unable to load or save resources. Please try again.'},500);}}
export const config:Config={path:'/api/tour-resources'};
