'use client';
import {createContext,useContext,useEffect,useState,useCallback,type ReactNode} from 'react';
import {useTDSession} from './TDSession';
import BrandIcon from './BrandIcon';
import {uploadBooklet} from '../lib/booklet-upload';
import {BOOKLET_MAX_BYTES,type BookletLayout} from '../lib/booklet-pages';
import {validateBookletPdf} from '../lib/booklet-pdf';
type Entry={id:string;title:string;group:string;visible:boolean;deleted?:boolean;file?:boolean;revision?:string|null;booklet?:boolean;bookletLayout?:BookletLayout;type?:string|null};
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
 async function change(action:string,file?:File,layout?:BookletLayout){setBusy(true);setMessage('');try{
  const uploadTitle=file&&(!item?.title||item.title==='New document')?(file.name.replace(/\.[^.]+$/,'').slice(0,120)||'New booklet'):(item?.title||title);
  if(action==='upload'&&file&&group==='handouts'&&(file.type==='application/pdf'||/\.pdf$/i.test(file.name))){
   if(file.size>BOOKLET_MAX_BYTES)throw Error('Choose a booklet PDF of 5 MB or less.');setMessage('Preparing your booklet…');await validateBookletPdf(await file.arrayBuffer());
   await uploadBooklet(file,{id,title:uploadTitle,group,revision:item?.revision||null},setMessage);await reload();setMessage('Booklet created and hidden. Preview it, then show it to travelers.');return;
  }
  let upload:undefined|{data:string;type:string};if(file){if(file.size>3*1024*1024)throw Error('Choose a document or image smaller than 3 MB.');const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Unable to read this file.'));reader.readAsDataURL(file);});upload={data,type:file.type};}
  if(action==='booklet'){setMessage('Preparing your booklet…');const source=await fetch(`/api/tour-resources?file=${encodeURIComponent(id)}`,{cache:'no-store'});if(!source.ok)throw Error('Unable to open this PDF. Reload and try again.');await validateBookletPdf(await source.arrayBuffer());}
  const r=await fetch('/api/tour-resources',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,title:action==='rename'?name:uploadTitle,group,action,revision:item?.revision||null,upload,layout})});const d=await r.json();if(r.status===401)await refresh();if(!r.ok)throw Error(d.error||'Unable to save.');await reload();setMessage(action==='upload'?(group==='handouts'&&upload?.type==='application/pdf'?'Booklet created and hidden. Preview it, then show it to travelers.':'Uploaded and hidden. Preview, then reveal when ready.'):action==='booklet'?'Booklet created and hidden. Preview it, then show it to travelers.':'Saved.');setEditing(false);
 }catch(e){setMessage(e instanceof Error?e.message:'Unable to save.');}finally{setBusy(false);}}
 if(item?.deleted&&!authenticated)return null;
 const visible=loaded&&item?.visible&&!item.deleted;
 const content=item?.booklet&&item.file?<a className="button" href={`/booklet?id=${encodeURIComponent(id)}`} target="_blank" rel="noopener noreferrer">Read booklet ↗</a>:item?.file?<a className="button" href={`/api/tour-resources?file=${encodeURIComponent(id)}`} target="_blank" rel="noreferrer">Open {item.title || title} ↗</a>:children;
 return <section className="release-card" aria-label={displayTitle}>
 {group!=='schedules'&&<div className="release-heading"><BrandIcon name={icon}/><div><h3>{displayTitle}</h3>{!visible&&<p className="release-soon">{item?.deleted?'Removed':'Coming soon'}</p>}</div></div>}
 {!visible&&!authenticated&&<p className="release-caption">{error||caption}</p>}
 {visible&&content}
 {authenticated&&<div className="release-controls" data-pdf-exclude><p>{visible?'Visible to travelers':item?.deleted?'Deleted — hidden from travelers':'Hidden from travelers'}</p><fieldset disabled={busy||!loaded}>
 {!item?.deleted&&<><button type="button" onClick={()=>void change(visible?'hide':'reveal')}>{visible?(item?.booklet?'Hide booklet':'Hide'):(item?.booklet?'Show booklet to travelers':'Reveal to travelers')}</button>{group==='handouts'&&item?.file&&item.type==='application/pdf'&&!item.booklet&&<button type="button" onClick={()=>void change('booklet')}>Make interactive booklet</button>}<button type="button" onClick={()=>setPreview(!preview)}>{preview?'Close preview':'Preview / edit'}</button><button type="button" onClick={()=>{setName(item?.title||title);setEditing(!editing);}}>Update title</button>{group!=='schedules'&&<label className="upload-resource">Upload replacement<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f)void change('upload',f);e.target.value='';}}/></label>}<button type="button" onClick={()=>{if(confirm(`Delete ${item?.title||title}? It will be hidden from travelers.`))void change('delete');}}>Delete</button></>}
 {item?.deleted&&<button type="button" onClick={()=>void change('restore')}>Restore as hidden</button>}
 {item?.booklet&&!item.deleted&&<label>Booklet page layout<select value={item.bookletLayout||'auto'} onChange={e=>void change('booklet-layout',undefined,e.target.value as BookletLayout)}><option value="auto">Automatic · split wide two-page sheets</option><option value="single">One complete PDF page per turn</option><option value="spread">Split sheets · left page then right page</option><option value="spread-reversed">Split sheets · right page then left page</option></select><small>Changing the layout hides the booklet for a new preview.</small></label>}
 {editing&&<form onSubmit={e=>{e.preventDefault();void change('rename');}}><label>Title<input required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label><button>Save title</button></form>}
 </fieldset>{group==='handouts'&&<p>PDF booklets up to 5 MB support swiping and zoom. Wide two-page sheets are split automatically. New and replacement booklets stay hidden until you show them.</p>}{!visible&&preview&&!item?.deleted&&<div className="resource-preview"><small>TD preview · hidden from travelers</small>{content||<p>Upload a document to add content.</p>}</div>}{message&&<p role="status">{message}</p>}{error&&<p role="alert">{error}</p>}</div>}
 </section>;
}
export function ResourceGroup({group}:{group:string}){
 const {items}=useResources();const {authenticated}=useTDSession();const [newId,setNewId]=useState('');
 return <>{Object.values(items).filter(x=>x.group===group&&x.id.startsWith('custom-')&&(authenticated||!x.booklet||x.visible&&!x.deleted)).map(x=><ResourceSlot key={x.id} id={x.id} title={x.title} group={group}/>)}{authenticated&&<><button className="add-resource" onClick={()=>setNewId('custom-'+crypto.randomUUID())}>{group==='handouts'?'＋ Add handout / booklet':'＋ Add a document'}</button>{newId&&!items[newId]&&<ResourceSlot id={newId} title="New document" group={group}/>}</>}</>;
}

export function Handouts(){const {items,loaded,error}=useResources();const {authenticated}=useTDSession();const entries=Object.values(items).filter(x=>x.group==='handouts'&&!x.deleted&&(authenticated||x.visible));return <>{!loaded&&<p>{error||'Checking handouts…'}</p>}<ResourceGroup group="handouts"/></>;}
