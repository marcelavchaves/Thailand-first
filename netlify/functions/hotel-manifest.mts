import type {Config} from '@netlify/functions';
import {getStore} from '@netlify/blobs';
import {hasTDSession,sameOrigin} from '../lib/td-auth';
import {rosterData,type RosterData} from '../lib/safe-roster';
import {MANIFEST_SITE_ID,manifestDefaults,cleanManifest,checkExport,manifestHotels,type HotelManifest} from '../../lib/hotel-manifest';
import {hotelManifestPdf} from '../lib/hotel-manifest-pdf.mjs';
const headers={'Cache-Control':'no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'};
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers});
export default async function handler(request:Request){try{
 if((Netlify.env.get('SITE_ID')||process.env.SITE_ID)!==MANIFEST_SITE_ID)return reply({error:'Not found.'},404);
 if(!await hasTDSession(request))return reply({error:'Sign in to TD Suitcase.'},401);
 if(!['GET','PUT'].includes(request.method))return reply({error:'Method not allowed.'},405);
 if(request.method==='PUT'&&!sameOrigin(request))return reply({error:'Open this action in the app.'},403);
 const rosterItem=await getStore({name:'guest-profiles',consistency:'strong'}).getWithMetadata('roster',{type:'json'});
 const roster=rosterData(rosterItem?.data as RosterData|undefined).guests;
 const store=getStore({name:'hotel-manifests-v1',consistency:'strong'}),item=await store.getWithMetadata('manifest',{type:'json'});
 const data=manifestDefaults(roster,item?.data as HotelManifest|undefined);
 const u=new URL(request.url),format=u.searchParams.get('format'),hotel=u.searchParams.get('hotel')||'';
 if(request.method==='GET'){
  if(format){
   if(!['pdf','csv'].includes(format)||!manifestHotels.some(h=>h.id===hotel))return reply({error:'Choose a hotel and PDF or CSV.'},400);
   try{checkExport(data,hotel,roster);}catch(e){return reply({error:(e as Error).message},400);}
   if(format==='pdf')return new Response(new Uint8Array(await hotelManifestPdf(data,hotel,roster)),{headers:{...headers,'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="Wondercase-${hotel}-manifest.pdf"`}});
   const sheet=data.hotels[hotel];const cell=(v:string)=>'"'+(/^[=+@\-\t\r]/.test(v)?"'"+v:v).replaceAll('"','""')+'"';
   const hotelName=manifestHotels.find(h=>h.id===hotel)!.name;
   const rows=[['Hotel','Arrival','Departure','Tour','Tour number','Hotel notes','IMPORTANT hotel observations','Guest number','Full name','Preferred name','Traveling-together group','Notes for every hotel','IMPORTANT observations for every hotel','Room group','Bed request','Hotel notes','IMPORTANT observations'],...roster.map(g=>{const s=data.guests[g.id],r=sheet.entries[g.id];return [hotelName,sheet.arrival,sheet.departure,data.tourName,data.tourNumber,sheet.notes,sheet.important,s.number,g.name,s.preferredName,s.travelGroup,s.notes,s.important,r.room,r.bed,r.notes,r.important];})];
   return new Response('\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\r\n'),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="Wondercase-${hotel}-manifest.csv"`}});
  }
  return reply({data,revision:item?.etag||null,rosterRevision:rosterItem?.etag||null,guests:roster.map(g=>({id:g.id,name:g.name})),hotels:manifestHotels});
 }
 const raw=await request.text();if(raw.length>2500000)return reply({error:'Manifest is too large.'},413);
 let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid manifest.'},400);}
 if(body.revision!==(item?.etag||null)||body.rosterRevision!==(rosterItem?.etag||null))return reply({error:'The manifest or guest list changed. Reload before saving.'},409);
 let next:HotelManifest;try{next=cleanManifest(body.data,roster);}catch(e){return reply({error:(e as Error).message},400);}
 // Check for a concurrent roster edit again before committing guest-keyed settings.
 const current=await getStore({name:'guest-profiles',consistency:'strong'}).getWithMetadata('roster',{type:'json'});
 if((current?.etag||null)!==body.rosterRevision)return reply({error:'The guest list changed. Reload before saving.'},409);
 const saved=await store.setJSON('manifest',next,item?{onlyIfMatch:item.etag}:{onlyIfNew:true});if(!saved.modified)return reply({error:'Another TD updated this manifest. Reload before saving.'},409);
 return reply({revision:saved.etag,data:next});
}catch{return reply({error:'Unable to load or save the hotel manifest. Please try again.'},500);}}
export const config:Config={path:'/api/hotel-manifest'};
