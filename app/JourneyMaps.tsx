"use client";
import InteractiveRouteMap from './InteractiveRouteMap';
import {cityMaps,googleCityMap} from './city-maps';
import {useResources} from './ResourceLibrary';
import BrandIcon from './BrandIcon';
import './city-map-tiles.css';
export default function JourneyMaps(){
 const {items}=useResources();
 return <section className="page maps-page">
  <h1 className="tab-page-title">Maps</h1>
  <InteractiveRouteMap src="/images/southeast-asia-map-without-routes.png"/>
  <ul className="city-map-tiles" aria-label="City maps">{cityMaps.map(city=>{
   const url=googleCityMap(city.id,items),cover=items[`city-map-${city.id}`]?.mapCover;
   const handout=items[`map-handout-${city.id}`],hasHandout=handout?.file&&handout.visible&&!handout.deleted;
   return <li key={city.id}><a className="city-map-tile" href={hasHandout?`/map-handout?city=${city.id}`:url} target={hasHandout?undefined:"_blank"} rel="noopener noreferrer">{cover?<img src={cover} alt="" style={{width:'100%',height:120,objectFit:'cover'}}/>:<BrandIcon name="map"/>}<strong>{city.id==='saigon'?'Saigon':city.name}</strong><small>{hasHandout?'View Handout':url.startsWith('/api/')?'Uploaded map':'xavUrl'in city?'Xavier’s map':'Google Map'} ↗</small></a></li>;
  })}</ul>
 </section>;
}
