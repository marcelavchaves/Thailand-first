"use client";
import {useState} from 'react';
import hotels from './hotels.json';
import {ResourceGroup,useResources} from './ResourceLibrary';

const destinations=[
 {name:'Hanoi',country:'Vietnam',lat:21.0285,lon:105.8542},
 {name:'Hue',country:'Vietnam',lat:16.4637,lon:107.5909},
 {name:'Da Nang',country:'Vietnam',lat:16.0544,lon:108.2022},
 {name:'Hoi An',country:'Vietnam',lat:15.8801,lon:108.3380},
 {name:'Ho Chi Minh City (Saigon)',country:'Vietnam',lat:10.8231,lon:106.6297},
 {name:'Siem Reap',country:'Cambodia',lat:13.3633,lon:103.8564},
 {name:'Chiang Mai',country:'Thailand',lat:18.7883,lon:98.9853},
 {name:'Bangkok',country:'Thailand',lat:13.7563,lon:100.5018},
];
const google=(query:string)=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export default function JourneyMaps(){
 const [destination,setDestination]=useState(0),[provider,setProvider]=useState<'google'|'osm'>('google');
 const place=destinations[destination],query=`${place.name}, ${place.country}`;
 const osm=`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=13/${place.lat}/${place.lon}`;
 const osmEmbed=`https://www.openstreetmap.org/export/embed.html?bbox=${place.lon-.07},${place.lat-.05},${place.lon+.07},${place.lat+.05}&layer=mapnik&marker=${place.lat},${place.lon}`;
 const {items,loaded}=useResources();
 const sharedMaps=Object.values(items).some(item=>item.group==='maps'&&item.visible&&!item.deleted);
 return <section className="page maps-page">
  <div className="intro"><h1>Map</h1><p>Explore the places on your journey and find your hotel.</p></div>
  <section className="map-viewer" aria-labelledby="destination-map-title">
   <h2 id="destination-map-title">Destination maps</h2>
   <label htmlFor="map-destination">Choose a destination</label>
   <select id="map-destination" value={destination} onChange={e=>setDestination(Number(e.target.value))}>{destinations.map((d,i)=><option value={i} key={d.name}>{i+1}. {d.name} · {d.country}</option>)}</select>
   <div className="map-provider-switch" role="group" aria-label="Map provider"><button type="button" aria-pressed={provider==='google'} onClick={()=>setProvider('google')}>Google Maps</button><button type="button" aria-pressed={provider==='osm'} onClick={()=>setProvider('osm')}>OpenStreetMap</button></div>
   <iframe key={`${provider}-${destination}`} title={`${provider==='google'?'Google Maps':'OpenStreetMap'}: ${query}`} src={provider==='google'?`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=12&output=embed`:osmEmbed} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"/>
   <a className="map-open-link" href={provider==='google'?google(query):osm} target="_blank" rel="noopener noreferrer">Open {place.name} in {provider==='google'?'Google Maps':'OpenStreetMap'} ↗</a>
   <p className="map-online-note">Interactive maps need an internet connection. If the map does not load, use the link above.</p>
  </section>
  <section className="map-hotels" aria-labelledby="hotel-maps-title"><h2 id="hotel-maps-title">Hotel maps</h2><div className="map-link-list">{hotels.filter(h=>!h.name.includes('to be confirmed')).map(h=><a key={h.name} href={google(`${h.name}, ${h.city}`)} target="_blank" rel="noopener noreferrer"><strong>{h.name}</strong><span>{h.city} ↗</span></a>)}</div></section>
  <section className="map-shared" aria-labelledby="other-maps-title"><h2 id="other-maps-title">Other maps</h2><p>Printable maps and local maps shared by your tour director.</p>{loaded&&!sharedMaps&&<p>No shared maps yet.</p>}<ResourceGroup group="maps"/></section>
 </section>;
}
