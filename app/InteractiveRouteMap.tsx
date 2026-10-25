"use client";
import {useResources} from './ResourceLibrary';
import {preferredCityMap} from './city-maps';

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
export default function InteractiveRouteMap({src}:{src:string}){
 const {items}=useResources();
 const mapHref=(place:typeof places[number])=>preferredCityMap(place.mapId,items)||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.query)}`;
 return <figure className="interactive-route-map">
  <figcaption><h2>Journey</h2><p>Tap a place for Xav’s map, when available, or Google Maps.</p></figcaption>
  <div className="route-map-scroll" role="region" aria-label="Interactive journey route map" tabIndex={0}>
   <div className="route-map-image">
    <img src={src} alt="Journey through Hanoi, Hue, Da Nang, Ho Chi Minh City, Siem Reap, Chiang Mai and Bangkok" width="1269" height="1239"/>
    {places.map(place=><a key={place.name} className="route-map-hotspot" style={{left:`${place.x}%`,top:`${place.y}%`}} href={mapHref(place)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${preferredCityMap(place.mapId,items)?"Xav’s ":""}${place.name} map`} title={`Open ${place.name} map`}/>)}

   </div>
  </div>
 </figure>;
}
