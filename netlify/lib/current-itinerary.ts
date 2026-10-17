import {applyReleases} from '../../shared/release-policy.mjs';
import {getStore} from '@netlify/blobs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderItinerary,hydrateContent} from '../../scripts/render-itinerary.mjs';
import {rosterData,type RosterData} from './safe-roster';
import {importedSchedule,TOUR_IMPORT_VERSION} from '../../shared/tour-import.mjs';
export async function loadCurrentContent(){
 const root=process.cwd();
 const snapshot=JSON.parse(await readFile(root+'/netlify/data/itinerary-content.json','utf8'));
 const store=getStore({name:'journey-timelines',consistency:'strong'});
 const changes=await Promise.all(snapshot.data.days.map((day:{date:number})=>store.get(`day/${day.date}`,{type:'json'})));
 const guestStore=getStore({name:'guest-profiles',consistency:'strong'});
 const roster=rosterData(await guestStore.get('roster',{type:'json'}) as RosterData|null);
 const visibleGuests=roster.revealed?roster.guests:[];
 const profiles=await Promise.all(visibleGuests.map(g=>guestStore.get(`guest/${g.id}`,{type:'json'})));
 const publicProfiles=profiles.map((p:any)=>({intro:p?.intro||'',photo:p?.photo||null}));
 const director=await getStore({name:"director-profile",consistency:"strong"}).get("xavier",{type:"json"}) as {photo?:string}|null;
 const releaseStore=getStore({name:'tour-resources',consistency:'strong'});
 const listing=await releaseStore.list({prefix:'entry/'});
 const entries=Object.fromEntries(await Promise.all(listing.blobs.map(async b=>[b.key.slice(6),await releaseStore.get(b.key,{type:'json'})])));
 const revision=createHash('sha256').update(TOUR_IMPORT_VERSION+snapshot.sourceHash+JSON.stringify(entries)+JSON.stringify(changes)+JSON.stringify({guests:visibleGuests,revealed:roster.revealed})+JSON.stringify(publicProfiles)+JSON.stringify(director?.photo||null)).digest('hex');
 const content=hydrateContent(snapshot);
 content.data.days=content.data.days.map((day:{date:number},index:number)=>({...day,...importedSchedule(snapshot,day.date,changes[index])}));
 for(const section of content.sections)for(const block of section.blocks)if(block.directorPhoto&&director?.photo)block.photo=director.photo;
 content.guests=visibleGuests.map(g=>g.name);
 const guestSection=content.sections.find((section:any)=>section.title==='Our Travelers'||section.title==='The Guest List');
 if(guestSection)guestSection.blocks=visibleGuests.length?visibleGuests.flatMap((g,index)=>[
  {kind:'heading',text:g.name,guestId:g.id,photo:publicProfiles[index].photo||undefined},
  {kind:'text',text:g.origin},
  {kind:'text',text:publicProfiles[index].intro||g.bio||'Introduction coming soon.'}
 ]):[{kind:'text',text:roster.revealed?'No guests listed.':'The guest list is currently hidden by the tour director.'}];
 applyReleases(content,entries);
 return {content,root,snapshot,revision};
}
export async function currentItinerary(){
 const {content,root,snapshot,revision}=await loadCurrentContent();
 const cache=getStore({name:'journey-pdfs',consistency:'strong'});
 const cached=await cache.get(revision,{type:'arrayBuffer'});
 if(cached)return {bytes:new Uint8Array(cached),revision};
 const {bytes}=await renderItinerary(content,{root,baseUrl:snapshot.baseUrl,testEdition:snapshot.testEdition});
 await cache.set(revision,new Uint8Array(bytes).buffer);
 return {bytes:new Uint8Array(bytes),revision};
}
