import {build} from 'esbuild';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {TOUR_IMPORT_VERSION} from '../shared/tour-import.mjs';
await mkdir('.pdf-build',{recursive:true});
globalThis.importTest={stores:new Map(),td:false,sequence:0};
const storage=`export function getStore({name}){const state=globalThis.importTest;if(!state.stores.has(name))state.stores.set(name,new Map());const map=state.stores.get(name);return {get:async k=>structuredClone(map.get(k)?.data??null),getWithMetadata:async k=>structuredClone(map.get(k)??null),list:async({prefix='' }={})=>({blobs:[...map.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key}))}),setJSON:async(k,data,o={})=>{const old=map.get(k);if(o.onlyIfNew&&old||o.onlyIfMatch&&old?.etag!==o.onlyIfMatch)return {modified:false};const etag=String(++state.sequence);map.set(k,{data:structuredClone(data),etag});return {modified:true,etag}},set:async(k,data)=>map.set(k,{data,etag:String(++state.sequence)}),delete:async k=>map.delete(k)}}`;
await build({stdin:{contents:'export {default as roster} from "./netlify/functions/guest-roster.mts";export {default as profiles} from "./netlify/functions/guest-profiles.mts";export {default as resources} from "./netlify/functions/tour-resources.mts";export {default as timeline} from "./netlify/functions/journey-timeline.mts";export {loadCurrentContent} from "./netlify/lib/current-itinerary";',resolveDir:process.cwd(),loader:'ts'},outfile:'.pdf-build/published-import.mjs',bundle:true,platform:'node',format:'esm',external:['sharp','pdfkit'],plugins:[{name:'storage-and-auth-only',setup(b){b.onResolve({filter:/^@netlify\/blobs$|\/td-auth$|\/updates$/},a=>({path:a.path,namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:a.path.endsWith('td-auth')?'export async function hasTDSession(){return globalThis.importTest.td} export async function identityReady(){return false} export function sameOrigin(r){return r.headers.get("origin")===new URL(r.url).origin}':a.path.endsWith('/updates')?'export async function announce(){}':storage}));}}]});
const {roster,profiles,resources,timeline,loadCurrentContent}=await import('../.pdf-build/published-import.mjs');
const state=globalThis.importTest;
const request=(path,body,method=body?'POST':'GET')=>new Request('https://example.test'+path,{method,headers:{Origin:'https://example.test','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
const json=async response=>{assert.equal(response.status,200);return response.json()};
const store=name=>{if(!state.stores.has(name))state.stores.set(name,new Map());return state.stores.get(name)};
const seed=(name,key,data,etag='old')=>store(name).set(key,{data,etag});
// Empty deployment: these are real handler responses, without mocked visibility.
let guests=await json(await roster(request('/api/guest-roster')));
assert.equal(guests.guests.length,16);assert.equal(guests.revealed,true);
const signupOrder=['Ms. Victoria Millett','Mr. Perry Thompson','Mr. Cooper Chilton','Mrs. Judy Chilton','Mr. Allan Weiner','Mrs. Elyse Weiner','Mr. Bob Heiber','Mrs. Robin Heiber','Mrs. Lisa Smucker','Mrs. Laurie Kruppa','Ms. Kimberly Stitzinger','Ms. Elle Green','Mr. George Graf','Ms. Julie Coover','Mrs. Michele Bell','Mr. Dave Bell'];
assert.deepEqual(guests.guests.map(g=>g.name),signupOrder);
assert.equal(Object.keys(await json(await profiles(request('/api/guest-profiles'),{}))).length,16);
let releases=await json(await resources(request('/api/tour-resources')));
for(let day=5;day<=18;day++){
 assert.equal(releases.items['schedule-'+day].visible,true);
 const data=await json(await timeline(request('/api/journey-timeline?day='+day),{}));
 assert.ok(data.schedule.events.length>0);assert.notEqual(data.schedule.events[0][0],'COMING SOON');
}
assert.equal((await json(await timeline(request('/api/journey-timeline?day=9'),{}))).schedule.events[3][0],'4:55 AM');
assert.equal((await json(await timeline(request('/api/journey-timeline?day=13'),{}))).schedule.events[2][0],'8:30 AM');
let pdf=await loadCurrentContent();assert.equal(pdf.content.guests.length,16);
assert.ok(pdf.content.sections.find(s=>s.title==='Our Travelers').blocks.some(b=>b.text==='Ms. Victoria Millett'));
// Correct an already imported row-major list without reassigning issued Safes.
const rowMajor=Array.from({length:8},(_,i)=>[guests.guests[i],guests.guests[i+8]]).flat();
const oldSafeIds=Object.fromEntries(rowMajor.map((g,i)=>[g.id,'TG'+String(i+1).padStart(2,'0')]));
seed('guest-profiles','roster',{guests:rowMajor,revealed:false,guestListVersion:TOUR_IMPORT_VERSION,safeAssignments:{byGuest:oldSafeIds,next:17}},'old-order');
state.td=true;
const sorted=await json(await roster(request('/api/guest-roster')));
assert.deepEqual(sorted.guests.map(g=>g.name),signupOrder);assert.equal(sorted.revealed,false);
assert.equal(sorted.guests[1].safeId,'TG03');assert.equal(sorted.guests[8].safeId,'TG02');
await json(await roster(request('/api/guest-roster',{guests:[...sorted.guests].reverse(),revision:sorted.revision})));
assert.deepEqual((await json(await roster(request('/api/guest-roster')))).guests.map(g=>g.name),[...signupOrder].reverse());
state.stores.clear();state.td=false;
// Existing deployment: old hides/edits cannot mask the newly approved import.
const id='11111111-1111-4111-8111-111111111111';
seed('guest-profiles','roster',{guests:[{id,name:'Victoria Millett',origin:'Old town',bio:'Approved introduction',phone:'',email:'',social:'',shareContact:false}],revealed:false,guestListVersion:'kd103-sm23-2026-10-17',safeAssignments:{byGuest:{[id]:'TG40',removed:'TG41'},next:42}});
seed('guest-profiles','guest/'+id,{intro:'Existing approved biography'});
seed('tour-resources','entry/schedule-9',{id:'schedule-9',title:'Old title',group:'schedules',visible:false,deleted:true});
seed('journey-timelines','day/9',{events:[['OLD','Outdated schedule']],note:'Old reminder'});
guests=await json(await roster(request('/api/guest-roster')));assert.equal(guests.guests.length,16);assert.equal(guests.guests[0].id,id);assert.equal(guests.guests[0].safeId,'TG40');assert.equal(guests.guests[1].safeId,'TG42');
assert.equal((await json(await profiles(request('/api/guest-profiles'),{})))[id].intro,'Existing approved biography');
assert.equal((await json(await resources(request('/api/tour-resources')))).items['schedule-9'].visible,true);
assert.equal((await json(await timeline(request('/api/journey-timeline?day=9'),{}))).schedule.events[0][0],'4:00 AM');
pdf=await loadCurrentContent();assert.equal(pdf.content.guests.length,16);assert.equal(pdf.content.data.days[4].events[0][0],'4:00 AM');
// Later TD control still wins: hide, edit and clear remain persistent.
state.td=true;
releases=await json(await resources(request('/api/tour-resources')));
await json(await resources(request('/api/tour-resources',{id:'schedule-9',title:'Day 5',group:'schedules',action:'hide',revision:releases.items['schedule-9'].revision},'PUT')));
const before=await json(await timeline(request('/api/journey-timeline?day=9'),{}));
const savedTimeline=await json(await timeline(request('/api/journey-timeline',{day:9,events:[['5:00 AM','New TD instruction']],note:'Updated after import',revision:before.revision},'PUT'),{}));
assert.equal(savedTimeline.pdfReady,true);
const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
const cached=[...store('journey-pdfs').values()].at(-1).data;
const document=await getDocument({data:new Uint8Array(cached),useSystemFonts:true,isEvalSupported:false}).promise;
let pdfText='';for(let i=1;i<=document.numPages;i++){const page=await document.getPage(i);pdfText+=' '+(await page.getTextContent()).items.filter(x=>'str'in x).map(x=>x.str).join(' ');}
const compact=text=>text.replace(/\s+/g,'');
for(const guest of guests.guests)assert.ok(compact(pdfText).includes(compact(guest.name)),guest.name+' missing from live PDF');
assert.ok(pdfText.includes('Existing approved biography'));
assert.equal(store('journey-timelines').get('day/9').data.importVersion,TOUR_IMPORT_VERSION);
assert.equal((await json(await timeline(request('/api/journey-timeline?day=9'),{}))).schedule.events[0][0],'5:00 AM');
const editor=await json(await roster(request('/api/guest-roster')));
await json(await roster(request('/api/guest-roster',{revealed:false,revision:editor.revision})));
state.td=false;
assert.deepEqual((await json(await roster(request('/api/guest-roster')))).guests,[]);
assert.deepEqual(await json(await profiles(request('/api/guest-profiles'),{})),{});
assert.equal((await json(await timeline(request('/api/journey-timeline?day=9'),{}))).schedule.events[0][0],'COMING SOON');
pdf=await loadCurrentContent();assert.equal(pdf.content.guests.length,0);assert.equal(pdf.content.data.days[4].events[0][0],'COMING SOON');
assert.equal(pdf.content.data.days[5].events[0][0],'7:00 AM');
state.td=true;const current=await json(await roster(request('/api/guest-roster')));await json(await roster(request('/api/guest-roster',{guests:[],revision:current.revision})));state.td=false;
assert.equal((await json(await roster(request('/api/guest-roster')))).guestCount,0);
console.log('PASS real handlers: published 16-guest/14-day import on empty and legacy stores, preserved Safe/profile IDs, live PDF content, and persistent subsequent TD hides/edits/removals.');
