'use client';
import {createContext,useContext,useEffect,useState,useCallback,type ReactNode} from 'react';
import {useTDSession} from './TDSession';
import BrandIcon from './BrandIcon';
type Entry={id:string;title:string;group:string;visible:boolean;deleted?:boolean;file?:boolean;revision?:string|null};
type State={items:Record<string,Entry>;loaded:boolean;error:string;reload:()=>Promise<void>};
const Context=createContext<State>({items:{},loaded:false,error:'',reload:async()=>{}});
export function useResources(){return useContext(Context);}
export function ResourceProvider({children}:{children:ReactNode}){
 const {authenticated}=useTDSession();const [items,setItems]=useState<Record<string,Entry>>({}),[loaded,setLoaded]=useState(false),[error,setError]=useState('');
 const reload=useCallback(async()=>{try{const r=await fetch('/api/tour-resources',{cache:'no-store'});if(!r.ok)throw Error();const d=await r.json();setItems(d.items);setLoaded(true);setError('');}catch{setItems({});setLoaded(false);setError('Connect to check the latest releases.');}},[]);
 useEffect(()=>{void reload();const focus=()=>void reload();window.addEventListener('focus',focus);const t=setInterval(focus,30000);return()=>{clearInterval(t);window.removeEventListener('focus',focus);};},[reload,authenticated]);
 return <Context.Provider value={{items,loaded,error,reload}}>{children}</Context.Provider>;
}
export function ResourceSlot({id,title,group='guides',children,icon='book',caption='Xavier will share this when it’s ready.'}:{id:string;title:string;group?:string;children?:ReactNode;icon?:string;caption?:string}){
 const {items,loaded,error,reload}=useResources();const {authenticated,refresh}=useTDSession();const item=items[id];
 const displayTitle=(item?.title||title).replace(/^Today[’']s schedule$/, 'Schedule');
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[preview,setPreview]=useState(false),[editing,setEditing]=useState(false),[name,setName]=useState(title);
 async function change(action:string,file?:File){setBusy(true);setMessage('');try{
  let upload:undefined|{data:string;type:string};if(file){if(file.size>3*1024*1024)throw Error('Choose a PDF or image smaller than 3 MB.');const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Unable to read this file.'));reader.readAsDataURL(file);});upload={data,type:file.type};}
  const r=await fetch('/api/tour-resources',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,title:action==='rename'?name:(item?.title||title),group,action,revision:item?.revision||null,upload})});const d=await r.json();if(r.status===401)await refresh();if(!r.ok)throw Error(d.error||'Unable to save.');await reload();setMessage(action==='upload'?'Uploaded and hidden. Preview, then reveal when ready.':'Saved.');setEditing(false);
 }catch(e){setMessage(e instanceof Error?e.message:'Unable to save.');}finally{setBusy(false);}}
 if(item?.deleted&&!authenticated)return null;
 const visible=loaded&&item?.visible&&!item.deleted;
 const content=item?.file?<a className="button" href={`/api/tour-resources?file=${encodeURIComponent(id)}`} target="_blank" rel="noreferrer">Open {item.title || title} ↗</a>:children;
 return <section className="release-card" aria-label={displayTitle}>
 <div className="release-heading"><BrandIcon name={icon}/><div><h3>{displayTitle}</h3>{!visible&&<p className="release-soon">{item?.deleted?'Removed':'Coming soon'}</p>}</div></div>
 {!visible&&!authenticated&&<p className="release-caption">{error||caption}</p>}
 {visible&&content}
 {authenticated&&<div className="release-controls" data-pdf-exclude><p>{visible?'Visible to travelers':item?.deleted?'Deleted — hidden from travelers':'Hidden from travelers'}</p><fieldset disabled={busy||!loaded}>
 {!item?.deleted&&<><button type="button" onClick={()=>void change(visible?'hide':'reveal')}>{visible?'Hide':'Reveal to travelers'}</button><button type="button" onClick={()=>setPreview(!preview)}>{preview?'Close preview':'Preview / edit'}</button><button type="button" onClick={()=>{setName(item?.title||title);setEditing(!editing);}}>Update title</button>{group!=='schedules'&&<label className="upload-resource">Upload replacement<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f)void change('upload',f);e.target.value='';}}/></label>}<button type="button" onClick={()=>{if(confirm(`Delete ${item?.title||title}? It will be hidden from travelers.`))void change('delete');}}>Delete</button></>}
 {item?.deleted&&<button type="button" onClick={()=>void change('restore')}>Restore as hidden</button>}
 {editing&&<form onSubmit={e=>{e.preventDefault();void change('rename');}}><label>Title<input required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label><button>Save title</button></form>}
 </fieldset>{!visible&&preview&&!item?.deleted&&<div className="resource-preview"><small>TD preview · hidden from travelers</small>{content||<p>Upload a document to add content.</p>}</div>}{message&&<p role="status">{message}</p>}{error&&<p role="alert">{error}</p>}</div>}
 </section>;
}
export function ResourceGroup({group}:{group:string}){
 const {items}=useResources();const {authenticated}=useTDSession();const [newId,setNewId]=useState('');
 return <>{Object.values(items).filter(x=>x.group===group&&x.id.startsWith('custom-')).map(x=><ResourceSlot key={x.id} id={x.id} title={x.title} group={group}/>)}{authenticated&&<><button className="add-resource" onClick={()=>setNewId('custom-'+crypto.randomUUID())}>＋ Add a document</button>{newId&&!items[newId]&&<ResourceSlot id={newId} title="New document" group={group}/>}</>}</>;
}

export function Handouts(){const {items,loaded,error}=useResources();const {authenticated}=useTDSession();const entries=Object.values(items).filter(x=>x.group==='handouts'&&!x.deleted&&(authenticated||x.visible));return <>{loaded&&!entries.length&&<p>No handouts yet. Your tour director will add them as needed.</p>}{!loaded&&<p>{error||'Checking handouts…'}</p>}<ResourceGroup group="handouts"/></>;}
