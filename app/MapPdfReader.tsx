'use client';
import {useEffect,useState} from 'react';
import type {PDFDocumentLoadingTask} from 'pdfjs-dist';
import {bookletEngine,bookletPdfOptions} from '../lib/booklet-pdf';
import {bookletPages} from '../lib/booklet-pages';
import {downloadBookletPdf} from '../lib/booklet-upload';
import {BookletReader} from './BookletViewer';
import LoadingIndicator from './LoadingIndicator';
type Meta={title:string;preview:boolean;version:string;size:number;layout:Parameters<typeof bookletPages>[1];mapUrl?:string;cover?:string|null;preparedPages?:string[]};
export default function MapPdfReader({id,title,mapUrl,cover}:{id:string;title:string;mapUrl:string;cover?:string|null}){
 const [pages,setPages]=useState<string[]>([]),[error,setError]=useState(''),[meta,setMeta]=useState<Meta|null>(null),[retry,setRetry]=useState(0),[phase,setPhase]=useState('Opening Handout…');
 useEffect(()=>{let active=true,task:PDFDocumentLoadingTask|undefined;const controller=new AbortController(),urls:string[]=[];setPages([]);setError('');setMeta(null);setPhase('Opening Handout…');let version='';
 async function metadata(){const r=await fetch(`/api/tour-resources?booklet=${encodeURIComponent(id)}`,{cache:'no-store',signal:controller.signal});if(!r.ok)throw Error('This handout is not available. Return to Maps to see the current handouts.');return await r.json() as Meta;}
 function publish(blob:Blob,index:number){if(!active)return;const url=URL.createObjectURL(blob);urls.push(url);setPages(previous=>previous.map((value,i)=>i===index?url:value));}
 async function load(){try{
  const details=await metadata();if(!active)return;version=details.version;setMeta(details);
  if(details.preparedPages?.length){
   setPages(Array(details.preparedPages.length).fill(''));setPhase('Loading Handout…');
   async function prepared(index:number){const r=await fetch(details.preparedPages![index],{cache:'no-store',signal:controller.signal});if(!r.ok)throw Error('Unable to open this handout page. Please try again.');publish(await r.blob(),index);}
   await prepared(0);let next=1;async function remaining(){while(active&&next<details.preparedPages!.length)await prepared(next++);}await Promise.all([remaining(),remaining()]);return;
  }
  setPhase('Downloading Handout…');const [bytes,engine]=await Promise.all([downloadBookletPdf(id,details.size,details.version,controller.signal),bookletEngine()]);if(!active)return;
  task=engine.getDocument({data:new Uint8Array(bytes),...bookletPdfOptions});const pdf=await task.promise;const dimensions=[];
  for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i),v=page.getViewport({scale:1});dimensions.push({width:v.width,height:v.height});}
  const logical=bookletPages(dimensions,details.layout);if(logical.length>100)throw Error('This handout is too long to open. Ask the TD for a shorter PDF.');if(!active)return;setPages(Array(logical.length).fill(''));setPhase('Preparing First Page…');
  for(const [index,logicalPage]of logical.entries()){if(!active)return;const page=await pdf.getPage(logicalPage.pdfPage),base=page.getViewport({scale:1}),width=base.width/(logicalPage.side==='full'?1:2),scale=Math.min(2,1500/width),viewport=page.getViewport({scale});const canvas=document.createElement('canvas');canvas.width=Math.ceil(width*scale);canvas.height=Math.ceil(base.height*scale);await page.render({canvas,viewport,transform:logicalPage.side==='right'?[1,0,0,1,-viewport.width/2,0]:undefined}).promise;const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Unable to display this page.')),'image/jpeg',.9));publish(blob,index);canvas.width=canvas.height=0;}
 }catch(e){if(active)setError((e as Error).message);}}
 async function check(){try{const details=await metadata();if(!active)return;if(version&&version!==details.version)setRetry(n=>n+1);else setMeta(details);}catch(e){if(active){setPages([]);setError((e as Error).message);}}}
 void load();const timer=setInterval(()=>void check(),30000);window.addEventListener('focus',check);return()=>{active=false;controller.abort();clearInterval(timer);window.removeEventListener('focus',check);void task?.destroy();urls.forEach(url=>URL.revokeObjectURL(url));};
 },[id,retry]);
 const close=()=>{window.location.href='/?tab=map';},currentTitle=meta?.title||title,currentCover=meta?.cover??cover,currentMap=meta?.mapUrl||mapUrl;
 if(error||!pages.length)return <main className="map-reader-loading"><a href="/?tab=map">← Back To Maps</a><h1>{currentTitle}</h1>{error?<><p role="alert">{error}</p><button onClick={()=>setRetry(n=>n+1)}>Try Again</button></>:<LoadingIndicator label={phase}/>}<a href={currentMap} target="_blank" rel="noopener noreferrer">Open Map ↗</a></main>;
 return <BookletReader key={`${id}-${retry}-${currentCover||''}`} booklet={{id,title:meta?.preview?`${currentTitle} · TD Preview`:currentTitle,subtitle:'',pages:currentCover?[currentCover,...pages]:pages,partial:false,returnLabel:'Maps',hasCover:!!currentCover}} mapUrl={currentMap} onClose={close}/>;
}
