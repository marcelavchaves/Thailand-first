"use client";
import {useState} from 'react';

const places=[
 {name:'Hanoi',query:'Hanoi, Vietnam',x:59.43,y:19.71},
 {name:'Hue',query:'Hue, Vietnam',x:67.14,y:41.86},
 {name:'Da Nang',query:'Da Nang, Vietnam',x:72.29,y:44.57},
 {name:'Ho Chi Minh City',query:'Ho Chi Minh City, Vietnam',x:67.14,y:72.14},
 {name:'Siem Reap',query:'Siem Reap, Cambodia',x:52.29,y:59.86},
 {name:'Angkor Wat',query:'Angkor Wat, Cambodia',x:45,y:63.6},
 {name:'Chiang Mai',query:'Chiang Mai, Thailand',x:26,y:31.57},
 {name:'Bangkok',query:'Bangkok, Thailand',x:35,y:58},
];
const airplanes=[{x:70,y:27.29},{x:54,y:70}];

/** Hotspots correspond to the supplied 700 × 700 Vietnam–Cambodia–Thailand route map. */
export default function InteractiveRouteMap({src,onOpenFlights}:{src:string;onOpenFlights:()=>void}){
 const [enlarged,setEnlarged]=useState(false);
 return <figure className="interactive-route-map">
  <figcaption><h2>Your journey at a glance</h2><p>Tap an airplane for Flights or a place to open Google Maps. Enlarge the map for easier tapping.</p></figcaption>
  <button type="button" className="route-map-size" aria-pressed={enlarged} onClick={()=>setEnlarged(!enlarged)}>{enlarged?'Fit map to screen':'Enlarge map'}</button>
  <div className="route-map-scroll" role="region" aria-label="Interactive journey route map" tabIndex={0}>
   <div className={`route-map-image${enlarged?' is-enlarged':''}`}>
    <img src={src} alt="Journey through Hanoi, Hue, Da Nang, Ho Chi Minh City, Siem Reap, Chiang Mai and Bangkok" width="700" height="700"/>
    {places.map(place=><a key={place.name} className="route-map-hotspot" style={{left:`${place.x}%`,top:`${place.y}%`}} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.query)}`} target="_blank" rel="noopener noreferrer" aria-label={`Open ${place.name} in Google Maps`} title={`Open ${place.name} in Google Maps`}/>)}
    {airplanes.map((plane,i)=><a key={i} className="route-map-hotspot route-map-flight" style={{left:`${plane.x}%`,top:`${plane.y}%`}} href="/?tab=hotels&section=flights" onClick={event=>{if(!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){event.preventDefault();onOpenFlights();}}} aria-label="Open Flights" title="Open Flights"/>)}
   </div>
  </div>
  <details className="route-map-locations"><summary>Map locations</summary><div className="map-link-list">{places.map(place=><a key={place.name} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.query)}`} target="_blank" rel="noopener noreferrer">{place.name} ↗</a>)}</div></details>
 </figure>;
}
