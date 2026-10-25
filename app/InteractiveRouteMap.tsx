"use client";
import {useResources} from './ResourceLibrary';
import {preferredCityMap} from './city-maps';

const labelAreas:Record<string,{left:number;top:number;width:number;height:number}>={hanoi:{left:51.2,top:16,width:6.1,height:2.8},hue:{left:63.7,top:37.8,width:4.6,height:2.6},danang:{left:71.8,top:41.8,width:9,height:2.8},saigon:{left:66.6,top:72.6,width:10,height:5},siemreap:{left:39.3,top:58,width:11,height:2.6},angkorwat:{left:37.5,top:61.4,width:13.5,height:3},chiangmai:{left:21.7,top:25,width:8,height:5.3},bangkok:{left:26.6,top:58.5,width:9,height:2.8}};
const places=[
 {name:'Hanoi',mapId:'hanoi',query:'Hanoi, Vietnam',x:58,y:19.13},
 {name:'Hue',mapId:'hue',query:'Hue, Vietnam',x:65.72,y:41.16},
 {name:'Da Nang',mapId:'danang',query:'Da Nang, Vietnam',x:70.61,y:44.07},
 {name:'Ho Chi Minh City',mapId:'saigon',query:'Ho Chi Minh City, Vietnam',x:65.8,y:71.03},
 {name:'Siem Reap',mapId:'siemreap',query:'Siem Reap, Cambodia',x:51.22,y:59},
 {name:'Angkor Wat',mapId:'angkorwat',query:'Angkor Wat, Cambodia',x:44.29,y:62.55},
 {name:'Chiang Mai',mapId:'chiangmai',query:'Chiang Mai, Thailand',x:26.08,y:31.24},
 {name:'Bangkok',mapId:'bangkok',query:'Bangkok, Thailand',x:34.59,y:57.14},
];
/** City hotspots align with the clean 1269 × 1239 map. */
export default function InteractiveRouteMap({src,onSelectCity}:{src:string;onSelectCity:(id:string)=>void}){
 const {items}=useResources();
 const mapHref=(place:typeof places[number])=>preferredCityMap(place.mapId,items)||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.query)}`;
 return <figure className="interactive-route-map">
  <figcaption><h2>Journey</h2><p>Tap a place for Xav’s map, when available, or Google Maps.</p></figcaption>
  <div className="route-map-scroll" role="region" aria-label="Interactive journey route map" tabIndex={0}>
   <div className="route-map-image">
    <img src={src} alt="Journey through Hanoi, Hue, Da Nang, Ho Chi Minh City, Siem Reap, Chiang Mai and Bangkok" width="1269" height="1239"/>
    {places.map(place=><a key={place.name} className="route-map-hotspot" style={{left:`${place.x}%`,top:`${place.y}%`}} href={mapHref(place)} target="_blank" rel="noopener noreferrer" onClick={event=>{if(!preferredCityMap(place.mapId,items)&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){event.preventDefault();onSelectCity(place.mapId);}}} aria-label={`Open ${preferredCityMap(place.mapId,items)?"Xav’s ":""}${place.name} map`} title={`Open ${place.name} map`}/>)}
    {places.map(place=>{const area=labelAreas[place.mapId];return <a key={`label-${place.mapId}`} className="route-map-label" style={{left:`${area.left}%`,top:`${area.top}%`,width:`${area.width}%`,height:`${area.height}%`}} href={mapHref(place)} target="_blank" rel="noopener noreferrer" aria-hidden="true" tabIndex={-1} title={`Open ${place.name} map`} onClick={event=>{if(!preferredCityMap(place.mapId,items)&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){event.preventDefault();onSelectCity(place.mapId);}}}/>;})}
   </div>
  </div>
 </figure>;
}
