import {BOOKLET_MAX_BYTES,BOOKLET_CHUNK_BYTES} from './booklet-pages';
export async function uploadBooklet(file:File,details:{id:string;title:string;group:string;revision:string|null},progress:(text:string)=>void){
 if(file.size>BOOKLET_MAX_BYTES)throw Error('Choose a booklet PDF of 5 MB or less.');
 async function call(body:object){const r=await fetch('/api/tour-resources',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.error||'Unable to upload this booklet.');return data;}
 let uploadId:string|undefined;
 try{
  const started=await call({...details,action:'booklet-start',size:file.size});uploadId=started.uploadId;
  const count=Math.ceil(file.size/BOOKLET_CHUNK_BYTES);
  for(let index=0;index<count;index++){
   progress(`Uploading booklet… ${Math.round(index/count*100)}%`);
   const part=file.slice(index*BOOKLET_CHUNK_BYTES,(index+1)*BOOKLET_CHUNK_BYTES);
   const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Unable to read this PDF.'));reader.readAsDataURL(part);});
   await call({action:'booklet-part',uploadId,index,data});
  }
  progress('Finishing booklet…');await call({action:'booklet-finish',uploadId});uploadId=undefined;
 }finally{if(uploadId)await call({action:'booklet-cancel',uploadId}).catch(()=>{});}
}

/** Keep large PDF downloads below hosted function response-size limits too. */
export async function downloadBookletPdf(id:string,size=0,version='',signal?:AbortSignal):Promise<ArrayBuffer>{
 if(size>BOOKLET_MAX_BYTES)throw Error('This booklet is larger than 5 MB.');
 const count=size>3*1024*1024?Math.ceil(size/BOOKLET_CHUNK_BYTES):1;const pieces:Uint8Array[]=[];
 for(let index=0;index<count;index++){
  const query=new URLSearchParams({file:id});if(count>1){query.set('part',String(index));if(version)query.set('version',version);}
  const r=await fetch('/api/tour-resources?'+query,{cache:'no-store',signal});if(!r.ok)throw Error(r.status===409?'This booklet changed. Reopen it to read the latest version.':'This booklet is not currently available.');
  const bytes=new Uint8Array(await r.arrayBuffer());if(count>1&&bytes.length!==Math.min(BOOKLET_CHUNK_BYTES,size-index*BOOKLET_CHUNK_BYTES))throw Error('The PDF download was incomplete. Please try again.');pieces.push(bytes);
 }
 const result=new Uint8Array(pieces.reduce((n,b)=>n+b.length,0));let offset=0;for(const piece of pieces){result.set(piece,offset);offset+=piece.length;}return result.buffer;
}
