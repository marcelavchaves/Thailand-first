"use client";
import {useEffect,useRef,useState} from 'react';
import {type Guest,cleanGuests,parseGuestText} from '../lib/guest-roster';
import {scanGuestList} from './scanGuestList';
export default function GuestRosterManager({guests,revision,onSaved}:{guests:Guest[];revision:string|null;onSaved:()=>Promise<void>}){
 const [open,setOpen]=useState(false),[draft,setDraft]=useState<Guest[]>([]),[base,setBase]=useState<string|null>(null);
 const [text,setText]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[scanning,setScanning]=useState(false);
 const controller=useRef<AbortController|null>(null);
 useEffect(()=>()=>controller.current?.abort(),[]);
 function start(){setDraft(guests.map(g=>({...g})));setBase(revision);setOpen(true);setMessage('');}
 function patch(id:string,values:Partial<Guest>){setDraft(old=>old.map(g=>g.id===id?{...g,...values}:g));}
 function move(index:number,offset:number){setDraft(old=>{const result=[...old];[result[index],result[index+offset]]=[result[index+offset],result[index]];return result;});}
 async function scan(file?:File){if(!file)return;const c=new AbortController();controller.current=c;setScanning(true);setMessage('Reading your list…');try{const result=await scanGuestList(file,setMessage,c.signal);if(!c.signal.aborted){setText(result);setMessage('Review the text below. Put one guest on each line, then create draft cards.');}}catch(e){setMessage(e instanceof Error?e.message:'Unable to read this file. Paste the list instead.');}finally{setScanning(false);controller.current=null;}}
 function makeCards(){try{const rows=parseGuestText(text);if(!rows.length)throw Error('Add at least one guest to the text first.');if(rows.length+draft.length>100)throw Error('The list can contain up to 100 guests.');setDraft(old=>[...old,...rows]);setText('');setMessage(`${rows.length} draft cards added. Check spelling, remove headers or duplicates, and separate couples into individual cards before saving.`);}catch(e){setMessage(e instanceof Error?e.message:'Check the list.');}}
 async function save(){setBusy(true);try{const validated=cleanGuests(draft);const r=await fetch('/api/guest-roster',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({guests:validated,revision:base})});const body=await r.json();if(!r.ok)throw Error(body.error);await onSaved();setOpen(false);setMessage('Guest list saved. Its Hidden / Revealed setting has been preserved.');}catch(e){setMessage(e instanceof Error?e.message:'Unable to save. Try again.');}finally{setBusy(false);}}
 return <section className="roster-manager" aria-label="Manage guest list">
 {!open?<button type="button" onClick={start}>Scan or manage guest list</button>:<>
 <h3>Manage guest list</h3><p>Two cards per row, in the order shown below. Keep the original tour sign-up order. Safe IDs are assigned from the original list order when saved. Once issued, they stay fixed even if cards are moved; new guests receive the next unused number.</p>
 <fieldset disabled={busy||scanning}><label className="roster-upload">Scan or upload a list<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf,.csv,.tsv,.txt" onChange={e=>{void scan(e.target.files?.[0]);e.target.value='';}}/></label><small>Photo, PDF (up to 10 pages), CSV or text · up to 15 MB. Scanning runs on your device. Review every name before saving.</small></fieldset>
 {scanning&&<button type="button" onClick={()=>controller.current?.abort()}>Cancel scan</button>}
 <fieldset disabled={busy||scanning}><label>Review scan or paste a list<textarea rows={5} value={text} onChange={e=>setText(e.target.value)} placeholder={'Name | Hometown | Bio | Phone | Email | Social link\nOne guest per line'}/></label><small>Columns are optional. Separate them with | or tabs. CSV with a header row is also supported.</small>
 <div className="roster-actions"><button type="button" onClick={makeCards} disabled={!text.trim()}>Create draft cards</button><button type="button" disabled={draft.length>=100} onClick={()=>setDraft(old=>[...old,{id:crypto.randomUUID(),name:'',origin:'',bio:'',phone:'',email:'',social:'',shareContact:false}])}>Add guest</button></div>
 <p>{draft.length} guests · Not saved yet</p>
 <ol className="roster-edit-grid">{draft.map((g,index)=><li key={g.id}>
 <div className="roster-position"><span>Guest {index+1}{g.safeId&&<small> · Safe {g.safeId}</small>}</span><button type="button" disabled={index===0} aria-label={`Move ${g.name||'guest '+(index+1)} earlier`} onClick={()=>move(index,-1)}>←</button><button type="button" disabled={index===draft.length-1} aria-label={`Move ${g.name||'guest '+(index+1)} later`} onClick={()=>move(index,1)}>→</button></div>
 <label>Name<input value={g.name} maxLength={120} onChange={e=>patch(g.id,{name:e.target.value})}/></label>
 <label>Hometown<input value={g.origin} maxLength={160} onChange={e=>patch(g.id,{origin:e.target.value})}/></label>
 {!guests.some(old=>old.id===g.id)&&<label>Short bio<textarea value={g.bio} maxLength={600} rows={3} onChange={e=>patch(g.id,{bio:e.target.value})}/></label>}
 <details><summary>Optional contact details</summary><label>Phone<input type="tel" maxLength={80} value={g.phone} onChange={e=>patch(g.id,{phone:e.target.value})}/></label><label>Email<input type="email" maxLength={160} value={g.email} onChange={e=>patch(g.id,{email:e.target.value})}/></label><label>Social media link<input type="url" maxLength={500} placeholder="https://…" value={g.social} onChange={e=>patch(g.id,{social:e.target.value})}/></label><label className="roster-consent"><input type="checkbox" checked={g.shareContact} onChange={e=>patch(g.id,{shareContact:e.target.checked})}/>Guest agreed to share these contact details in the app.</label><small>Leave unchecked to keep contacts visible only to the TD. The app’s Info page is public.</small></details>
 <button type="button" className="roster-remove" onClick={()=>setDraft(old=>old.filter(item=>item.id!==g.id))}>Remove from draft</button>
 </li>)}</ol>
 <p>Saving prepares the guest cards without changing visibility. Open a saved guest’s profile to upload their photo or edit their bio. Reveal the list when you are ready.</p>
 <div className="roster-actions"><button type="button" onClick={()=>void save()}>Save guest list</button><button type="button" onClick={()=>{setOpen(false);setText('');setMessage('Draft discarded. The saved guest list is unchanged.');}}>Discard draft</button></div></fieldset></>}
 <p role="status" aria-live="polite">{busy?'Saving guest list…':message}</p>
 </section>;
}
