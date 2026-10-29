import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd(),temp=await mkdtemp(join(root,'.meal-tests-'));
const RealDate=Date;
const state={stores:new Map(),td:false,now:RealDate.parse('2026-11-16T10:00:00Z'),site:'c1f3ce92-834f-4a1e-a84b-1551409ddb7b',sequence:0};
globalThis.mealTest=state;
globalThis.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[state.now]));}static now(){return state.now;}};
globalThis.Netlify={env:{get:k=>k==='SITE_ID'?state.site:k==='MEAL_PIN_ENCRYPTION_KEY'?'a'.repeat(64):k==='PROTOTYPE_TD_SETUP_HASH'?createHash('sha256').update('b'.repeat(64)).digest('hex'):k==='PROTOTYPE_TD_SETUP_EXPIRES'?'2026-12-01T00:00:00Z':undefined}};
const storage=`export function getStore({name}){const s=globalThis.mealTest;if(!s.stores.has(name))s.stores.set(name,new Map());const map=s.stores.get(name);return {get:async k=>structuredClone(map.get(k)?.data??null),getWithMetadata:async k=>structuredClone(map.get(k)??null),setJSON:async(k,data,options={})=>{const old=map.get(k);if(options.onlyIfNew&&old||options.onlyIfMatch&&options.onlyIfMatch!==old?.etag)return {modified:false};const etag=String(++s.sequence);map.set(k,{data:structuredClone(data),etag});return {modified:true,etag}},delete:async k=>map.delete(k)}}`;
try{
 await build({stdin:{contents:'export {default as handler} from "./netlify/functions/meal-choices.mts";export {default as setup} from "./netlify/functions/prototype-td-setup.mts"; export {menus,MEAL_DEADLINE,mealReport} from "./lib/meal-choices";',resolveDir:root,loader:'ts'},outfile:join(temp,'bundle.mjs'),bundle:true,platform:'node',format:'esm',external:['pdfkit'],plugins:[{name:'test-storage',setup(b){b.onResolve({filter:/^@netlify\/blobs$|\/td-auth$/},a=>({path:a.path,namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path.endsWith('/td-auth')?'export async function hasTDSession(){return globalThis.mealTest.td} export function sameOrigin(r){return r.headers.get("origin")===new URL(r.url).origin} export async function tdPasswordConfigured(){return !!globalThis.mealTest.stores.get("td-credentials")?.get("password")} export async function passwordSessionCookie(){return "test-setup-cookie=1; Secure; HttpOnly"}':storage}));}}]});
 const {handler,setup,menus,MEAL_DEADLINE,mealReport}=await import(join(temp,'bundle.mjs'));
 const req=(method='GET',body=null,query='',cookie='',origin='https://prototype.test')=>new Request('https://prototype.test/api/meal-choices'+query,{method,headers:{origin,'Content-Type':'application/json','x-nf-client-connection-ip':'192.0.2.1',cookie},body:body?JSON.stringify(body):undefined});
 const call=async(method,body,query='',cookie='')=>handler(req(method,body,query,cookie));
 const ok=async response=>{assert.equal(response.status,200,await response.clone().text());return response.json();};
 assert.equal(MEAL_DEADLINE,'2026-11-16T11:30:00.000Z');
 const initial=await ok(await call('GET'));assert.equal(initial.guests.length,16);assert.equal(initial.pinRequired,false);assert.equal(Object.keys(initial.deadlines).length,5);
 const [a,b]=initial.guests;
 assert.equal((await call('GET',null,'?action=td')).status,401);
 assert.equal((await call('GET',null,'?action=export&format=csv')).status,401);
 const deadlines={...initial.deadlines,vedana:'2026-11-16T10:30:00.000Z',farewell:'2026-11-17T12:00:00.000Z'};
 assert.equal((await call('POST',{action:'update-deadlines',deadlines,revision:null})).status,401);
 state.td=true;
 assert.equal((await call('POST',{action:'generate-missing'})).status,409);
 assert.equal((await call('POST',{action:'update-deadlines',deadlines:{...deadlines,vedana:'invalid'},revision:null})).status,400);
 assert.equal((await call('POST',{action:'update-deadlines',deadlines:{...deadlines,vedana:'2026-11-16T09:00:00Z'},revision:null})).status,400);
 const settings=await ok(await call('POST',{action:'update-deadlines',deadlines,revision:null}));
 assert.equal(settings.deadlines.vedana,deadlines.vedana);
 assert.equal((await call('POST',{action:'update-deadlines',deadlines,revision:null})).status,409);
 state.td=false;
 // A traveler selection establishes an opaque session without a PIN.
 let response=await call('POST',{action:'login',guestId:a.id});await ok(response);const cookie=response.headers.get('set-cookie').split(';')[0];assert(response.headers.get('set-cookie').includes('HttpOnly'));
 assert.equal((await ok(await call('GET',null,'',cookie))).guest.id,a.id);
 assert.equal(state.stores.get('meal-choices-v1').has('pin/'+a.id),false);
 assert.equal((await call('POST',{action:'login',guestId:'not-a-traveler'})).status,400);
 assert.equal((await call('PUT',{action:'submit',selections:{},dietary:'',revision:null})).status,401);
 const selections=Object.fromEntries(menus.map(m=>[m.id,Object.fromEntries(m.courses.map(c=>[c.id,c.options[0].id]))]));
 assert.equal((await call('PUT',{action:'submit',menuId:'vedana',selections:{vedana:{main:'invented'}},dietary:'',revision:null},'',cookie)).status,400);
 assert.equal((await call('PUT',{action:'submit',menuId:'vedana',selections:{},dietary:'',revision:null},'',cookie)).status,400);
 // Individual submission is complete for just that meal and counts in its report even though others are unfinished.
 let saved=await ok(await call('PUT',{action:'submit',menuId:'vedana',selections:{vedana:selections.vedana},dietary:'Peanut allergy',revision:null,guestId:b.id},'',cookie));
 assert.equal(saved.submission.mealStates.vedana.status,'submitted');assert.equal(saved.submission.mealStates.farewell,undefined);assert.equal(saved.submission.status,'draft');
 assert.equal(state.stores.get('meal-choices-v1').has('choice/'+b.id),false);
 state.td=true;let report=await ok(await call('GET',null,'?action=td'));assert.equal(report.summary.find(t=>t.meal===menus[0].title&&t.choice===menus[0].courses[0].options[0].name).count,1);state.td=false;
 assert.equal((await call('PUT',{action:'submit',selections,dietary:'',revision:null},'',cookie)).status,409);
 assert.equal((await handler(req('PUT',{action:'submit',selections,dietary:'',revision:saved.revision},'',cookie,'https://evil.test'))).status,403);
 // At the exact first cutoff, only Vedana closes. Its selections AND allergy notes remain frozen.
 state.now=RealDate.parse(deadlines.vedana);
 let read=await ok(await call('GET',null,'',cookie));assert.equal(read.lockedMeals.vedana,true);assert.equal(read.lockedMeals.farewell,false);assert.equal(read.locked,false);
 assert.equal((await call('PUT',{action:'submit',menuId:'vedana',selections,dietary:'Changed after cutoff',revision:saved.revision},'',cookie)).status,423);
 assert.equal((await call('PUT',{action:'save',menuId:'vedana',selections,dietary:'Changed after cutoff',revision:saved.revision},'',cookie)).status,423);
 state.td=true;assert.equal((await call('POST',{action:'update-deadlines',deadlines:{...deadlines,vedana:'2026-11-20T12:00:00Z'},revision:settings.settingsRevision})).status,423);
 const later={...deadlines,farewell:'2026-11-18T12:00:00.000Z'};await ok(await call('POST',{action:'update-deadlines',deadlines:later,revision:settings.settingsRevision}));state.td=false;
 const changed={...selections,vedana:{main:'main-2'}};
 saved=await ok(await call('PUT',{action:'submit',selections:changed,dietary:'=HYPERLINK("bad")\nNew dietary note',revision:saved.revision},'',cookie));
 assert.equal(saved.submission.selections.vedana.main,selections.vedana.main);assert.equal(saved.submission.mealStates.vedana.dietary,'Peanut allergy');assert.equal(saved.submission.mealStates.farewell.dietary,'=HYPERLINK("bad")\nNew dietary note');assert.equal(saved.submission.status,'submitted');
 state.td=true;
 response=await call('GET',null,'?action=export&format=csv&meal=vedana');assert.equal(response.status,200);const csv=await response.text();assert(csv.includes(a.name));assert(csv.includes('Peanut allergy'));assert(!csv.includes('New dietary note'));assert(!csv.includes('Lakorn'));assert(csv.includes('Deadline (Hanoi time)'));
 response=await call('GET',null,'?action=export&format=csv&meal=farewell');assert((await response.text()).includes("'=HYPERLINK"));
 for(const format of ['xlsx','pdf']){response=await call('GET',null,'?action=export&format='+format+'&meal=vedana');assert.equal(response.status,200);const bytes=Buffer.from(await response.arrayBuffer());assert(bytes.subarray(0,4).equals(Buffer.from(format==='pdf'?'%PDF':'PK\x03\x04')));await writeFile('/tmp/meal-test-export.'+format,bytes);}
 state.td=false;
 // Old all-meal submissions migrate without losing closed selections or dietary snapshots.
 state.stores.get('meal-choices-v1').set('choice/'+b.id,{etag:'legacy',data:{selections,dietary:'Legacy allergy',status:'submitted',updatedAt:new Date().toISOString(),submittedAt:new Date().toISOString()}});
 response=await call('POST',{action:'login',guestId:b.id});await ok(response);const bCookie=response.headers.get('set-cookie').split(';')[0];
 let legacy=await ok(await call('GET',null,'',bCookie));assert.equal(legacy.submission.dietary,'Legacy allergy');
 let migrated=await ok(await call('PUT',{action:'save',menuId:'farewell',selections,dietary:'New farewell allergy',revision:'legacy'},'',bCookie));
 assert.equal(migrated.submission.mealStates.vedana.dietary,'Legacy allergy');assert.equal(migrated.submission.mealStates.vedana.status,'submitted');assert.equal(migrated.submission.mealStates.farewell.status,'draft');
 // Every meal eventually becomes read-only; arbitrary timestamps and TD permissions cannot override it.
 state.now=RealDate.parse(later.farewell);read=await ok(await call('GET',null,'',cookie));assert.equal(read.locked,true);assert.equal(read.submission.mealStates.vedana.status,'submitted');
 assert.equal((await call('PUT',{action:'submit',selections,dietary:'After all deadlines',revision:saved.revision},'',cookie)).status,423);
 state.td=true;assert.equal((await call('PUT',{action:'submit',menuId:'vedana',selections,dietary:'TD override',revision:saved.revision},'',cookie)).status,423);state.td=false;
 state.site='2207afda-0a2b-4b67-a708-91c325bd214a';assert.equal((await call('GET')).status,404);
 state.site='c1f3ce92-834f-4a1e-a84b-1551409ddb7b';
 assert.equal((await setup(req('POST',{token:'c'.repeat(64),password:'Some long test password'}))).status,403);
 assert.equal((await setup(req('POST',{token:'b'.repeat(64),password:'short'}))).status,400);
 assert.equal((await setup(req('POST',{token:'b'.repeat(64),password:'Some long test password'}))).status,200);
 assert.equal((await setup(req('POST',{token:'b'.repeat(64),password:'Some other test password'}))).status,409);
 state.now=RealDate.parse('2026-12-02T00:00:00Z');
 assert.equal((await setup(req('POST',{token:'b'.repeat(64),password:'Some long test password'}))).status,403);
 console.log('PASS real handler: prototype isolation, name-only entry, TD-only deadline management/exports, per-meal submission and exact cutoff, closed selections/allergies preserved, legacy migration, stale-write protection, CSRF, CSV/XLSX/PDF and one-time TD setup.');
}finally{globalThis.Date=RealDate;await rm(temp,{recursive:true,force:true});}
