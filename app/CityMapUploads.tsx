'use client';
import {useState} from 'react';
import {ResourceSlot,ResourceGroup,useResources} from './ResourceLibrary';
import booklets from '../shared/booklets.json';
import {cityMaps} from './city-maps';
function MapHandoutChoice({city}:{city:typeof cityMaps[number]}){
 const {items,reload}=useResources(),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const id=`city-map-${city.id}`,entry=items[id];
 async function save(value:string){setBusy(true);setMessage('');try{const r=await fetch('/api/tour-resources',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,title:entry?.title||`${city.name} map`,group:'maps',action:'map-handout',mapHandoutId:value||null,revision:entry?.revision||null})});const d=await r.json();if(!r.ok)throw Error(d.error||'Unable to save.');await reload();setMessage('Map tile updated.');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 return <div className="release-card"><label>Handout For {city.name}<select disabled={busy} value={entry?.mapHandoutId||''} onChange={e=>void save(e.target.value)}><option value="">Open Map Directly</option>{Object.values(items).filter(x=>x.group==='handouts'&&(x.file||booklets.some(b=>b.id===x.id))&&!x.deleted).map(x=><option key={x.id} value={x.id}>{x.title}{x.visible?'':' · Hidden'}</option>)}</select></label><p>Travelers open the associated handout first, with an Open Map link. Hidden handouts stay hidden; the tile opens the map directly until the handout is shown.</p>{message&&<p role="status">{message}</p>}</div>;
}
export default function CityMapUploads(){
 return <section aria-labelledby="city-map-uploads-title"><h2 id="city-map-uploads-title">City maps</h2><p>Upload a PDF or image up to 3 MB for each city. Preview it, then reveal it to travelers. Supplied Google Maps remain available as city links. Revealed uploads are also available alongside those links; other cities use their uploaded map from the journey marker.</p>{cityMaps.map(city=><div key={city.id}><MapHandoutChoice city={city}/><ResourceSlot key={city.id} id={`city-map-${city.id}`} title={`Xav’s ${city.name} map`} group="maps" icon="map" caption="The city’s Google Map is available until Xavier shares a map."/></div>)}<h2>Other maps</h2><p>Add any other maps you’d like to share.</p><ResourceGroup group="maps"/></section>;
}
