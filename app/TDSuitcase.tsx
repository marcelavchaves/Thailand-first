'use client';
import {useState,type ReactNode} from 'react';
import {TDLogin,useTDSession} from './TDSession';
import {ResourceSlot,ResourceGroup,useResources} from './ResourceLibrary';
import JourneyTimeline from './JourneyTimeline';
import useXavierPhoto from './useXavierPhoto';
import './td-suitcase.css';
import WondercaseMark from './WondercaseMark';
import GuestProfiles from './GuestProfiles';

type Day={date:number;title:string;events:[string,string][];note:string};
export type SuitcaseResource={id:string;title:string;group:string;content:ReactNode};
export default function TDSuitcase({days,dateLabel,announcement,resources,groups,onBack}:{days:Day[];dateLabel:(day:number)=>string;announcement:(day:number)=>ReactNode;resources:SuitcaseResource[];groups:{id:string;title:string}[];onBack:()=>void}){
 const {masterAdmin,authenticated,configured,refresh}=useTDSession();
 const [section,setSection]=useState('announcements'),[dayId,setDayId]=useState(days[0].date),[group,setGroup]=useState('handouts');
 const day=days.find(d=>d.date===dayId)!;
 const {items,loaded,error,reload}=useResources();
 return <section className="td-suitcase section">
  <button className="td-back" onClick={onBack}>← Back to the journey</button>
  <header className="td-suitcase-heading"><WondercaseMark/><div><span className="eyebrow">WONDERCASE · K&D103</span><h1>TD Suitcase</h1><p>{authenticated?(masterAdmin?'Marcela · Master admin':'Xavier’s tour workspace'):'Tour director sign-in'}</p></div></header>
  {!authenticated?<div className="td-locked"><h2>Everything for your tour, in one place.</h2><p>Sign in to share announcements, adjust each day’s schedule and prepare documents for your travelers.</p><TDLogin open onClose={onBack} onSignedIn={()=>{}}/>{configured===null&&<button onClick={()=>void refresh()}>Check connection</button>}</div>:<>
   <TDLogin open={false} onClose={()=>{}}/>
   <nav className="td-workspace-nav" aria-label="TD Suitcase sections">{[['announcements','Announcements'],['schedule','Daily schedule'],['documents','Documents & menus'],['travelers','Travelers'],['account','My account']].map(([id,title])=><button key={id} aria-pressed={section===id} onClick={()=>setSection(id)}>{title}</button>)}</nav>
   {(section==='announcements'||section==='schedule')&&<label className="td-day-picker">Journey day<select value={dayId} onChange={e=>setDayId(Number(e.target.value))}>{days.map((d,i)=><option key={d.date} value={d.date}>Day {i+1} · {dateLabel(d.date)} · {d.title}</option>)}</select></label>}
   {section==='announcements'&&<div key={`note-${dayId}`}><p className="td-hint">Post an announcement for the selected day. Once saved, you can share it through WhatsApp.</p>{announcement(dayId)}</div>}
   {section==='schedule'&&<div key={`schedule-${dayId}`}><ResourceSlot id={`schedule-${dayId}`} title={`Day ${days.indexOf(day)+1} schedule`} group="schedules" icon="calendar"/><JourneyTimeline day={dayId} dateLabel={dateLabel(dayId)} events={day.events} note={day.note}/></div>}
   {section==='documents'&&<div><h2>Documents &amp; menus</h2><p className="td-hint">Upload PDFs or images up to 3 MB. New uploads stay hidden until you reveal them. Add handouts as needed; this collection starts empty. Revealed documents appear in Essentials under the matching collection or hotel; the Maps collection appears in the Map tab.</p><label className="td-day-picker">Collection<select value={group} onChange={e=>setGroup(e.target.value)}>{groups.map(g=><option key={g.id} value={g.id}>{g.title}</option>)}</select></label>{error&&<p role="alert">{error} <button onClick={()=>void reload()}>Try again</button></p>}{loaded&&<p className="td-hint">{Object.values(items).filter(i=>i.group===group&&i.visible&&!i.deleted).length} released in this collection</p>}{resources.filter(r=>r.group===group).map(r=><ResourceSlot key={r.id} id={r.id} title={r.title} group={r.group}>{r.content}</ResourceSlot>)}<ResourceGroup key={group} group={group}/></div>}
   {section==='travelers'&&<div><h2>Traveler profiles</h2><GuestProfiles directorMode/></div>}
   {section==='account'&&(masterAdmin?<div><h2>Master admin</h2><p>Manage your account and reset Xavier’s password from your admin workspace.</p><a href="/master-admin">Open master-admin workspace →</a></div>:<TDAccount/>)}
  </>}
 </section>;
}
function TDAccount(){
 const {refresh}=useTDSession();const portrait=useXavierPhoto();
 const [current,setCurrent]=useState(''),[next,setNext]=useState(''),[confirmPassword,setConfirm]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function save(e:React.FormEvent){e.preventDefault();setMessage('');if(next!==confirmPassword){setMessage('The new passwords do not match.');return;}setBusy(true);try{const response=await fetch('/api/td-password',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword:current,newPassword:next})});const data=await response.json();if(!response.ok)throw Error(data.error||'Unable to update your password.');setCurrent('');setNext('');setConfirm('');await refresh();setMessage('Password updated. Use your new password the next time you sign in.');if(typeof BroadcastChannel!=='undefined'){const channel=new BroadcastChannel('kd-td-session');channel.postMessage('changed');channel.close();}}catch(e){setMessage(e instanceof Error?e.message:'Unable to update your password.');}finally{setBusy(false);}}
 return <div className="td-account"><h2>My account</h2><p>Xavier Brunelle · Tour director · KD103</p><section><h3>Profile photo</h3>{portrait.photo&&<img className="td-profile-photo" src={portrait.photo} alt="Xavier Brunelle"/>}<label>Choose photo<input type="file" accept="image/jpeg,image/png,image/webp" disabled={!portrait.loaded||portrait.busy} onChange={e=>{const file=e.target.files?.[0];if(file)void portrait.save(file);e.target.value='';}}/></label>{portrait.photo&&<button disabled={portrait.busy} onClick={()=>{if(confirm('Remove your profile photo?'))void portrait.save(null);}}>Remove photo</button>}<p role="status">{portrait.message}</p></section><form onSubmit={save}><h3>Change password</h3><p>Use at least 12 characters. You’ll need your current password.</p><fieldset disabled={busy}><label>Current password<input type="password" autoComplete="current-password" required maxLength={200} value={current} onChange={e=>setCurrent(e.target.value)}/></label><label>New password<input type="password" autoComplete="new-password" required minLength={12} maxLength={200} value={next} onChange={e=>setNext(e.target.value)}/></label><label>Confirm new password<input type="password" autoComplete="new-password" required minLength={12} maxLength={200} value={confirmPassword} onChange={e=>setConfirm(e.target.value)}/></label><button type="submit">{busy?'Updating password…':'Update password'}</button></fieldset><p role="status">{message}</p></form></div>;
}
