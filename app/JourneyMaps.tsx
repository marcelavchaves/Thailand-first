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
   const url=googleCityMap(city.id,items),name=city.id==='saigon'?'Saigon':city.name;
   const handout=items[`map-handout-${city.id}`],hasHandout=handout?.file&&handout.visible&&!handout.deleted;
   const listContent=<><span className="city-map-action-icon"><BrandIcon name="list"/></span><small>List</small></>;
   return <li key={city.id}><div className="city-map-tile" role="group" aria-label={name}>
    <strong>{name}</strong>
    <div className="city-map-actions">
     <a className="city-map-action" href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${name} map`}><span className="city-map-action-icon"><BrandIcon name="map"/></span><small>Map</small></a>
     {hasHandout?<a className="city-map-action" href={`/map-handout?city=${city.id}`} aria-label={`Open ${name} list`}>{listContent}</a>:<button type="button" className="city-map-action" disabled title="This list has not been shared yet" aria-label={`${name} list not yet shared`}>{listContent}</button>}
    </div>
   </div></li>;
  })}</ul>
 </section>;
}
