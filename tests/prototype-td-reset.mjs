import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
const root=process.cwd(),temp=await mkdtemp(join(root,'.td-reset-test-'));
globalThis.resetTest={stores:new Map(),sequence:0};
globalThis.Netlify={env:{get:()=>undefined},context:{cookies:{get:()=>undefined}}};
const storage=`export function getStore({name}){const s=globalThis.resetTest;if(!s.stores.has(name))s.stores.set(name,new Map());const map=s.stores.get(name);return {get:async k=>structuredClone(map.get(k)?.data??null),getMetadata:async k=>map.has(k)?{etag:map.get(k).etag}:null,getWithMetadata:async k=>structuredClone(map.get(k)??null),setJSON:async(k,data,o={})=>{const old=map.get(k);if(o.onlyIfNew&&old||o.onlyIfMatch&&o.onlyIfMatch!==old?.etag)return {modified:false};const etag=String(++s.sequence);map.set(k,{data:structuredClone(data),etag});return {modified:true,etag}},delete:async k=>map.delete(k)}}`;
try{
 await build({stdin:{contents:'export {resetTDPassword,legacyPasswordMatches,passwordSessionCookie,hasTDSession,passwordVersion} from "./netlify/lib/td-auth";',resolveDir:root,loader:'ts'},outfile:join(temp,'auth.mjs'),bundle:true,platform:'node',format:'esm',plugins:[{name:'fake-runtime-storage',setup(b){b.onResolve({filter:/^@netlify\/(blobs|identity)$/},a=>({path:a.path,namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path.endsWith('blobs')?storage:'export const admin={};export function getIdentityConfig(){return null} export function getUser(){return null}'}));}}]});
 const auth=await import(join(temp,'auth.mjs'));
 const req=cookie=>new Request('https://prototype.test',{headers:{cookie:cookie||''}});
 assert.equal(await auth.resetTDPassword('First test password only'),true);
 const before=await auth.passwordVersion();
 const cookie=(await auth.passwordSessionCookie(req(),true)).split(';')[0];
 assert.equal(await auth.hasTDSession(req(cookie)),true);
 assert.equal(await auth.resetTDPassword('Second test password only'),true);
 assert.notEqual(await auth.passwordVersion(),before);
 assert.equal(await auth.legacyPasswordMatches('First test password only'),false);
 assert.equal(await auth.legacyPasswordMatches('Second test password only'),true);
 assert.equal(await auth.hasTDSession(req(cookie)),false);
 const next=(await auth.passwordSessionCookie(req(),true)).split(';')[0];
 assert.equal(await auth.hasTDSession(req(next)),true);
 assert.equal(globalThis.resetTest.stores.size,2);
 console.log('PASS real TD auth: reset accepts new password, rejects old password, revokes old sessions, creates a working new session and touches only credential/session stores.');
}finally{await rm(temp,{recursive:true,force:true});}
