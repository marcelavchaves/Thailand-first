'use client';
import './offline-book.css';
import {useCallback,useEffect,useState} from 'react';
export function useOfflineSnapshotSettings(){
 const [data,setData]=useState<{visible:boolean;revision:string|null}|null>(null),[error,setError]=useState('');
 const reload=useCallback(async()=>{try{const r=await fetch('/api/offline-snapshot-settings',{cache:'no-store'});if(!r.ok)throw Error('Connect to check snapshot availability.');setData(await r.json());setError('');}catch(e){setError((e as Error).message);}},[]);
 useEffect(()=>{void reload();const check=()=>void reload();window.addEventListener('focus',check);window.addEventListener('snapshot-settings-changed',check);const timer=setInterval(check,30000);return()=>{clearInterval(timer);window.removeEventListener('focus',check);window.removeEventListener('snapshot-settings-changed',check);};},[reload]);
 return {data,error,reload};
}
export default function OfflineSnapshotSettings(){
 const {data,error,reload}=useOfflineSnapshotSettings(),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function toggle(){if(!data)return;setBusy(true);setMessage('');try{const r=await fetch('/api/offline-snapshot-settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({visible:!data.visible,revision:data.revision})}),body=await r.json();if(!r.ok)throw Error(body.error);await reload();window.dispatchEvent(new Event('snapshot-settings-changed'));setMessage(body.visible?'Offline Snapshot is shown to travelers.':'Offline Snapshot is hidden from travelers.');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 return <section className="release-card snapshot-visibility-card"><h2>Offline Snapshot</h2><p>Travelers can save the journey, announcements, hotel and flight information, and guest photo tiles for offline reading. Maps, handouts and gallery are excluded.</p><p className="snapshot-visibility-status">{data?data.visible?'Shown To Travelers':'Hidden From Travelers':error||'Checking availability…'}</p><div className="snapshot-visibility-actions"><button className="snapshot-visibility-toggle" disabled={!data||busy} onClick={()=>void toggle()}>{data?.visible?'Hide Offline Snapshot':'Show Offline Snapshot'}</button><button className="snapshot-visibility-refresh" onClick={()=>void reload()}>Refresh Status</button></div><p>Hiding removes the option from More and stops new traveler downloads. Copies already saved on a device remain available.</p><a href="/offline-reader">Preview Offline Reader</a>{message&&<p role="status">{message}</p>}</section>;
}
