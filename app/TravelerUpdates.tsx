'use client';
import {useEffect,useState} from 'react';
type Update={id:string;at:string;action:string;section:string;url:string};
function keyBytes(key:string){const padding='='.repeat((4-key.length%4)%4);const raw=atob((key+padding).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(raw,c=>c.charCodeAt(0));}
export default function TravelerUpdates(){
 const [updates,setUpdates]=useState<Update[]>([]),[open,setOpen]=useState(false),[seen,setSeen]=useState<string[]>([]),[publicKey,setPublicKey]=useState<string|null>(null),[status,setStatus]=useState('');
 useEffect(()=>{try{setSeen(JSON.parse(localStorage.getItem('kd-seen-updates')||'[]'));}catch{}},[]);
 useEffect(()=>{let alive=true;const load=async()=>{try{const response=await fetch('/api/traveler-updates',{cache:'no-store'});if(!response.ok)return;const data=await response.json();if(alive){setUpdates(data.updates||[]);setPublicKey(data.publicKey||null);}}catch{}};load();const timer=window.setInterval(load,60000);window.addEventListener('focus',load);return()=>{alive=false;window.clearInterval(timer);window.removeEventListener('focus',load);};},[]);
 function show(){setOpen(v=>!v);if(!open){const ids=updates.map(u=>u.id);setSeen(ids);localStorage.setItem('kd-seen-updates',JSON.stringify(ids));}}
 const unread=updates.filter(u=>!seen.includes(u.id)).length;
 async function enable(){
  try{
   if(!publicKey||!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window)){setStatus('Install the app on your Home Screen to enable device alerts, or check this bell for updates.');return;}
   const permission=await Notification.requestPermission();if(permission!=='granted'){setStatus('Device alerts were not enabled. Updates will still appear here.');return;}
   const registration=await navigator.serviceWorker.ready;
   const subscription=await registration.pushManager.getSubscription()||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(publicKey)});
   const response=await fetch('/api/traveler-updates',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(subscription)});
   if(!response.ok)throw new Error('Unable to save your device subscription');
   setStatus('Device alerts enabled for Xavier’s updates.');
  }catch{setStatus('Device alerts could not be enabled. You can still check this bell.');}
 }
 return <div className="updates-control"><button type="button" className="updates-bell" onClick={show} aria-label={`Xavier updates${unread?`, ${unread} unread`:''}`} aria-expanded={open}>♧<span className="updates-bell-icon" aria-hidden="true">🔔</span>{unread>0&&<b>{unread}</b>}</button>{open&&<aside className="updates-popover" aria-label="Xavier updates"><h2>Xavier’s updates</h2><p className="updates-intro">Changes to the journey and traveler information appear here.</p><button type="button" className="updates-enable" onClick={enable}>Enable device alerts</button>{status&&<p role="status">{status}</p>}<div className="updates-list">{updates.length?updates.map(u=><a key={u.id} href={u.url}><strong>{u.action}</strong><small>{u.section} · {new Date(u.at).toLocaleString()}</small></a>):<p>No updates yet.</p>}</div></aside>}</div>;
}
