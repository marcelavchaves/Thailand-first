'use client';
import {ResourceSlot,ResourceGroup} from './ResourceLibrary';
import {cityMaps} from './city-maps';
export default function CityMapUploads(){
 return <section aria-labelledby="city-map-uploads-title"><h2 id="city-map-uploads-title">City maps</h2><p>Upload a PDF or image up to 3 MB for each city. Preview it, then reveal it to travelers. A revealed city map becomes the main map for that city, including its marker on the journey map.</p>{cityMaps.map(city=><ResourceSlot key={city.id} id={`city-map-${city.id}`} title={`Xav’s ${city.name} map`} group="maps" icon="map" caption="The city’s Google Map is available until Xavier shares a map."/>)}<h2>Other maps</h2><p>Add any other maps you’d like to share.</p><ResourceGroup group="maps"/></section>;
}
