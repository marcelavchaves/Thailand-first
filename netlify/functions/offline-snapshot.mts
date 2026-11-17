import type {Config} from '@netlify/functions';
import {getStore} from '@netlify/blobs';
import {loadCurrentContent} from '../lib/current-itinerary';
import {dayFeatures} from '../lib/day-features';
import {renderOfflineSnapshot} from '../lib/offline-snapshot-pdf.mjs';
import {hasTDSession} from '../lib/td-auth';
import {offlineSnapshotSettings} from '../lib/offline-snapshot-settings';
export default async function handler(request:Request){
 if(request.method!=='GET')return new Response('Method not allowed',{status:405});
 try{
  if(!(await offlineSnapshotSettings()).visible&&!await hasTDSession(request))return new Response('Offline Snapshot is currently hidden by the TD.',{status:404,headers:{'Cache-Control':'no-store'}});
  const downloadedAt=new Date().toISOString();const {content,root}=await loadCurrentContent();
  const notes=getStore({name:'xavier-daily-notes',consistency:'strong'});
  const announcements=Object.fromEntries(await Promise.all(content.data.days.map(async(d:{date:number})=>[d.date,(await dayFeatures(d.date)).announcement?await notes.get('day/'+d.date,{type:'json'}):null])));
  const bytes=await renderOfflineSnapshot({content,root,announcements,downloadedAt,baseUrl:new URL(request.url).origin});
  return new Response(new Blob([Uint8Array.from(bytes).buffer]).stream(),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="Wondercase-offline-${downloadedAt.slice(0,10)}.pdf"`,'Cache-Control':'no-store','X-Snapshot-Date':downloadedAt}});
 }catch{return new Response('Unable to create your snapshot. Connect to the internet and try again.',{status:503,headers:{'Cache-Control':'no-store'}});}
}
export const config:Config={path:'/api/offline-snapshot'};
