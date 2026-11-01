import type {Config} from '@netlify/functions';
import {createHash,timingSafeEqual} from 'node:crypto';
import {getStore} from '@netlify/blobs';
import {sameOrigin,passwordSessionCookie,resetTDPassword} from '../lib/td-auth';
const LIVE_SITE_ID='2207afda-0a2b-4b67-a708-91c325bd214a';
const reply=(body:unknown,status=200,headers:Record<string,string>={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
export default async function handler(request:Request){try{
 if((Netlify.env.get('SITE_ID')||process.env.SITE_ID)!==LIVE_SITE_ID)return reply({error:'Not found.'},404);
 if(request.method!=='POST')return reply({error:'Use the private reset page.'},405);
 if(!sameOrigin(request))return reply({error:'Open this reset link from the live app.'},403);
 const raw=await request.text();if(raw.length>1200)return reply({error:'Invalid reset request.'},400);
 let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid reset request.'},400);}
 const expected=Netlify.env.get('LIVE_TD_RESET_HASH')||'',expires=Date.parse(Netlify.env.get('LIVE_TD_RESET_EXPIRES')||'');
 if(!/^[a-f0-9]{64}$/.test(expected)||!Number.isFinite(expires)||expires<=Date.now()||typeof body?.token!=='string'||!/^[a-f0-9]{64}$/.test(body.token)||!timingSafeEqual(Buffer.from(expected,'hex'),createHash('sha256').update(body.token).digest()))return reply({error:'This private reset link is invalid or expired.'},403);
 if(typeof body.password!=='string'||body.password.length<12||body.password.length>200)return reply({error:'Choose a password with 12–200 characters.'},400);
 const claims=getStore({name:'td-reset-links',consistency:'strong'}),claim=await claims.setJSON(expected,{usedAt:new Date().toISOString()},{onlyIfNew:true});
 if(!claim.modified)return reply({error:'This reset link has already been used. Sign in with your new password.'},409);
 try{if(!await resetTDPassword(body.password)){await claims.delete(expected);return reply({error:'The password changed in another window. Please try again.'},409);}}
 catch{await claims.delete(expected);throw Error('Unable to reset password.');}
 return reply({ok:true},200,{'Set-Cookie':await passwordSessionCookie(request,true)});
 }catch{return reply({error:'Password reset is temporarily unavailable. Please try again.'},503);}}
export const config:Config={path:'/api/td-private-reset',rateLimit:{windowLimit:5,windowSize:60,aggregateBy:['ip','domain']}};
