export type Guest = {id:string;name:string;origin:string;bio:string;phone:string;email:string;social:string;shareContact:boolean;safeId?:string;preferredName?:string;roomGroup?:string};
export const MAX_GUESTS=100;
export function cleanGuests(value:unknown):Guest[]{
 if(!Array.isArray(value)||value.length>MAX_GUESTS)throw Error('Use a maximum of 100 guests.');
 const seen=new Set<string>();
 const guests:Guest[]=value.map(g=>{
  if(!g||typeof g!=='object'||typeof g.id!=='string'||!/^([1-9]|1[0-4]|[a-f0-9-]{36})$/.test(g.id)||seen.has(g.id))throw Error('Each guest needs a unique valid ID.');
  seen.add(g.id);
  const field=(key:string,max:number)=>{if(typeof g[key]!=='string'||g[key].length>max)throw Error(`Check the ${key} field.`);return g[key].trim();};
  const name=field('name',120),origin=field('origin',160),bio=field('bio',600),phone=field('phone',80),email=field('email',160),social=field('social',500);
  const optional=(key:string,max:number)=>g[key]===undefined?undefined:field(key,max);
  const preferredName=optional('preferredName',80),roomGroup=optional('roomGroup',60);
  if(!name)throw Error('Each guest needs a name.');
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error(`Check the email for ${name}.`);
  if(social){let url;try{url=new URL(social);}catch{throw Error(`Use a complete https:// social link for ${name}.`);}if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error('Use an http or https social link without login details.');}
  return {id:g.id,name,origin,bio,phone,email,social,shareContact:g.shareContact===true,...(preferredName===undefined?{}:{preferredName}),...(roomGroup===undefined?{}:{roomGroup})};
 });
 const rooms=new Map<string,number>();for(const g of guests){if(!g.roomGroup)continue;rooms.set(g.roomGroup,(rooms.get(g.roomGroup)||0)+1);if(rooms.get(g.roomGroup)!>4)throw Error('Use at most four guests in each room group.');}
 return guests;
}
export const guestDisplayName=(g:{name:string;preferredName?:string})=>g.preferredName&&!g.name.includes(`(${g.preferredName})`)?`${g.name} (${g.preferredName})`:g.name;
export function publicGuests(guests:Guest[]){return guests.map(({roomGroup,...g})=>({...g,phone:g.shareContact?g.phone:'',email:g.shareContact?g.email:'',social:g.shareContact?g.social:''}));}
// Scan output is deliberately a draft: no guessed couples or silently discarded rows.
export function parseGuestText(text:string):Guest[]{
 const lines=text.replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(Boolean);
 if(lines.length>MAX_GUESTS+1)throw Error('Import up to 100 rows at a time.');
 const split=(line:string)=>{const delimiter=line.includes('\t')?'\t':line.includes('|')?'|':',';const out:string[]=[];let value='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===delimiter&&!quoted){out.push(value.trim());value='';}else value+=c;}out.push(value.trim());return out;};
 const aliases:Record<string,string>={name:'name',guest:'name','full name':'name',hometown:'origin',origin:'origin',city:'origin',bio:'bio',intro:'bio',phone:'phone',telephone:'phone',email:'email',social:'social','social link':'social'};
 const first=lines[0]?split(lines[0]):[];const header=first.some(c=>aliases[c.toLowerCase()]==='name')?first.map(c=>aliases[c.toLowerCase()]||''):null;
 return lines.slice(header?1:0).map(line=>{
  const cells=split(line);const g:Guest={id:crypto.randomUUID(),name:'',origin:'',bio:'',phone:'',email:'',social:'',shareContact:false};
  if(header)header.forEach((key,i)=>{if(key)(g as any)[key]=cells[i]||'';});
  else {g.name=cells[0].replace(/^\d+[.)]\s+/,'');g.origin=cells[1]||'';g.bio=cells[2]||'';g.phone=cells[3]||'';g.email=cells[4]||'';g.social=cells[5]||'';}
  return g;
 });
}

/** Room groups are TD-only roster details; selecting guests never changes their IDs. */
export function assignGuestRoomGroup(guests:Guest[],previous:string|null,label:string,members:string[]):Guest[]{
 const room=label.trim();if(!room||room.length>60)throw Error('Enter a room group name of 1–60 characters.');
 if(members.length<1||members.length>4||new Set(members).size!==members.length||members.some(id=>!guests.some(g=>g.id===id)))throw Error('Choose one to four current guests for this room group.');
 if(room!==previous&&guests.some(g=>g.roomGroup===room))throw Error('This room group already exists. Choose it to edit its members.');
 return guests.map(g=>members.includes(g.id)?{...g,roomGroup:room}:previous&&g.roomGroup===previous?{...g,roomGroup:''}:g);
}
