"use client";
import {TDProvider} from "../TDSession";
import {ResourceProvider,ResourceSlot} from "../ResourceLibrary";
import {useEffect,useState} from 'react';
import stories from '../storytelling.json';
function Storytelling(){
 const [query,setQuery]=useState<{id:string|null;day:number}>({id:null,day:0});
 useEffect(()=>{const q=new URLSearchParams(location.search);setQuery({id:q.get('story'),day:Number(q.get('day'))});},[]);
 const story=stories.find(s=>s.id===query.id);
 const back=story?(story.days.includes(query.day+4)?`/?tab=journey&day=${query.day}`:story.returnTo):'/?tab=journey';
 const label=story?.hotelIndex!==undefined&&story.hotelIndex>=0?'Back to hotel':'Back to journey';
 return <main className="original-document"><a href="/?tab=hotels">← Back to app</a>{story?<ResourceSlot id={`story-${story.id}`} title={story.title}><header><a href={back}>← {label}</a>{story&&<a href={`/documents/storytelling/${story.id}.pdf`} download>Download PDF</a>}</header>{story?<><div className="original-document-intro"><span className="eyebrow">{story.category}</span><h1>{story.title}</h1><p>{story.description}</p><p>Read below or download the PDF for selectable text. Every PDF page includes a Back to App link.</p></div>{Array.from({length:story.pages},(_,i)=><section className="original-document-page" key={i}><img src={`/documents/storytelling/${story.id}/page-${String(i+1).padStart(2,'0')}.jpg`} alt={`${story.title}, page ${i+1} of ${story.pages}. Download PDF for selectable text.`} loading={i?'lazy':'eager'} style={{width:'100%',height:'auto'}}/></section>)}</>:<p>Choose a story from a journey day or a stay guide from Hotels + Flights.</p>}</ResourceSlot>:<p>Choose a document from the app.</p>}<a className="document-bottom-back" href={back}>← {label}</a></main>
}

export default function Page(){return <TDProvider><ResourceProvider><Storytelling/></ResourceProvider></TDProvider>;}
