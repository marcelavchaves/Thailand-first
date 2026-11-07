"use client";
import InteractiveRouteMap from './InteractiveRouteMap';
import {cityMaps} from './city-maps';
import {useResources} from './ResourceLibrary';
import BrandIcon from './BrandIcon';
import './learn-more.css';
export default function JourneyMaps(){
 const {items}=useResources();
 return <section className="page maps-page">
  <h1 className="tab-page-title">Maps</h1>
  <InteractiveRouteMap src="/images/southeast-asia-map-without-routes.png"/>
  <section className="city-map-links" aria-labelledby="xavier-city-maps"><h2 id="xavier-city-maps">Xavier’s city maps</h2><ul>{cityMaps.filter(city=>'xavUrl' in city).map(city=>{const upload=items[`city-map-${city.id}`];return <li key={city.id}><a href={'xavUrl'in city?city.xavUrl:undefined} target="_blank" rel="noopener noreferrer"><BrandIcon name="map"/><span>{city.name}<small>Open Xavier’s Google Map ↗</small></span></a>{upload?.visible&&!upload.deleted&&upload.file&&<a className="city-upload-link" href={`/api/tour-resources?file=city-map-${city.id}`} target="_blank" rel="noopener noreferrer">View uploaded city map ↗</a>}</li>;})}</ul></section>
 </section>;
}
