"use client";
import {useEffect,useRef,useState} from 'react';
import hotels from './hotels.json';
import {ResourceGroup,useResources} from './ResourceLibrary';

const destinations=[
 {name:'Hanoi',icon:'hanoi',country:'Vietnam',lat:21.0285,lon:105.8542},
 {name:'Hue',icon:'hue',country:'Vietnam',lat:16.4637,lon:107.5909},
 {name:'Da Nang',icon:'danang',country:'Vietnam',lat:16.0544,lon:108.2022},
 {name:'Hoi An',icon:'hoian',country:'Vietnam',lat:15.8801,lon:108.3380},
 {name:'Ho Chi Minh City (Saigon)',icon:'saigon',country:'Vietnam',lat:10.8231,lon:106.6297},
 {name:'Siem Reap',icon:'siemreap',country:'Cambodia',lat:13.3633,lon:103.8564},
 {name:'Chiang Mai',icon:'chiangmai',country:'Thailand',lat:18.7883,lon:98.9853},
 {name:'Bangkok',icon:'bangkok',country:'Thailand',lat:13.7563,lon:100.5018},
];
const google=(query:string)=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

const confirmedHotels=hotels.filter(h=>!h.name.includes('to be confirmed'));
const tiles=[
 ...destinations.map((d,i)=>({key:`city-${i}`,title:d.name,subtitle:d.country,image:`/images/maps-${d.icon}.svg`})),
 ...confirmedHotels.map((h,i)=>({key:`hotel-${i}`,title:h.name,subtitle:h.city,image:'/images/essentials-hotels.svg'})),
 {key:'shared',title:'Other maps',subtitle:'Shared by your tour director',image:'/images/maps-other.svg'},
];

export default function JourneyMaps(){
 const [selected,setSelected]=useState<string|null>(null),[provider,setProvider]=useState<'google'|'osm'>('google');
 const panel=useRef<HTMLElement>(null),hotelMap=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!selected)return;
  const frame=requestAnimationFrame(()=>{
   const target=selected.startsWith('hotel-')?hotelMap.current:panel.current;
   if(!target)return;
   const bannerHeight=document.querySelector('.topbar')?.getBoundingClientRect().height??0;
   window.scrollTo({top:Math.max(0,window.scrollY+target.getBoundingClientRect().top-bannerHeight-12),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  });
  return ()=>cancelAnimationFrame(frame);
 },[selected]);
 const hotelsExpanded=selected==='hotels'||!!selected?.startsWith('hotel-');
 const city=selected?.startsWith('city-')?destinations[Number(selected.slice(5))]:null;
 const hotel=selected?.startsWith('hotel-')?confirmedHotels[Number(selected.slice(6))]:null;
 const query=city?`${city.name}, ${city.country}`:hotel?`${hotel.name}, ${hotel.city}`:'';
 const osm=city?`https://www.openstreetmap.org/?mlat=${city.lat}&mlon=${city.lon}#map=13/${city.lat}/${city.lon}`:'';
 const osmEmbed=city?`https://www.openstreetmap.org/export/embed.html?bbox=${city.lon-.07},${city.lat-.05},${city.lon+.07},${city.lat+.05}&layer=mapnik&marker=${city.lat},${city.lon}`:'';
 const {items,loaded}=useResources();
 const sharedMaps=Object.values(items).some(item=>item.group==='maps'&&item.visible&&!item.deleted);
 return <section className="page maps-page">
  <div className="intro"><h1>Maps</h1><p>Explore each city, find your hotel and discover Xavier’s local maps.</p></div>
  <h2>Visited cities</h2>
  <div className="more-tile-grid" role="group" aria-label="City maps">{tiles.filter(t=>t.key.startsWith('city-')).map(tile=>renderTile(tile))}</div>
  <div className="more-tile-grid" role="group" aria-label="More maps">
   <button type="button" className="more-tile" aria-expanded={hotelsExpanded} aria-controls={hotelsExpanded?'selected-map':undefined} onClick={()=>setSelected(hotelsExpanded?null:'hotels')}><img src="/images/essentials-hotels.svg" alt=""/><strong>Hotels</strong><small>Find your hotel</small></button>
   {renderTile(tiles[tiles.length-1])}
  </div>
  {selected&&<section id="selected-map" ref={panel} className="map-viewer" aria-labelledby="selected-map-title">
   <h2 id="selected-map-title">{hotelsExpanded?'Hotels':city?.name??'Other maps'}</h2>
   {hotelsExpanded&&<><div className="more-tile-grid" role="group" aria-label="Hotel maps">{tiles.filter(t=>t.key.startsWith('hotel-')).map(tile=>renderTile(tile))}</div><p>Hanoi hotel details will be added once confirmed.</p></>}
   {selected==='hotels'?null:selected==='shared'?<><p>Printable maps and local maps shared by your tour director.</p>{loaded&&!sharedMaps&&<p>No shared maps yet.</p>}<ResourceGroup group="maps"/></>:<div ref={hotelMap}>
    {hotel&&<h3>{hotel.name}</h3>}
    {city===destinations[0]&&<a className="map-open-link map-xavier-link" href="https://maps.app.goo.gl/xYNpoB1qDGe6rfy76?g_st=i" target="_blank" rel="noopener noreferrer">Open Xav’s Hanoi map ↗</a>}
    {city&&<div className="map-provider-switch" role="group" aria-label="Map provider"><button type="button" aria-pressed={provider==='google'} onClick={()=>setProvider('google')}>Google Maps</button><button type="button" aria-pressed={provider==='osm'} onClick={()=>setProvider('osm')}>OpenStreetMap</button></div>}
    <iframe key={`${selected}-${provider}`} title={`${city&&provider==='osm'?'OpenStreetMap':'Google Maps'}: ${query}`} src={city&&provider==='osm'?osmEmbed:`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${hotel?16:12}&output=embed`} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"/>
    <a className="map-open-link" href={city&&provider==='osm'?osm:google(query)} target="_blank" rel="noopener noreferrer">Open {city?.name??hotel?.name} in {city&&provider==='osm'?'OpenStreetMap':'Google Maps'} ↗</a>
    <p className="map-online-note">Interactive maps need an internet connection. If the map does not load, use the link above.</p>
   </div>}
  </section>}
 </section>;
 function renderTile(tile:typeof tiles[number]){
  return <button key={tile.key} type="button" className="more-tile" aria-expanded={selected===tile.key} aria-controls={selected===tile.key?'selected-map':undefined} onClick={()=>{setSelected(selected===tile.key?(tile.key.startsWith('hotel-')?'hotels':null):tile.key);setProvider('google');}}><img src={tile.image} alt=""/><strong>{tile.title}</strong><small>{tile.subtitle}</small></button>;
 }
}
