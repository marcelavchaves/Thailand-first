import type {Guest} from './guest-roster';
export type SafeAssignments={byGuest:Record<string,string>;next:number};
export const normalizeSafeId=(value:unknown)=>typeof value==='string'&&/^TG\d{2,}$/.test(value.trim().toUpperCase())?value.trim().toUpperCase():null;
// Retain removed guests' assignments too: an issued Safe ID is never recycled.
export function assignSafeIds(guests:Guest[],previous?:SafeAssignments){
 const byGuest={...(previous?.byGuest||{})};
 let next=Math.max(previous?.next||1,...Object.values(byGuest).map(id=>Number(id.slice(2))+1));
 const assigned=guests.map(g=>{
  if(!byGuest[g.id])byGuest[g.id]=`TG${String(next++).padStart(2,'0')}`;
  return {...g,safeId:byGuest[g.id]};
 });
 return {guests:assigned,safeAssignments:{byGuest,next}};
}
