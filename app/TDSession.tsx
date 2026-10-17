"use client";
import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from 'react';
import LoadingIndicator from './LoadingIndicator';
type Session={masterAdmin:boolean;authenticated:boolean;configured:boolean|null;refresh:()=>Promise<void>};
const TDContext=createContext<Session>({masterAdmin:false,authenticated:false,configured:null,refresh:async()=>{}});
export function useTDSession(){return useContext(TDContext);}
export function TDProvider({children}:{children:ReactNode}){
 const [masterAdmin,setMasterAdmin]=useState(false);
 const [authenticated,setAuthenticated]=useState(false),[configured,setConfigured]=useState<boolean|null>(null);
 const refresh=useCallback(async()=>{try{const r=await fetch('/api/td-session',{cache:'no-store'});if(!r.ok)throw Error();let s=await r.json();if(s.needsRefresh){const result=await fetch('/api/td-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh:true})});if(result.ok){const fresh=await fetch('/api/td-session',{cache:'no-store'});if(fresh.ok)s=await fresh.json();}}setAuthenticated(s.authenticated===true);setMasterAdmin(s.masterAdmin===true);setConfigured(s.configured===true);}catch{setAuthenticated(false);setMasterAdmin(false);}},[]);
 useEffect(()=>{void refresh();const focus=()=>{void refresh();};window.addEventListener('focus',focus);const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('kd-td-session'):null;if(channel)channel.onmessage=focus;const timer=window.setInterval(focus,60000);return()=>{window.removeEventListener('focus',focus);window.clearInterval(timer);channel?.close();};},[refresh]);
 return <TDContext.Provider value={{masterAdmin,authenticated,configured,refresh}}>{children}</TDContext.Provider>;
}
export function TDLogin({open,onClose,onSignedIn}:{open:boolean;onClose:()=>void;onSignedIn?:()=>void}){
 const {masterAdmin,authenticated,configured,refresh}=useTDSession();
 const [password,setPassword]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{if(!open){setPassword('');setMessage('');}},[open]);
 async function action(signOut=false){
  setBusy(true);setMessage('');
  try{const r=await fetch('/api/td-session',{method:signOut?'DELETE':'POST',headers:{'Content-Type':'application/json'},body:signOut?undefined:JSON.stringify({password})});const data=await r.json();if(!r.ok)throw Error(data.error||'Unable to sign in.');setPassword('');await refresh();if(!signOut&&onSignedIn)onSignedIn();else onClose();if(typeof BroadcastChannel!=='undefined'){const channel=new BroadcastChannel('kd-td-session');channel.postMessage('changed');channel.close();}}
  catch(e){setMessage(e instanceof Error?e.message:'Please try again.');setPassword('');}finally{setBusy(false);}
 }
 if(!authenticated&&!open)return null;
 return <div className="td-access" data-pdf-exclude>
 {authenticated?<div className="td-status"><span>{masterAdmin?'Master admin · Marcela signed in':'TD access · Xavier signed in'}</span><button type="button" disabled={busy} onClick={()=>void action(true)}>Sign out</button></div>:null}
 {open&&!authenticated&&<form className="td-login-form" onSubmit={e=>{e.preventDefault();void action();}}>
 <p>Sign in once to manage announcements, schedules, guides and menus throughout the app.</p>
 {configured===false&&<p className="td-setup-note">No TD password is configured for this deployment. Your master admin can set one in Master admin → Reset tour director password.</p>}
 <label>TD password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required maxLength={200}/></label>
 <div><button type="submit" disabled={busy||configured!==true}>{busy?<LoadingIndicator label="Signing in…"/>:'Sign in'}</button><button type="button" onClick={()=>{onClose();setPassword('');}}>Cancel</button></div>
 </form>}
 {message&&<p role="status">{message}</p>}
 </div>;
}
