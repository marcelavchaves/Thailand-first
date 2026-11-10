import {getStore} from '@netlify/blobs';
import {type MealSubmission} from '../../lib/meal-choices';
export function currentDietary(choice:MealSubmission|null|undefined,fallback=''){
 return choice?.dietarySynced||choice?.dietary?.trim()?choice?.dietary||'':fallback;
}
// A shared current note lives on the meal record. Per-meal submitted snapshots stay intact.
export async function withCurrentDietary(id:string,choice:MealSubmission|null|undefined){
 if(choice?.dietarySynced||choice?.dietary?.trim())return choice||null;
 const manifest=await getStore({name:'hotel-manifests-v1',consistency:'strong'}).get('manifest',{type:'json'}) as {guests?:Record<string,{dietary?:string}>}|null;
 const dietary=manifest?.guests?.[id]?.dietary||'';if(!dietary)return choice||null;
 return {...(choice||{selections:{},mealStates:{},status:'draft' as const,updatedAt:'',submittedAt:null}),dietary};
}
