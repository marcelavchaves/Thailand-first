"use client";
import {useEffect,useState,useRef} from 'react';
import {useTDSession} from './TDSession';
import {type Guest} from '../lib/guest-roster';
import ClassicSafeIcon from './ClassicSafeIcon';
import GuestRosterManager from './GuestRosterManager';
import './guest-roster.css';
type Profile={intro?:string;photo?:string;pending?:string;revision?:string};
export default function GuestProfiles({directorMode=false}:{directorMode?:boolean}){
 const {authenticated}=useTDSession();
 const [guests,setGuests]=useState<Guest[]>([]);
 const [revision,setRevision]=useState<string|null>(null);
 const [loaded,setLoaded]=useState(false);
 const [revealed,setRevealed]=useState(false),[guestCount,setGuestCount]=useState(0),[visibilityBusy,setVisibilityBusy]=useState(false),[preview,setPreview]=useState(false);
 const managing=authenticated&&directorMode&&!preview;
 const hidden=!revealed&&!managing;
 const [profiles,setProfiles]=useState<Record<string,Profile>>({});
 const [message,setMessage]=useState('');
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 const selectedGuest=guests.find(guest=>guest.id===selectedId);
 const selectedProfile=selectedId?{...profiles[selectedId],intro:profiles[selectedId]?.intro||selectedGuest?.bio}:undefined;
 useEffect(()=>{
  if(!selectedId)return;
  const element=dialog.current;
  if(!element)return;
  const previousOverflow=document.body.style.overflow;
  element.showModal();
  document.body.style.overflow='hidden';
  return()=>{element.close();document.body.style.overflow=previousOverflow;};
 },[selectedId]);
 async function load(){try{const [r,list]=await Promise.all([fetch('/api/guest-profiles',{cache:'no-store'}),fetch('/api/guest-roster',{cache:'no-store'})]);if(!r.ok||!list.ok)throw Error();const roster=await list.json();setProfiles(await r.json());setGuests(roster.guests);setRevealed(roster.revealed===true);setGuestCount(roster.guestCount||0);setRevision(roster.revision||null);setLoaded(true);}catch{setMessage('Guest updates are temporarily unavailable. Please reload to try again.');}}
 useEffect(()=>{setLoaded(false);setGuests([]);setProfiles({});setSelectedId(null);void load();const timer=setInterval(()=>void load(),15000);return()=>clearInterval(timer);},[authenticated]);
 useEffect(()=>{if(hidden)setSelectedId(null);},[hidden]);
 async function visibility(next:boolean){setVisibilityBusy(true);setMessage('');try{const r=await fetch('/api/guest-roster',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revealed:next,revision})});const b=await r.json();if(!r.ok)throw Error(b.error);await load();setMessage(next?'Guest list revealed to travelers.':'Guest list hidden from travelers.');}catch(e){setMessage(e instanceof Error?e.message:'Unable to change visibility.');await load();}finally{setVisibilityBusy(false);}}
 async function save(id:string,action:string,values:object={}){
  setMessage('Saving…');
  try{const r=await fetch('/api/guest-profiles',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,action,revision:profiles[id]?.revision||null,...values})});const body=await r.json();if(!r.ok)throw Error(body.error);setMessage(action==='submit'?'Thank you! Xavier will review your introduction.':'Guest profile updated.');await load();}catch(e){setMessage(e instanceof Error?e.message:'Please try again.');}
 }
 async function photo(id:string,file?:File){
  if(!file)return;if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>10000000){setMessage('Choose a JPEG, PNG or WebP photo under 10 MB.');return;}
  try{const bitmap=await createImageBitmap(file);const canvas=document.createElement('canvas');const scale=Math.min(1,640/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();await save(id,'photo',{photo:canvas.toDataURL('image/jpeg',0.82)});}catch{setMessage('This photo could not be opened. Please choose another.');}
 }
 function profileControls(guest:typeof guests[number],p:Profile){return <div className="guest-profile-controls">
    <details className="guest-profile-editor" data-pdf-exclude><summary>{authenticated?'Edit introduction':'Write your own introduction'}</summary>
     <form data-pdf-exclude onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const intro=String(new FormData(form).get('intro')||'');void save(guest.id,authenticated?'intro':'submit',{intro});}}>
      <label>{authenticated?'Edit introduction':'Write your own introduction'}<textarea name="intro" maxLength={600} required rows={3} defaultValue={authenticated?p.intro:''} key={`${authenticated}-${p.intro}`} placeholder="Share a little about yourself…"/></label>
      {!authenticated&&<small>Introductions are shared with fellow travelers after Xavier approves them. Please submit only your own.</small>}
      <button type="submit">{authenticated?'Save introduction':'Send to Xavier'}</button>
     </form>
    </details>
    {authenticated&&<div className="guest-admin" data-pdf-exclude><label>Add or replace photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>void photo(guest.id,e.target.files?.[0])}/></label>{p.photo&&<button onClick={()=>void save(guest.id,'photo',{photo:null})}>Remove photo</button>}
     {p.pending&&<div><p>Introduction awaiting review: {p.pending}</p><button onClick={()=>void save(guest.id,'approve')}>Approve</button><button onClick={()=>void save(guest.id,'reject')}>Dismiss</button></div>}
    </div>}
