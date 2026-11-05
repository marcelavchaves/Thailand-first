'use client';
import {useEffect,useRef} from 'react';
import './wondercase-gallery.css';
export const galleryUrl='https://photos.omnifizer.com/?g=ec27abd5-4348-4f1a-890e-5745250d680e95e4ef0c';
export default function WondercaseGallery(){
 const opened=useRef(false);
 useEffect(()=>{if(opened.current)return;opened.current=true;window.location.assign(galleryUrl);},[]);
 return <section className="section gallery-page wondercase-gallery"><h1 className="tab-page-title">Gallery</h1><p role="status">Opening your photo gallery…</p><p className="gallery-help">The photo gallery uses its own membership to open your photos or show its Join screen.</p><a href={galleryUrl}>Continue if the gallery hasn’t opened ↗</a></section>;
}
