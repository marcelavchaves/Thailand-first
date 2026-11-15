import type {Config} from '@netlify/functions';
import {getStore} from '@netlify/blobs';
import {loadCurrentContent} from '../lib/current-itinerary';
import {dayFeatures} from '../lib/day-features';
import {renderOfflineSnapshot} from '../lib/offline-snapshot-pdf.mjs';
import {cityMaps,preferredCityMap} from '../../app/city-maps';
import languages from '../../app/language-lessons.json';
import trivia from '../../app/tour-trivia.json';
export default async function handler(request:Request){
 if(request.method!=='GET')return new Response('Method not allowed',{status:405});
 try{
  const downloadedAt=new Date().toISOString();const {content,root}=await loadCurrentContent();
  const notes=getStore({name:'xavier-daily-notes',consistency:'strong'});
  const announcements=Object.fromEntries(await Promise.all(content.data.days.map(async(d:{date:number})=>[d.date,(await dayFeatures(d.date)).announcement?await notes.get('day/'+d.date,{type:'json'}):null])));
  const store=getStore({name:'tour-resources',consistency:'strong'});const listing=await store.list({prefix:'entry/'});
  const entries:Record<string,{visible:boolean;deleted?:boolean;blob?:string;group?:string;title:string}>=Object.fromEntries(await Promise.all(listing.blobs.map(async b=>[b.key.slice(6),await store.get(b.key,{type:'json'}) as {visible:boolean;deleted?:boolean;blob?:string;group?:string;title:string}])));
  const resources=Object.entries(entries).filter(([,e])=>e?.visible&&!e.deleted&&e.blob&&e.group==='handouts').map(([id,e])=>({title:e.title,url:'/api/tour-resources?file='+encodeURIComponent(id)}));
  const maps=cityMaps.map(m=>({name:m.name,url:preferredCityMap(m.id,Object.fromEntries(Object.entries(entries).map(([id,e])=>[id,{...e,file:!!e.blob}])))||'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(m.name)}));
  const bytes=await renderOfflineSnapshot({content,root,announcements,maps,languages,trivia,resources,downloadedAt,baseUrl:new URL(request.url).origin});
  return new Response(new Blob([Uint8Array.from(bytes).buffer]).stream(),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="Wondercase-offline-${downloadedAt.slice(0,10)}.pdf"`,'Cache-Control':'no-store','X-Snapshot-Date':downloadedAt}});
 }catch{return new Response('Unable to create your snapshot. Connect to the internet and try again.',{status:503,headers:{'Cache-Control':'no-store'}});}
}
export const config:Config={path:'/api/offline-snapshot'};
