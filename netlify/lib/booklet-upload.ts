import {getStore} from '@netlify/blobs';
import {randomUUID} from 'node:crypto';
import {BOOKLET_MAX_BYTES,BOOKLET_CHUNK_BYTES} from '../../lib/booklet-pages';
type Upload={id:string;title:string;revision:string|null;size:number;count:number;expires:number};
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie'}});
// Called only after the resource handler's TD and same-origin checks.
export async function bookletUpload(body:any){
 const store=getStore({name:'tour-resources',consistency:'strong'});
 async function discard(id:string,record:Upload){for(let i=0;i<record.count;i++)await store.delete(`booklet-uploads/parts/${id}/${i}`);await store.delete('booklet-uploads/meta/'+id);}
 if(body.action==='booklet-start'){
  if(!/^[a-zA-Z0-9_-]{1,100}$/.test(body.id)||typeof body.title!=='string'||!body.title.trim()||body.title.length>120||body.group!=='handouts'||!(body.revision===null||typeof body.revision==='string'))return reply({error:'Choose a PDF handout.'},400);
  if(!Number.isInteger(body.size)||body.size<5||body.size>BOOKLET_MAX_BYTES)return reply({error:'Choose a booklet PDF of 5 MB or less.'},400);
  const old=await store.getWithMetadata('entry/'+body.id,{type:'json'});if((old?.etag||null)!==body.revision)return reply({error:'This item changed. Reload before uploading.'},409);
  if(old?.data&&(old.data as any).group!=='handouts')return reply({error:'Booklets belong in Handouts.'},400);
  // Abandoned uploads are private and expire; sweep a bounded batch on later uploads.
  const pending=await store.list({prefix:'booklet-uploads/meta/'});
  for(const blob of pending.blobs.slice(0,20)){const record=await store.get(blob.key,{type:'json'}) as Upload|null;if(record&&record.expires<Date.now())await discard(blob.key.slice('booklet-uploads/meta/'.length),record);}
  const uploadId=randomUUID(),record:Upload={id:body.id,title:body.title.trim(),revision:body.revision,size:body.size,count:Math.ceil(body.size/BOOKLET_CHUNK_BYTES),expires:Date.now()+30*60*1000};
  await store.setJSON('booklet-uploads/meta/'+uploadId,record,{onlyIfNew:true});return reply({uploadId});
 }
 if(typeof body.uploadId!=='string'||!/^[a-f0-9-]{36}$/.test(body.uploadId))return reply({error:'Invalid booklet upload.'},400);
 const record=await store.get('booklet-uploads/meta/'+body.uploadId,{type:'json'}) as Upload|null;
 if(!record)return reply({error:'This upload has ended. Choose the PDF again.'},404);
 if(body.action==='booklet-cancel'){await discard(body.uploadId,record);return reply({cancelled:true});}
 if(record.expires<Date.now()){await discard(body.uploadId,record);return reply({error:'This upload expired. Choose the PDF again.'},410);}
 if(body.action==='booklet-part'){
  if(!Number.isInteger(body.index)||body.index<0||body.index>=record.count||typeof body.data!=='string')return reply({error:'Invalid booklet upload part.'},400);
  const bytes=Buffer.from(body.data,'base64'),expected=Math.min(BOOKLET_CHUNK_BYTES,record.size-body.index*BOOKLET_CHUNK_BYTES);
  if(bytes.length!==expected||bytes.toString('base64')!==body.data)return reply({error:'The PDF upload was incomplete. Choose the file again.'},400);
  const key=`booklet-uploads/parts/${body.uploadId}/${body.index}`;
  const saved=await store.setJSON(key,{data:body.data},{onlyIfNew:true});if(!saved.modified){const old=await store.get(key,{type:'json'}) as {data:string}|null;if(old?.data!==body.data)return reply({error:'This upload part changed. Choose the file again.'},409);}
  return reply({received:true});
 }
 if(body.action!=='booklet-finish')return reply({error:'Invalid booklet upload action.'},400);
 const old=await store.getWithMetadata('entry/'+record.id,{type:'json'});if((old?.etag||null)!==record.revision)return reply({error:'This item changed during the upload. Reload and try again.'},409);
 const parts:Buffer[]=[];for(let i=0;i<record.count;i++){const part=await store.get(`booklet-uploads/parts/${body.uploadId}/${i}`,{type:'json'}) as {data:string}|null;if(!part)return reply({error:'Upload all PDF parts before finishing.'},409);parts.push(Buffer.from(part.data,'base64'));}
 const bytes=Buffer.concat(parts);if(bytes.length!==record.size||bytes.length>BOOKLET_MAX_BYTES||bytes.subarray(0,5).toString()!=='%PDF-')return reply({error:'Choose a valid booklet PDF of 5 MB or less.'},400);
 const blob='files/'+randomUUID();await store.set(blob,new Uint8Array(bytes).buffer);
 const prior=old?.data as any;const entry={...prior,id:record.id,title:record.title,group:'handouts',type:'application/pdf',booklet:true,size:bytes.length,bookletLayout:prior?.bookletLayout||'auto',blob,visible:false,deleted:false,updatedAt:new Date().toISOString()};
 const saved=await store.setJSON('entry/'+record.id,entry,record.revision===null?{onlyIfNew:true}:{onlyIfMatch:record.revision});
 if(!saved.modified){await store.delete(blob);return reply({error:'This item changed during the upload. Reload and try again.'},409);}
 await discard(body.uploadId,record);if(prior?.blob&&prior.blob!==blob)await store.delete(prior.blob);return reply({saved:true});
}
