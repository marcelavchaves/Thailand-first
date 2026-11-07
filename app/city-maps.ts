export const cityMaps=[
 {id:'hanoi',name:'Hanoi',xavUrl:'https://maps.app.goo.gl/xYNpoB1qDGe6rfy76?g_st=i'},
 {id:'hue',name:'Hue'},
 {id:'danang',name:'Da Nang',xavUrl:'https://www.google.com/maps/placelists/list/tAV0ppFSrn-rVp1UBzGbYSMzkTUt0Q?token=YXLdY6_exYc&shh=CAE&g_st=i',primaryLink:true},
 {id:'hoian',name:'Hoi An'},
 {id:'saigon',name:'Ho Chi Minh City (Saigon)',xavUrl:'https://maps.app.goo.gl/GX8iH6YDuY3whSF17?g_st=i',primaryLink:true},
 {id:'siemreap',name:'Siem Reap',xavUrl:'https://maps.app.goo.gl/rDc8nzsBtgjNmVLPA?g_st=i',primaryLink:true},
 {id:'chiangmai',name:'Chiang Mai',xavUrl:'https://maps.app.goo.gl/fRRXFUc3f6phM7J28?g_st=i',primaryLink:true},
 {id:'bangkok',name:'Bangkok',xavUrl:'https://maps.app.goo.gl/CAUsDLDWoHVoSDVi8?g_st=i',primaryLink:true},
] as const;
type MapEntry={visible:boolean;deleted?:boolean;file?:boolean};
export function preferredCityMap(id:string,items:Record<string,MapEntry>){
 const city=cityMaps.find(city=>city.id===id);
 if(city&&'primaryLink' in city&&city.primaryLink&&'xavUrl' in city)return city.xavUrl;
 const entryId=`city-map-${id}`,entry=items[entryId];
 if(entry?.visible&&!entry.deleted&&entry.file)return `/api/tour-resources?file=${encodeURIComponent(entryId)}`;
 return city&&'xavUrl' in city?city.xavUrl:null;
}
