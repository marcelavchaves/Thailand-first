'use client';
import {useEffect,useState} from 'react';
import {menus,mealState,type MealSubmission} from '../lib/meal-choices';

export function mealShareText(name:string,submission:MealSubmission|null,meal='all',includeDietary=true){
 const lines=['WONDERCASE','Vietnam, Cambodia & Thailand',`Meal choices · ${name}`];
 for(const menu of menus.filter(m=>meal==='all'||m.id===meal)){
  const state=mealState(submission,menu.id);
  lines.push('',menu.title,menu.restaurant,`Status: ${state?.status==='submitted'?'Submitted':state?'Draft · not submitted':'Not submitted'}`);
  for(const course of menu.courses)lines.push(`${course.title}: ${course.options.find(o=>o.id===submission?.selections[menu.id]?.[course.id])?.name||'No choice saved'}`);
  if(includeDietary)lines.push(`Dietary restrictions / allergies: ${state?.dietary||'None provided'}`);
 }
 lines.push('','This is a copy of saved choices. Sharing does not submit or change a meal choice.');
 return lines.join('\n');
}
async function summaryImage(text:string):Promise<Blob>{
 const canvas=document.createElement('canvas');canvas.width=900;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Image creation is unavailable in this browser.');
 ctx.font='24px Arial';
 const lines:string[]=[];
 for(const paragraph of text.split('\n')){
  if(!paragraph){lines.push('');continue;}
  let line='';
  for(const word of paragraph.split(/\s+/)){
   // Split unusually long unbroken words so notes cannot run off the image.
   for(const part of word.match(/.{1,45}/gu)||['']){
    const next=line?line+' '+part:part;
    if(ctx.measureText(next).width>804&&line){lines.push(line);line=part;}else line=next;
   }
  }
  lines.push(line);
 }
 canvas.height=100+lines.length*35;ctx.fillStyle='#faf8f0';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle='#315c4f';ctx.font='24px Arial';ctx.textBaseline='top';
 lines.forEach((line,i)=>ctx.fillText(line,48,48+i*35));
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Unable to create the image.')),'image/png'));
}
export default function MealChoicesShare({name,submission,dirty}:{name:string;submission:MealSubmission|null;dirty:boolean}){
 const [meal,setMeal]=useState('all'),[includeDietary,setIncludeDietary]=useState(true),[message,setMessage]=useState(''),[image,setImage]=useState<{url:string;file:File}|null>(null),[busy,setBusy]=useState(false);
 const text=mealShareText(name,submission,meal,includeDietary);
 useEffect(()=>{setImage(null);setMessage('');},[text]);
 useEffect(()=>()=>{if(image)URL.revokeObjectURL(image.url);},[image]);
 const filename='wondercase-meal-choices.png';
 async function share(){try{if(navigator.share)await navigator.share({title:`Meal choices · ${name}`,text});else{await navigator.clipboard.writeText(text);setMessage('Summary copied. Paste it into the app of your choice.');}}catch(e){if(!(e instanceof Error&&e.name==='AbortError'))setMessage('Sharing could not open. Use WhatsApp, email, or select and copy the summary below.');}}
 async function makeImage(){setBusy(true);setMessage('');try{const blob=await summaryImage(text);setImage({url:URL.createObjectURL(blob),file:new File([blob],filename,{type:'image/png'})});}catch(e){setMessage(e instanceof Error?e.message:'Unable to prepare the image.');}finally{setBusy(false);}}
 async function shareImage(){if(!image)return;try{await navigator.share({files:[image.file],title:`Meal choices · ${name}`});}catch(e){if(!(e instanceof Error&&e.name==='AbortError'))setMessage('Use Save image below, or touch and hold the preview to save or share it.');}}
 return <details className="meal-share"><summary>Share your meal choices</summary><p>Send a copy by WhatsApp or email, or save it as an image. Review the summary before sharing.</p>{dirty&&<p className="meal-help"><strong>You have unsaved changes.</strong> This summary uses your saved choices. Save or submit your edits first to include them.</p>}
 <label>Meals to share<select value={meal} onChange={e=>setMeal(e.target.value)}><option value="all">All five meals</option>{menus.map(m=><option key={m.id} value={m.id}>{m.title}</option>)}</select></label>
 <label className="meal-share-dietary"><input type="checkbox" checked={includeDietary} onChange={e=>setIncludeDietary(e.target.checked)}/>Include dietary restrictions and allergies</label>
 <label>Summary<textarea readOnly rows={10} value={text}/></label>
 <div className="meal-share-actions"><button type="button" onClick={()=>void share()}>Share…</button><a href={'https://wa.me/?text='+encodeURIComponent(text)} target="_blank" rel="noopener noreferrer">WhatsApp</a><a href={'mailto:?subject='+encodeURIComponent(`Meal choices · ${name}`)+'&body='+encodeURIComponent(text)}>Email</a><button type="button" className="meal-secondary" disabled={busy} onClick={()=>void makeImage()}>{busy?'Preparing image…':'Create image'}</button></div>
 {image&&<div className="meal-share-image"><img src={image.url} alt={`Saved meal choices for ${name}`}/><div className="meal-share-actions">{typeof navigator!=='undefined'&&navigator.canShare?.({files:[image.file]})&&<button type="button" onClick={()=>void shareImage()}>Share image…</button>}<a href={image.url} download={filename}>Save image</a></div><p className="meal-help">On iPhone or iPad, use Share image → Save Image, or touch and hold the preview.</p></div>}
 <p role="status">{message}</p><p className="meal-help">Sharing sends a copy only. It does not submit your choices or give anyone access to edit them.</p>
 </details>;
}
