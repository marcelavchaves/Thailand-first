"use client";
import {TDProvider} from "../TDSession";
import {ResourceProvider,ResourceSlot} from "../ResourceLibrary";
import {useEffect,useState} from 'react';
import menus from '../hotel-resources.json';
function HotelMenu(){const [id,setId]=useState<string|null>(null);useEffect(()=>setId(new URLSearchParams(location.search).get('menu')),[]);const menu=menus.find(m=>m.id===id);return <main className="original-document"><a href="/?tab=hotels">← Back to app</a>{menu?<ResourceSlot id={`menu-${menu.id}`} title={menu.title}><header><a href="/?tab=hotels">← Back to hotels</a>{menu&&<a href={`/documents/hotel-menus/${menu.id}.pdf`} download>Download PDF</a>}</header>{menu?<><div className="original-document-intro"><h1>{menu.title}</h1><h2>{menu.hotel}</h2><p>{menu.note}</p><p>Read the pages below or download the PDF. Every PDF page has a Back to App link.</p></div>{Array.from({length:menu.pages},(_,i)=><section className="original-document-page" key={i}><img src={`/documents/hotel-menus/${menu.id}/page-${String(i+1).padStart(2,'0')}.jpg`} alt={`${menu.title}, page ${i+1} of ${menu.pages}. Download PDF for selectable text.`} loading={i?'lazy':'eager'} style={{width:'100%',height:'auto'}}/></section>)}</>:<p>Choose a menu from the Hotels + Flights tab.</p>}</ResourceSlot>:<p>Choose a document from the app.</p>}<a className="document-bottom-back" href="/?tab=hotels">← Back to hotels</a></main>}

export default function Page(){return <TDProvider><ResourceProvider><HotelMenu/></ResourceProvider></TDProvider>;}
