import hotels from '../app/hotels.json';
export const MANIFEST_SITE_ID='c1f3ce92-834f-4a1e-a84b-1551409ddb7b';
export const manifestHotels=hotels.map((h,i)=>({id:`hotel-${i}`,name:h.name,arrival:dateFor(h.checkin),departure:dateFor(h.checkout)}));
function dateFor(day:number){return new Date(Date.UTC(2026,10,11+day)).toISOString().slice(0,10);}
export type ManifestGuest={number:string;preferredName:string;travelGroup:string;notes:string;important:string};
export type RoomEntry={room:string;bed:string;notes:string;important:string};
export type HotelSheet={arrival:string;departure:string;notes:string;important:string;entries:Record<string,RoomEntry>};
export type HotelManifest={tourName:string;tourNumber:string;director:string;start:string;end:string;nonSmoking:boolean;staffRoom:boolean;guests:Record<string,ManifestGuest>;hotels:Record<string,HotelSheet>};
export const blankEntry=():RoomEntry=>({room:'',bed:'',notes:'',important:''});
export const preferredIn=(name:string)=>name.match(/\(([^)]+)\)/)?.[1]?.trim()||'';
export const guestDisplayName=(g:{name:string;preferredName?:string})=>g.preferredName&&!g.name.includes(`(${g.preferredName})`)?`${g.name} (${g.preferredName})`:g.name;
export function manifestDefaults(roster:{id:string;name:string}[],saved?:HotelManifest|null):HotelManifest{
 const numbers=new Set(Object.values(saved?.guests||{}).map(g=>g.number));let next=1;
 const guests=Object.fromEntries(roster.map(g=>{while(numbers.has(String(next).padStart(3,'0')))next++;const value=saved?.guests[g.id]||{number:String(next++).padStart(3,'0'),preferredName:preferredIn(g.name),travelGroup:''};return [g.id,{notes:'',important:'',...value}];}));
 return {tourName:'Vietnam, Cambodia & Thailand',tourNumber:'',director:'Xavier Brunelle',start:'2026-11-16',end:'2026-12-01',nonSmoking:true,staffRoom:true,...saved,guests,hotels:Object.fromEntries(manifestHotels.map(h=>[h.id,{arrival:h.arrival,departure:h.departure,notes:'',important:'',...saved?.hotels[h.id],entries:Object.fromEntries(roster.map(g=>[g.id,saved?.hotels[h.id]?.entries[g.id]||blankEntry()]))}]))};
}
export function cleanManifest(value:unknown,roster:{id:string}[]):HotelManifest{
 if(!value||typeof value!=='object')throw Error('Check the manifest.');const v=value as any;
 const field=(x:unknown,max:number)=>{if(typeof x!=='string'||x.length>max)throw Error('A manifest field is missing or too long.');return x.trim();};
 const date=(x:unknown)=>{const d=field(x,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d)throw Error('Use a valid date.');return d;};
 if(typeof v.nonSmoking!=='boolean'||typeof v.staffRoom!=='boolean')throw Error('Check room preferences.');
 if(!v.guests||!v.hotels)throw Error('Reload the manifest.');
 const ids=new Set(roster.map(g=>g.id));if(Object.keys(v.guests).some(id=>!ids.has(id))||roster.some(g=>!v.guests[g.id]))throw Error('The guest list changed. Reload before saving.');
 const seen=new Set<string>();
 const guests=Object.fromEntries(roster.map(g=>{const row=v.guests[g.id];const n=field(row.number,3);if(n&&!/^\d{1,3}$/.test(n))throw Error('Guest numbers must be 1–999.');const number=n?String(Number(n)).padStart(3,'0'):'';if(number==='000'||number&&seen.has(number))throw Error('Use a unique number from 001 to 999 for each guest.');if(number)seen.add(number);return [g.id,{number,preferredName:field(row.preferredName,80),travelGroup:field(row.travelGroup,100),notes:field(row.notes,1200),important:field(row.important,1200)}];}));
 const sheets=Object.fromEntries(manifestHotels.map(h=>{const s=v.hotels[h.id];if(!s?.entries||Object.keys(s.entries).some(id=>!ids.has(id)))throw Error('Check hotel guests.');const entries=Object.fromEntries(roster.map(g=>{const r=s.entries[g.id];if(!r)throw Error('The guest list changed. Reload before saving.');const bed=field(r.bed,30);if(!['','King/Queen','Two beds','No preference'].includes(bed))throw Error('Choose a bed preference.');return [g.id,{room:field(r.room,60),bed,notes:field(r.notes,1200),important:field(r.important,1200)}];}));const arrival=date(s.arrival),departure=date(s.departure);if(departure<=arrival)throw Error('Hotel departure must be after arrival.');return [h.id,{arrival,departure,notes:field(s.notes,2000),important:field(s.important,2000),entries}];}));
 const start=date(v.start),end=date(v.end);if(end<start)throw Error('Tour end must follow its start.');const result={tourName:field(v.tourName,150),tourNumber:field(v.tourNumber,60),director:field(v.director,120),start,end,nonSmoking:v.nonSmoking,staffRoom:v.staffRoom,guests,hotels:sheets};if(!result.tourName||!result.director)throw Error('Enter tour name and director.');return result;
}
export function roomGroups(data:HotelManifest,hotel:string,roster:{id:string;name:string}[]){
 const sheet=data.hotels[hotel];const groups=new Map<string,typeof roster>();
 for(const guest of [...roster].sort((a,b)=>Number(data.guests[a.id].number)-Number(data.guests[b.id].number))){const key=sheet.entries[guest.id].room||`unassigned:${guest.id}`;groups.set(key,[...(groups.get(key)||[]),guest]);}
 return [...groups].map(([key,guests])=>({key,guests,assigned:!key.startsWith('unassigned:'),type:['','Single','Double','Triple','Quad'][guests.length]||`${guests.length} guests`}));
}
export function checkExport(data:HotelManifest,hotel:string,roster:{id:string;name:string}[]){
 if(!roster.length)throw Error('Add guests before generating a manifest.');
 if(roster.some(g=>!data.guests[g.id].number||!data.hotels[hotel].entries[g.id].room))throw Error('Give every guest a number and room group before generating this hotel document.');
 for(const group of roomGroups(data,hotel,roster)){
  if(group.guests.length>4)throw Error('Use at most four guests per room group. Traveling-together groups can span several rooms.');
  const beds=new Set(group.guests.map(g=>data.hotels[hotel].entries[g.id].bed).filter(Boolean));if(beds.size>1)throw Error(`Room ${group.key} has conflicting bed requests. Use the same preference for its occupants.`);
 }
}
