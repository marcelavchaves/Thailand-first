// All three destinations use UTC+7.
export function getJourneyStatus(now: Date) {
 const timeZone="Asia/Bangkok";
 const parts=new Intl.DateTimeFormat("en-US",{timeZone,year:"numeric",month:"numeric",day:"numeric"}).formatToParts(now);
 const value=(type:string)=>Number(parts.find(p=>p.type===type)?.value);
 const elapsed=Math.round((Date.UTC(value("year"),value("month")-1,value("day"))-Date.UTC(2026,10,16))/86400000);
 return {timeZone,timeLabel:"Vietnam / Cambodia / Thailand time · UTC+7",daysToGo:Math.max(0,-elapsed),dayNumber:elapsed>=0&&elapsed<16?elapsed+1:null,dayId:5+Math.max(0,Math.min(15,elapsed)),beforeTrip:elapsed<0,afterTrip:elapsed>=16};
}
