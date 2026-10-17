// Explicit publication of Xavier's supplied KD 103 schedules and guest list.
// TD edits/hides saved with this version take precedence after the import.
export const TOUR_IMPORT_VERSION='kd103-cher-sm23-published-v2';
/** @param {Record<string, any>} entries @returns {Record<string, any>} */
export function importedReleaseEntries(entries={}){
 const result={...entries};
 for(let day=5;day<=20;day++){
  const id=`schedule-${day}`,old=entries[id];
  if(old?.importVersion===TOUR_IMPORT_VERSION)continue;
  result[id]={...old,id,title:old?.title||'Today’s schedule',group:'schedules',visible:true,deleted:false,blob:null,type:null,importVersion:TOUR_IMPORT_VERSION};
 }
 return result;
}
/** @param {any} snapshot @param {number} day @param {any} saved */
export function importedSchedule(snapshot,day,saved){
 if(saved?.importVersion===TOUR_IMPORT_VERSION)return saved;
 const original=snapshot.data.days.find(item=>item.date===day);
 return original?{events:original.events,note:original.note,importVersion:TOUR_IMPORT_VERSION}:null;
}
