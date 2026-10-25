'use client';
import {useEffect,useId,useState} from 'react';
import {languageFor} from './language-content';
import BrandIcon from './BrandIcon';
export default function LocalLanguageLesson({region}:{region:string}){
 const lesson=languageFor(region),heading=useId();
 const [supported,setSupported]=useState(false),[voices,setVoices]=useState<SpeechSynthesisVoice[]>([]),[speaking,setSpeaking]=useState<string|null>(null),[message,setMessage]=useState('');
 useEffect(()=>{
  if(!('speechSynthesis' in window))return;
  setSupported(true);const update=()=>setVoices(window.speechSynthesis.getVoices());update();window.speechSynthesis.addEventListener('voiceschanged',update);
  return()=>{window.speechSynthesis.removeEventListener('voiceschanged',update);window.speechSynthesis.cancel();};
 },[]);
 const nativeVoice=voices.find(v=>v.lang.toLowerCase().startsWith(lesson.lang.slice(0,2)));
 function pronounce(local:string,sound:string){
  window.speechSynthesis.cancel();setMessage('');
  const utterance=new SpeechSynthesisUtterance(nativeVoice?local:sound);
  utterance.lang=nativeVoice?lesson.lang:'en-US';utterance.rate=.75;
  if(nativeVoice)utterance.voice=nativeVoice;
  utterance.onend=()=>setSpeaking(null);utterance.onerror=(event)=>{if(event.error==='canceled'||event.error==='interrupted')return;setSpeaking(null);setMessage('Audio is unavailable on this device. Please use the written sound guide.');};
  setSpeaking(local);window.speechSynthesis.speak(utterance);
 }
 return <section className="local-language-lesson" aria-labelledby={heading}>
  <span className="eyebrow">A FEW WORDS GO A LONG WAY</span><h2 id={heading}>Local Language Lesson</h2>
  <p className="language-destination">{region} · {lesson.name}</p><p>{lesson.courtesy}</p>
  <p className="language-pronunciation-key">{supported?(nativeVoice?'Tap the speaker icon for pronunciation using your device’s '+lesson.name+' voice.':'Tap the speaker icon to hear the approximate English sound guide; your device has no '+lesson.name+' voice available.'):'Use the written sound guides for pronunciation.'}</p>
  <div className="language-phrase-grid">{lesson.phrases.map(([english,local,sound])=><div className="language-phrase" key={english}><span className="language-meaning">{english}</span><strong lang={lesson.lang}>{local}</strong><div className="language-pronunciation-row"><span className="language-sound">Say: {sound}</span>{supported&&<button type="button" className="language-listen" onClick={()=>pronounce(local,sound)} aria-label={`Listen: ${english}`} title={`Listen: ${english}`} aria-pressed={speaking===local}><BrandIcon name="volume"/></button>}</div></div>)}</div>
  {message&&<p role="status">{message}</p>}<p className="language-source">Phrase reference: <a href={`https://www.omniglot.com/language/phrases/${lesson.source}.php`} target="_blank" rel="noopener noreferrer">{lesson.name} phrase guide</a></p>
 </section>;
}
