"use client";
import InteractiveRouteMap from './InteractiveRouteMap';
import {cityMaps,preferredCityMap} from './city-maps';
import {useResources} from './ResourceLibrary';
import BrandIcon from './BrandIcon';
import './city-map-tiles.css';
export default function JourneyMaps(){
 const {items}=useResources();
 return <section className="page maps-page">
  <h1 className="tab-page-title">Maps</h1>
  <InteractiveRouteMap src="/images/southeast-asia-map-without-routes.png"/>
  <ul className="city-map-tiles" aria-label="City maps">{cityMaps.map(city=>{
   const upload=items[`city-map-${city.id}`],url=preferredCityMap(city.id,items)||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(city.name)}`;
   return <li key={city.id}><a className="city-map-tile" href={url} target="_blank" rel="noopener noreferrer"><BrandIcon name="map"/><strong>{city.id==='saigon'?'Saigon':city.name}</strong><small>{url.startsWith('/api/')?'Uploaded map':'xavUrl'in city?'Xavier’s map':'Google Map'} ↗</small></a>{upload?.visible&&!upload.deleted&&upload.file&&!url.startsWith('/api/')&&<a className="city-upload-link" href={`/api/tour-resources?file=city-map-${city.id}`} target="_blank" rel="noopener noreferrer">View uploaded city map ↗</a>}</li>;
  })}</ul>
 </section>;
}
