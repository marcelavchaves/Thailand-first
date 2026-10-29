import menus from '../app/meal-menus.json';
export {menus};
export const PROTOTYPE_SITE_ID='c1f3ce92-834f-4a1e-a84b-1551409ddb7b';
export const WELCOME_DINNER_AT='2026-11-16T19:00:00+07:00';
export const MEAL_DEADLINE=new Date(Date.parse(WELCOME_DINNER_AT)-30*60*1000).toISOString();
export type Selections=Record<string,Record<string,string>>;
export type MealSubmission={selections:Selections;dietary:string;status:'draft'|'submitted';updatedAt:string;submittedAt:string|null};
export function validateSubmission(value:unknown,complete:boolean):{selections:Selections;dietary:string}{
 if(!value||typeof value!=='object')throw Error('Check your meal choices.');
 const v=value as {selections:unknown;dietary:unknown};
 if(!v.selections||typeof v.selections!=='object'||Array.isArray(v.selections)||typeof v.dietary!=='string'||v.dietary.length>2000)throw Error('Enter your choices and keep dietary notes under 2,000 characters.');
 const source=v.selections as Record<string,unknown>,selections:Selections={};
 if(Object.keys(source).some(id=>!menus.some(m=>m.id===id)))throw Error('Unknown menu. Refresh this page.');
 for(const menu of menus){
  const raw=source[menu.id]??{};
  if(typeof raw!=='object'||raw===null||Array.isArray(raw))throw Error('Check your choices.');
  const choices=raw as Record<string,unknown>;
  if(Object.keys(choices).some(id=>!menu.courses.some(c=>c.id===id)))throw Error('Unknown course. Refresh this page.');
  const selected:Record<string,string>={};
  for(const course of menu.courses){const id=choices[course.id];if(id===undefined||id===''){if(complete)throw Error(`Choose one ${course.title.toLowerCase()} for ${menu.title}.`);continue;}if(typeof id!=='string'||!course.options.some(o=>o.id===id))throw Error('Choose one of the available menu options.');selected[course.id]=id;}
  selections[menu.id]=selected;
 }
 return {selections,dietary:v.dietary.trim()};
}
export type MealReportGuest={id:string;name:string;pinReady:boolean;submission:MealSubmission|null};
export function mealReport(guests:MealReportGuest[],menuId='all'){
 if(menuId!=='all'&&!menus.some(m=>m.id===menuId))throw Error('Choose an available meal.');
 const selected=menus.filter(m=>menuId==='all'||m.id===menuId);
 const rows=selected.flatMap(menu=>guests.flatMap(guest=>menu.courses.map(course=>{
  const submission=guest.submission,choice=course.options.find(o=>o.id===submission?.selections[menu.id]?.[course.id]);
  return {meal:menu.title,restaurant:menu.restaurant,course:course.title,travelerId:guest.id,traveler:guest.name,choice:choice?.name||'—',dietary:submission?.dietary||'',status:submission?.status||'not started',submittedAt:submission?.submittedAt||''};
 })));
 const totals=selected.flatMap(menu=>menu.courses.flatMap(course=>course.options.map(option=>({meal:menu.title,course:course.title,choice:option.name,count:guests.filter(g=>g.submission?.status==='submitted'&&g.submission.selections[menu.id]?.[course.id]===option.id).length}))));
 return {rows,totals};
}
