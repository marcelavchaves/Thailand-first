import {importedReleaseEntries} from './tour-import.mjs';
export const released=(entries,id)=>entries[id]?.visible===true&&!entries[id]?.deleted;
export function applyReleases(content,entries){
 entries=importedReleaseEntries(entries);
 const data=content.data;
 data.days=data.days.map(day=>released(entries,`schedule-${day.date}`)?day:{...day,events:[['COMING SOON','Xavier will share this day’s schedule when it’s ready.']],note:'',updatedAt:undefined});
 data.localGuides=(data.localGuides||[]).filter((g,i)=>released(entries,`local-${i}`)&&!entries[`local-${i}`]?.blob);
 data.hotelResources=(data.hotelResources||[]).filter(x=>released(entries,`menu-${x.id}`));
 data.storytelling=(data.storytelling||[]).filter(x=>released(entries,`story-${x.id}`));
 const ids={'Java Guide':'guide-java','Bali Guide':'guide-bali','Bali Map':'guide-bali-map','Singapore Guide':'guide-singapore'};
 content.sections=content.sections.map(section=>{
  const id=ids[section.title];if(!id)return section;
  if(!released(entries,id))return {...section,blocks:[{kind:'paragraph',text:'Coming soon. Xavier will share this when it’s ready.'}]};
  if(entries[id]?.blob)return {...section,blocks:[{kind:'paragraph',text:'Open the updated guide in the app.',href:`/api/tour-resources?file=${id}`}]};
  return section;
 });
 content.documents=(content.documents||[]).filter(d=>{const id=d.src.includes('IMG_9436')?'guide-bali-map':d.src.includes('xavier-java')?'guide-java':d.src.includes('xavier-bali')?'guide-bali':null;return !id||released(entries,id)&&!entries[id]?.blob;});
 return content;
}
