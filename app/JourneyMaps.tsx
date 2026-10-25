"use client";
import {useEffect,useRef,useState} from 'react';
import InteractiveRouteMap from './InteractiveRouteMap';
const destinations:Record<string,{name:string;country:string}>={
 hanoi:{name:'Hanoi',country:'Vietnam'},hue:{name:'Hue',country:'Vietnam'},danang:{name:'Da Nang',country:'Vietnam'},hoian:{name:'Hoi An',country:'Vietnam'},saigon:{name:'Ho Chi Minh City',country:'Vietnam'},siemreap:{name:'Siem Reap',country:'Cambodia'},chiangmai:{name:'Chiang Mai',country:'Thailand'},bangkok:{name:'Bangkok',country:'Thailand'},angkorwat:{name:'Angkor Wat',country:'Cambodia'},
};
export default function JourneyMaps(){
 const [selected,setSelected]=useState<string|null>(null),[selection,setSelection]=useState(0);
 const panel=useRef<HTMLElement>(null),city=selected?destinations[selected]:null;
 useEffect(()=>{
  if(!city)return;
  const frame=requestAnimationFrame(()=>panel.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));
  return()=>cancelAnimationFrame(frame);
 },[city,selection]);
 const query=city?`${city.name}, ${city.country}`:'';
 return <section className="page maps-page">
  <div className="intro"><h1>Maps</h1></div>
  <InteractiveRouteMap src="/images/southeast-asia-map-without-routes.png" onSelectCity={id=>{if(destinations[id]){setSelected(id);setSelection(value=>value+1);}}}/>
  {city&&<section id="selected-map" ref={panel} className="map-viewer" aria-labelledby="selected-map-title">
   <h2 id="selected-map-title">{city.name}</h2>
   <iframe key={selected} title={`Google Maps: ${query}`} src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=12&output=embed`} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"/>
   <a className="map-open-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer">Open {city.name} in Google Maps ↗</a>
  </section>}
 </section>;
}
