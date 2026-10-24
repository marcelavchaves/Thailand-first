export const cityMaps=[
 {id:'hanoi',name:'Hanoi',xavUrl:'https://maps.app.goo.gl/xYNpoB1qDGe6rfy76?g_st=i'},
 {id:'hue',name:'Hue'},
 {id:'danang',name:'Da Nang'},
 {id:'hoian',name:'Hoi An'},
 {id:'saigon',name:'Ho Chi Minh City (Saigon)'},
 {id:'siemreap',name:'Siem Reap'},
 {id:'chiangmai',name:'Chiang Mai'},
 {id:'bangkok',name:'Bangkok'},
] as const;
type MapEntry={visible:boolean;deleted?:boolean;file?:boolean};
export function preferredCityMap(id:string,items:Record<string,MapEntry>){
 const entryId=`city-map-${id}`,entry=items[entryId];
 if(entry?.visible&&!entry.deleted&&entry.file)return `/api/tour-resources?file=${encodeURIComponent(entryId)}`;
 const city=cityMaps.find(city=>city.id===id);
 return city&&'xavUrl' in city?city.xavUrl:null;
}
