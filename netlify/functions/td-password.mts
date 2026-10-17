import type {Config} from '@netlify/functions';
import {login,updateUser,AuthError} from '@netlify/identity';
import {hasTDSession,sameOrigin,identityReady,isTourDirector,TD_EMAIL,changeStoredPassword,passwordSessionCookie} from '../lib/td-auth';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie'}});
export default async function handler(request:Request){
 try{
  if(request.method!=='PUT')return reply({error:'Method not allowed.'},405);
  if(!sameOrigin(request))return reply({error:'Open this action from TD Suitcase.'},403);
  if(!await hasTDSession(request))return reply({error:'Sign in as the tour director first.'},401);
  const raw=await request.text();if(raw.length>2000)return reply({error:'Invalid request.'},400);
  let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid request.'},400);}
  const {currentPassword,newPassword}=body;
  if(typeof currentPassword!=='string'||!currentPassword||currentPassword.length>200||typeof newPassword!=='string'||newPassword.length<12||newPassword.length>200||newPassword===currentPassword)return reply({error:'Choose a different password with 12–200 characters.'},400);
  if(!await changeStoredPassword(currentPassword,newPassword))return reply({error:'Check your current password. If it changed in another window, sign in again.'},409);
  return new Response(JSON.stringify({saved:true}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':await passwordSessionCookie(request,true)}});
 }catch(error){return reply({error:error instanceof AuthError?'Check your current password and try again.':'Unable to update your password. Please try again.'},error instanceof AuthError?401:503);}
}
export const config:Config={path:'/api/td-password',rateLimit:{windowLimit:6,windowSize:60,aggregateBy:['ip','domain']}};
