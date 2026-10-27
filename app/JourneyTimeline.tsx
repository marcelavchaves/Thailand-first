"use client";
import {useCallback,useEffect,useState} from 'react';
import {useTDSession} from './TDSession';
import {mealWording} from './meal-wording';
import LoadingIndicator from './LoadingIndicator';
type Event=[string,string];
type Schedule={events:Event[];note:string;updatedAt?:string};
export default function JourneyTimeline({day,dateLabel,events,note,previewUnavailable=false,heading}:{day:number;dateLabel:string;events:Event[];note:string;previewUnavailable?:boolean;heading?:string}){
 const {authenticated,refresh}=useTDSession();
 const [schedule,setSchedule]=useState<Schedule>({events,note}),[revision,setRevision]=useState<string|null>(null);
 const [loaded,setLoaded]=useState(false),[editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [draft,setDraft]=useState<Schedule>({events,note});
 const load=useCallback(async(signal?:AbortSignal)=>{try{const r=await fetch(`/api/journey-timeline?day=${day}`,{cache:'no-store',signal});if(!r.ok)throw Error();const d=await r.json();if(signal?.aborted)return;setSchedule(previewUnavailable && (!d.schedule?.events?.length || d.schedule.events[0][0]==='COMING SOON') ? {events,note} : d.schedule||{events,note});setRevision(d.revision);setLoaded(true);setMessage(m=>m.startsWith("Unable to check schedule updates")?"":m);}catch{if(!signal?.aborted)setMessage('Unable to check schedule updates. Please try again when connected.');}},[day,events,note,previewUnavailable]);
 useEffect(()=>{if(editing)return;const controller=new AbortController();void load(controller.signal);const check=()=>void load(controller.signal);window.addEventListener('focus',check);const timer=window.setInterval(check,60000);return()=>{controller.abort();window.removeEventListener('focus',check);clearInterval(timer);};},[load,editing]);
 useEffect(()=>{if(!authenticated)setEditing(false);},[authenticated]);
 function update(index:number,column:0|1,value:string){setDraft(d=>({...d,events:d.events.map((e,i)=>i===index?(column===0?[value,e[1]]:[e[0],value]):e)}));}
 function move(index:number,delta:number){setDraft(d=>{const next=[...d.events];[next[index],next[index+delta]]=[next[index+delta],next[index]];return {...d,events:next};});}
 async function save(){setBusy(true);setMessage('');try{const r=await fetch('/api/journey-timeline',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({day,revision,events:draft.events,note:draft.note})});const d=await r.json();if(r.status===401){setEditing(false);await refresh();}if(!r.ok)throw Error(d.error||'Unable to save.');setSchedule(d.schedule);setRevision(d.revision);setEditing(false);setMessage(d.pdfReady?'Saved for this date. The interactive PDF is updated too.':'Schedule saved. The PDF will be regenerated when next opened.');}catch(e){setMessage(e instanceof Error?e.message:'Unable to save.');}finally{setBusy(false);}}
 return <section className="journey-timeline-panel" aria-label="Today’s journey timeline">
  <div className="timeline-heading"><h2>{heading||`Day ${day-4} schedule`}</h2></div>
  {!loaded&&<LoadingIndicator label="Checking the latest schedule…"/>}
  {schedule.updatedAt&&<p className="timeline-updated">Updated by Xavier · {new Date(schedule.updatedAt).toLocaleString('en-US',{timeZone:'Asia/Singapore',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} (Singapore / Bali time)</p>}
  <div className="timeline">{schedule.events.map(([time,text],index)=><article className="timeline-entry" key={index}><span className="timeline-time-label">{time}</span><p>{mealWording(text)}</p></article>)}</div>
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
