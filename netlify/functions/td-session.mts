import {logout,refreshSession} from '@netlify/identity';
import type {Config} from '@netlify/functions';
import {hasTDSession,tdPasswordConfigured,passwordSessionCookie,identityReady,legacyPasswordMatches,sameOrigin} from '../lib/td-auth';
import {hasMasterAdmin} from '../lib/master-auth';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie'}});
export default async function handler(request:Request){try{
 if(request.method==='GET'){const master=await hasMasterAdmin();const authenticated=master||await hasTDSession(request);return reply({configured:await tdPasswordConfigured(),authenticated,masterAdmin:master,name:master?'Marcela':'Xavier Brunelle',needsRefresh:identityReady()&&!authenticated&&/(?:^|;\s*)nf_refresh=/.test(request.headers.get('cookie')||'')});}
 if(!sameOrigin(request))return reply({error:'Open this action from the app.'},403);
 if(request.method==='DELETE'){if(identityReady())await logout();return new Response(JSON.stringify({authenticated:false}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':await passwordSessionCookie(request)}});}
 if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
 const raw=await request.text();if(raw.length>1000)return reply({error:'Invalid sign-in.'},400);let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid sign-in.'},400);}
 if(body?.refresh===true&&identityReady())return reply({refreshed:!!await refreshSession()});
 if(!await tdPasswordConfigured())return reply({error:'No TD password is configured for this deployment. Ask your master admin to set the TD password.'},503);
 if(!await legacyPasswordMatches(body?.password))return reply({error:'Check your TD password and try again.'},401);
 return new Response(JSON.stringify({configured:true,authenticated:true,name:'Xavier Brunelle'}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':await passwordSessionCookie(request,true)}});
 }catch{return reply({error:'Sign-in is temporarily unavailable. Please try again.'},503);}}
export const config:Config={path:'/api/td-session',rateLimit:{windowLimit:12,windowSize:60,aggregateBy:['ip','domain']}};
