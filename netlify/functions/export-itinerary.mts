import type {Config} from '@netlify/functions';
import {loadCurrentContent,currentItinerary} from '../lib/current-itinerary';
import {renderExport} from '../../scripts/render-export.mjs';
export default async function handler(req:Request){
 if(req.method!=='GET')return new Response('Method not allowed',{status:405});
 const u=new URL(req.url),section=u.searchParams.get('section')||'days';
 const raw=u.searchParams.getAll('day');const days=[...new Set(raw.map(Number))].sort((a,b)=>a-b);
 if(!['days','hotels','guides','full'].includes(section)||section==='days'&&(!days.length||raw.length>14||days.some(d=>!Number.isInteger(d)||d<1||d>14)))return new Response('Choose one or more days from 1 to 14.',{status:400});
 try{let bytes:Uint8Array;if(section==='full')bytes=(await currentItinerary()).bytes;else{const {content,root,snapshot}=await loadCurrentContent();bytes=await renderExport(content,{root,baseUrl:snapshot.baseUrl,section,days});}
 const name=section==='days'?'Days-'+days.join('-'):section;
 return new Response(new Blob([Uint8Array.from(bytes).buffer]).stream(),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="KD-101-${name}.pdf"`,'Cache-Control':'no-store'}});
 }catch{return new Response('Unable to create the PDF. Please return to the app and try again.',{status:503,headers:{'Cache-Control':'no-store'}});}
}
export const config:Config={path:'/api/export-itinerary'};
