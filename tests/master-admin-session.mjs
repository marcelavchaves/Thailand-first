import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('.pdf-build',{recursive:true});
await build({entryPoints:['netlify/functions/master-admin.mts'],outfile:'.pdf-build/master-session.mjs',bundle:true,platform:'node',format:'esm',external:['@netlify/identity','@netlify/blobs']});
// Exercise the installed Identity SDK, including its cookies and operator token.
const origin='https://identity.test';
const id='11111111-1111-4111-8111-111111111111';
const cookies=new Map();
let user={id,email:'owner@example.test',confirmed_at:'2026-10-01',app_metadata:{roles:[]},user_metadata:{}};
let available=true;let activationAvailable=true;
const calls=[];
globalThis.netlifyIdentityContext={url:origin+'/.netlify/identity',token:'operator-token'};
globalThis.Netlify={env:{get:k=>k==='MASTER_ADMIN_EMAIL'?'owner@example.test':''},context:{url:origin,cookies:{get:k=>cookies.get(k),set:({name,value})=>cookies.set(name,value),delete:k=>cookies.delete(k)}}};
globalThis.fetch=async(url,options={})=>{
 const path=new URL(url).pathname;const auth=options.headers?.Authorization;calls.push({path,auth});
 if(path.endsWith('/token')){const body=new URLSearchParams(options.body);return body.get('password')==='correct-test-password'?Response.json({access_token:'visitor-token',refresh_token:'refresh-token'}):Response.json({msg:'Invalid credentials'},{status:400});}
 if(path.endsWith('/user')){if(!available)return new Response(null,{status:503});return auth==='Bearer visitor-token'?Response.json(user):Response.json({msg:'Invalid session'},{status:401});}
 if(path.endsWith('/admin/users/'+id)){
  assert.equal(auth,'Bearer operator-token');
  if(options.method==='PUT'&&!activationAvailable)return Response.json({msg:'Operator access denied'},{status:403});
  if(options.method==='PUT'){const change=JSON.parse(options.body);user={...user,app_metadata:change.app_metadata};}
  return Response.json(user);
 }
 throw Error('Unexpected Identity request: '+path);
};
const {default:handler}=await import('../.pdf-build/master-session.mjs');
const request=body=>new Request(origin+'/api/master-admin',{method:body?'POST':'GET',headers:{Origin:origin},body:body?JSON.stringify(body):undefined});
let result=await handler(request());assert.equal(result.status,200);assert.equal((await result.json()).authenticated,false);assert.equal(calls.length,0);
result=await handler(request({action:'login',email:user.email,password:'wrong'}));assert.equal(result.status,401);
result=await handler(request({action:'login',email:user.email,password:'correct-test-password'}));assert.equal(result.status,200);assert.equal(cookies.get('nf_jwt'),'visitor-token');assert.ok(user.app_metadata.roles.includes('master-admin'));
result=await handler(request());assert.equal(result.status,200);assert.equal((await result.json()).authenticated,true);
assert.ok(calls.filter(c=>c.path.endsWith('/user')).every(c=>c.auth==='Bearer visitor-token'));
// A correct password followed by a denied role update must not be called a credential error.
user.app_metadata.roles=[];activationAvailable=false;
result=await handler(request({action:'login',email:user.email,password:'correct-test-password'}));assert.equal(result.status,503);assert.match((await result.json()).error,/password was accepted/);activationAvailable=true;
// Activation links also use the visitor's session, while operator access stays server-only.
user.app_metadata.roles=[];result=await handler(request({action:'activate'}));assert.equal(result.status,200);assert.ok(user.app_metadata.roles.includes('master-admin'));
for(const patch of [{email:'guest@example.test'},{confirmed_at:null},{app_metadata:{roles:[]}}]){
 const saved=structuredClone(user);user={...user,...patch};result=await handler(request());assert.equal((await result.json()).authenticated,false);user=saved;
}
// Standard Netlify deployments may expose the endpoint without an operator token.
// A verified owner with an existing role must still be able to sign in and activate.
delete globalThis.netlifyIdentityContext.token;
result=await handler(request());assert.equal((await result.json()).configured,true);
result=await handler(request({action:'login',email:user.email,password:'correct-test-password'}));assert.equal(result.status,200);
assert.equal((await (await handler(request())).json()).authenticated,true);
assert.equal((await handler(request({action:'activate'}))).status,200);
user.app_metadata.roles=[];result=await handler(request({action:'login',email:user.email,password:'correct-test-password'}));assert.equal(result.status,403);assert.match((await result.json()).error,/master-admin role/);
assert.equal((await (await handler(request())).json()).authenticated,false);
user.app_metadata.roles=['master-admin'];cookies.set('nf_jwt','visitor-token');
cookies.set('nf_jwt','forged-token');assert.equal((await (await handler(request())).json()).authenticated,false);assert.equal((await handler(request({action:'activate'}))).status,403);
cookies.set('nf_jwt','visitor-token');available=false;assert.equal((await handler(request())).status,503);available=true;
assert.equal((await handler(request({action:'logout'}))).status,200);assert.equal(cookies.has('nf_jwt'),false);assert.equal((await (await handler(request())).json()).authenticated,false);
console.log('PASS: real Identity SDK login persists a visitor session; operator token is used only for admin operations; activation, sign-out, invalid sessions, owner/verification/role checks, and provider failures stay secure.');
