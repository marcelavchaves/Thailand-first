"use client";
import InteractiveRouteMap from './InteractiveRouteMap';
export default function JourneyMaps(){
 return <section className="page maps-page">
  <div className="intro"><h1>Maps</h1></div>
  <InteractiveRouteMap src="/images/southeast-asia-map-without-routes.png"/>
 </section>;
}
