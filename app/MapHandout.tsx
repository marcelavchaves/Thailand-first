'use client';
import {useEffect,useState} from 'react';
import {cityMaps,googleCityMap} from './city-maps';
import MapPdfReader from './MapPdfReader';
import LoadingIndicator from './LoadingIndicator';
import './booklet-viewer.css';
export default function MapHandout(){
 const [cityId,setCityId]=useState<string|null>(null);
 useEffect(()=>{setCityId(new URLSearchParams(window.location.search).get('city')||'');},[]);
 const city=cityMaps.find(x=>x.id===cityId);
 if(cityId===null)return <main className="map-reader-loading"><LoadingIndicator label="Opening Handout…"/></main>;
 if(!city)return <main className="map-reader-loading"><a href="/?tab=map">← Back To Maps</a><p>Choose a city handout from Maps.</p></main>;
 return <MapPdfReader id={`map-handout-${city.id}`} title={`${city.name} Map Handout`} mapUrl={googleCityMap(city.id,{})}/>;
}
