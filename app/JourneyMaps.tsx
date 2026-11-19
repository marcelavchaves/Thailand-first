"use client";
import {useEffect,useRef,useState,type MouseEvent} from 'react';
import {flushSync,preload} from 'react-dom';
import LoadingIndicator from './LoadingIndicator';
import InteractiveRouteMap from './InteractiveRouteMap';
import {cityMaps,googleCityMap} from './city-maps';
import {useResources} from './ResourceLibrary';
import BrandIcon from './BrandIcon';
import './city-map-tiles.css';
export default function JourneyMaps(){
 const {items}=useResources();
 const [opening,setOpening]=useState<string|null>(null),openingRef=useRef(false),frame=useRef<number|null>(null);
 preload('/images/loading-compass-transparent.png',{as:'image'});
 useEffect(()=>{const reset=(event:PageTransitionEvent)=>{if(!event.persisted)return;if(frame.current!==null)cancelAnimationFrame(frame.current);openingRef.current=false;setOpening(null);};window.addEventListener('pageshow',reset);return()=>{window.removeEventListener('pageshow',reset);if(frame.current!==null)cancelAnimationFrame(frame.current);};},[]);
 function openHandout(event:MouseEvent<HTMLAnchorElement>,name:string){
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();if(openingRef.current)return;openingRef.current=true;const href=event.currentTarget.href;
  flushSync(()=>setOpening(name));
  frame.current=requestAnimationFrame(()=>{frame.current=requestAnimationFrame(()=>window.location.assign(href));});
 }
 return <section className="page maps-page">
  {opening&&<div className="city-map-opening" role="dialog" aria-modal="true" aria-label={`Opening ${opening} handout`} aria-busy="true"><LoadingIndicator label={`Opening ${opening} Handout…`}/></div>}
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
     {hasHandout?<a className="city-map-action" href={`/map-handout?city=${city.id}`} aria-label={`Open ${name} list`} onClick={event=>openHandout(event,name)}>{listContent}</a>:<button type="button" className="city-map-action" disabled title="This list has not been shared yet" aria-label={`${name} list not yet shared`}>{listContent}</button>}
    </div>
   </div></li>;
  })}</ul>
 </section>;
}
