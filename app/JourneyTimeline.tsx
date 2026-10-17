"use client";
import {useCallback,useEffect,useState,useRef} from 'react';
import {useTDSession} from './TDSession';
import LoadingIndicator from './LoadingIndicator';
type Event=[string,string];
type Schedule={events:Event[];note:string;updatedAt?:string};
export default function JourneyTimeline({day,dateLabel,events,note}:{day:number;dateLabel:string;events:Event[];note:string}){
 const {authenticated,refresh}=useTDSession();
 const [schedule,setSchedule]=useState<Schedule>({events,note}),[revision,setRevision]=useState<string|null>(null);
 const [loaded,setLoaded]=useState(false),[editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[zoom,setZoom]=useState(0);
 const [expandedEvent,setExpandedEvent]=useState<Event|null>(null);
 const timeDialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  if(!expandedEvent||!timeDialog.current)return;
  const element=timeDialog.current,previousOverflow=document.body.style.overflow;
  element.showModal();document.body.style.overflow='hidden';
  return()=>{element.close();document.body.style.overflow=previousOverflow;};
 },[expandedEvent]);
 const [draft,setDraft]=useState<Schedule>({events,note});
 const load=useCallback(async(signal?:AbortSignal)=>{try{const r=await fetch(`/api/journey-timeline?day=${day}`,{cache:'no-store',signal});if(!r.ok)throw Error();const d=await r.json();if(signal?.aborted)return;setSchedule(d.schedule||{events,note});setRevision(d.revision);setLoaded(true);setMessage(m=>m.startsWith("Unable to check schedule updates")?"":m);}catch{if(!signal?.aborted)setMessage('Unable to check schedule updates. Please try again when connected.');}},[day,events,note]);
 useEffect(()=>{if(editing)return;const controller=new AbortController();void load(controller.signal);const check=()=>void load(controller.signal);window.addEventListener('focus',check);const timer=window.setInterval(check,60000);return()=>{controller.abort();window.removeEventListener('focus',check);clearInterval(timer);};},[load,editing]);
 useEffect(()=>{if(!authenticated)setEditing(false);},[authenticated]);
 function update(index:number,column:0|1,value:string){setDraft(d=>({...d,events:d.events.map((e,i)=>i===index?(column===0?[value,e[1]]:[e[0],value]):e)}));}
 function move(index:number,delta:number){setDraft(d=>{const next=[...d.events];[next[index],next[index+delta]]=[next[index+delta],next[index]];return {...d,events:next};});}
 async function save(){setBusy(true);setMessage('');try{const r=await fetch('/api/journey-timeline',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({day,revision,events:draft.events,note:draft.note})});const d=await r.json();if(r.status===401){setEditing(false);await refresh();}if(!r.ok)throw Error(d.error||'Unable to save.');setSchedule(d.schedule);setRevision(d.revision);setEditing(false);setMessage(d.pdfReady?'Saved for this date. The interactive PDF is updated too.':'Schedule saved. The PDF will be regenerated when next opened.');}catch(e){setMessage(e instanceof Error?e.message:'Unable to save.');}finally{setBusy(false);}}
 return <section className="journey-timeline-panel" aria-label="Today’s journey timeline">
  <div className="timeline-heading"><h2>Today’s journey</h2><div className="timeline-zoom-controls" aria-label="Timeline text size"><button type="button" onClick={()=>setZoom(z=>Math.max(0,z-1))} disabled={zoom===0} aria-label="Make timeline text smaller">A−</button><span>{zoom===0?'100%':zoom===1?'125%':'150%'}</span><button type="button" onClick={()=>setZoom(z=>Math.min(2,z+1))} disabled={zoom===2} aria-label="Make timeline text larger">A+</button></div></div>
  {!loaded&&<LoadingIndicator label="Checking the latest schedule…"/>}
  {schedule.updatedAt&&<p className="timeline-updated">Updated by Chervil · {new Date(schedule.updatedAt).toLocaleString('en-US',{timeZone:'Asia/Singapore',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} (Singapore / Bali time)</p>}
  <div className={`timeline timeline-zoom-${zoom}`}>{schedule.events.map(([time,text],index)=><article key={index}><span><button type="button" className="timeline-time" aria-label={`Enlarge time: ${time}`} aria-haspopup="dialog" onClick={()=>setExpandedEvent([time,text])}>{time}<small aria-hidden="true"> ⤢</small></button></span><p>{text}</p></article>)}</div>
  <dialog ref={timeDialog} className="timeline-time-dialog" aria-labelledby="expanded-time-title" data-pdf-exclude onClose={()=>setExpandedEvent(null)} onClick={event=>{if(event.target===event.currentTarget)event.currentTarget.close();}}>
   <button type="button" className="timeline-time-close" autoFocus onClick={()=>timeDialog.current?.close()}>Close ×</button>
   {expandedEvent&&<div><p className="expanded-time-date">{dateLabel}</p><h2 id="expanded-time-title">{expandedEvent[0]}</h2><p className="expanded-time-activity">{expandedEvent[1]}</p></div>}
  </dialog>
  {schedule.note&&<div className="note"><span className="eyebrow">A NOTE FOR TODAY</span><p>{schedule.note}</p></div>}
  <div data-pdf-exclude>
   {authenticated&&!editing&&<button className="timeline-edit-button" disabled={!loaded} onClick={()=>{setDraft({events:schedule.events.map(e=>[...e] as Event),note:schedule.note});setMessage('');setEditing(true);}}>Edit this day’s journey</button>}
   {editing&&authenticated&&<form className="timeline-editor" onSubmit={e=>{e.preventDefault();void save();}}>
    <h3>Edit journey · {dateLabel}</h3><p>Changes apply only to this date. Travelers see this schedule once it is revealed. Times can be exact or labels such as DINNER.</p>
    <fieldset disabled={busy}>
     {draft.events.map(([time,text],index)=><div className="timeline-editor-row" key={index}>
      <label>Time / label {index+1}<input value={time} maxLength={80} required onChange={e=>update(index,0,e.target.value)}/></label>
      <label>Activity {index+1}<textarea value={text} maxLength={1200} required rows={3} onChange={e=>update(index,1,e.target.value)}/></label>
      <div className="timeline-row-actions"><button type="button" disabled={index===0} onClick={()=>move(index,-1)} aria-label={`Move activity ${index+1} up`}>↑</button><button type="button" disabled={index===draft.events.length-1} onClick={()=>move(index,1)} aria-label={`Move activity ${index+1} down`}>↓</button><button type="button" disabled={draft.events.length===1} onClick={()=>setDraft(d=>({...d,events:d.events.filter((_,i)=>i!==index)}))}>Remove activity {index+1}</button></div>
     </div>)}
     <button type="button" disabled={draft.events.length>=24} onClick={()=>setDraft(d=>({...d,events:[...d.events,['','']]}))}>+ Add activity</button>
     <label>Daily reminder<textarea value={draft.note} maxLength={1200} rows={3} onChange={e=>setDraft(d=>({...d,note:e.target.value}))}/></label>
     <div className="timeline-editor-actions"><button type="submit">Save this day</button><button type="button" onClick={()=>setEditing(false)}>Cancel</button></div>
    </fieldset>
    {busy&&<LoadingIndicator label="Saving schedule and updating the PDF…"/>}
   </form>}
   {message&&<p role="status" className="timeline-save-status">{message}</p>}
  </div>
 </section>;
}
