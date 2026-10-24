"use client";
import {useState} from 'react';
import {useResources} from './ResourceLibrary';
import {preferredCityMap} from './city-maps';

const places=[
 {name:'Hanoi',mapId:'hanoi',query:'Hanoi, Vietnam',x:59.43,y:19.71},
 {name:'Hue',mapId:'hue',query:'Hue, Vietnam',x:67.14,y:41.86},
 {name:'Da Nang',mapId:'danang',query:'Da Nang, Vietnam',x:72.29,y:44.57},
 {name:'Ho Chi Minh City',mapId:'saigon',query:'Ho Chi Minh City, Vietnam',x:67.14,y:72.14},
 {name:'Siem Reap',mapId:'siemreap',query:'Siem Reap, Cambodia',x:52.29,y:59.86},
 {name:'Angkor Wat',mapId:'angkorwat',query:'Angkor Wat, Cambodia',x:45,y:63.6},
 {name:'Chiang Mai',mapId:'chiangmai',query:'Chiang Mai, Thailand',x:26,y:31.57},
 {name:'Bangkok',mapId:'bangkok',query:'Bangkok, Thailand',x:35,y:58},
];
const airplanes=[{x:70,y:27.29},{x:54,y:70}];

/** Hotspots correspond to the supplied 700 × 700 Vietnam–Cambodia–Thailand route map. */
export default function InteractiveRouteMap({src,onOpenFlights}:{src:string;onOpenFlights:()=>void}){
 const {items}=useResources();
 const mapHref=(place:typeof places[number])=>preferredCityMap(place.mapId,items)||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.query)}`;
 const [enlarged,setEnlarged]=useState(false);
 return <figure className="interactive-route-map">
  <figcaption><div className="route-map-heading"><h2>Journey</h2><button type="button" className="route-map-size" aria-pressed={enlarged} onClick={()=>setEnlarged(!enlarged)}>{enlarged?'Fit map to screen':'Enlarge map'}</button></div><p>Tap an airplane for Flights or a place for Xav’s map, when available, or Google Maps. Enlarge the map for easier tapping.</p></figcaption>
  <div className="route-map-scroll" role="region" aria-label="Interactive journey route map" tabIndex={0}>
   <div className={`route-map-image${enlarged?' is-enlarged':''}`}>
    <img src={src} alt="Journey through Hanoi, Hue, Da Nang, Ho Chi Minh City, Siem Reap, Chiang Mai and Bangkok" width="700" height="700"/>
    {places.map(place=><a key={place.name} className="route-map-hotspot" style={{left:`${place.x}%`,top:`${place.y}%`}} href={mapHref(place)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${preferredCityMap(place.mapId,items)?"Xav’s ":""}${place.name} map`} title={`Open ${place.name} map`}/>)}
    {airplanes.map((plane,i)=><a key={i} className="route-map-hotspot route-map-flight" style={{left:`${plane.x}%`,top:`${plane.y}%`}} href="/?tab=hotels&section=flights" onClick={event=>{if(!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){event.preventDefault();onOpenFlights();}}} aria-label="Open Flights" title="Open Flights"/>)}
   </div>
  </div>
  <details className="route-map-locations"><summary>Map locations</summary><div className="map-link-list">{places.map(place=><a key={place.name} href={mapHref(place)} target="_blank" rel="noopener noreferrer">{place.name} ↗</a>)}</div></details>
 </figure>;
}
