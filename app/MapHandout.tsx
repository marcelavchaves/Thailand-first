'use client';
import {useEffect,useState} from 'react';
import {useResources} from './ResourceLibrary';
import {cityMaps,googleCityMap} from './city-maps';
import BookletReader from './BookletReader';
import {useTDSession} from './TDSession';
export default function MapHandout(){
 const {authenticated}=useTDSession();
 const {items,loaded,error}=useResources(),[cityId,setCityId]=useState('');
 useEffect(()=>{setCityId(new URLSearchParams(window.location.search).get('city')||'');},[]);
 const city=cityMaps.find(x=>x.id===cityId),handout=items[`map-handout-${cityId}`];
 if(!loaded)return <main className="page"><a href="/?tab=map">← Back To Maps</a><p role="status">{error||'Opening handout…'}</p></main>;
 const url=googleCityMap(cityId,items);
 if(!city||!handout?.file||!handout.booklet||(!handout.visible&&!authenticated)||handout.deleted)return <main className="page"><a href="/?tab=map">← Back To Maps</a><p>This handout is not currently available.</p>{city&&<a className="button" href={url} target="_blank" rel="noopener noreferrer">Open Map ↗</a>}</main>;
 return <BookletReader resourceId={handout.id} mapUrl={url} backUrl="/?tab=map" backLabel="Maps"/>;
}
