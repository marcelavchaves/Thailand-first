"use client";
import {useEffect,useState} from 'react';
type Attachment={slot:number;name:string;type:string;size:number};
const MB=1024*1024;
export async function prepareMemoryFile(file:File){
  const pdf=file.type==='application/pdf';if(!pdf&&!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPG, PNG, WebP photo or PDF.');
  if(file.size>(pdf?4:10)*MB)throw Error(pdf?'PDFs must be 4 MB or smaller.':'Photos must be 10 MB or smaller.');
  let body:Blob=file,name=file.name;
  if(!pdf){const bitmap=await createImageBitmap(file);try{const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);body=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Photo could not be resized.')),'image/jpeg',0.82));name=name.replace(/\.[^.]+$/,'')+'.jpg';}finally{bitmap.close();}}
  if(body.size>4*MB)throw Error('This file is still too large. Please choose a smaller file.');
  return {body,name};
}
export default function MemoryAttachments({day,id,isOwner,token}:{day:number;id:string;isOwner:boolean;token:string}){
 const [items,setItems]=useState<Attachment[]>([]),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[loaded,setLoaded]=useState(false);
 const base=`/api/memory-attachments?day=${day}&id=${encodeURIComponent(id)}`;
 async function load(){const r=await fetch(base,{cache:'no-store'});const j=await r.json();if(!r.ok)throw Error(j.error||'Attachments unavailable.');setItems(j.attachments);setLoaded(true);return j.attachments as Attachment[];}
 useEffect(()=>{void load().catch(()=>setMessage('Attachments are temporarily unavailable.'));},[base]);
 async function upload(file?:File){if(!file)return;setMessage('');setBusy(true);try{
  const {body,name}=await prepareMemoryFile(file);
  const current=await load(),slot=[1,2,3].find(n=>!current.some(a=>a.slot===n));if(!slot)throw Error('Three attachments maximum. Remove one to add another.');
  const r=await fetch(`${base}&slot=${slot}`,{method:'POST',headers:{'Content-Type':body.type,'x-journal-token':token,'x-file-name':encodeURIComponent(name)},body});const j=await r.json();if(!r.ok)throw Error(j.error||'Upload failed.');await load();setMessage('Attachment added.');
 }catch(e){setMessage(e instanceof Error?e.message:'Upload failed. Please try again.');}finally{setBusy(false);}}
 async function remove(slot:number){setBusy(true);try{const r=await fetch(`${base}&slot=${slot}`,{method:'DELETE',headers:{'x-journal-token':token}});const j=await r.json();if(!r.ok)throw Error(j.error);await load();setMessage('Attachment removed.');}catch(e){setMessage(e instanceof Error?e.message:'Could not remove attachment.');}finally{setBusy(false);}}
 return <div className="memory-attachments">
  {items.length>0&&<ul>{items.map(a=><li key={a.slot}><a href={`${base}&slot=${a.slot}`} target="_blank" rel="noopener noreferrer">{a.type.startsWith('image/')?<img src={`${base}&slot=${a.slot}`} alt={a.name} loading="lazy"/>:<span className="memory-file-icon" aria-hidden="true">PDF</span>}<span>{a.name}</span><small>{a.type.startsWith('image/')?'Open photo':'Download PDF'} ↗ · {(a.size/MB).toFixed(1)} MB</small></a>{isOwner&&<button type="button" disabled={busy} onClick={()=>void remove(a.slot)} aria-label={`Remove ${a.name}`}>Remove attachment</button>}</li>)}</ul>}
  {isOwner&&<div className="memory-upload"><label>Add photos or files<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={busy||!loaded||items.length>=3} onChange={e=>{const f=e.target.files?.[0];e.target.value='';void upload(f);}}/></label><small>Up to 3 attachments. Photos: 10 MB before automatic resizing. PDFs: 4 MB. Shared with fellow travelers. Files open separately so you can return to the app.</small></div>}
  {busy&&<p role="status">Saving attachment…</p>}{message&&<p role="status">{message}</p>}
 </div>;
}
