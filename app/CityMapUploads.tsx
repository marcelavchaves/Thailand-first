'use client';
import {useState} from 'react';
import {ResourceSlot,ResourceGroup,useResources} from './ResourceLibrary';
import {cityMaps} from './city-maps';
function MapLink({city}:{city:typeof cityMaps[number]}){
 const {items,loaded,reload}=useResources(),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[value,setValue]=useState<string|null>(null);
 const id=`city-map-${city.id}`,entry=items[id];
 async function save(){setBusy(true);setMessage('');try{const r=await fetch('/api/tour-resources',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,title:entry?.title||`${city.name} map`,group:'maps',action:'map-link',mapUrl:value??entry?.mapUrl??'',revision:entry?.revision||null})});const d=await r.json();if(!r.ok)throw Error(d.error||'Unable to save.');await reload();setValue(null);setMessage('Google Maps link saved.');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 return <form className="release-card" onSubmit={e=>{e.preventDefault();void save();}}><label>Google Maps Link For {city.name}<input type="url" placeholder={'xavUrl'in city?city.xavUrl:'https://maps.google.com/…'} value={value??entry?.mapUrl??''} onChange={e=>setValue(e.target.value)}/></label><p>Leave blank to use the original city map link. This link is also shown inside the map handout.</p><button disabled={busy||!loaded}>Save Map Link</button>{message&&<p role="status">{message}</p>}</form>;
}
export default function CityMapUploads(){
 return <section aria-labelledby="city-map-uploads-title"><h2 id="city-map-uploads-title">City maps</h2><p>Upload a dedicated map handout PDF up to 5 MB for each city. Preview it in the Handouts reader, then show it to travelers. Add or change the Google Maps link below. Existing map uploads and their controls remain available.</p>{cityMaps.map(city=><div key={city.id}><h3>{city.name}</h3><MapLink city={city}/><ResourceSlot id={`map-handout-${city.id}`} title={`${city.name} Map Handout`} group="map-handouts" icon="book" caption="The TD will share a map handout when it is ready."/><ResourceSlot key={city.id} id={`city-map-${city.id}`} title={`Xav’s ${city.name} map`} group="maps" icon="map" caption="The city’s Google Map is available until Xavier shares a map."/></div>)}<h2>Other maps</h2><p>Add any other maps you’d like to share.</p><ResourceGroup group="maps"/></section>;
}
