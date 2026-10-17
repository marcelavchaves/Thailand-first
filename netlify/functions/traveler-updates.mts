import type {Config} from '@netlify/functions';
import {getStore} from '@netlify/blobs';
import {sameOrigin} from '../lib/td-auth';
import {recentUpdates,subscriptionKey} from '../lib/updates';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export default async function handler(request:Request){
 try{
  if(request.method==='GET')return reply({updates:await recentUpdates(),publicKey:process.env.WEB_PUSH_PUBLIC_KEY||null});
  if(!['POST','DELETE'].includes(request.method))return reply({error:'Method not allowed'},405);
  if(!sameOrigin(request))return reply({error:'Open this action in the app'},403);
  const raw=await request.text();if(raw.length>4096)return reply({error:'Invalid subscription'},400);
  const body=JSON.parse(raw);
  const endpoint=body?.endpoint;
  if(typeof endpoint!=='string'||endpoint.length>2048)return reply({error:'Invalid subscription'},400);
  const url=new URL(endpoint);
  if(url.protocol!=='https:'||!/(^|\.)push\.apple\.com$|(^|\.)push\.services\.mozilla\.com$|^fcm\.googleapis\.com$|^updates\.push\.services\.mozilla\.com$|^android\.googleapis\.com$/.test(url.hostname))return reply({error:'Unsupported push service'},400);
  const store=getStore({name:'traveler-push-subscriptions',consistency:'strong'});
  const key=subscriptionKey(endpoint);
  if(request.method==='DELETE'){await store.delete(key);return reply({ok:true});}
  if(typeof body?.keys?.p256dh!=='string'||typeof body?.keys?.auth!=='string'||body.keys.p256dh.length>256||body.keys.auth.length>256)return reply({error:'Invalid subscription'},400);
  await store.setJSON(key,{endpoint,keys:{p256dh:body.keys.p256dh,auth:body.keys.auth}});
  return reply({ok:true});
 }catch(error){console.error('Traveler updates error',error);return reply({error:'Notifications are unavailable'},500);}
}
export const config:Config={path:'/api/traveler-updates',rateLimit:{windowLimit:60,windowSize:60,aggregateBy:['ip','domain']}};
