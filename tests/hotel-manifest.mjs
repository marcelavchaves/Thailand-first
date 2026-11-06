import {build} from 'esbuild';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const temp=await mkdtemp(join(process.cwd(),'.manifest-test-'));
const state={td:false,site:'c1f3ce92-834f-4a1e-a84b-1551409ddb7b',stores:new Map(),seq:0};globalThis.manifestTest=state;globalThis.Netlify={env:{get:k=>k==='SITE_ID'?state.site:undefined}};
const mock=`export function getStore({name}){const s=globalThis.manifestTest;if(!s.stores.has(name))s.stores.set(name,new Map());const map=s.stores.get(name);return {get:async k=>structuredClone(map.get(k)?.data??null),getWithMetadata:async k=>structuredClone(map.get(k)??null),setJSON:async(k,data,o={})=>{const old=map.get(k);if(o.onlyIfNew&&old||o.onlyIfMatch&&o.onlyIfMatch!==old?.etag)return {modified:false};const etag=String(++s.seq);map.set(k,{data:structuredClone(data),etag});return {modified:true,etag}}}}`;
try{
 await build({stdin:{contents:`export {default as handler} from './netlify/functions/hotel-manifest.mts';export {default as roster} from './netlify/functions/guest-roster.mts';export * from './lib/hotel-manifest';export {GUEST_IMPORT_VERSION} from './shared/tour-import.mjs';`,resolveDir:process.cwd(),loader:'ts'},outfile:join(temp,'test.mjs'),bundle:true,platform:'node',format:'esm',external:['pdfkit'],plugins:[{name:'mock',setup(b){b.onResolve({filter:/^@netlify\/blobs$|\/td-auth$/},a=>({path:a.path,namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path.endsWith('/td-auth')?`export async function hasTDSession(){return globalThis.manifestTest.td} export function sameOrigin(r){return r.headers.get('origin')===new URL(r.url).origin}`:mock}));}}]});
 const {handler,roster,GUEST_IMPORT_VERSION,manifestDefaults,checkExport,guestDisplayName}=await import(join(temp,'test.mjs'));
 const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333'];
 const guests=ids.map((id,i)=>({id,name:['Ms. Sample One','Mr. Sample Two','Ms. Sample Three'][i],origin:'Sample town',bio:'',phone:'',email:'',social:'',shareContact:false}));
 state.stores.set('guest-profiles',new Map([['roster',{etag:'roster1',data:{guests,revealed:true,guestListVersion:GUEST_IMPORT_VERSION,guestOrderVersion:'ic2026-left-column-then-right-v1',safeAssignments:{byGuest:Object.fromEntries(ids.map((id,i)=>[id,'TG0'+(i+1)])),next:4}}}]]));
 const request=(body,query='',origin='https://prototype.test')=>new Request('https://prototype.test/api/hotel-manifest'+query,{method:body?'PUT':'GET',headers:{Origin:origin},body:body?JSON.stringify(body):undefined});
 const ok=async r=>{assert.equal(r.status,200,await r.clone().text());return r.json();};
 assert.equal((await handler(request())).status,401);state.site='2207afda-0a2b-4b67-a708-91c325bd214a';state.td=true;assert.equal((await handler(request())).status,404);state.site='c1f3ce92-834f-4a1e-a84b-1551409ddb7b';
 let first=await ok(await handler(request()));assert.equal(first.guests.length,3);assert.equal(first.data.hotels['hotel-0'].arrival,'2026-11-16');assert.equal(first.data.hotels['hotel-0'].departure,'2026-11-18');
 assert.equal(first.data.guests[ids[0]].number,'001');
 assert.equal((await handler(request({data:first.data,revision:null,rosterRevision:'roster1'},'','https://evil.test'))).status,403);
 assert.equal((await handler(request(null,'?format=pdf&hotel=hotel-0'))).status,400);
 const data=first.data;data.guests[ids[0]].preferredName='Sam';data.guests[ids[0]].important='Shared dietary observation';data.guests[ids[0]].travelGroup='Sample companions';data.guests[ids[2]].travelGroup='Sample companions';
 for(const [i,id] of ids.entries()){data.hotels['hotel-0'].entries[id]={room:i<2?'A':'B',bed:'King/Queen',notes:'Arrival request',important:i===0?'No peanuts — sample allergy':''};}
 data.hotels['hotel-0'].important='Hotel-specific important note';data.hotels['hotel-1'].important='Other hotel only';
 const body={data,revision:null,rosterRevision:'roster1'};let bad=structuredClone(body);bad.data.guests[ids[1]].number='1';assert.equal((await handler(request(bad))).status,400);
 bad=structuredClone(body);bad.data.guests['unknown']={number:'004',preferredName:'',travelGroup:''};assert.equal((await handler(request(bad))).status,400);
 bad=structuredClone(body);bad.rosterRevision='stale';assert.equal((await handler(request(bad))).status,409);
 let saved=await ok(await handler(request(body)));assert(saved.revision);assert.equal((await handler(request(body))).status,409);
 state.td=false;let publicRoster=await ok(await roster(new Request('https://prototype.test/api/guest-roster')));assert.equal(publicRoster.guests[0].preferredName,'Sam');assert.equal(publicRoster.guests[0].safeId,'TG01');assert(!JSON.stringify(publicRoster).includes('peanuts'));assert(!JSON.stringify(publicRoster).includes('Shared dietary observation'));assert(!JSON.stringify(publicRoster).includes('Sample companions'));assert(!JSON.stringify(publicRoster).includes('Arrival request'));
 assert.equal((await handler(request(null,'?format=pdf&hotel=hotel-0'))).status,401);assert.equal((await handler(request(null,'?format=csv&hotel=hotel-0'))).status,401);state.td=true;
 const pdfResponse=await handler(request(null,'?format=pdf&hotel=hotel-0'));assert.equal(pdfResponse.status,200);assert.equal(pdfResponse.headers.get('Cache-Control'),'no-store');const bytes=new Uint8Array(await pdfResponse.arrayBuffer());await writeFile('/tmp/hotel-manifest-test.pdf',bytes);
 const pdf=await getDocument({data:bytes,useSystemFonts:true,isEvalSupported:false}).promise;let text='';for(let i=1;i<=pdf.numPages;i++)text+=' '+(await (await pdf.getPage(i)).getTextContent()).items.map(x=>x.str||'').join(' ');
 for(const required of ['Sample One (Sam)','001','003','Sample companions','No peanuts','1 Singles, 1 Doubles','3 guests plus 1 staff','Hotel-specific important note','Shared dietary observation'])assert(text.includes(required),required);assert(!text.includes('Other hotel only'));
 let csv=await (await handler(request(null,'?format=csv&hotel=hotel-0'))).text();assert(csv.includes('IMPORTANT observations'));assert(csv.includes('No peanuts'));assert(csv.includes('Hotel-specific important note'));
 bad=structuredClone(saved.data);bad.hotels['hotel-0'].entries[ids[1]].bed='Two beds';assert.throws(()=>checkExport(bad,'hotel-0',guests),/conflicting/);
 assert.equal(guestDisplayName({name:'Mr. Example (Tom)',preferredName:'Tom'}),'Mr. Example (Tom)');assert.equal(manifestDefaults([{id:'x',name:'Ms. Example (Pat)'}]).guests.x.preferredName,'Pat');
 // Guest-list hiding still protects preferred names.
 const record=state.stores.get('guest-profiles').get('roster');record.data.revealed=false;state.td=false;publicRoster=await ok(await roster(new Request('https://prototype.test/api/guest-roster')));assert.equal(publicRoster.guests.length,0);
 console.log('PASS hotel manifests: prototype isolation, TD authorization, CSRF, revisions, duplicate numbers, roster changes, private-note projection, Safe preservation, room grouping/conflicts, preferred names, hotel-specific PDF/CSV and room totals.');
}finally{await rm(temp,{recursive:true,force:true});}
