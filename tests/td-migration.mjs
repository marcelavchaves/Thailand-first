import {build} from 'esbuild';
import assert from 'node:assert/strict';
const sdk=`
export class AuthError extends Error {}
export function getIdentityConfig(){return {token:'test-operator'}}
export async function getUser(){return null}
export async function logout(){}
export async function refreshSession(){return null}
export const admin={
 listUsers:async()=>globalThis.migration.user?[globalThis.migration.user]:[],
 createUser:async({email})=>{globalThis.migration.creates++;return globalThis.migration.user={id:'test-user',email,roles:[],appMetadata:{}}},
 updateUser:async(id,attributes)=>{globalThis.migration.updates++;globalThis.migration.user.roles=attributes.app_metadata.roles;return globalThis.migration.user}
};
export async function login(email,password){if(password!=='test-secret')throw new AuthError('Wrong password');return globalThis.migration.user}
`;
await build({entryPoints:['netlify/functions/td-session.mts'],outfile:'.pdf-build/td-migration-test.mjs',bundle:true,platform:'node',format:'esm',plugins:[{name:'identity-mock',setup(b){b.onResolve({filter:/^@netlify\/(identity|blobs)$/},a=>({path:a.path,namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:a.path.endsWith('identity')?sdk:'export function getStore(){return {get:async()=>null}}',loader:'js'}));}}]});
globalThis.Netlify={env:{get:()=> 'test-secret'}};
globalThis.migration={user:null,creates:0,updates:0};
const {default:handler}=await import('../.pdf-build/td-migration-test.mjs');
const call=()=>handler(new Request('https://example.test/api/td-session',{method:'POST',headers:{Origin:'https://example.test','Content-Type':'application/json'},body:JSON.stringify({password:'test-secret'})}));
assert.equal((await call()).status,200);assert.equal(globalThis.migration.creates,1);assert.equal(globalThis.migration.updates,1);assert.deepEqual(globalThis.migration.user.roles,['tour-director']);
assert.equal((await call()).status,200);assert.equal(globalThis.migration.creates,1);assert.equal(globalThis.migration.updates,1);
console.log('PASS: first sign-in assigns TD role even if Identity omits it during account creation; repeated sign-in is idempotent.');
