'use client';
import {useEffect,useState} from 'react';
const storageKey='wondercase-safe-invite';
export default function SafeInvitation({email,onConnected}:{email:string|null;onConnected:()=>Promise<void>}){
 const [token,setToken]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{const capture=()=>{const hash=new URLSearchParams(location.hash.slice(1)),incoming=hash.get('safe_invite');if(incoming){if(/^[-_A-Za-z0-9]{43}$/.test(incoming))sessionStorage.setItem(storageKey,incoming);history.replaceState(null,'',location.pathname+location.search);}setToken(sessionStorage.getItem(storageKey)||'');};capture();window.addEventListener('hashchange',capture);return()=>window.removeEventListener('hashchange',capture);},[]);
 async function claim(){setBusy(true);setMessage('');try{const r=await fetch('/api/safe-invitations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim',token})}),b=await r.json();if(!r.ok)throw Error(b.error);sessionStorage.removeItem(storageKey);setToken('');await onConnected();}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 if(!token)return null;
 return <section className="safe-card" aria-label="Private Safe invitation"><h2>Your private Safe invitation</h2><p>{email?`Connect ${email} to the Safe in this invitation. Only continue if this link was given privately to you for your own Safe.`:'Sign in or create an account below with your preferred email, or use Google. Then connect your account here. Keep this link private.'}</p>{email&&<button disabled={busy} onClick={()=>void claim()}>{busy?'Connecting…':'Connect my Safe'}</button>}<button disabled={busy} onClick={()=>{sessionStorage.removeItem(storageKey);setToken('');}}>Dismiss invitation</button><p role="status">{message}</p></section>;
}