<p role="status">{message}</p></div>;}
 return <article className="guests guests-after-travelers">
  <h2>Our Travelers</h2>
  {authenticated&&directorMode&&<><section className="guest-visibility" aria-label="Guest list visibility"><h3>Reveal to travelers</h3><p className="guest-visibility-state">Currently {revealed?'Revealed':'Hidden'}</p><div className="guest-visibility-switch"><button type="button" disabled={!loaded||visibilityBusy} aria-pressed={!revealed} onClick={()=>void visibility(false)}>🔒 Hidden</button><button type="button" disabled={!loaded||visibilityBusy} aria-pressed={revealed} onClick={()=>void visibility(true)}>Revealed</button></div><p>Names, photos, hometowns and guest details stay private until you reveal them. You can hide the list again at any time.</p><button className="guest-preview-button" type="button" onClick={()=>{setPreview(!preview);setSelectedId(null);}}>{preview?'← Back to guest management':'Preview traveler view'}</button>{preview&&<small>Traveler preview · {revealed?'Revealed':'Hidden'}</small>}</section></>}
  {hidden&&<div className="guest-reveal-notice"><span aria-hidden="true">🔒</span><div><strong>A little wonder is on its way</strong><p>You will soon meet your fellow travelers</p></div></div>}

  
  {managing&&loaded&&<GuestRosterManager guests={guests} revision={revision} onSaved={load}/>}
  {!loaded&&<p>Loading guest list…</p>}
  {loaded&&guestCount === 0 && <p className="guest-grid-help">The guest list is coming soon.</p>}
  
  <ul className="guest-list guest-grid" style={{gridTemplateRows:`repeat(${Math.max(1,Math.ceil((hidden?guestCount:guests.length)/2))},auto)`}}>{loaded&&hidden&&Array.from({length:guestCount},(_,index)=><li className="guest-entry guest-hidden-card" key={`hidden-${index}`}><span className="guest-hidden-lock" aria-label="Not revealed">🔒</span><div className="guest-traveler-avatar" style={{backgroundPosition:`${index%2===0?0:100}% ${[0,50,100][Math.floor(index/2)%3]}%`}} role="img" aria-label="Traveler avatar"/><strong>Traveler {String(index+1).padStart(2,'0')}</strong></li>)}{!hidden&&guests.map(guest=>{const p={...profiles[guest.id],intro:profiles[guest.id]?.intro||guest.bio};return <li className="guest-entry" key={guest.id} data-guest-id={guest.id}>
   <button type="button" className="guest-photo-button" aria-label={`View ${guest.name}’s profile`} aria-haspopup="dialog" onClick={()=>setSelectedId(guest.id)}>{p.photo?<img className="guest-photo" src={p.photo} alt={guest.name} width={240} height={240}/>:<div className="guest-photo guest-photo-placeholder" aria-label="Photo coming soon"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/></svg></div>}</button>
   <button type="button" className="guest-details guest-details-button" aria-label={`Read ${guest.name}’s profile`} onClick={()=>setSelectedId(guest.id)}><strong>{guest.name}</strong><p className="guest-origin">{guest.origin}</p>
    <div className={`guest-introduction guest-profile-preview${p.intro?.trim()?' has-introduction':''}`}><span className="guest-about-label">A little about me <span aria-hidden="true">↗</span></span><small>{p.intro?.trim()?'Introduction available · Tap to read':'Tap to view profile'}</small><p hidden>{p.intro||'Introduction coming soon.'}</p></div>

   </button><a className="guest-safe-link" href={`/traveler-safe/?safe=${encodeURIComponent(guest.safeId||'')}`} aria-label={`Open ${guest.name}’s assigned Safe ${guest.safeId||''}`} title={`Traveler Safe ${guest.safeId||''}`} data-pdf-exclude><ClassicSafeIcon/><span>My Safe</span></a></li>;})}</ul><p role="status" data-pdf-exclude>{message}</p>
  <dialog ref={dialog} className="guest-profile-dialog" aria-labelledby="guest-profile-title" data-pdf-exclude onClose={()=>setSelectedId(null)} onClick={event=>{if(event.target===event.currentTarget){const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.currentTarget.close();}}}>
   <button type="button" className="guest-profile-close" autoFocus onClick={()=>dialog.current?.close()} aria-label="Close guest profile">Close ×</button>
   {selectedGuest&&<div className="guest-profile-content">
    {selectedProfile?.photo?<img className="guest-profile-large-photo" src={selectedProfile.photo} alt={selectedGuest.name}/>:<div className="guest-profile-no-photo">Photo coming soon</div>}
    <h2 id="guest-profile-title">{selectedGuest.name}</h2>
    <p className="guest-profile-origin">From: {selectedGuest.origin}</p>
    <h3>A little about me</h3><p className="guest-profile-bio">{selectedProfile?.intro||'Introduction coming soon.'}</p>
    {(selectedGuest.phone||selectedGuest.email||selectedGuest.social)&&<section className="guest-contact-details"><h3>Keep in touch</h3>{authenticated&&!selectedGuest.shareContact&&<small>TD only · Not shared with travelers</small>}{selectedGuest.phone&&<a href={`tel:${selectedGuest.phone.replace(/[^+0-9]/g,'')}`}>{selectedGuest.phone}</a>}{selectedGuest.email&&<a href={`mailto:${selectedGuest.email}`}>{selectedGuest.email}</a>}{selectedGuest.social&&<a href={selectedGuest.social} target="_blank" rel="noopener noreferrer">Social media ↗</a>}</section>}
    {(!authenticated||managing)&&profileControls(selectedGuest,selectedProfile||{})}
   </div>}
  </dialog>
 </article>;
}
