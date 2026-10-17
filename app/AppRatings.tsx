"use client";
import {useEffect,useRef,useState} from 'react';

type Scores={overall:number};
type Rating={id:string;author:string;scores:Scores;worked:string;improve:string;wished:string;other:string;isOwner:boolean};
export const scoreQuestions:[keyof Scores,string][]=[['overall','Overall experience with the app']];
const initialScores:Scores={overall:0};

function ScoreSlider({name,label,value,onChange,disabled=false}:{name:string;label:string;value:number;onChange:(value:number)=>void;disabled?:boolean}){
 return <fieldset className="survey-score" disabled={disabled}>
  <legend>{label}</legend>
  <div className="rating-slider-stars" aria-hidden="true"><span>★★★★★</span><span className="rating-slider-filled" style={{width:`${value/5*100}%`}}>★★★★★</span></div>
  <input id={`rating-${name}`} className="rating-slider" type="range" min="0" max="5" step="0.5" value={value} onChange={e=>onChange(Number(e.target.value))} aria-label={label} aria-valuetext={`${value} out of 5 stars`}/>
  <div className="rating-slider-scale"><span>0 stars</span><output htmlFor={`rating-${name}`}>{value} out of 5</output><span>5 stars</span></div>
 </fieldset>;
}

export default function AppRatings(){
 const [entries,setEntries]=useState<Rating[]>([]),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[editing,setEditing]=useState(false),[confirmDelete,setConfirmDelete]=useState(false);
 const [author,setAuthor]=useState('Anonymous'),[scores,setScores]=useState<Scores>(initialScores),[worked,setWorked]=useState(''),[improve,setImprove]=useState(''),[wished,setWished]=useState(''),[other,setOther]=useState(''),[message,setMessage]=useState('');
 const token=useRef('');const mine=entries.find(e=>e.isOwner);
 async function load(){const r=await fetch('/api/app-ratings',{headers:{'x-journal-token':token.current},cache:'no-store'});const data=await r.json();if(!r.ok)throw Error(data.error);setEntries(data.entries);}
 useEffect(()=>{let active=true;async function start(){try{let key=localStorage.getItem('kd-traveler-journal-token');if(!key){key=crypto.randomUUID()+crypto.randomUUID();localStorage.setItem('kd-traveler-journal-token',key);}token.current=key;await load();if(active)setReady(true);}catch{if(active)setMessage('Could not load feedback. Please reopen this page to try again.');}}void start();return()=>{active=false;};},[]);
 function reset(){setAuthor('Anonymous');setScores(initialScores);setWorked('');setImprove('');setWished('');setOther('');}
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');try{const r=await fetch('/api/app-ratings',{method:mine?'PATCH':'POST',headers:{'content-type':'application/json','x-journal-token':token.current},body:JSON.stringify({id:mine?.id,author:author.trim()||'Anonymous',scores,worked,improve,wished,other})});const data=await r.json();if(!r.ok)throw Error(data.error);setEntries(old=>[data.entry,...old.filter(x=>x.id!==data.entry.id)]);setEditing(false);setMessage('Thank you! Your feedback has been saved.');}catch(e){setMessage(e instanceof Error?e.message:'Could not save your feedback.');}finally{setBusy(false);}}
 async function remove(){if(!mine)return;setBusy(true);try{const r=await fetch(`/api/app-ratings?id=${encodeURIComponent(mine.id)}`,{method:'DELETE',headers:{'x-journal-token':token.current}});const data=await r.json();if(!r.ok)throw Error(data.error);setEntries(old=>old.filter(x=>x.id!==mine.id));reset();setEditing(false);setConfirmDelete(false);setMessage('Your feedback has been deleted.');}catch(e){setMessage(e instanceof Error?e.message:'Could not delete your feedback.');}finally{setBusy(false);}}
 function beginEdit(e:Rating){setAuthor(e.author);setScores(e.scores);setWorked(e.worked);setImprove(e.improve);setWished(e.wished);setOther(e.other);setEditing(true);setConfirmDelete(false);}
 return <section className="app-ratings" aria-labelledby="app-rating-title">
  <span className="eyebrow">AN INVITATION TO OUR TRAVELERS</span><h2 id="app-rating-title">Help Wondercase Grow</h2><p>As you travel with Wondercase, tell us what delighted you, what could be simpler, and what you wish it could do. Share a thought whenever it occurs to you—even over breakfast. Your experience can help shape what comes next.</p><p className="rating-invitation">You are our travelers, explorers, storytellers—and co-creators of this new idea.</p>
  <div data-pdf-exclude>

   {ready&&(!mine||editing)&&<form onSubmit={save} className="rating-form">
    <label>Name (optional)<input value={author} onChange={e=>setAuthor(e.target.value)} maxLength={80} autoComplete="off" placeholder="Anonymous"/></label>
    <div className="survey-writing"><h3>Help us see the journey through your eyes</h3>
     <label>What made your journey easier?<textarea value={worked} onChange={e=>setWorked(e.target.value)} maxLength={1200} rows={3}/></label>
     <label>What felt confusing?<textarea value={improve} onChange={e=>setImprove(e.target.value)} maxLength={1200} rows={3}/></label>
     <label>What would you love us to add?<textarea value={wished} onChange={e=>setWished(e.target.value)} maxLength={1200} rows={3}/></label>
     <details className="rating-extras"><summary>Anything else? (optional)</summary><label>Anything else you’d like us to know?<textarea value={other} onChange={e=>setOther(e.target.value)} maxLength={1200} rows={3}/></label></details>
    </div>
    <details className="rating-extras"><summary>Add an optional overall rating</summary>    <div className="survey-rating-heading"><h3>How is the app working for you?</h3><p>Choose an overall rating from 0 to 5 stars. You can come back and update your thoughts throughout the journey.</p></div>
    {scoreQuestions.map(([key,label])=><ScoreSlider key={key} name={key} label={label} value={scores[key]} disabled={busy} onChange={value=>setScores(current=>({...current,[key]:value}))}/>)}
    </details>
    <p className="rating-ownership">Your feedback is shared with fellow travelers. You can edit or delete it using this same browser/device. Clearing browser data removes that access.</p>
    <button disabled={busy} type="submit">{busy?'Saving…':mine?'Update my thoughts':'Share my thoughts'}</button>{editing&&<button type="button" className="rating-secondary" disabled={busy} onClick={()=>setEditing(false)}>Cancel</button>}
   </form>}
   {!ready&&!message&&<p>Loading feedback…</p>}
   <p role="status">{message}</p>{mine&&!editing&&<button className="rating-return" type="button" onClick={()=>beginEdit(mine)}>Add to or update my thoughts →</button>}
   <ul className="rating-list">{entries.map(e=><li key={e.id}><div className="rating-entry-heading"><strong>{e.author}{e.isOwner?' · You':''}</strong><span className="rating-given" aria-label={`${e.scores.overall} out of 5 stars overall`}><span className="rating-small-stars" aria-hidden="true"><span>★★★★★</span><span className="rating-slider-filled" style={{width:`${e.scores.overall/5*100}%`}}>★★★★★</span></span> <small>{e.scores.overall}/5 overall</small></span></div>
    {e.worked&&<div className="rating-comment"><strong>What worked well</strong><p>{e.worked}</p></div>}{e.improve&&<div className="rating-comment"><strong>What could be improved</strong><p>{e.improve}</p></div>}{e.wished&&<div className="rating-comment"><strong>What I wished it included</strong><p>{e.wished}</p></div>}{e.other&&<div className="rating-comment"><strong>Other comments</strong><p>{e.other}</p></div>}
    {e.isOwner&&<div className="rating-owner-controls"><button disabled={busy} onClick={()=>beginEdit(e)}>Edit my feedback</button><button disabled={busy} onClick={()=>setConfirmDelete(true)}>Delete my feedback</button>{confirmDelete&&<div><p>Delete your feedback?</p><button disabled={busy} onClick={()=>void remove()}>Yes, delete</button><button disabled={busy} onClick={()=>setConfirmDelete(false)}>Keep it</button></div>}</div>}</li>)}</ul>
  </div>
 </section>;
}
