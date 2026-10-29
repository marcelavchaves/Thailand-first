import type {Config} from '@netlify/functions';
import {createHash,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {getStore} from '@netlify/blobs';
import {PROTOTYPE_SITE_ID} from '../../lib/meal-choices';
import {sameOrigin,tdPasswordConfigured,passwordSessionCookie} from '../lib/td-auth';
const reply=(body:unknown,status=200,headers:Record<string,string>={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
export default async function handler(request:Request){try{
 if((Netlify.env.get('SITE_ID')||process.env.SITE_ID)!==PROTOTYPE_SITE_ID)return reply({error:'Not found.'},404);
 if(request.method!=='POST')return reply({error:'Use the private setup page.'},405);
 if(!sameOrigin(request))return reply({error:'Open setup from the prototype app.'},403);
 const raw=await request.text();if(raw.length>1200)return reply({error:'Invalid setup request.'},400);
 let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid setup request.'},400);}
 const expected=Netlify.env.get('PROTOTYPE_TD_SETUP_HASH')||'',expires=Date.parse(Netlify.env.get('PROTOTYPE_TD_SETUP_EXPIRES')||'');
 if(!/^[a-f0-9]{64}$/.test(expected)||!Number.isFinite(expires)||expires<=Date.now()||typeof body?.token!=='string'||!/^[a-f0-9]{64}$/.test(body.token)||!timingSafeEqual(Buffer.from(expected,'hex'),createHash('sha256').update(body.token).digest()))return reply({error:'This private setup link is invalid or expired.'},403);
 if(typeof body.password!=='string'||body.password.length<12||body.password.length>200)return reply({error:'Choose a password with 12–200 characters.'},400);
 if(await tdPasswordConfigured())return reply({error:'The prototype TD password is already set. Use TD Suitcase to sign in.'},409);
 const salt=randomBytes(32).toString('hex'),hash=scryptSync(body.password,salt,64).toString('hex');
 const saved=await getStore({name:'td-credentials',consistency:'strong'}).setJSON('password',{salt,hash,version:randomBytes(32).toString('hex')},{onlyIfNew:true});
 if(!saved.modified)return reply({error:'The prototype TD password is already set.'},409);
 return reply({ok:true},200,{'Set-Cookie':await passwordSessionCookie(request,true)});
 }catch{return reply({error:'Prototype setup is temporarily unavailable. Please try again.'},503);}}
export const config:Config={path:'/api/prototype-td-setup',rateLimit:{windowLimit:5,windowSize:60,aggregateBy:['ip','domain']}};
