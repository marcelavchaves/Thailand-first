import { createHash, randomUUID } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

export type TravelerUpdate = { id:string; at:string; action:string; section:string; day?:number; url:string };
const events = () => getStore({name:'traveler-updates',consistency:'strong'});
const subscriptions = () => getStore({name:'traveler-push-subscriptions',consistency:'strong'});
export const subscriptionKey = (endpoint:string) => 'subscription/'+createHash('sha256').update(endpoint).digest('hex');
export async function recentUpdates():Promise<TravelerUpdate[]> {
 const store=events(), result:TravelerUpdate[]=[];
 for await(const page of store.list({prefix:'update/',paginate:true})) {
  const sorted=[...page.blobs].sort((a,b)=>b.key.localeCompare(a.key));
  for(const blob of sorted){const item=await store.get(blob.key,{type:'json'}) as TravelerUpdate|null;if(item)result.push(item);}
  if(result.length>=100)break;
 }
 return result.sort((a,b)=>b.at.localeCompare(a.at)).slice(0,30);
}
export async function publishUpdate(update:Pick<TravelerUpdate,'action'|'section'|'url'> & Partial<Pick<TravelerUpdate,'day'>>){
 const at=new Date().toISOString();
 const item:TravelerUpdate={...update,id:randomUUID(),at};
 await events().setJSON(`update/${at}-${item.id}`,item);
 return item;
}
export async function sendPush(item:TravelerUpdate){
 const publicKey=process.env.WEB_PUSH_PUBLIC_KEY,privateKey=process.env.WEB_PUSH_PRIVATE_KEY;
 if(!publicKey||!privateKey)return;
 webpush.setVapidDetails(process.env.URL || 'https://kingdoms-dragons-new-edition.netlify.app',publicKey,privateKey);
 const store=subscriptions();
 for await(const page of store.list({prefix:'subscription/',paginate:true})){
  await Promise.all(page.blobs.map(async blob=>{
   try{
    const sub=await store.get(blob.key,{type:'json'}) as webpush.PushSubscription|null;
    if(sub)await webpush.sendNotification(sub,JSON.stringify({title:'Chervil updated the journey',body:item.action+' · '+item.section,url:item.url,id:item.id}),{TTL:86400});
   }catch(error){
    const status=(error as {statusCode?:number}).statusCode;
    if(status===404||status===410)await store.delete(blob.key);
    else console.error('Traveler push delivery failed',error);
   }
  }));
 }
}
export async function announce(update:Pick<TravelerUpdate,'action'|'section'|'url'> & Partial<Pick<TravelerUpdate,'day'>>,context?:{waitUntil?:(promise:Promise<unknown>)=>void}){
 // Traveler notifications are paused while the experience is being revised.
 void update;
 void context;
}
