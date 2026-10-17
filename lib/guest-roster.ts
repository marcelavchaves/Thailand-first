export type Guest = {id:string;name:string;origin:string;bio:string;phone:string;email:string;social:string;shareContact:boolean;safeId?:string};
export const MAX_GUESTS=100;
export function cleanGuests(value:unknown):Guest[]{
 if(!Array.isArray(value)||value.length>MAX_GUESTS)throw Error('Use a maximum of 100 guests.');
 const seen=new Set<string>();
 return value.map(g=>{
  if(!g||typeof g!=='object'||typeof g.id!=='string'||!/^([1-9]|1[0-4]|[a-f0-9-]{36})$/.test(g.id)||seen.has(g.id))throw Error('Each guest needs a unique valid ID.');
  seen.add(g.id);
  const field=(key:string,max:number)=>{if(typeof g[key]!=='string'||g[key].length>max)throw Error(`Check the ${key} field.`);return g[key].trim();};
  const name=field('name',120),origin=field('origin',160),bio=field('bio',600),phone=field('phone',80),email=field('email',160),social=field('social',500);
  if(!name)throw Error('Each guest needs a name.');
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error(`Check the email for ${name}.`);
  if(social){let url;try{url=new URL(social);}catch{throw Error(`Use a complete https:// social link for ${name}.`);}if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error('Use an http or https social link without login details.');}
  return {id:g.id,name,origin,bio,phone,email,social,shareContact:g.shareContact===true};
 });
}
export function publicGuests(guests:Guest[]){return guests.map(g=>({...g,phone:g.shareContact?g.phone:'',email:g.shareContact?g.email:'',social:g.shareContact?g.social:''}));}
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
