'use client';
import {useEffect,useRef,useState} from 'react';
import {menus,mealState,type MealSubmission,type Selections} from '../lib/meal-choices';
import {paperSuggestions,sheetRegions,type SheetRegion} from '../lib/meal-paper';
import {scanGuestList} from './scanGuestList';
import {mealDeadlineLabel} from './MealChoices';
type Guest={id:string;name:string};
type Photo={id:string;name:string;url:string};
type Draft={id:string;url:string;text:string;guestId:string;selections:Selections;menuIds:string[];dietary:string;reviewed:boolean;saved:boolean;loaded:boolean;revision:string|null;previous:MealSubmission|null;error:string};
export default function MealPaperImport({guests,onImported}:{guests:Guest[];onImported:()=>void}){
 const [photos,setPhotos]=useState<Photo[]>([]),[photoId,setPhotoId]=useState(''),[layout,setLayout]=useState('whole'),[region,setRegion]=useState<SheetRegion|null>(null),[drafts,setDrafts]=useState<Draft[]>([]),[activeId,setActiveId]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[locks,setLocks]=useState<Record<string,boolean>>({}),[deadlines,setDeadlines]=useState<Record<string,string>>({});
 const requests=useRef<Record<string,number>>({});
 const image=useRef<HTMLImageElement>(null),start=useRef<{x:number;y:number}|null>(null),controller=useRef<AbortController|null>(null),urls=useRef<string[]>([]),mounted=useRef(true);
 const photo=photos.find(p=>p.id===photoId),draft=drafts.find(d=>d.id===activeId);
 const keepUrl=(blob:Blob)=>{const url=URL.createObjectURL(blob);urls.current.push(url);return url;};
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;controller.current?.abort();urls.current.forEach(u=>URL.revokeObjectURL(u));};},[]);
 useEffect(()=>{if(!photos.length)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[photos.length]);
 function patch(id:string,change:Partial<Draft>){setDrafts(all=>all.map(d=>d.id===id?{...d,...change}:d));}
 function edit(change:Partial<Draft>){if(draft)patch(draft.id,{...change,reviewed:false,error:''});}
 function addFiles(files:FileList|null){
  if(!files)return;setMessage('');const added:Photo[]=[];
  for(const file of Array.from(files)){
   if(photos.length+added.length>=10){setMessage('Upload up to 10 photos at a time.');break;}
   if(!file.type.startsWith('image/')||file.size>15*1024*1024){setMessage('Choose image files up to 15 MB each.');continue;}
   added.push({id:crypto.randomUUID(),name:file.name,url:keepUrl(file)});
  }
  setPhotos(p=>[...p,...added]);if(added.length&&!photoId)setPhotoId(added[0].id);
 }
 function point(e:React.PointerEvent){const rect=e.currentTarget.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height))};}
 function drag(e:React.PointerEvent){if(!start.current)return;const p=point(e),s=start.current;setRegion({x:Math.min(s.x,p.x),y:Math.min(s.y,p.y),width:Math.abs(s.x-p.x),height:Math.abs(s.y-p.y)});}
 async function readSheets(){
  const img=image.current;if(!img?.naturalWidth||!photo)return;
  const regions=region?[region]:sheetRegions(layout);
  if(regions.some(r=>r.width<.03||r.height<.03)){setMessage('Select a larger area around the whole paper.');return;}
  setBusy(true);setMessage('');const abort=new AbortController();controller.current=abort;
  try{
   for(let i=0;i<regions.length;i++){
    if(abort.signal.aborted)break;const r=regions[i],canvas=document.createElement('canvas'),scale=Math.min(1,2500/Math.max(img.naturalWidth*r.width,img.naturalHeight*r.height));
    canvas.width=Math.max(1,Math.round(img.naturalWidth*r.width*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*r.height*scale));
    canvas.getContext('2d')!.drawImage(img,img.naturalWidth*r.x,img.naturalHeight*r.y,img.naturalWidth*r.width,img.naturalHeight*r.height,0,0,canvas.width,canvas.height);
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Could not prepare this sheet.')),'image/png'));canvas.width=canvas.height=0;
    let text='',scanError='';
    try{text=await scanGuestList(new File([blob],'meal-sheet.png',{type:'image/png'}),progress=>{if(mounted.current)setMessage(`Sheet ${i+1} of ${regions.length}: ${progress}`);},abort.signal);}catch(e){if(abort.signal.aborted)break;scanError=e instanceof Error?e.message:'Text recognition was unavailable.';}
    if(abort.signal.aborted||!mounted.current)break;
    const suggestions=paperSuggestions(text,guests),id=crypto.randomUUID();
    const item:Draft={id,url:keepUrl(blob),text,guestId:'',selections:suggestions.selections,menuIds:suggestions.menuIds,dietary:'',reviewed:false,saved:false,loaded:false,revision:null,previous:null,error:scanError};
    setDrafts(all=>[...all,item]);setActiveId(id);
    if(suggestions.guestId)await chooseGuest(item,suggestions.guestId);
   }
   if(mounted.current)setMessage(abort.signal.aborted?'Scan canceled. Completed sheets remain available for review.':'Ready for review. Confirm the traveler and every choice against each paper. Handwriting, ticks and allergy notes may need manual entry.');
  }catch(e){if(mounted.current)setMessage(e instanceof Error?e.message:'Could not read the photo.');}
  finally{controller.current=null;if(mounted.current)setBusy(false);}
 }
 async function chooseGuest(item:Draft,id:string){
  const sequence=(requests.current[item.id]||0)+1;requests.current[item.id]=sequence;
  patch(item.id,{guestId:id,loaded:false,reviewed:false,error:''});if(!id)return;
  try{const r=await fetch('/api/meal-choices?action=paper-review&guestId='+encodeURIComponent(id),{cache:'no-store'}),body=await r.json();if(!r.ok)throw Error(body.error||'Unable to load current choices.');
   if(!mounted.current||requests.current[item.id]!==sequence)return;setLocks(body.lockedMeals);setDeadlines(body.deadlines);patch(item.id,{loaded:true,reviewed:false,revision:body.revision,previous:body.submission});
  }catch(e){if(mounted.current&&requests.current[item.id]===sequence)patch(item.id,{error:e instanceof Error?e.message:'Could not load saved choices.'});}
 }
 async function save(){
  if(!draft)return;setBusy(true);setMessage('');
  try{const r=await fetch('/api/meal-choices',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'paper-import',guestId:draft.guestId,selections:draft.selections,menuIds:draft.menuIds,dietary:draft.dietary,revision:draft.revision,reviewed:draft.reviewed})}),body=await r.json();if(!r.ok){if(body.lockedMeals){setLocks(body.lockedMeals);setDeadlines(body.deadlines);}throw Error(body.error||'Unable to import this paper.');}
   patch(draft.id,{saved:true,error:''});setMessage('Paper choices submitted and recorded as a TD paper-form entry.');onImported();
  }catch(e){patch(draft.id,{error:e instanceof Error?e.message:'Unable to import. Reload current choices and review before retrying.'});}finally{setBusy(false);}
 }
 const complete=!!draft?.guestId&&draft.loaded&&draft.menuIds.length>0&&draft.menuIds.every(id=>!locks[id]&&menus.find(m=>m.id===id)!.courses.every(c=>!!draft.selections[id]?.[c.id]));
 return <details className="meal-paper-import"><summary>Scan paper meal choices</summary><p>Photograph completed forms or upload several photos. If several papers appear in one photo, choose a layout or drag a box around one sheet at a time.</p><p className="meal-help">Photos and recognition stay on this device. Text recognition works best on clear printed text; handwriting and marked boxes may be missed. Nothing is saved until you review and submit it.</p>
 <fieldset disabled={busy}><label>Take a photo<input type="file" accept="image/*" capture="environment" onChange={e=>{addFiles(e.target.files);e.target.value='';}}/></label><label>Upload photos<input type="file" accept="image/*" multiple onChange={e=>{addFiles(e.target.files);e.target.value='';}}/></label></fieldset>
 {!!photos.length&&<><label>Photo<select disabled={busy} value={photoId} onChange={e=>{setPhotoId(e.target.value);setRegion(null);}}>{photos.map((p,i)=><option key={p.id} value={p.id}>{i+1}. {p.name}</option>)}</select></label><label>Sheets in this photo<select disabled={busy} value={region?'custom':layout} onChange={e=>{setRegion(null);setLayout(e.target.value);}}><option value="whole">One whole sheet</option><option value="two-across">Two sheets · side by side</option><option value="three-across">Three sheets · side by side</option><option value="two-down">Two sheets · top and bottom</option>{region&&<option value="custom">Selected area</option>}</select></label>
 <div className="meal-paper-photo" onPointerDown={e=>{if(busy)return;start.current=point(e);e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(!busy)drag(e);}} onPointerUp={e=>{if(!busy)drag(e);start.current=null;}} onPointerCancel={()=>{start.current=null;}}><img ref={image} src={photo?.url} alt="Paper forms; drag to select one sheet" draggable={false} onError={()=>setMessage('This image could not be opened. Export it as JPEG or PNG and try again.')}/>{(region?[region]:sheetRegions(layout)).map((r,i)=><span key={i} className="meal-paper-region" style={{left:r.x*100+'%',top:r.y*100+'%',width:r.width*100+'%',height:r.height*100+'%'}}><b>Sheet {i+1}</b></span>)}</div>
 <div className="meal-actions"><button type="button" disabled={busy} onClick={()=>void readSheets()}>Read {region?1:sheetRegions(layout).length} sheet{!region&&sheetRegions(layout).length>1?'s':''}</button>{region&&<button type="button" disabled={busy} className="meal-secondary" onClick={()=>setRegion(null)}>Clear selection</button>}{busy&&controller.current&&<button type="button" onClick={()=>controller.current?.abort()}>Cancel scan</button>}</div></>}
 <p role="status">{message}</p>
 {!!drafts.length&&<><label>Paper to review<select disabled={busy} value={activeId} onChange={e=>setActiveId(e.target.value)}>{drafts.map((d,i)=><option key={d.id} value={d.id}>Sheet {i+1}{d.guestId?' · '+guests.find(g=>g.id===d.guestId)?.name:''}{d.saved?' · Submitted':''}</option>)}</select></label><p>{drafts.filter(d=>d.saved).length} of {drafts.length} reviewed sheets submitted</p></>}
 {draft&&<section className="meal-paper-review"><h3>Review this paper</h3><img className="meal-paper-crop" src={draft.url} alt="Selected paper for checking choices"/>{draft.saved?<p>This sheet has been submitted. Its entry is in Meal change history.</p>:<fieldset disabled={busy}>
 <details><summary>Recognized text · may be incomplete</summary><textarea readOnly rows={7} value={draft.text||'No text recognized. Enter the choices from the photo below.'}/></details>
 <label>Traveler<select value={draft.guestId} onChange={e=>void chooseGuest(draft,e.target.value)}><option value="">Choose the traveler on this paper</option>{guests.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
 {draft.guestId&&!draft.loaded&&<button type="button" onClick={()=>void chooseGuest(draft,draft.guestId)}>Load current choices</button>}
 {menus.map(menu=><section className="meal-paper-menu" key={menu.id}><label className="meal-paper-check"><input type="checkbox" checked={draft.menuIds.includes(menu.id)} disabled={!!locks[menu.id]||!draft.loaded} onChange={e=>edit({menuIds:e.target.checked?[...draft.menuIds,menu.id]:draft.menuIds.filter(id=>id!==menu.id)})}/><strong>{menu.title}{locks[menu.id]?' · Closed':''}</strong></label>{deadlines[menu.id]&&<p className="meal-help">Deadline: {mealDeadlineLabel(deadlines[menu.id])}</p>}{draft.menuIds.includes(menu.id)&&menu.courses.map(course=><label key={course.id}>{course.title}<select disabled={!!locks[menu.id]} value={draft.selections[menu.id]?.[course.id]||''} onChange={e=>edit({selections:{...draft.selections,[menu.id]:{...draft.selections[menu.id],[course.id]:e.target.value}}})}><option value="">Confirm choice from paper</option>{course.options.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select>{draft.previous?.selections[menu.id]?.[course.id]&&<small>Currently saved: {course.options.find(o=>o.id===draft.previous?.selections[menu.id]?.[course.id])?.name}</small>}</label>)}{draft.menuIds.includes(menu.id)&&mealState(draft.previous,menu.id)&&<p className="meal-help">This meal already has {mealState(draft.previous,menu.id)?.status} choices. Importing replaces its choices and dietary notes. Saved dietary notes: {mealState(draft.previous,menu.id)?.dietary||'None provided'}</p>}</section>)}
 <label>Dietary restrictions / allergies on this paper<textarea rows={4} maxLength={2000} value={draft.dietary} onChange={e=>edit({dietary:e.target.value})} placeholder="Transcribe dietary notes exactly; leave blank only after checking the paper."/></label>
 <label className="meal-paper-check"><input type="checkbox" checked={draft.reviewed} onChange={e=>patch(draft.id,{reviewed:e.target.checked})}/>I checked the traveler, every selected meal, and allergies/dietary notes (including any blank notes) against this paper. I approve replacing any existing entries for these meals.</label>
 <div className="meal-actions"><button type="button" disabled={!complete||!draft.reviewed} onClick={()=>void save()}>Confirm &amp; submit paper choices</button><button type="button" className="meal-secondary" disabled={!draft.guestId} onClick={()=>void chooseGuest(draft,draft.guestId)}>Reload current choices</button></div>
 </fieldset>}{draft.error&&<p role="alert">{draft.error}</p>}</section>}
 {!!photos.length&&<button type="button" className="meal-secondary" disabled={busy} onClick={()=>{if(!confirm('Clear local photos and reviews? Submitted choices remain saved.'))return;urls.current.forEach(u=>URL.revokeObjectURL(u));urls.current=[];setPhotos([]);setDrafts([]);setPhotoId('');setActiveId('');setMessage('Local photos cleared.');}}>Clear photos and reviews</button>}
 </details>;
}
