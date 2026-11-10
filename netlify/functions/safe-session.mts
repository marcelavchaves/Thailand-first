import type {Config} from '@netlify/functions';
import {logout} from '@netlify/identity';
import {safeSession,safeIdentityUser,type SafeAccount} from '../lib/safe-auth';
const reply=(body:unknown,status=200,cookie?:string)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie',...(cookie?{'Set-Cookie':cookie}:{})}});
const summary=(a:SafeAccount)=>({username:a.username,safeId:a.safeId,displayName:'My Safe'});
export default async function handler(request:Request){try{
 if(request.method==='GET'){const user=await safeIdentityUser(request),account=user?await safeSession(request,user):null;return reply({authenticated:!!account,identityAuthenticated:!!user,email:user?.email||null,...(account?summary(account):{username:null,safeId:null})});}
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Open Traveler Safe from the app.'},403);
 if(request.method==='DELETE'){await logout();return reply({ok:true},200,'__Host-kd_safe=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0');}
 return reply({error:'Use email/password or Google to sign in. Safe names, PINs and recovery codes are not used.'},405);
}catch{return reply({error:'Traveler Safe is temporarily unavailable.'},503);}}
export const config:Config={path:'/api/safe-session',rateLimit:{windowLimit:60,windowSize:60,aggregateBy:['ip','domain']}};
