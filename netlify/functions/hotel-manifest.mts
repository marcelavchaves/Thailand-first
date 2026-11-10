import {currentDietary} from '../lib/guest-dietary';
import {menus,mealState,type MealSubmission} from '../../lib/meal-choices';
import {hotelManifestXlsx} from '../lib/hotel-manifest-xlsx';
import type {Config} from '@netlify/functions';
import {getStore} from '@netlify/blobs';
import {hasTDSession,sameOrigin} from '../lib/td-auth';
import {rosterData,type RosterData} from '../lib/safe-roster';
import {MANIFEST_SITE_ID,LIVE_MANIFEST_SITE_ID,manifestDefaults,cleanManifest,checkExport,manifestHotels,type HotelManifest} from '../../lib/hotel-manifest';
import {hotelManifestPdf} from '../lib/hotel-manifest-pdf.mjs';
const headers={'Cache-Control':'no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'};
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers});
export default async function handler(request:Request){try{
 if(![MANIFEST_SITE_ID,LIVE_MANIFEST_SITE_ID].includes(Netlify.env.get('SITE_ID')||process.env.SITE_ID||''))return reply({error:'Not found.'},404);
 if(!await hasTDSession(request))return reply({error:'Sign in to TD Suitcase.'},401);
 if(!['GET','PUT','POST'].includes(request.method))return reply({error:'Method not allowed.'},405);
 if(request.method!=='GET'&&!sameOrigin(request))return reply({error:'Open this action in the app.'},403);
 const rosterItem=await getStore({name:'guest-profiles',consistency:'strong'}).getWithMetadata('roster',{type:'json'});
 const roster=rosterData(rosterItem?.data as RosterData|undefined).guests;
 const store=getStore({name:'hotel-manifests-v1',consistency:'strong'}),item=await store.getWithMetadata('manifest',{type:'json'});
 const data=manifestDefaults(roster,item?.data as HotelManifest|undefined);
 const meals=getStore({name:'meal-choices-v1',consistency:'strong'});
 const dietaryRecords=Object.fromEntries(await Promise.all(roster.map(async g=>[g.id,await meals.getWithMetadata('choice/'+g.id,{type:'json'})])));
 const dietaryRevisions=Object.fromEntries(roster.map(g=>[g.id,dietaryRecords[g.id]?.etag||null]));
 for(const g of roster)data.guests[g.id].dietary=currentDietary(dietaryRecords[g.id]?.data as MealSubmission|null,data.guests[g.id].dietary||'');
 const u=new URL(request.url),format=u.searchParams.get('format'),hotel=u.searchParams.get('hotel')||'';
 if(request.method==='GET'){
  if(format==='csv')return new Response(null,{status:307,headers:{...headers,Location:`/api/hotel-manifest?format=xlsx&hotel=${encodeURIComponent(hotel)}`}});
  if(format){
   if(!['pdf','xlsx'].includes(format)||!manifestHotels.some(h=>h.id===hotel))return reply({error:'Choose a hotel and PDF or Excel.'},400);
   if(format==='pdf')return new Response(new Uint8Array(await hotelManifestPdf(data,hotel,roster)),{headers:{...headers,'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="Wondercase-${hotel}-manifest.pdf"`}});
   return new Response(new Uint8Array(hotelManifestXlsx(data,hotel,roster)),{headers:{...headers,'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':`attachment; filename="Wondercase-${hotel}-manifest.xlsx"`}});
  }
  return reply({data,dietaryRevisions,revision:item?.etag||null,rosterRevision:rosterItem?.etag||null,guests:roster.map(g=>({id:g.id,name:g.name})),hotels:manifestHotels});
 }
 if(request.method==='POST'&&(!['pdf','xlsx'].includes(format||'')||!manifestHotels.some(h=>h.id===hotel)))return reply({error:'Choose a hotel PDF preview.'},400);
 const raw=await request.text();if(raw.length>2500000)return reply({error:'Manifest is too large.'},413);
 let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid manifest.'},400);}
 if(body.revision!==(item?.etag||null)||body.rosterRevision!==(rosterItem?.etag||null))return reply({error:'The manifest or guest list changed. Reload before saving.'},409);
 let next:HotelManifest;try{next=cleanManifest(body.data,roster);}catch(e){return reply({error:(e as Error).message},400);}
  const changed=Array.isArray(body.dietaryChanges)?body.dietaryChanges:roster.filter(g=>next.guests[g.id].dietary!==(item?.data as HotelManifest|undefined)?.guests?.[g.id]?.dietary).map(g=>g.id);
 if(changed.some((id:unknown)=>typeof id!=='string'||!roster.some(g=>g.id===id)))return reply({error:'Reload the guest list.'},400);
 for(const g of roster)if(!changed.includes(g.id))next.guests[g.id].dietary=data.guests[g.id].dietary;
 if(request.method==='POST')return format==='pdf'?new Response(new Uint8Array(await hotelManifestPdf(next,hotel,roster)),{headers:{...headers,'Content-Type':'application/pdf','Content-Disposition':u.searchParams.get('preview')==='1'?'inline; filename="hotel-manifest-preview.pdf"':'attachment; filename="hotel-manifest.pdf"'}}):new Response(new Uint8Array(hotelManifestXlsx(next,hotel,roster)),{headers:{...headers,'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':'attachment; filename="hotel-manifest.xlsx"'}});
 for(const id of changed)if(body.dietaryRevisions&&body.dietaryRevisions[id]!==dietaryRevisions[id])return reply({error:'Dietary restrictions changed in Meal choices. Reload the manifest before saving.'},409);
 // Check for a concurrent roster edit again before committing guest-keyed settings.
 const current=await getStore({name:'guest-profiles',consistency:'strong'}).getWithMetadata('roster',{type:'json'});
 if((current?.etag||null)!==body.rosterRevision)return reply({error:'The guest list changed. Reload before saving.'},409);
 const saved=await store.setJSON('manifest',next,item?{onlyIfMatch:item.etag}:{onlyIfNew:true});if(!saved.modified)return reply({error:'Another TD updated this manifest. Reload before saving.'},409);
 for(const id of changed){const record=dietaryRecords[id],prior=record?.data as MealSubmission|undefined;
  const choice={...(prior||{selections:{},mealStates:{},status:'draft',submittedAt:null,audit:[]}),...(prior&&!prior.mealStates?{mealStates:Object.fromEntries(menus.map(m=>[m.id,mealState(prior,m.id)]))}:{}),dietary:next.guests[id].dietary||'',dietarySynced:true,updatedAt:new Date().toISOString()};
  const result=await meals.setJSON('choice/'+id,choice,record?{onlyIfMatch:record.etag}:{onlyIfNew:true});if(!result.modified)return reply({error:'The manifest saved, but dietary restrictions changed at the same time. Reload to see the latest notes.'},409);dietaryRevisions[id]=result.etag||null;
 }
 return reply({revision:saved.etag,data:next,dietaryRevisions});
}catch{return reply({error:'Unable to load or save the hotel manifest. Please try again.'},500);}}
export const config:Config={path:'/api/hotel-manifest'};
