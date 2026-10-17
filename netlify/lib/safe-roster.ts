import {getStore} from '@netlify/blobs';
import legacy from '../../app/guests.json';
import {assignSafeIds,type SafeAssignments} from '../../lib/safe-ids';
import {cleanGuests,type Guest} from '../../lib/guest-roster';
import {TOUR_IMPORT_VERSION} from '../../shared/tour-import.mjs';
export const GUEST_LIST_VERSION=TOUR_IMPORT_VERSION;
export const GUEST_ORDER_VERSION="sm23-left-column-then-right-v1";
export type RosterData={guests:Guest[];revealed:boolean;safeAssignments?:SafeAssignments;guestListVersion?:string;guestOrderVersion?:string};
export function rosterData(data?:RosterData|null){
 // Publish the supplied list once, retaining matching guest/profile IDs and
 // every previously issued Safe ID. Later TD edits, hides and removals win.
 const importing=data?.guestListVersion!==GUEST_LIST_VERSION;
 const normalize=(name:string)=>name.toLowerCase().replace(/^(?:mrs?|ms)\.\s*/,'').replace(/\s+/g,' ').trim();
 const previous=data?.guests||[];
 let guests:Guest[]=importing?cleanGuests(legacy).map(guest=>{
  const saved=previous.find(g=>g.id===guest.id||normalize(g.name)===normalize(guest.name));
  return saved?{...saved,name:guest.name,origin:guest.origin}:guest;
 }):previous;
 if(data?.guestOrderVersion!==GUEST_ORDER_VERSION){
  const ranks=new Map(legacy.map((guest,index)=>[normalize(guest.name),index]));
  guests=[...guests].sort((a,b)=>(ranks.get(normalize(a.name))??legacy.length)-(ranks.get(normalize(b.name))??legacy.length));
 }
 return {guestOrderVersion:GUEST_ORDER_VERSION,...assignSafeIds(guests,data?.safeAssignments),revealed:importing||data?.revealed===true,guestListVersion:GUEST_LIST_VERSION};
}
// Persist assignments before Safe activation. Conditional writes protect concurrent roster edits.
export async function assignedGuest(safeId:string){
 const store=getStore({name:'guest-profiles',consistency:'strong'});
 for(let attempt=0;attempt<4;attempt++){
  const item=await store.getWithMetadata('roster',{type:'json'});
  const old=item?.data as RosterData|undefined;
  const data=rosterData(old);
  if(old?.guestOrderVersion!==data.guestOrderVersion||old?.guestListVersion!==data.guestListVersion||!old?.safeAssignments||data.guests.some(g=>!old.safeAssignments?.byGuest[g.id])){
   const saved=await store.setJSON('roster',{...old,...data},item?{onlyIfMatch:item.etag}:{onlyIfNew:true});
   if(!saved.modified)continue;
  }
  return data.guests.find(g=>g.safeId===safeId)||null;
 }
 throw Error('The guest list changed. Try again.');
}
