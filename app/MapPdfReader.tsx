'use client';
import {useEffect,useState} from 'react';
import type {PDFDocumentLoadingTask} from 'pdfjs-dist';
import {bookletEngine,bookletPdfOptions} from '../lib/booklet-pdf';
import {bookletPages} from '../lib/booklet-pages';
import {downloadBookletPdf} from '../lib/booklet-upload';
import {BookletReader} from './BookletViewer';
export default function MapPdfReader({id,title,mapUrl,cover}:{id:string;title:string;mapUrl:string;cover?:string|null}){
 const [pages,setPages]=useState<string[]>([]),[error,setError]=useState(''),[preview,setPreview]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true,task:PDFDocumentLoadingTask|undefined;const controller=new AbortController(),urls:string[]=[];setPages([]);setError('');let version='';
 async function metadata(){const r=await fetch(`/api/tour-resources?booklet=${encodeURIComponent(id)}`,{cache:'no-store',signal:controller.signal});if(!r.ok)throw Error('This handout is not available. Return to Maps to see the current handouts.');return r.json();}
 async function load(){try{const details=await metadata();version=details.version;setPreview(details.preview);const bytes=await downloadBookletPdf(id,details.size,details.version,controller.signal),engine=await bookletEngine();if(!active)return;task=engine.getDocument({data:new Uint8Array(bytes),...bookletPdfOptions});const pdf=await task.promise;const dimensions=[];for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i),v=page.getViewport({scale:1});dimensions.push({width:v.width,height:v.height});}const logical=bookletPages(dimensions,details.layout);if(logical.length>100)throw Error('This handout is too long to open. Ask the TD for a shorter PDF.');
 for(const logicalPage of logical){if(!active)return;const page=await pdf.getPage(logicalPage.pdfPage),base=page.getViewport({scale:1}),width=base.width/(logicalPage.side==='full'?1:2),scale=Math.min(2,1500/width),viewport=page.getViewport({scale});const canvas=document.createElement('canvas');canvas.width=Math.ceil(width*scale);canvas.height=Math.ceil(base.height*scale);await page.render({canvas,viewport,transform:logicalPage.side==='right'?[1,0,0,1,-viewport.width/2,0]:undefined}).promise;const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Unable to display this page.')),'image/jpeg',.9));urls.push(URL.createObjectURL(blob));canvas.width=canvas.height=0;}
 if(active)setPages([...urls]);
 }catch(e){if(active)setError((e as Error).message);}}
 async function check(){try{const details=await metadata();if(active&&version&&version!==details.version)setRetry(n=>n+1);}catch(e){if(active){setPages([]);setError((e as Error).message);}}}
 void load();const timer=setInterval(()=>void check(),30000);window.addEventListener('focus',check);return()=>{active=false;controller.abort();clearInterval(timer);window.removeEventListener('focus',check);void task?.destroy();urls.forEach(url=>URL.revokeObjectURL(url));};
 },[id,retry]);
 const close=()=>{window.location.href='/?tab=map';};
 if(!pages.length)return <main className="map-reader-loading"><a href="/?tab=map">← Back To Maps</a><h1>{title}</h1>{error?<><p role="alert">{error}</p><button onClick={()=>setRetry(n=>n+1)}>Try Again</button></>:<p role="status">Opening Handout…</p>}<a href={mapUrl} target="_blank" rel="noopener noreferrer">Open Map ↗</a></main>;
 return <BookletReader key={`${id}-${retry}-${cover||''}`} booklet={{id,title:preview?`${title} · TD Preview`:title,subtitle:'',pages:cover?[cover,...pages]:pages,partial:false,returnLabel:'Maps',hasCover:!!cover}} mapUrl={mapUrl} onClose={close}/>;
}
