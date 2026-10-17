'use client';
import {useState} from 'react';
type Flight={route:string;airline:string;time:string;detail:string;duration?:string};
type Props={date:number;dateLabel:string;title:string;events:[string,string][];note:string;flight?:Flight;hotel:string};
function element<K extends keyof HTMLElementTagNameMap>(tag:K,className='',text=''){
 const node=document.createElement(tag);node.className=className;node.textContent=text;return node;
}
export default function DayPhoto({date,dateLabel,title,events,note,flight,hotel}:Props){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function save(){
  setBusy(true);setError('');let sheet:HTMLElement|null=null;
  try{
   const [noteResponse,scheduleResponse]=await Promise.all([
    fetch(`/api/xavier-notes?day=${date}`,{cache:'no-store'}),
    fetch(`/api/journey-timeline?day=${date}`,{cache:'no-store'})
   ]);
   if(!noteResponse.ok||!scheduleResponse.ok)throw Error('Connect to the internet to include Xavier’s latest updates.');
   const [noteData,scheduleData]=await Promise.all([noteResponse.json(),scheduleResponse.json()]);
   const current=scheduleData.schedule||{events,note};
   sheet=element('div','day-photo-sheet detail-body');
   sheet.setAttribute('aria-hidden','true');
   sheet.style.cssText='position:fixed;left:-10000px;top:0;width:560px;z-index:-1;';
   const head=element('div','day-photo-heading');
   head.append(element('span','eyebrow','Vietnam, Cambodia & Thailand · 103RD TOUR'),element('strong','',`Day ${date-4}`),element('span','',dateLabel),element('h1','',title));sheet.append(head);
   const announcement=element('section',`xavier-daily-note${noteData.note?' has-note':''}`);
   const annHead=element('div','xavier-note-heading');const annTitle=element('div');annTitle.append(element('span','eyebrow','FROM YOUR TOUR DIRECTOR'),element('h2','','Xavier’s Announcements for Today'),element('p','special-notes-date',`Day ${date-4} · ${dateLabel}`));annHead.append(annTitle);announcement.append(annHead,element('p',noteData.note?'xavier-note-copy':'xavier-note-empty',noteData.note?.text||'Xavier has not posted a note for this day yet.'));sheet.append(announcement);
   const timeline=element('section','journey-timeline-panel');timeline.append(element('h2','day-photo-section-title','Today’s journey'));
   const list=element('div','timeline');
   for(const [time,activity] of current.events as [string,string][]) {const row=element('article');row.append(element('span','',time),element('p','',activity));list.append(row);}
   timeline.append(list);
   if(current.note){const reminder=element('div','note');reminder.append(element('span','eyebrow','A NOTE FOR TODAY'),element('p','',current.note));timeline.append(reminder);}
   sheet.append(timeline);
   if(flight){const panel=element('section','day-flight-panel');panel.append(element('span','eyebrow','TODAY’S INTERNAL FLIGHT'));
    const route=element('div','flight-route');route.append(element('h3','',flight.route));const meta=element('div','flight-meta');meta.append(element('strong','',flight.airline),element('span','',flight.time));route.append(meta);if(flight.duration)route.append(element('span','flight-duration',`Flight duration: ${flight.duration}`));route.append(element('p','',flight.detail));panel.append(route);sheet.append(panel);}
   const stay=element('div','detail-footer');const stayContent=element('div');stayContent.append(element('span','eyebrow','TONIGHT’S STAY'),element('strong','',hotel));stay.append(stayContent);sheet.append(stay);
   document.body.append(sheet);
   await document.fonts.ready;
   const {default:html2canvas}=await import('html2canvas');
   const canvas=await html2canvas(sheet,{backgroundColor:'#fbf8f1',scale:2,logging:false,useCORS:true,scrollX:0,scrollY:0,windowWidth:560});
   const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Could not create the photo.')),'image/png'));
   const fileName=`KD103-Day-${date-4}.png`,file=new File([blob],fileName,{type:'image/png'});
   if(navigator.share&&navigator.canShare?.({files:[file]})){
    try{await navigator.share({files:[file],title:`Day ${date-4} · ${title}`});return;}
    catch(e){if((e as DOMException).name==='AbortError')return;}
   }
   const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=fileName;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch(e){setError(e instanceof Error?e.message:'Could not create the photo.');}
  finally{sheet?.remove();setBusy(false);}
 }
 return <div className="day-photo-control"><button type="button" disabled={busy} onClick={save}>{busy?'Preparing your photo…':'Save this day as a photo'}</button>{error&&<p role="alert">{error}</p>}</div>;
}
