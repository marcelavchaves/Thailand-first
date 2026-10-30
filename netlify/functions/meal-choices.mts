import type {Config} from '@netlify/functions';
import {getStore} from '@netlify/blobs';
import {createHash,randomBytes,randomInt,scryptSync,timingSafeEqual,createCipheriv,createDecipheriv} from 'node:crypto';
import {hasTDSession,sameOrigin} from '../lib/td-auth';
import {rosterData,type RosterData} from '../lib/safe-roster';
import {menus,MEAL_DEADLINE,WELCOME_DINNER_AT,PROTOTYPE_SITE_ID,validateSubmission,mealReport,MEAL_PINS_REQUIRED,defaultMealDeadlines,mealLocks,mealState,type MealSubmission,type MealReportGuest,type MealDeadlines,type MealState,type MealAuditEntry} from '../../lib/meal-choices';
import {exportMeals} from '../lib/meal-exports';
const store=()=>getStore({name:'meal-choices-v1',consistency:'strong'});
const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
const cookieName='__Host-wondercase_meals';
const tokenOf=(r:Request)=>r.headers.get('cookie')?.match(/(?:^|;\s*)__Host-wondercase_meals=([a-f0-9]{64})(?:;|$)/)?.[1];
const reply=(body:unknown,status=200,extra:Record<string,string>={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff',...extra}});
async function deadlineSettings(){
 const record=await store().getWithMetadata('settings/deadlines',{type:'json'});
 const saved=record?.data as {deadlines?:MealDeadlines}|undefined;
 return {deadlines:{...defaultMealDeadlines(),...saved?.deadlines},revision:record?.etag||null};
}
function metadata(settings:{deadlines:MealDeadlines;revision:string|null}){
 const lockedMeals=mealLocks(settings.deadlines);
 return {menus,deadline:MEAL_DEADLINE,deadlines:settings.deadlines,settingsRevision:settings.revision,pinRequired:MEAL_PINS_REQUIRED,privateLinksRequired:false,optionalPin:true,welcomeDinnerAt:WELCOME_DINNER_AT,serverNow:new Date().toISOString(),lockedMeals,locked:Object.values(lockedMeals).every(Boolean)};
}
const pinKey=()=>{const key=Netlify.env.get('MEAL_PIN_ENCRYPTION_KEY');if(!key||!/^[a-f0-9]{64}$/.test(key))throw Error('Meal PIN setup is not complete.');return Buffer.from(key,'hex');};
function encryptPin(pin:string){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',pinKey(),iv);const bytes=Buffer.concat([cipher.update(pin,'utf8'),cipher.final()]);return {iv:iv.toString('hex'),tag:cipher.getAuthTag().toString('hex'),data:bytes.toString('hex')};}
function decryptPin(v:Pick<Credential,'encrypted'>){const decipher=createDecipheriv('aes-256-gcm',pinKey(),Buffer.from(v.encrypted.iv,'hex'));decipher.setAuthTag(Buffer.from(v.encrypted.tag,'hex'));return Buffer.concat([decipher.update(Buffer.from(v.encrypted.data,'hex')),decipher.final()]).toString('utf8');}
type Credential={salt:string;hash:string;version:string;encrypted:{iv:string;tag:string;data:string}};
type Session={guestId:string;version:string;expires:number;channel?:'traveler-link'|'td'|'public'|'pin'};
type Protection={salt?:string;hash?:string;version:string;protected:boolean};
const protection=async(id:string)=>await store().get('protection/'+id,{type:'json'}) as Protection|null;
const validPin=(pin:unknown,p:Protection)=>typeof pin==='string'&&/^\d{4}$/.test(pin)&&!!p.salt&&!!p.hash&&timingSafeEqual(scryptSync(pin,p.salt,64),Buffer.from(p.hash,'hex'));
type Access={hash:string;version:string;encrypted:Credential['encrypted']};
function travelerSubmission(value:unknown){if(!value)return null;const {audit,...submission}=value as MealSubmission;return submission;}
async function roster(){return rosterData(await getStore({name:'guest-profiles',consistency:'strong'}).get('roster',{type:'json'}) as RosterData|null);}
async function authenticatedGuest(request:Request,guests:{id:string;name:string}[]){
 const token=tokenOf(request);if(!token)return null;
 const session=await store().get('session/'+hash(token),{type:'json'}) as Session|null;
 if(!session||session.expires<=Date.now())return null;
 const guest=guests.find(g=>g.id===session.guestId);if(!guest)return null;
 if(await hasTDSession(request))return {...guest,actor:{type:'td' as const,label:'TD Suitcase account'}};
 if(session.channel==='td')return null;
 const p=await protection(guest.id);
 if(session.channel==='public')return !p?.protected&&session.version===(p?.version||'public')?{...guest,actor:{type:'public' as const,label:`Public edit for ${guest.name} · identity unverified`}}:null;
 if(session.channel==='pin')return p?.protected&&p.version===session.version?{...guest,actor:{type:'pin' as const,label:`PIN-authorized edit for ${guest.name}`}}:null;
 if(session.channel!=='traveler-link')return null; // Revoke previous name-only sessions.
 const access=await store().get('access/'+guest.id,{type:'json'}) as Access|null;
 return !p?.protected&&access?.version===session.version?{...guest,actor:{type:'traveler-link' as const,label:`Private link for ${guest.name}`}}:null;
}
async function consumeAttempt(key:string,limit:number){
 for(let i=0;i<5;i++){
  const r=await store().getWithMetadata('attempt/'+hash(key),{type:'json'});
  const old=r?.data as {count:number;until:number}|undefined;
  const data=old&&old.until>Date.now()?{...old,count:old.count+1}:{count:1,until:Date.now()+15*60*1000};
  if(data.count>limit)return false;
  const write=await store().setJSON('attempt/'+hash(key),data,r?{onlyIfMatch:r.etag}:{onlyIfNew:true});if(write.modified)return true;
 }
 return false;
}
async function generate(guestId:string,replace=false){
 const current=await store().getWithMetadata('pin/'+guestId,{type:'json'});
 if(current&&!replace)return false;
 const pin=String(randomInt(0,100000000)).padStart(8,'0'),salt=randomBytes(16).toString('hex');
 const saved=await store().setJSON('pin/'+guestId,{salt,hash:scryptSync(pin,salt,64).toString('hex'),version:randomBytes(16).toString('hex'),encrypted:encryptPin(pin)},current?{onlyIfMatch:current.etag}:{onlyIfNew:true});
 if(!saved.modified)throw Error('The PIN changed in another window. Refresh before trying again.');return true;
}
async function generateLink(id:string,replace=false){
 const current=await store().getWithMetadata('access/'+id,{type:'json'});if(current&&!replace)return false;
 const token=randomBytes(32).toString('hex');
 const saved=await store().setJSON('access/'+id,{hash:hash(token),version:randomBytes(16).toString('hex'),encrypted:encryptPin(token)},current?{onlyIfMatch:current.etag}:{onlyIfNew:true});
 if(!saved.modified)throw Error('The private link changed in another window. Refresh before trying again.');return true;
}
async function report(guests:{id:string;name:string}[]):Promise<MealReportGuest[]>{
 return Promise.all(guests.map(async g=>({id:g.id,name:g.name,pinReady:!!(await protection(g.id))?.protected,accessReady:!!await store().get('access/'+g.id,{type:'json'}),submission:await store().get('choice/'+g.id,{type:'json'}) as MealSubmission|null})));
}
export default async function handler(request:Request){
 try{
  if((Netlify.env.get('SITE_ID')||process.env.SITE_ID)!==PROTOTYPE_SITE_ID)return reply({error:'Not found.'},404);
  const url=new URL(request.url),action=url.searchParams.get('action')||'traveler';
  if(!['GET','POST','PUT','DELETE'].includes(request.method))return reply({error:'Method not allowed.'},405);
  if(request.method!=='GET'&&!sameOrigin(request))return reply({error:'Open this action from the app.'},403);
  const {guests,revealed}=await roster();
  let settings=await deadlineSettings();
  if(request.method==='GET'){
   if(action==='td'||action==='export'){
    if(!await hasTDSession(request))return reply({error:'Sign in to TD Suitcase.'},401);
    const data=await report(guests);
    if(action==='export'){
     const format=url.searchParams.get('format')||'csv',meal=url.searchParams.get('meal')||'all';
     if(!['csv','xlsx','pdf'].includes(format)||meal!=='all'&&!menus.some(m=>m.id===meal))return reply({error:'Choose an available export.'},400);
     let exported;
     try{exported=await exportMeals(mealReport(data,meal,settings.deadlines),format,meal);}
     catch(error){
      const code=error&&typeof error==='object'&&'code' in error?String(error.code):'EXPORT_FAILED';
      console.error('Meal report export failed',{format,code});
      return reply({error:format==='pdf'?'The meal PDF could not be created. CSV and Excel exports are still available.':'The meal report could not be created. Please try again.'},503);
     }
     return new Response(new Uint8Array(exported.bytes),{headers:{'Content-Type':exported.type,'Content-Disposition':`attachment; filename="meal-choices-${meal}.${format}"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }
    return reply({...metadata(settings),guests:data,summary:mealReport(data,'all',settings.deadlines).totals});
   }
   if(action!=='traveler')return reply({error:'Not found.'},404);
   const guest=await authenticatedGuest(request,guests);
   const choice=guest?await store().getWithMetadata('choice/'+guest.id,{type:'json'}):null;
   return reply({...metadata(settings),td:await hasTDSession(request),guests:revealed?await Promise.all(guests.map(async g=>({id:g.id,name:g.name,protected:!!(await protection(g.id))?.protected}))):[],guest:guest?{id:guest.id,name:guest.name,protected:!!(await protection(guest.id))?.protected}:null,submission:travelerSubmission(choice?.data),revision:choice?.etag||null});
  }
  if(request.method==='DELETE'){
   const token=tokenOf(request);if(token)await store().delete('session/'+hash(token));
   return reply({ok:true},200,{'Set-Cookie':`${cookieName}=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0`});
  }
  const raw=await request.text();if(raw.length>12000)return reply({error:'Meal form is too large.'},413);
  let body:any;try{body=JSON.parse(raw);}catch{return reply({error:'Check your meal form.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body))return reply({error:'Check your meal form.'},400);
  if(request.method==='POST'){
   if(body.action==='login'){
    const guest=guests.find(g=>g.id===body.guestId);
    if(!guest)return reply({error:'Choose a current traveler from the guest list.'},400);
    let version='td',channel:Session['channel']='td';
    if(!await hasTDSession(request)){
     const access=await store().get('access/'+guest.id,{type:'json'}) as Access|null;
     if(body.accessToken!==undefined){
      if(typeof body.accessToken!=='string'||!/^[a-f0-9]{64}$/.test(body.accessToken)||!access||!timingSafeEqual(Buffer.from(access.hash,'hex'),Buffer.from(hash(body.accessToken),'hex')))return reply({error:'This private meal link is not valid.'},403);
      const p=await protection(guest.id);
      if(p?.protected)return reply({error:'These choices are PIN-protected. Select your name and enter your four-digit PIN.'},403);
      version=access.version;channel='traveler-link';
     }else{
      if(!revealed)return reply({error:'The traveler list is not yet available.'},403);
      const p=await protection(guest.id);
      if(p?.protected){
       const ip=request.headers.get('x-nf-client-connection-ip')||'unknown';
       if(!await consumeAttempt('pin-ip:'+ip,25)||!await consumeAttempt('pin-guest:'+guest.id,10))return reply({error:'Too many PIN attempts. Please wait 15 minutes or contact Xavier.'},429);
       if(!validPin(body.pin,p))return reply({error:'Enter this traveler’s four-digit PIN.'},403);
       channel='pin';
      }else channel='public';
      version=p?.version||'public';
     }
    }
    const old=tokenOf(request);if(old)await store().delete('session/'+hash(old));
    const token=randomBytes(32).toString('hex');
    await store().setJSON('session/'+hash(token),{guestId:guest.id,version,channel,expires:Date.now()+7*86400000});
    return reply({ok:true},200,{'Set-Cookie':`${cookieName}=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=604800`});
   }
   if(body.action==='set-protection'){
    const guest=await authenticatedGuest(request,guests);if(!guest)return reply({error:'Open your choices before changing protection.'},401);
    if(body.guestId!==guest.id)return reply({error:'Reload this traveler before continuing.'},409);
    const current=await store().getWithMetadata('protection/'+guest.id,{type:'json'});
    const old=current?.data as Protection|undefined;
    if(typeof body.protected!=='boolean'||body.protected&&(typeof body.pin!=='string'||!/^\d{4}$/.test(body.pin)))return reply({error:'Choose a four-digit PIN.'},400);
    if(old?.protected&&guest.actor.type!=='td'){
     if(!await consumeAttempt('change-pin:'+guest.id,10))return reply({error:'Too many PIN attempts. Please wait 15 minutes.'},429);
     if(!validPin(body.currentPin,old))return reply({error:'Enter your current PIN to change protection.'},403);
    }
    const salt=randomBytes(16).toString('hex'),version=randomBytes(16).toString('hex');
    const value:Protection={protected:body.protected,version,...(body.protected?{salt,hash:scryptSync(body.pin,salt,64).toString('hex')}:{})};
    const saved=await store().setJSON('protection/'+guest.id,value,current?{onlyIfMatch:current.etag}:{onlyIfNew:true});
    if(!saved.modified)return reply({error:'Protection changed in another window. Reload before continuing.'},409);
    const token=tokenOf(request)!;const session=await store().get('session/'+hash(token),{type:'json'}) as Session;
    if(session.channel==='public'||session.channel==='pin')await store().setJSON('session/'+hash(token),{...session,version,channel:body.protected?'pin':'public'});
    return reply({ok:true,message:body.protected?'Your choices are now PIN-protected.':'Your choices are now public. Anyone can edit them by selecting your name.'});
   }
   if(!await hasTDSession(request))return reply({error:'Sign in to TD Suitcase.'},401);
   if(body.action==='generate-links'){
    let count=0;for(const guest of guests)if(await generateLink(guest.id))count++;
    return reply({ok:true,message:`${count} private traveler link${count===1?'':'s'} created. Existing links were kept.`});
   }
   if(body.action==='reveal-link'||body.action==='replace-link'){
    const guest=guests.find(g=>g.id===body.guestId);if(!guest)return reply({error:'Choose a current traveler.'},400);
    if(body.action==='replace-link'){await generateLink(guest.id,true);return reply({ok:true,message:'Private link replaced. The previous link and its meal sessions no longer work. Saved choices are unchanged.'});}
    const access=await store().get('access/'+guest.id,{type:'json'}) as Access|null;if(!access)return reply({error:'Create private traveler links first.'},400);
    const token=decryptPin(access);
    return reply({url:new URL('/meal-choices',request.url).href+'#access='+guest.id+'.'+token});
   }
   if(body.action==='update-deadlines'){
    if((body.revision||null)!==settings.revision)return reply({error:'Deadlines changed in another window. Refresh before saving.'},409);
    if(!body.deadlines||typeof body.deadlines!=='object'||Array.isArray(body.deadlines)||Object.keys(body.deadlines).length!==menus.length||Object.keys(body.deadlines).some(id=>!menus.some(m=>m.id===id)))return reply({error:'Set a deadline for each of the five meals.'},400);
    const deadlines:MealDeadlines={};
    for(const menu of menus){
     const value=body.deadlines[menu.id];
     if(typeof value!=='string'||value.length>50||!/(Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value)))return reply({error:`Enter a date and time for ${menu.title}.`},400);
     const next=new Date(value).toISOString(),old=settings.deadlines[menu.id];
     if(next!==old&&Date.now()>=Date.parse(old))return reply({error:`${menu.title} is already closed. Its deadline cannot be changed.`,...metadata(settings)},423);
     if(next!==old&&Date.parse(next)<=Date.now())return reply({error:`Choose a future deadline for ${menu.title}.`},400);
     deadlines[menu.id]=next;
    }
    const saved=await store().setJSON('settings/deadlines',{deadlines,updatedAt:new Date().toISOString()},settings.revision?{onlyIfMatch:settings.revision}:{onlyIfNew:true});
    if(!saved.modified)return reply({error:'Deadlines changed in another window. Refresh before saving.'},409);
    settings={deadlines,revision:saved.etag||null};
    return reply({ok:true,message:'Meal deadlines saved.',...metadata(settings)});
   }
   if(!MEAL_PINS_REQUIRED)return reply({error:'Traveler meal PINs are paused on the prototype.'},409);
   if(body.action==='generate-missing'){
    let count=0;for(const g of guests)if(await generate(g.id))count++;
    return reply({ok:true,message:`${count} new traveler PIN${count===1?'':'s'} generated. Existing PINs were kept.`});
   }
   const guest=guests.find(g=>g.id===body.guestId);if(!guest)return reply({error:'Choose a current traveler.'},400);
   if(body.action==='replace-pin'){await generate(guest.id,true);return reply({ok:true,message:'PIN replaced. Previous PIN and meal sign-in sessions are no longer valid.'});}
   if(body.action==='reveal-pin'){
    const credential=await store().get('pin/'+guest.id,{type:'json'}) as Credential|null;
    if(!credential)return reply({error:'Generate traveler PINs first.'},400);
    return reply({pin:decryptPin(credential),guest:{id:guest.id,name:guest.name}});
   }
   return reply({error:'Unknown action.'},400);
  }
  const guest=await authenticatedGuest(request,guests);if(!guest)return reply({error:'Open your private meal link to continue.'},401);
  if(body.guestId!==guest.id)return reply({error:'The selected traveler changed in another tab. Reload and choose your name before saving.'},409);
  if(body.action!=='save'&&body.action!=='submit')return reply({error:'Choose Save draft or Submit choices.'},400);
  if(!(body.revision===null||typeof body.revision==='string'))return reply({error:'Refresh your choices before saving.'},400);
  const requested=body.menuId||'all';
  if(requested!=='all'&&!menus.some(m=>m.id===requested))return reply({error:'Choose an available meal.'},400);
  let locks=mealLocks(settings.deadlines);
  const targets=menus.filter(m=>(requested==='all'||m.id===requested)&&!locks[m.id]).map(m=>m.id);
  if(!targets.length)return reply({error:'The deadline has passed for this meal. Its choices are read-only.',...metadata(settings)},423);
  let clean;try{clean=validateSubmission(body,body.action==='submit',targets);}catch(e){return reply({error:e instanceof Error?e.message:'Check your choices.'},400);}
  const previous=await store().getWithMetadata('choice/'+guest.id,{type:'json'});
  if((previous?.etag||null)!==body.revision)return reply({error:'Your choices changed in another window. Reload before saving.'},409);
  // Recheck settings and server time immediately before saving. Closed meals are never overwritten.
  settings=await deadlineSettings();locks=mealLocks(settings.deadlines);
  if(targets.some(id=>locks[id]))return reply({error:'A meal deadline has just passed. Reload to continue with the remaining open meals.',...metadata(settings)},423);
  const old=previous?.data as MealSubmission|undefined;
  const selections={...old?.selections},mealStates:Record<string,MealState>={};
  for(const menu of menus){const saved=mealState(old,menu.id);if(saved)mealStates[menu.id]=saved;}
  const now=new Date().toISOString();
  for(const id of targets){
   selections[id]=clean.selections[id];
   mealStates[id]={status:body.action==='submit'?'submitted':'draft',dietary:clean.dietary,updatedAt:now,submittedAt:body.action==='submit'?now:null};
  }
  const allSubmitted=menus.every(m=>mealStates[m.id]?.status==='submitted');
  const entry:MealAuditEntry={id:randomBytes(16).toString('hex'),at:now,actor:guest.actor,action:body.action,meals:targets.map(id=>({menuId:id,before:{choices:old?.selections[id]||{},state:mealState(old,id)},after:{choices:selections[id],state:mealStates[id]}}))};
  const submission:MealSubmission={selections,mealStates,dietary:clean.dietary,status:allSubmitted?'submitted':'draft',updatedAt:now,submittedAt:allSubmitted?now:null,audit:[...(old?.audit||[]),entry]};
  const saved=await store().setJSON('choice/'+guest.id,submission,previous?{onlyIfMatch:previous.etag}:{onlyIfNew:true});
  if(!saved.modified)return reply({error:'Your choices changed in another window. Reload before saving.'},409);
  return reply({submission:travelerSubmission(submission),revision:saved.etag,...metadata(settings)});
 }catch(e){return reply({error:e instanceof Error&&e.message==='Meal PIN setup is not complete.'?e.message:'Meal choices are temporarily unavailable. Please try again.'},503);}
}
export const config:Config={path:'/api/meal-choices',rateLimit:{windowLimit:90,windowSize:60,aggregateBy:['ip','domain']}};
