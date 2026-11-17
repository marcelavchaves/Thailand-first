'use client';
import {useEffect,useState} from 'react';
import {useResources} from './ResourceLibrary';
import {cityMaps,preferredCityMap} from './city-maps';
import BookletReader from './BookletReader';
import {BookletReader as IllustratedBookletReader} from './BookletViewer';
import booklets from '../shared/booklets.json';
export default function MapHandout(){
 const {items,loaded,error}=useResources(),[cityId,setCityId]=useState('');
 useEffect(()=>{setCityId(new URLSearchParams(window.location.search).get('city')||'');},[]);
 const city=cityMaps.find(x=>x.id===cityId),association=items[`city-map-${cityId}`]?.mapHandoutId,handout=association?items[association]:null;
 if(!loaded)return <main className="page"><a href="/?tab=map">← Back To Maps</a><p role="status">{error||'Opening handout…'}</p></main>;
 const illustrated=booklets.find(b=>b.id===association);
 const url=preferredCityMap(cityId,items)||(city?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(city.name)}`:null);
 if(!city||(!handout?.file&&!illustrated)||!handout?.visible||handout.deleted)return <main className="page"><a href="/?tab=map">← Back To Maps</a><p>This handout is not currently available.</p>{url&&<a className="button" href={url} target="_blank" rel="noopener noreferrer">Open Map ↗</a>}</main>;
 if(illustrated&&!handout.file)return <IllustratedBookletReader booklet={{...illustrated,title:handout.title,returnLabel:'Maps'}} mapUrl={url!} onClose={()=>{window.location.href='/?tab=map';}}/>;
 if(handout.booklet)return <BookletReader resourceId={handout.id} mapUrl={url!} backUrl="/?tab=map" backLabel="Maps"/>;
 const src=`/api/tour-resources?file=${encodeURIComponent(handout.id)}`;
 return <main className="page"><a href="/?tab=map">← Back To Maps</a><h1>{handout.title}</h1><p><a className="button" href={url!} target="_blank" rel="noopener noreferrer">Open Map ↗</a></p>{handout.type?.startsWith('image/')?<img src={src} alt={handout.title} style={{width:'100%',height:'auto'}}/>:<><iframe title={handout.title} src={src} style={{width:'100%',height:'75vh',border:0}}/><a href={src} target="_blank" rel="noopener noreferrer">Open Handout ↗</a></>}</main>;
}
