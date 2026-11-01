import {menus,type Selections} from './meal-choices';
export type SheetRegion={x:number;y:number;width:number;height:number};
export function sheetRegions(layout:string):SheetRegion[]{
 const columns=layout==='two-across'?2:layout==='three-across'?3:1,rows=layout==='two-down'?2:1;
 return Array.from({length:columns*rows},(_,i)=>({x:(i%columns)/columns,y:Math.floor(i/columns)/rows,width:1/columns,height:1/rows}));
}
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function paperSuggestions(text:string,guests:{id:string;name:string}[]){
 const normalized=' '+normalize(text)+' ';
 const names=guests.filter(g=>normalized.includes(' '+normalize(g.name)+' '));
 const selections:Selections={},conflicts=new Set<string>();
 // A printed list of menu options is not evidence of a choice. Only explicit marked/selected lines can suggest a dish.
 for(const line of text.split(/\r?\n/)){
  if(!/(?:\[[xX✓✔]\]|[✓✔☑]|^\s*[xX]\s|\bselected\s*:|\bchoice\s*:)/i.test(line))continue;
  const clean=' '+normalize(line)+' ';
  const matches=menus.flatMap(m=>m.courses.flatMap(c=>c.options.filter(o=>clean.includes(' '+normalize(o.name)+' ')).map(o=>({menu:m.id,course:c.id,option:o.id}))));
  if(matches.length!==1)continue;
  const match=matches[0],key=match.menu+'/'+match.course,old=selections[match.menu]?.[match.course];
  if(conflicts.has(key))continue;
  if(old&&old!==match.option){selections[match.menu][match.course]='';conflicts.add(key);}
  else{selections[match.menu]??={};selections[match.menu][match.course]=match.option;}
 }
 return {guestId:names.length===1?names[0].id:'',selections,menuIds:Object.keys(selections)};
}
