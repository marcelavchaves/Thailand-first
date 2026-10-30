'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {menus,MEAL_DEADLINE,defaultMealDeadlines,mealState,type MealDeadlines,type Selections,type MealSubmission} from '../lib/meal-choices';
import './meal-choices.css';
type Data={guest:{id:string;name:string;protected:boolean}|null;guests:{id:string;name:string;protected:boolean}[];submission:MealSubmission|null;revision:string|null;deadlines:MealDeadlines;serverNow:string;lockedMeals:Record<string,boolean>;locked:boolean;td:boolean};
export const mealDeadlineLabel=(deadline=MEAL_DEADLINE)=>new Date(deadline).toLocaleString('en-US',{timeZone:'Asia/Ho_Chi_Minh',month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'})+' · Hanoi time';
export default function MealChoices(){
 const [data,setData]=useState<Data|null>(null),[guestId,setGuestId]=useState(''),[selections,setSelections]=useState<Selections>({}),[dietary,setDietary]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[dirty,setDirty]=useState(false),[offset,setOffset]=useState(0),[now,setNow]=useState(0);
 const [pin,setPin]=useState(''),[newPin,setNewPin]=useState(''),[confirmPin,setConfirmPin]=useState(''),[currentPin,setCurrentPin]=useState(''),[showPin,setShowPin]=useState(false);
 const started=useRef(false);
 const load=useCallback(async()=>{const r=await fetch('/api/meal-choices',{cache:'no-store'}),body=await r.json();if(!r.ok)throw Error(body.error||'Unable to load meal choices.');setData(body);setSelections(body.submission?.selections||{});setDietary(body.submission?.dietary||'');setDirty(false);setOffset(Date.parse(body.serverNow)-Date.now());setNow(Date.now());return body;},[]);
 useEffect(()=>{
  const enter=async()=>{
   setMessage('');
   const params=new URLSearchParams(window.location.hash.slice(1)),access=params.get('access');
   const requested=new URLSearchParams(window.location.search).get('guest');
   history.replaceState(null,'',window.location.pathname);
   if(access){
    const [id,token]=access.split('.');setGuestId(id);
    const r=await fetch('/api/meal-choices',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',guestId:id,accessToken:token})}),body=await r.json();if(!r.ok)throw Error(body.error||'This private meal link is not valid.');
    await load();
   }else{
    const body=await load();
    if(requested&&body.guest?.id!==requested){
     if(body.td){const r=await fetch('/api/meal-choices',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',guestId:requested})});if(!r.ok)throw Error('Unable to open this traveler.');await load();}
     else{setGuestId(requested);setData(d=>d?{...d,guest:null,submission:null,revision:null}:d);}
    }
   }
  };
  const attempt=()=>void enter().catch(e=>{setMessage(e.message);void load().catch(()=>{});});
  if(!started.current){started.current=true;attempt();}
  const changed=()=>{if(new URLSearchParams(window.location.hash.slice(1)).has('access'))attempt();};
  window.addEventListener('hashchange',changed);
  const timer=setInterval(()=>setNow(Date.now()),1000);return()=>{clearInterval(timer);window.removeEventListener('hashchange',changed);};
 },[load]);
 useEffect(()=>{
  if(!data?.guest)return;
  const refresh=async()=>{try{const r=await fetch('/api/meal-choices',{cache:'no-store'});if(!r.ok)return;const body=await r.json();setData(d=>d?{...d,deadlines:body.deadlines,lockedMeals:body.lockedMeals}:d);setOffset(Date.parse(body.serverNow)-Date.now());setNow(Date.now());}catch{}};
  const timer=setInterval(()=>void refresh(),30000);window.addEventListener('focus',refresh);
  return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};
 },[data?.guest?.id]);
 useEffect(()=>{if(!dirty)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 const deadlines=data?.deadlines||defaultMealDeadlines();
 const isLocked=(id:string)=>!!data&&(data.lockedMeals[id]||now+offset>=Date.parse(deadlines[id]));
 const open=menus.filter(m=>!isLocked(m.id)),allLocked=!!data&&!open.length;
 async function openTraveler(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');try{const r=await fetch('/api/meal-choices',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',guestId,pin})}),body=await r.json();if(!r.ok)throw Error(body.error);await load();setPin('');}catch(e){setMessage(e instanceof Error?e.message:'Unable to open meal choices.');}finally{setBusy(false);}}
 async function save(submit:boolean,menuId='all'){
  setBusy(true);setMessage('');
  try{const r=await fetch('/api/meal-choices',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:submit?'submit':'save',guestId:data?.guest?.id,menuId,selections,dietary,revision:data?.revision})}),body=await r.json();
   if(!r.ok){if(body.lockedMeals)setData(d=>d?{...d,lockedMeals:body.lockedMeals,deadlines:body.deadlines}:d);throw Error(body.error);}
   setData(d=>d?{...d,submission:body.submission,revision:body.revision,lockedMeals:body.lockedMeals,deadlines:body.deadlines}:d);
   const remainingEdits=menus.some(m=>!body.lockedMeals[m.id]&&m.courses.some(c=>(selections[m.id]?.[c.id]||'')!==(body.submission.selections[m.id]?.[c.id]||'')));
   setDirty(remainingEdits);setMessage(submit?(menuId==='all'?'All open meals have been submitted.':'This meal has been submitted. Other meals keep their own status.'):'Draft saved. Submit this meal before its deadline.');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to save your choices.');}finally{setBusy(false);}
 }
 async function changeTraveler(){if(dirty&&!confirm('Leave without saving your changes?'))return;setBusy(true);setMessage('');try{const r=await fetch('/api/meal-choices',{method:'DELETE'});if(!r.ok)throw Error();setGuestId('');await load();}catch{setMessage('Unable to change traveler. Please try again.');}finally{setBusy(false);}}
 async function protect(protectedValue:boolean){
  if(protectedValue&&(newPin!==confirmPin||!/^\d{4}$/.test(newPin))){setMessage('Enter and confirm the same four-digit PIN.');return;}
  if(!protectedValue&&!confirm('Make your meal choices public? Anyone selecting your name can view and edit your choices and dietary notes.'))return;
  setBusy(true);setMessage('');try{const r=await fetch('/api/meal-choices',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'set-protection',guestId:data?.guest?.id,protected:protectedValue,pin:newPin,currentPin})}),body=await r.json();if(!r.ok)throw Error(body.error);setData(d=>d?.guest?{...d,guest:{...d.guest,protected:protectedValue}}:d);setNewPin('');setConfirmPin('');setCurrentPin('');setMessage(body.message);}catch(e){setMessage(e instanceof Error?e.message:'Unable to update protection.');}finally{setBusy(false);}
 }
 const submittedCount=menus.filter(m=>mealState(data?.submission,m.id)?.status==='submitted').length;
 const status=(id:string)=>mealState(data?.submission,id)?.status==='submitted'?'Submitted':mealState(data?.submission,id)?'Draft · not submitted':'Not submitted';
 return <main className="meal-page"><a href="/">← Back to Home</a><header><span className="eyebrow">WONDERCASE · YOUR TABLE AWAITS</span><h1>Your meal choices</h1><p>Choose your meals for all five menus, and let Xavier know about dietary restrictions or allergies.</p></header>
 <aside className={`meal-deadline${allLocked?' is-locked':''}`}><strong>{allLocked?'All meal choices are read-only':'Each meal has its own deadline'}</strong><p>Check the cutoff shown on each menu. Times are in Hanoi time (UTC+7).</p><small>{allLocked?'All deadlines have passed. Your saved choices remain available below.':'Submit one meal at a time, or submit all open meals together. Each meal becomes read-only at its own cutoff.'}</small></aside>
 {!data?<><p role="status">{message||'Loading meal choices…'}</p><button onClick={()=>void load().catch(e=>setMessage(e.message))}>Try again</button></>:!data.guest?<form className="meal-login" onSubmit={openTraveler}><h2>Open your meal choices</h2><p>{data.td?'TD updates are recorded in the change history.':'Select your name. Public choices open directly; protected choices require your four-digit PIN.'}</p><fieldset disabled={busy}><label>Traveler<select required value={guestId} onChange={e=>{setGuestId(e.target.value);setPin('');}}><option value="">Choose your name</option>{data.guests.map(g=><option key={g.id} value={g.id}>{g.name}{g.protected?' · PIN-protected':' · Public'}</option>)}</select></label>{!data.guests.length&&<p>Xavier will make the traveler list available here.</p>}{!data.td&&data.guests.find(g=>g.id===guestId)?.protected&&<label>Four-digit PIN<input type={showPin?'text':'password'} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required autoComplete="off" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))}/><button type="button" className="meal-secondary" onClick={()=>setShowPin(v=>!v)} aria-label={showPin?'Hide PIN':'Show PIN'}>{showPin?'Hide PIN':'Show PIN'}</button></label>}<button type="submit">{busy?'Opening…':'Open meal choices'}</button></fieldset><p role="status">{message}</p></form>:<>
 <div className="meal-traveler"><h2>{data.guest.name}</h2><button disabled={busy} onClick={()=>void changeTraveler()}>{data.td?'Change traveler':'Close my choices'}</button></div>
 <details className="meal-login"><summary>{data.guest.protected?'🔒 PIN-protected choices':'Public choices · add an optional PIN'}</summary><p>{data.guest.protected?'Your PIN is required to open your choices. Contact Xavier if you forget it.':'Anyone selecting your name can view and edit your choices and dietary notes. Add a four-digit PIN if you prefer to protect them.'}</p><fieldset disabled={busy}>{data.guest.protected&&!data.td&&<label>Current PIN<input type={showPin?'text':'password'} inputMode="numeric" maxLength={4} autoComplete="off" value={currentPin} onChange={e=>setCurrentPin(e.target.value.replace(/\D/g,''))}/></label>}<label>{data.guest.protected?'New four-digit PIN':'Choose a four-digit PIN'}<input type={showPin?'text':'password'} inputMode="numeric" maxLength={4} autoComplete="new-password" value={newPin} onChange={e=>setNewPin(e.target.value.replace(/\D/g,''))}/></label><label>Confirm PIN<input type={showPin?'text':'password'} inputMode="numeric" maxLength={4} autoComplete="new-password" value={confirmPin} onChange={e=>setConfirmPin(e.target.value.replace(/\D/g,''))}/></label><button type="button" className="meal-secondary" onClick={()=>setShowPin(v=>!v)}>{showPin?'Hide PIN':'Show PIN'}</button><div className="meal-actions"><button type="button" onClick={()=>void protect(true)}>{data.guest.protected?'Change PIN':'Protect my choices'}</button>{data.guest.protected&&<button type="button" className="meal-secondary" onClick={()=>void protect(false)}>Remove PIN · make public</button>}</div></fieldset></details>
 <p className="meal-status" role="status">{submittedCount} of {menus.length} meals submitted{dirty?' · You have unsaved changes':''}</p>
 <form onSubmit={e=>{e.preventDefault();void save(true);}}>
 {!allLocked&&<><label className="meal-dietary-label">Dietary restrictions or allergies<textarea rows={5} maxLength={2000} value={dietary} disabled={busy} onChange={e=>{setDietary(e.target.value);setDirty(true);setMessage('');}} placeholder="List any allergies, intolerances, or dietary requirements. Leave blank if none."/></label><p className="meal-help">These notes are included with each meal you save or submit. Closed meals retain their saved notes. If you have a serious food allergy, please also speak directly with Xavier.</p></>}
 {menus.map((menu,index)=>{
  const closed=isLocked(menu.id),savedState=mealState(data.submission,menu.id);
  return <details className={`meal-menu${closed?' meal-closed':''}`} key={menu.id} open><summary><span>{index+1}. {menu.title}</span><small>{status(menu.id)}{closed?' · Read-only':''}</small></summary><p>{menu.restaurant}</p><p className="meal-menu-deadline"><strong>Deadline:</strong> {mealDeadlineLabel(deadlines[menu.id])}</p><a className="meal-original" href={`/documents/${menu.document}`} target="_blank" rel="noopener noreferrer">View the original menu ↗</a>
   {closed?<div className="meal-readonly"><dl>{menu.courses.map(c=><div key={c.id}><dt>{c.title}</dt><dd>{c.options.find(o=>o.id===data.submission?.selections[menu.id]?.[c.id])?.name||'No choice saved'}</dd></div>)}</dl><strong>Dietary restrictions or allergies</strong><p className="meal-dietary-text">{savedState?.dietary||'None provided'}</p>{savedState?.status!=='submitted'&&<p>This meal was not submitted before its deadline. Please speak to Xavier.</p>}</div>:<>
   {menu.courses.map(course=><fieldset key={course.id} disabled={busy}><legend>{course.title} · choose one</legend>{course.options.map(option=><label className="meal-option" key={option.id}><input type="radio" name={`${menu.id}-${course.id}`} value={option.id} checked={selections[menu.id]?.[course.id]===option.id} onChange={()=>{setSelections(s=>({...s,[menu.id]:{...s[menu.id],[course.id]:option.id}}));setDirty(true);setMessage('');}}/><span><strong>{option.name}</strong>{option.description&&<small>{option.description}</small>}</span></label>)}</fieldset>)}
   {savedState?.dietary&&<p className="meal-help">Saved dietary notes for this meal: {savedState.dietary}</p>}
   <div className="meal-actions"><button type="button" className="meal-secondary" disabled={busy} onClick={()=>void save(false,menu.id)}>Save this meal as draft</button><button type="button" disabled={busy} onClick={()=>void save(true,menu.id)}>{savedState?.status==='submitted'?'Submit updated meal':'Submit this meal'}</button></div>
   </>}
  </details>;
 })}
 {!allLocked&&<>
 <div className="meal-actions"><button type="button" className="meal-secondary" disabled={busy} onClick={()=>void save(false)}>Save open meals as draft</button><button type="submit" disabled={busy}>{busy?'Saving…':'Submit all open meals'}</button></div><p className="meal-help">A saved draft is not a submission. Each meal must be submitted before its own deadline.</p></>}
 </form><p role="status" className="meal-message">{message}</p><button type="button" className="meal-secondary" disabled={busy} onClick={()=>{if(dirty&&!confirm('Reload and discard unsaved changes?'))return;void load().catch(e=>setMessage(e.message));}}>Reload saved choices</button>
 </>}
 </main>;
}
