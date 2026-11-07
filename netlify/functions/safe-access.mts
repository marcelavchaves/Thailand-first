import type {Config} from '@netlify/functions';
import {hasTDSession,sameOrigin} from '../lib/td-auth';
import {rosterData,type RosterData} from '../lib/safe-roster';
import {getStore} from '@netlify/blobs';
import {safeStore,normalizeEmail,type SafeAccessSettings,type SafeAccess} from '../lib/safe-auth';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie'}});
export default async function handler(request:Request){try{
 if(!await hasTDSession(request))return reply({error:'Sign in to TD Suitcase.'},401);
 if(!['GET','PUT'].includes(request.method))return reply({error:'Method not allowed.'},405);
 if(request.method==='PUT'&&!sameOrigin(request))return reply({error:'Open this action in the app.'},403);
 const rosterItem=await getStore({name:'guest-profiles',consistency:'strong'}).getWithMetadata('roster',{type:'json'}),roster=rosterData(rosterItem?.data as RosterData|undefined).guests;
 const store=safeStore('access'),record=await store.getWithMetadata('assignments',{type:'json'}),settings=record?.data as SafeAccessSettings|undefined;
 if(request.method==='GET')return reply({revision:record?.etag||null,rosterRevision:rosterItem?.etag||null,guests:roster.map(g=>({id:g.id,name:g.name,safeId:g.safeId,emails:settings?.safes[g.safeId!]?.guestId===g.id?settings.safes[g.safeId!].emails:[]}))});
 const raw=await request.text();if(raw.length>150000)return reply({error:'This list is too large.'},413);let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid request.'},400);}
 if(body.revision!==(record?.etag||null)||body.rosterRevision!==(rosterItem?.etag||null))return reply({error:'The Safe access or guest list changed. Reload before saving.'},409);
 if(!Array.isArray(body.guests)||body.guests.length!==roster.length)return reply({error:'Reload the guest list.'},400);
 const seen=new Set<string>(),ids=new Set<string>(),safes:Record<string,SafeAccess>={};
 for(const row of body.guests){if(!row||typeof row.id!=='string')return reply({error:'Reload the guest list.'},400);const guest=roster.find(g=>g.id===row.id);if(!guest||ids.has(row.id)||!Array.isArray(row.emails)||row.emails.length>4)return reply({error:'Use up to four authorized emails per Safe.'},400);ids.add(row.id);
  const emails:string[]=[];for(const value of row.emails){const email=normalizeEmail(value);if(!email||seen.has(email))return reply({error:'Use valid email addresses, each assigned to only one Safe.'},400);seen.add(email);emails.push(email);}
  const prior=settings?.safes[guest.safeId!],subjects=Object.fromEntries(emails.filter(email=>prior?.guestId===guest.id&&prior.subjects[email]).map(email=>[email,prior!.subjects[email]]));safes[guest.safeId!]={safeId:guest.safeId!,guestId:guest.id,emails,subjects};
 }
 const current=await getStore({name:'guest-profiles',consistency:'strong'}).getWithMetadata('roster',{type:'json'});if((current?.etag||null)!==body.rosterRevision)return reply({error:'The guest list changed. Reload before saving.'},409);
 if(!(await store.setJSON('assignments',{...settings,safes},record?{onlyIfMatch:record.etag}:{onlyIfNew:true})).modified)return reply({error:'Safe access changed in another window. Reload before saving.'},409);
 return reply({saved:true});
}catch{return reply({error:'Unable to manage Safe access. Please try again.'},503);}}
export const config:Config={path:'/api/safe-access'};
