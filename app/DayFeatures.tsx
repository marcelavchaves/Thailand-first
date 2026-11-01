'use client';
import {createContext,useContext,useCallback,useEffect,useState,type ReactNode} from 'react';
import {useTDSession} from './TDSession';
import {hiddenDayFeatures,type DayFeature,type DayFeatures} from '../lib/day-features';
type RecordValue={features:DayFeatures;revision:string|null};
const Context=createContext({days:{} as Record<string,RecordValue>,loaded:false,error:'',reload:async()=>{}});
export function DayFeaturesProvider({children}:{children:ReactNode}){
 const {authenticated}=useTDSession();const [days,setDays]=useState<Record<string,RecordValue>>({}),[loaded,setLoaded]=useState(false),[error,setError]=useState('');
 const reload=useCallback(async()=>{try{const r=await fetch('/api/day-features',{cache:'no-store'}),body=await r.json();if(!r.ok||!body.days||Array.isArray(body.days))throw Error();setDays(body.days);setLoaded(true);setError('');}catch{setDays({});setLoaded(false);setError('Connect to load day options. Optional features stay hidden until checked.');}},[]);
 useEffect(()=>{void reload();const refresh=()=>void reload();window.addEventListener('focus',refresh);const timer=setInterval(refresh,30000);return()=>{window.removeEventListener('focus',refresh);clearInterval(timer);};},[reload,authenticated]);
 return <Context.Provider value={{days,loaded,error,reload}}>{children}</Context.Provider>;
}
export function useDayFeatures(){const value=useContext(Context);return {...value,forDay:(day:number)=>value.days[day]?.features||hiddenDayFeatures()};}
export function DayOptions({day}:{day:number}){
 const {days,loaded,error,reload}=useDayFeatures();const {authenticated}=useTDSession();const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>setMessage(''),[day]);
 const features=days[day]?.features||hiddenDayFeatures();
 async function change(key:DayFeature,value:boolean){setBusy(true);setMessage('');try{const r=await fetch('/api/day-features',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({day,features:{...features,[key]:value},revision:days[day]?.revision||null})}),body=await r.json();if(!r.ok)throw Error(body.error||'Unable to save day options.');await reload();setMessage('Day options saved.');}catch(e){setMessage(e instanceof Error?e.message:'Unable to save.');await reload();}finally{setBusy(false);}}
 if(!authenticated)return null;
 return <section className="td-day-options"><h2>Show on Day {day-4}</h2><p>All options start hidden. Save an announcement below before showing it. These settings apply only to this day.</p><fieldset disabled={!loaded||busy}>{([['announcement','TD announcement'],['memories','Memories'],['trivia','Trivia'],['language','Language lessons']] as [DayFeature,string][]).map(([key,label])=><label key={key}><input type="checkbox" checked={features[key]} onChange={e=>void change(key,e.target.checked)}/><span>{label}</span><small>{features[key]?'Shown':'Hidden'}</small></label>)}</fieldset><p role="status">{message||error}</p>{error&&<button type="button" disabled={busy} onClick={()=>void reload()}>Reload day options</button>}</section>;
}
