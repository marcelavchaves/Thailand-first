import {guestCardFeatures} from '../../lib/guest-card-features';
import type {Config} from '@netlify/functions';
import {getStore} from '@netlify/blobs';
import {hasTDSession,sameOrigin} from '../lib/td-auth';
import {cleanGuests,publicGuests} from '../../lib/guest-roster';
import {rosterData,type RosterData} from '../lib/safe-roster';
import {assignSafeIds} from '../../lib/safe-ids';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export default async function handler(request:Request){try{
 const td=await hasTDSession(request);
 if(!['GET','POST'].includes(request.method))return reply({error:'Method not allowed.'},405);
 if(request.method==='POST'&&!td)return reply({error:'Sign in to TD Suitcase to manage guests.'},401);
 if(request.method==='POST'&&!sameOrigin(request))return reply({error:'Open this action in the app.'},403);
 const store=getStore({name:'guest-profiles',consistency:'strong'});
 const item=await store.getWithMetadata('roster',{type:'json'});
 const data=rosterData(item?.data as RosterData|undefined);
 const {guests,revealed}=data;
 if(request.method==='GET'){
  const visible=td?guests:revealed?publicGuests(guests):[];
  // Project only preferred names; private rooming, groups and observations never enter this response.
  const manifest=visible.length?await getStore({name:'hotel-manifests-v1',consistency:'strong'}).get('manifest',{type:'json'}) as {guests?:Record<string,{preferredName?:string}>}|null:null;
  return reply({guests:visible.map(g=>({...g,preferredName:manifest?.guests?.[g.id]?.preferredName||''})),guestCount:guests.length,revealed,guestCardFeatures:data.guestCardFeatures,...(td?{revision:item?.etag||null}:{})});
 }
 const raw=await request.text();if(raw.length>250000)return reply({error:'Guest list is too large.'},413);
 let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid request.'},400);}
 if((body.revision||null)!==(item?.etag||null))return reply({error:'The guest list changed. Reload it before saving.'},409);
 if(body.revealed!==undefined&&typeof body.revealed!=='boolean')return reply({error:'Choose Hidden or Revealed.'},400);
 if(body.guestCardFeatures!==undefined&&(!body.guestCardFeatures||typeof body.guestCardFeatures!=='object'||Array.isArray(body.guestCardFeatures)||Object.keys(body.guestCardFeatures).some(key=>!['safe','mealChoices'].includes(key))||Object.values(body.guestCardFeatures).some(value=>typeof value!=='boolean')))return reply({error:'Choose enabled or disabled for each guest card feature.'},400);
 let next;try{next=cleanGuests(body.guests===undefined?guests:body.guests);}catch(e){return reply({error:e instanceof Error?e.message:'Check guest details.'},400);}
 const saved=await store.setJSON('roster',{guestCardFeatures:guestCardFeatures({...data.guestCardFeatures,...body.guestCardFeatures}),guestOrderVersion:data.guestOrderVersion,guestListVersion:data.guestListVersion,...assignSafeIds(next,data.safeAssignments),revealed:body.revealed===undefined?revealed:body.revealed},item?{onlyIfMatch:item.etag}:{onlyIfNew:true});
 if(!saved.modified)return reply({error:'The guest list changed. Reload it before saving.'},409);
 return reply({ok:true,revision:saved.etag});
 }catch{return reply({error:'The guest list is temporarily unavailable.'},500);}}
export const config:Config={path:'/api/guest-roster',rateLimit:{windowLimit:60,windowSize:60,aggregateBy:['ip','domain']}};
