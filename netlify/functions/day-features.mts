import type {Config} from '@netlify/functions';
import {getStore} from '@netlify/blobs';
import {hasTDSession,sameOrigin} from '../lib/td-auth';
import {dayFeatureStore} from '../lib/day-features';
import {featureKeys,cleanDayFeatures} from '../../lib/day-features';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
export default async function handler(request:Request){
 try{
  if(request.method==='GET'){
   const days=await Promise.all(Array.from({length:16},async(_,i)=>{const day=i+5,r=await dayFeatureStore().getWithMetadata('day/'+day,{type:'json'});return [day,{features:cleanDayFeatures(r?.data),revision:r?.etag||null}];}));
   return reply({days:Object.fromEntries(days)});
  }
  if(request.method!=='PUT')return reply({error:'Method not allowed.'},405);
  if(!sameOrigin(request))return reply({error:'Open this action from the app.'},403);
  if(!await hasTDSession(request))return reply({error:'Sign in to TD Suitcase.'},401);
  const raw=await request.text();if(raw.length>2000)return reply({error:'Visibility form is too large.'},413);
  let body;try{body=JSON.parse(raw);}catch{return reply({error:'Check the day settings.'},400);}
  if(!body||!Number.isInteger(body.day)||body.day<5||body.day>20||!(body.revision===null||typeof body.revision==='string')||!body.features||typeof body.features!=='object'||Array.isArray(body.features)||Object.keys(body.features).length!==featureKeys.length||featureKeys.some(k=>typeof body.features[k]!=='boolean')||Object.keys(body.features).some(k=>!featureKeys.includes(k as typeof featureKeys[number])))return reply({error:'Choose a valid day and show/hide options.'},400);
  if(body.features.announcement){const note=await getStore({name:'xavier-daily-notes',consistency:'strong'}).get('day/'+body.day,{type:'json'}) as {text?:string}|null;if(!note?.text?.trim())return reply({error:'Save an announcement for this day before showing it to travelers.'},400);}
  const previous=await dayFeatureStore().getWithMetadata('day/'+body.day,{type:'json'});
  if((previous?.etag||null)!==body.revision)return reply({error:'Day options changed in another window. Refresh and try again.'},409);
  const features=cleanDayFeatures(body.features),saved=await dayFeatureStore().setJSON('day/'+body.day,features,previous?{onlyIfMatch:previous.etag}:{onlyIfNew:true});
  if(!saved.modified)return reply({error:'Day options changed in another window. Refresh and try again.'},409);
  return reply({features,revision:saved.etag||null});
 }catch{return reply({error:'Unable to load or save day options. Please try again.'},503);}
}
export const config:Config={path:'/api/day-features'};
