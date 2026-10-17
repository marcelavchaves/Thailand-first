"use client";
import {useCallback,useEffect,useState} from 'react';
export default function useXavierPhoto(){
 const [photo,setPhoto]=useState<string|null>(null),[revision,setRevision]=useState<string|null>(null);
 const [loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const load=useCallback(async()=>{try{const r=await fetch('/api/director-photo',{cache:'no-store'});if(!r.ok)throw Error();const d=await r.json();setPhoto(d.photo);setRevision(d.revision);setLoaded(true);}catch{setMessage('Unable to check the latest photo. Try again when connected.');}},[]);
 useEffect(()=>{void load();const refresh=()=>void load();window.addEventListener('focus',refresh);const timer=window.setInterval(refresh,60000);return()=>{window.removeEventListener('focus',refresh);clearInterval(timer);};},[load]);
 async function save(file:File|null){
  if(busy||!loaded)return;setBusy(true);setMessage('');
  try{
   let nextPhoto:string|null=null;
   if(file){
    if(file.size>20*1024*1024)throw Error('Choose a photo smaller than 20 MB.');
    const bitmap=await createImageBitmap(file);
    try{const scale=Math.min(1,800/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const context=canvas.getContext('2d');if(!context)throw Error('Unable to prepare this photo.');context.fillStyle='#fbf8f1';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);nextPhoto=canvas.toDataURL('image/jpeg',0.85);}finally{bitmap.close();}
   }
   const r=await fetch('/api/director-photo',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({photo:nextPhoto,revision})});const d=await r.json();
   if(!r.ok){if(r.status===409)await load();throw Error(d.error||'Unable to save your photo.');}
   setPhoto(d.photo);setRevision(d.revision);setMessage(file?'Photo saved for everyone.':'Original photo restored.');
  }catch(error){setMessage(error instanceof Error?error.message:'Choose a JPG, PNG, or WebP photo.');}finally{setBusy(false);}
 }
 return {photo,loaded,busy,message,save};
}
