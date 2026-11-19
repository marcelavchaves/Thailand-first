export type ScheduleHighlights={at:string|null;events:(string|null)[];noteAt:string|null};
type Schedule={events:[string,string][];note:string;updatedAt?:string;changes?:ScheduleHighlights};
export const SCHEDULE_HIGHLIGHT_MS=24*60*60*1000;
export function recentlyChanged(at:string|null|undefined,now=Date.now()){
 const time=at?Date.parse(at):NaN;return Number.isFinite(time)&&now>=time&&now-time<SCHEDULE_HIGHLIGHT_MS;
}
export function scheduleHighlights(previous:Schedule|null|undefined,next:Pick<Schedule,'events'|'note'>,at:string):ScheduleHighlights{
 const old=previous||{events:[],note:''},matches=new Map<string,(string|null)[]>();
 old.events.forEach((event,index)=>{const key=JSON.stringify(event),values=matches.get(key)||[];values.push(old.changes?.events[index]||null);matches.set(key,values);});
 const events=next.events.map(event=>{const values=matches.get(JSON.stringify(event));return values?.length?values.shift()!:at;});
 const changed=JSON.stringify(old.events)!==JSON.stringify(next.events)||old.note!==next.note;
 return {at:changed?at:old.changes?old.changes.at:old.updatedAt||null,events,noteAt:old.note!==next.note?at:old.changes?.noteAt||null};
}
