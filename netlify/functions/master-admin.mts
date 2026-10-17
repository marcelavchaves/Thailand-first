import type {Config} from '@netlify/functions';
import {admin,login,logout,requestPasswordRecovery,AuthError,getIdentityConfig,type User} from '@netlify/identity';
import {MASTER_EMAIL,MASTER_ROLE,isMasterAdmin,hasMasterAdmin,masterSessionUser,masterIdentityReady} from '../lib/master-auth';
import {sameOrigin,resetTDPassword} from '../lib/td-auth';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie'}});
async function activate(authenticatedUser?:User){const sessionUser=authenticatedUser??await masterSessionUser();if(!sessionUser?.id||!MASTER_EMAIL()||sessionUser.email?.toLowerCase()!==MASTER_EMAIL())return false;
 const user=authenticatedUser??(getIdentityConfig()?.token?await admin.getUser(sessionUser.id):sessionUser);if(user.email?.toLowerCase()!==MASTER_EMAIL()||!user.confirmedAt)return false;
 if(!user.roles?.includes(MASTER_ROLE)&&!getIdentityConfig()?.token)return false;
 if(!user.roles?.includes(MASTER_ROLE))await admin.updateUser(user.id,{app_metadata:{...user.appMetadata,roles:[...(user.roles||[]),MASTER_ROLE]}});
 return true;
}
export default async function handler(request:Request){let stage:'session'|'login'|'activation'|'recovery'='session';try{
 if(request.method==='GET')return reply({configured:masterIdentityReady()&&!!MASTER_EMAIL(),authenticated:await hasMasterAdmin()});
 if(!sameOrigin(request))return reply({error:'Open this action from the app.'},403);
 if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
 if(!MASTER_EMAIL())return reply({error:'This deployment cannot read MASTER_ADMIN_EMAIL. Check its Functions scope and deploy context in Netlify.'},503);
 if(!masterIdentityReady())return reply({error:'This deployment cannot find its Netlify Identity endpoint.'},503);
 const raw=await request.text();if(raw.length>2000)return reply({error:'Invalid request.'},400);let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid request.'},400);}
 if(body?.action==='logout'){await logout();return reply({ok:true});}
 if(body?.action==='activate'){stage='activation';if(!await activate())return reply({error:'A verified owner account is required.'},403);return reply({ok:true});}
 if(body?.action==='recover'){stage='recovery';if(body.email?.trim().toLowerCase()===MASTER_EMAIL())await requestPasswordRecovery(MASTER_EMAIL());return reply({ok:true,message:'If this is your master-admin account, check your email for a reset link.'});}
 if(body?.action==='login'){
  if(body.email?.trim().toLowerCase()!==MASTER_EMAIL()||typeof body.password!=='string'||!body.password||body.password.length>200)return reply({error:'Check your admin email and password.'},401);
  stage='login';const signedInUser=await login(MASTER_EMAIL(),body.password);
  stage='activation';if(!await activate(signedInUser)){await logout();return reply({error:'Your account needs a confirmed email and the master-admin role in Netlify Identity before signing in.'},403);}
  stage='session';await login(MASTER_EMAIL(),body.password);return reply({ok:true});
 }
 if(body?.action==='reset-td'){
  if(!await hasMasterAdmin())return reply({error:'Master-admin access is required.'},403);
  if(typeof body.currentPassword!=='string'||!body.currentPassword||body.currentPassword.length>200||typeof body.newPassword!=='string'||body.newPassword.length<12||body.newPassword.length>200)return reply({error:'Enter your admin password and a new TD password of 12–200 characters.'},400);
  stage='login';const user=await login(MASTER_EMAIL(),body.currentPassword);if(!isMasterAdmin(user))return reply({error:'Master-admin access is required.'},403);
  stage='session';if(!await resetTDPassword(body.newPassword))return reply({error:'The TD password changed in another window. Try again.'},409);
  return reply({ok:true,message:'TD password reset. Existing TD sessions have been signed out.'});
 }
 return reply({error:'Unknown action.'},400);
 }catch(e){
 if(e instanceof AuthError){
  if(e.status===429)return reply({error:'Too many sign-in attempts. Wait a minute before trying again.'},429);
  if(stage==='activation')return reply({error:'Your password was accepted, but master-admin account activation failed. Check the account’s master-admin role in Netlify Identity.'},503);
  if(stage==='login'&&(e.status===400||e.status===401))return reply({error:'Netlify Identity did not accept this email and password. Use your master-admin account password, or choose Forgot admin password to reset it.'},401);
  if(stage==='recovery')return reply({error:'Netlify could not send the password-reset email. Check Identity email settings or try again later.'},503);
 }
 return reply({error:'Admin access is temporarily unavailable. Please try again later.'},503);
}}
export const config:Config={path:'/api/master-admin',rateLimit:{windowLimit:8,windowSize:60,aggregateBy:['ip','domain']}};
