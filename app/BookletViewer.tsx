'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import './booklet-viewer.css';
type Booklet={id:string;title:string;subtitle:string;pages:string[];partial:boolean};
export function BookletButton({booklet}:{booklet:Booklet}){
 const [open,setOpen]=useState(false);
 return <><button className="booklet-card" onClick={()=>setOpen(true)} aria-label={`Read ${booklet.title} booklet`}><img src={booklet.pages[0]} alt={`${booklet.title} original booklet cover`} loading="lazy"/><span><strong>{booklet.title}</strong><span>{booklet.subtitle}</span><small>{booklet.partial?'Cover & back-page preview':`${booklet.pages.length} pages · Original illustrated booklet`}</small><b>Open full-screen booklet →</b></span></button>{open&&<BookletReader booklet={booklet} onClose={()=>setOpen(false)}/>}</>;
}
function BookletReader({booklet:b,onClose}:{booklet:Booklet;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),touch=useRef<{x:number;y:number}|null>(null),swiped=useRef(0);
 const [page,setPage]=useState(0),[ready,setReady]=useState(false),[controls,setControls]=useState(true),[view,setView]=useState<'read'|'pages'|'zoom'>('read'),[failed,setFailed]=useState(false),[fullscreenSupported,setFullscreenSupported]=useState(false);
 const storageKey=`wondercase-booklet-${b.id}-page`;
 const label=(i:number)=>i===0?'Cover':b.partial||i===b.pages.length-1?'Back page':`Page ${i+1}`;
 useEffect(()=>{
  const el=dialog.current!;el.showModal();setFullscreenSupported(!!el.requestFullscreen);
  const before=document.body.style.overflow;document.body.style.overflow='hidden';
  try{const n=Number(localStorage.getItem(storageKey));if(Number.isInteger(n)&&n>=0&&n<b.pages.length)setPage(n);}catch{}
  setReady(true);
  return()=>{document.body.style.overflow=before;if(document.fullscreenElement===el)void document.exitFullscreen().catch(()=>{});el.close();};
 },[storageKey,b.pages.length]);
 useEffect(()=>{if(ready)try{localStorage.setItem(storageKey,String(page));}catch{}},[page,ready,storageKey]);
 useEffect(()=>{setFailed(false);if(b.pages[page+1]){const image=new Image();image.src=b.pages[page+1];}},[page,b.pages]);
 function go(i:number){if(i>=0&&i<b.pages.length){setPage(i);setView('read');}}
 async function fullscreen(){try{if(document.fullscreenElement===dialog.current)await document.exitFullscreen();else await dialog.current?.requestFullscreen();}catch{setFullscreenSupported(false);}}
 return createPortal(<dialog ref={dialog} className={`booklet-reader ${controls||view!=='read'?'':'booklet-controls-hidden'}`} aria-label={`${b.title} booklet`} onCancel={e=>{if(view!=='read'){e.preventDefault();setView('read');}else onClose();}} onKeyDown={e=>{if(view!=='read')return;if(e.key==='ArrowRight'){e.preventDefault();go(page+1);}if(e.key==='ArrowLeft'){e.preventDefault();go(page-1);}}}>
  <header className="booklet-toolbar"><button onClick={view==='read'?onClose:()=>setView('read')}>{view==='read'?'← Handouts':'← Back to page'}</button><strong>{b.title}</strong><div>{fullscreenSupported&&<button onClick={()=>void fullscreen()} aria-label="Toggle device fullscreen">⛶</button>}<button onClick={()=>setView('pages')}>Pages</button><button onClick={()=>setView(view==='zoom'?'read':'zoom')}>{view==='zoom'?'Fit page':'＋ Zoom'}</button></div></header>
  {view==='pages'?<section className="booklet-page-chooser" aria-label="Choose a page"><h2>Inside this booklet</h2><div>{b.pages.map((src,i)=><button key={src} onClick={()=>go(i)} aria-current={i===page?'page':undefined}><img src={src} alt=""/><span>{label(i)}</span></button>)}</div></section>:view==='zoom'?<div className="booklet-zoom" tabIndex={0} aria-label="Enlarged page. Scroll to read."><img src={b.pages[page]} alt={`${b.title}, ${label(page)}, enlarged`}/></div>:<>
   {b.partial&&<p className="booklet-partial">Cover &amp; back-page preview. Chiang Mai’s inside pages need a PDF export.</p>}
   <div className="booklet-stage"><button className="booklet-arrow booklet-prev" disabled={page===0} onClick={()=>go(page-1)} aria-label="Previous page">‹</button><div className="booklet-page" role="button" tabIndex={0} aria-label="Tap to hide or show reading controls" onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setControls(c=>!c);}}} onClick={()=>{if(Date.now()<swiped.current)return;setControls(c=>!c);}} onTouchStart={e=>{swiped.current=0;touch.current=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;}} onTouchEnd={e=>{if(!touch.current)return;const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.3){swiped.current=Date.now()+400;go(page+(dx<0?1:-1));}touch.current=null;}}>
    <img src={b.pages[page]} alt={`${b.title} — ${label(page)}, original page`} draggable={false} onError={()=>setFailed(true)}/>{failed&&<p className="booklet-image-error" role="alert">This page could not load. Check your connection and reopen the booklet.</p>}
   </div><button className="booklet-arrow booklet-next" disabled={page===b.pages.length-1} onClick={()=>go(page+1)} aria-label="Next page">›</button></div>
   <footer className="booklet-reader-footer"><span aria-live="polite">{label(page)} · {page+1} of {b.pages.length}{b.partial?' available':''}</span><div>{b.pages.map((_,i)=><button key={i} aria-label={`Go to ${label(i)}`} aria-current={i===page?'page':undefined} onClick={()=>go(i)}/>)}</div><small>Swipe to turn · Tap page to hide controls</small></footer>
  </>}
 </dialog>,document.body);
}
