import {build} from 'esbuild';
import assert from 'node:assert/strict';
const sdk=`export function getIdentityConfig(){return globalThis.testTD.ready?{url:'https://example.test/.netlify/identity',token:'operator-test'}:null} export async function getUser(){return globalThis.testTD.user}`;
const blobs=`export function getStore({name}){return {get:async()=>name==='td-credentials'?null:({tripDate:5,text:'Existing announcement'}),setJSON:async(k,v)=>globalThis.testTD.writes.push([k,v]),delete:async(k)=>globalThis.testTD.writes.push(['delete',k])}}`;
await build({stdin:{contents:'export {default as handler} from "./netlify/functions/xavier-notes.mts"; export {isTourDirector} from "./netlify/lib/td-auth";',resolveDir:process.cwd(),loader:'ts'},outfile:'.pdf-build/td-auth-test.mjs',bundle:true,platform:'node',format:'esm',external:['web-push'],plugins:[{name:'controlled-auth-test',setup(b){b.onResolve({filter:/^@netlify\/(identity|blobs)$/},a=>({path:a.path,namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:a.path.endsWith('identity')?sdk:blobs,loader:'js'}));}}]});
globalThis.Netlify={env:{get:key=>key==='TOUR_DIRECTOR_EMAIL'?'td@example.test':'test-only-secret'}};
globalThis.testTD={ready:true,user:null,writes:[]};
const {handler,isTourDirector}=await import('../.pdf-build/td-auth-test.mjs');
let checks=0;
const call=async(method,body,origin='https://example.test')=>handler(new Request('https://example.test/api/xavier-notes?day=5',{method,headers:{Origin:origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}),{});
for(const user of [null,{email:'xbrunelle@tauck.com',roles:[]},{email:'guest@example.com',roles:['tour-director']},{email:'xbrunelle@tauck.com',userMetadata:{roles:['tour-director']}}]){
 globalThis.testTD.user=user;assert.equal(isTourDirector(user),false);assert.equal((await call('PUT',{day:5,text:'unauthorized',password:'test-only-secret'})).status,401);assert.equal((await call('DELETE',{day:5,password:'test-only-secret'})).status,401);checks+=3;
}
assert.equal(globalThis.testTD.writes.length,0);checks++;
assert.equal((await call('GET')).status,200);checks++;
globalThis.testTD.user={email:'td@example.test',roles:['tour-director']};
assert.equal((await call('PUT',{day:5,text:'Valid announcement'},'https://other.test')).status,403);checks++;
assert.equal((await call('PUT',{day:5,text:'Valid announcement'})).status,200);checks++;
assert.equal((await call('DELETE',{day:5})).status,200);checks++;
assert.equal(globalThis.testTD.writes.length,2);checks++;
globalThis.testTD.ready=false;globalThis.testTD.user=null;
assert.equal((await call('PUT',{day:5,text:'Legacy migration',password:'wrong'})).status,401);checks++;
assert.equal((await call('PUT',{day:5,text:'Legacy migration',password:'test-only-secret'})).status,200);checks++;
console.log(`PASS: ${checks} TD authorization checks; anonymous/forged-role/legacy-password bypasses denied after activation; authorized edits, CSRF and migration behavior verified.`);
