import {getStore} from '@netlify/blobs';
import {cleanDayFeatures} from '../../lib/day-features';
export const dayFeatureStore=()=>getStore({name:'day-feature-visibility',consistency:'strong'});
export async function dayFeatures(day:number){return cleanDayFeatures(await dayFeatureStore().get('day/'+day,{type:'json'}));}
export async function hideAnnouncement(day:number){
 for(let i=0;i<5;i++){
  const old=await dayFeatureStore().getWithMetadata('day/'+day,{type:'json'});
  const result=await dayFeatureStore().setJSON('day/'+day,{...cleanDayFeatures(old?.data),announcement:false},old?{onlyIfMatch:old.etag}:{onlyIfNew:true});
  if(result.modified)return;
 }
 throw Error('Visibility changed in another window. Please try again.');
}
