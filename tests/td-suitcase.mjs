import {build} from 'esbuild';
import assert from 'node:assert/strict';
const records=new Map();let seq=0;
globalThis.tdTest={identity:false,user:null,password:'old-test-password',records};
globalThis.Netlify={env:{get:key=>key==='TOUR_DIRECTOR_EMAIL'?'td@example.test':key==='CHERVIL_NOTES_PASSWORD'?'old-test-password':''}};
const sdk=`export class AuthError extends Error {};
export function getIdentityConfig(){return globalThis.tdTest.identity?{token:'test'}:null}
export async function getUser(){return globalThis.tdTest.user}
export async function login(email,password){if(password!==globalThis.tdTest.password)throw new AuthError('wrong');return globalThis.tdTest.user}
export async function updateUser(body){globalThis.tdTest.password=body.password}`;
const blobs=`export function getStore({name}){let m=globalThis.tdTest.records;return {get:async k=>m.get(name+'/'+k)?.data||null,getWithMetadata:async k=>m.get(name+'/'+k)||null,setJSON:async(k,data,opts={})=>{let key=name+'/'+k,prev=m.get(key);if((opts.onlyIfNew&&prev)||(opts.onlyIfMatch&&prev?.etag!==opts.onlyIfMatch))return {modified:false};let etag=crypto.randomUUID();m.set(key,{data,etag});return {modified:true,etag}},delete:async k=>m.delete(name+'/'+k)}}`;
await build({stdin:{contents:'export {default as change} from "./netlify/functions/td-password.mts";export * from "./netlify/lib/td-auth";',resolveDir:process.cwd(),loader:'ts'},outfile:'.pdf-build/td-suitcase-test.mjs',bundle:true,platform:'node',format:'esm',plugins:[{name:'mock',setup(b){b.onResolve({filter:/^@netlify\/(identity|blobs)$/},a=>({path:a.path,namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:a.path.endsWith('identity')?sdk:blobs}));}}]});
const {change,hasTDSession,passwordSessionCookie,legacyPasswordMatches}=await import('../.pdf-build/td-suitcase-test.mjs');
const origin='https://test.example';
const request=(cookie='',body,otherOrigin=origin)=>new Request(origin+'/api/td-password',{method:body?'PUT':'GET',headers:{Origin:otherOrigin,Cookie:cookie,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
let count=0;function check(value,expected){assert.equal(value,expected);count++}
check(await legacyPasswordMatches('old-test-password'),true);
const cookie=(await passwordSessionCookie(request(),true)).split(';')[0];
check(await hasTDSession(request(cookie)),true);
check((await change(request('',{currentPassword:'old-test-password',newPassword:'a-long-new-password'}))).status,401);
check((await change(request(cookie,{currentPassword:'old-test-password',newPassword:'a-long-new-password'},'https://evil.test'))).status,403);
check((await change(request(cookie,{currentPassword:'wrong',newPassword:'a-long-new-password'}))).status,409);
check((await change(request(cookie,{currentPassword:'old-test-password',newPassword:'short'}))).status,400);
const result=await change(request(cookie,{currentPassword:'old-test-password',newPassword:'a-long-new-password'}));check(result.status,200);
check(await legacyPasswordMatches('old-test-password'),false);check(await legacyPasswordMatches('a-long-new-password'),true);
check(await hasTDSession(request(cookie)),false);
const fresh=result.headers.get('set-cookie').split(';')[0];check(await hasTDSession(request(fresh)),true);
check(JSON.stringify([...records]).includes('a-long-new-password'),false);
await passwordSessionCookie(request(fresh));check(await hasTDSession(request(fresh)),false);
globalThis.tdTest.identity=true;globalThis.tdTest.user={email:'guest@example.test',roles:['tour-director']};
check((await change(request('',{currentPassword:'old-test-password',newPassword:'identity-new-password'}))).status,401);
globalThis.tdTest.user={email:'td@example.test',roles:['tour-director']};
check((await change(request('',{currentPassword:'wrong',newPassword:'identity-new-password'}))).status,401);
check((await change(request('',{currentPassword:'old-test-password',newPassword:'identity-new-password'}))).status,200);
check(globalThis.tdTest.password,'identity-new-password');
console.log(`PASS: ${count} password, role, CSRF, session rotation, revocation and hashed-storage checks.`);
