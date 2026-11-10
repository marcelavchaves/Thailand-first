import {roomGroups,guestDisplayName,manifestHotels,type HotelManifest} from './hotel-manifest';
export function hotelManifestReport(data:HotelManifest,hotel:string,roster:{id:string;name:string;preferredName?:string}[]){
 const sheet=data.hotels[hotel],groups=roomGroups(data,hotel,roster);
 const rows:string[][]=[];
 if(sheet.notes||sheet.important)rows.push(['—','Hotel notes','','',[sheet.notes,sheet.important&&`IMPORTANT: ${sheet.important}`].filter(Boolean).join('\n')]);
 for(const group of groups)for(const guest of group.guests){const details=data.guests[guest.id],entry=sheet.entries[guest.id];
  const companions=details.travelGroup?groups.filter(other=>other.key!==group.key&&other.guests.some(g=>data.guests[g.id].travelGroup===details.travelGroup)):[];
  const travel=details.travelGroup?`Traveling together: ${details.travelGroup}${companions.length?' · Traveling with room group '+companions.map(other=>`${other.key} (${other.guests.filter(g=>data.guests[g.id].travelGroup===details.travelGroup).map(g=>`${data.guests[g.id].number} ${guestDisplayName({...g,preferredName:data.guests[g.id].preferredName||roster.find(r=>r.id===g.id)?.preferredName})}`).join('; ')})`).join('; '):''}`:'';
  const notes=[details.dietary&&`Dietary restrictions: ${details.dietary}`,details.notes,details.important&&`IMPORTANT: ${details.important}`,entry.notes,entry.important&&`IMPORTANT: ${entry.important}`,travel].filter(Boolean).join('\n')||'—';
  rows.push([details.number,guestDisplayName({...guest,preferredName:details.preferredName||roster.find(r=>r.id===guest.id)?.preferredName}),group.assigned?`${group.type}\nRoom group ${group.key}`:'Not assigned',entry.bed==='Two beds'?'Two Beds':entry.bed||'Not specified',notes]);
 }
 if(data.staffRoom)rows.push(['—',`${data.director} · TD (staff)`,'Single','Not specified','Staff room']);
 const counts=[1,2,3,4].map(n=>groups.filter(g=>g.assigned&&g.guests.length===n).length);
 return {title:'WONDERCASE · HOTEL GUEST MANIFEST',hotel:manifestHotels.find(h=>h.id===hotel)!.name,meta:[`${data.tourName} · 499th Edition · Tour number: ${data.tourNumber||'Not specified'} · Tour director: ${data.director}`,`Hotel arrival: ${sheet.arrival} · Departure: ${sheet.departure} · Tour dates: ${data.start} to ${data.end}`,...(data.nonSmoking?['Non-smoking rooms requested for all guests unless otherwise noted.']:[])],columns:['Guest #','Full name (preferred name)','Room type','Bed type','Notes'],rows,summary:`Summary: ${counts[0]} Singles, ${counts[1]} Doubles, ${counts[2]} Triples, ${counts[3]} Quads = ${roster.length} guests${data.staffRoom?' plus 1 staff single room':''}.`};
}
