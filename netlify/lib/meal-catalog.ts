import {getStore} from '@netlify/blobs';
import {menus as defaults,PROTOTYPE_SITE_ID,type MealMenu} from '../../lib/meal-choices';
const store=()=>getStore({name:'meal-choices-v1',consistency:'strong'});
export async function readMealCatalog(){const record=await store().getWithMetadata('settings/catalog',{type:'json'});return {menus:(record?.data as {menus:MealMenu[]}|null)?.menus||defaults,revision:record?.etag||null};}
export function validateCatalog(value:unknown,previous:MealMenu[]):MealMenu[]{
 if(JSON.stringify(value||'').length>1000000)throw Error('Menus are too large. Shorten descriptions.');
 if(!Array.isArray(value)||!value.length||value.length>40)throw Error('Use 1–40 menus.');
 const ids=new Set<string>();
 const text=(v:unknown,max:number)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw Error('Enter a valid name or title.');return v.trim();};
 const id=(v:unknown,seen:Set<string>)=>{if(typeof v!=='string'||!/^[a-z0-9-]{1,80}$/.test(v)||seen.has(v))throw Error('Invalid or duplicate menu, course or option ID.');seen.add(v);return v;};
 const menus=value.map(v=>{const courseIds=new Set<string>();if(!v||!Array.isArray(v.courses)||!v.courses.length||v.courses.length>12)throw Error('Add 1–12 courses or a single option list.');
 const m:MealMenu={id:id(v.id,ids),title:text(v.title,120),restaurant:text(v.restaurant,160),document:previous.find(m=>m.id===v.id)?.document||'',flat:v.flat===true,courses:v.courses.map((c:any)=>{const optionIds=new Set<string>();if(!Array.isArray(c.options)||!c.options.length||c.options.length>80)throw Error('Add 1–80 options per course.');return {id:id(c.id,courseIds),title:text(c.title,100),options:c.options.map((o:any)=>({id:id(o.id,optionIds),name:text(o.name,160),description:typeof o.description==='string'?o.description.trim().slice(0,600):''}))};})};
 if(m.flat&&m.courses.length!==1)throw Error('A single option list must have exactly one list.');
 const old=previous.find(p=>p.id===m.id);if(old?.day)m.day=old.day;
 m.deadline=old?.deadline||v.deadline;
 if(!old&&(!m.deadline||!Number.isFinite(Date.parse(m.deadline))||Date.parse(m.deadline)<=Date.now()))throw Error('Choose a future deadline for the new menu.');
 return m;});
 // Keep every existing ID so submitted choices and report history remain readable.
 for(const old of previous){const m=menus.find(m=>m.id===old.id);if(!m)throw Error('Existing menus cannot be removed. Use Hide instead.');for(const c of old.courses){const next=m.courses.find(n=>n.id===c.id);if(!next||c.options.some(o=>!next.options.some(n=>n.id===o.id)))throw Error('Existing courses and options must be retained to preserve saved choices.');}}
 return menus;
}
export async function saveMealCatalog(body:any,current:Awaited<ReturnType<typeof readMealCatalog>>){
 if((Netlify.env.get('SITE_ID')||process.env.SITE_ID)!==PROTOTYPE_SITE_ID)throw Error('Menu editing is available on prototype only.');
 if(body.revision!==current.revision)throw Error('Menus changed in another window. Reload before saving.');
 const menus=validateCatalog(body.menus,current.menus);
 const saved=await store().setJSON('settings/catalog',{menus},current.revision?{onlyIfMatch:current.revision}:{onlyIfNew:true});
 if(!saved.modified)throw Error('Menus changed in another window. Reload before saving.');
 return readMealCatalog();
}
