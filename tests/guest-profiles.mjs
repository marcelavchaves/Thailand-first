import {build} from 'esbuild';
import assert from 'node:assert/strict';
const sdk=`export function getIdentityConfig(){return {token:'test'}};export async function getUser(){return globalThis.guestTest.user}`;
const blobs=`export function getStore(){return {getWithMetadata:async k=>globalThis.guestTest.data.get(k)||null,setJSON:async(k,data,options)=>{const old=globalThis.guestTest.data.get(k);if(options.onlyIfNew&&old||options.onlyIfMatch&&old?.etag!==options.onlyIfMatch)return {modified:false};const etag=String(++globalThis.guestTest.seq);globalThis.guestTest.data.set(k,{data:structuredClone(data),etag});return {modified:true,etag}}}}`;
await build({entryPoints:['netlify/functions/guest-profiles.mts'],outfile:'.pdf-build/guest-test.mjs',bundle:true,platform:'node',format:'esm',external:['sharp','web-push'],plugins:[{name:'controlled-test',setup(b){b.onResolve({filter:/^@netlify\/(identity|blobs)$/},a=>({path:a.path,namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:a.path.endsWith('identity')?sdk:blobs,loader:'js'}));}}]});
globalThis.Netlify={env:{get:key=>key==='TOUR_DIRECTOR_EMAIL'?'td@example.test':''}};
const {default:handler}=await import('../.pdf-build/guest-test.mjs');globalThis.guestTest={user:null,data:new Map(),seq:0};
const call=(b,origin='https://test.example')=>handler(new Request('https://test.example/api/guest-profiles',{method:b?'POST':'GET',headers:{Origin:origin},body:b?JSON.stringify(b):undefined}));
for(const user of [null,{email:'guest@example.com',roles:['tour-director']},{email:'xbrunelle@tauck.com',roles:[]}]){globalThis.guestTest.user=user;assert.equal((await call({id:'1',action:'photo',photo:null})).status,401);}
globalThis.guestTest.user=null;assert.equal((await call({id:'1',action:'submit',intro:'Hello'},'https://evil.example')).status,403);
assert.equal((await call({id:'1',action:'submit',intro:'Hello from Washington'})).status,200);
assert.equal((await call()).status,200);let publicData=await(await call()).json();assert.equal(publicData['1'].intro,'');assert.equal(publicData['1'].pending,undefined);
assert.equal((await call({id:'1',action:'submit',intro:'Overwrite'})).status,409);
globalThis.guestTest.user={email:'td@example.test',roles:['tour-director']};let data=await(await call()).json();assert.equal(data['1'].pending,'Hello from Washington');assert.equal((await call({id:'1',action:'approve',revision:data['1'].revision})).status,200);
assert.equal((await call({id:'1',action:'photo',photo:'data:image/jpeg;base64,invalid',revision:'2'})).status,400);
assert.equal((await call({id:'1',action:'intro',intro:'Stale',revision:'1'})).status,409);
const sharp=(await import('sharp')).default;const photo='data:image/jpeg;base64,'+(await sharp({create:{width:8,height:8,channels:3,background:'#245d56'}}).jpeg().toBuffer()).toString('base64');assert.equal((await call({id:'1',action:'photo',photo,revision:'2'})).status,200);
globalThis.guestTest.user=null;publicData=await(await call()).json();assert.equal(publicData['1'].intro,'Hello from Washington');assert.equal(publicData['2'].intro,'');assert.ok(publicData['1'].photo.startsWith('data:image/jpeg;base64,'));
console.log('PASS: TD-only photos, forged identity denial, origin protection, moderated introductions, guest isolation, stale edit denial, malformed image rejection.');
