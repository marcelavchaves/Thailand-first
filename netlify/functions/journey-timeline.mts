import {announce} from '../lib/updates';
import type {Config} from '@netlify/functions';
import {getStore} from '@netlify/blobs';
import {hasTDSession,sameOrigin} from '../lib/td-auth';
import {currentItinerary} from '../lib/current-itinerary';
import snapshot from '../data/itinerary-content.json';
import {importedReleaseEntries,importedSchedule,TOUR_IMPORT_VERSION} from '../../shared/tour-import.mjs';
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
const validDay=(day:unknown)=>typeof day==='number'&&Number.isInteger(day)&&day>=5&&day<=20;
export default async function handler(request:Request, context:{waitUntil?:(promise:Promise<unknown>)=>void}){
 try{
  const store=getStore({name:'journey-timelines',consistency:'strong'});
  if(request.method==='GET'){
   const day=Number(new URL(request.url).searchParams.get('day'));
   if(!validDay(day))return reply({error:'Choose a valid journey day.'},400);
   const raw:any=await getStore({name:'tour-resources',consistency:'strong'}).get(`entry/schedule-${day}`,{type:'json'});
   const release=importedReleaseEntries(raw?{[`schedule-${day}`]:raw}:{})[`schedule-${day}`];
   if((!release?.visible||release?.deleted)&&!(await hasTDSession(request)))return reply({schedule:{events:[['COMING SOON','Xavier will share this day’s schedule when it’s ready.']],note:''},revision:null});
   const result=await store.getWithMetadata(`day/${day}`,{type:'json'});
   return reply({schedule:importedSchedule(snapshot,day,result?.data),revision:result?.etag||null});
  }
  if(request.method!=='PUT')return reply({error:'Method not allowed.'},405);
  if(!sameOrigin(request))return reply({error:'Open this action from the journey app.'},403);
  if(!(await hasTDSession(request)))return reply({error:'Sign in using TD Suitcase.'},401);
  const raw=await request.text();if(raw.length>40000)return reply({error:'This schedule is too long.'},400);
  let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid schedule.'},400);}
  if(!body||!validDay(body.day)||!Array.isArray(body.events)||body.events.length<1||body.events.length>24||typeof body.note!=='string'||body.note.length>1200||!(body.revision===null||typeof body.revision==='string'))return reply({error:'Use 1–24 activities and a reminder of at most 1,200 characters.'},400);
  if(!body.events.every((e:unknown)=>Array.isArray(e)&&e.length===2&&e.every(x=>typeof x==='string'&&x.trim())&&e[0].length<=80&&e[1].length<=1200))return reply({error:'Each activity needs a time or label (up to 80 characters) and a description (up to 1,200 characters).'},400);
  const schedule={importVersion:TOUR_IMPORT_VERSION,events:body.events.map((e:string[])=>e.map(v=>v.trim())),note:body.note.trim(),updatedAt:new Date().toISOString()};
  const saved=await store.setJSON(`day/${body.day}`,schedule,body.revision===null?{onlyIfNew:true}:{onlyIfMatch:body.revision});
  if(!saved.modified)return reply({error:'This day changed in another window. Cancel, reopen the editor, and apply your changes to the latest schedule.'},409);
  await announce({action:`Updated the Day ${body.day-4} schedule: ${schedule.events[0][0]} ${schedule.events[0][1]}`.slice(0,150),section:'Journey',day:body.day,url:`/?tab=journey&day=${body.day-4}`},context);
  let pdfReady=true;try{await currentItinerary();}catch{pdfReady=false;}
  return reply({schedule,revision:saved.etag,pdfReady});
 }catch{return reply({error:'Unable to load or save this schedule. Please try again.'},500);}
}
export const config:Config={path:'/api/journey-timeline'};
