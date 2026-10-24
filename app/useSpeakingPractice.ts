'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {understoodPhrase} from './speech-matching';
type RecognitionResult={isFinal:boolean;length:number;[index:number]:{transcript:string}};
type Recognition={lang:string;continuous:boolean;interimResults:boolean;maxAlternatives:number;onresult:((event:{resultIndex:number;results:{length:number;[index:number]:RecognitionResult}})=>void)|null;onerror:((event:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void;abort:()=>void};
type RecognitionConstructor=new()=>Recognition;
type Feedback={text:string;heard?:string;kind:'success'|'retry'|'unavailable'};
type Session={recognition:Recognition;key:string;timer:ReturnType<typeof setTimeout>|null};
function appleHomeScreen(){
 const navigatorWithStandalone=navigator as Navigator&{standalone?:boolean};
 const appleMobile=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 return appleMobile&&(navigatorWithStandalone.standalone===true||window.matchMedia('(display-mode: standalone)').matches||window.matchMedia('(display-mode: fullscreen)').matches);
}
function recognitionConstructor(){const browser=window as Window&{SpeechRecognition?:RecognitionConstructor;webkitSpeechRecognition?:RecognitionConstructor};return browser.SpeechRecognition||browser.webkitSpeechRecognition;}
export default function useSpeakingPractice(language:string){
 const [available,setAvailable]=useState<boolean|null>(null),[active,setActive]=useState<string|null>(null),[feedback,setFeedback]=useState<Record<string,Feedback>>({});
 const [unavailableReason,setUnavailableReason]=useState('Speaking practice isn’t available in this browser. You can still practice with Listen and the written sound guides.');
 const session=useRef<Session|null>(null);
 const finish=useCallback((current:Session,result?:Feedback)=>{
  if(session.current!==current)return;
  session.current=null;if(current.timer)clearTimeout(current.timer);
  current.recognition.onresult=null;current.recognition.onerror=null;current.recognition.onend=null;
  try{current.recognition.abort();}catch{}
  setActive(null);if(result)setFeedback(previous=>({...previous,[current.key]:result}));
 },[]);
 useEffect(()=>{
  const homeScreen=appleHomeScreen();
  setAvailable(!homeScreen&&window.isSecureContext&&!!recognitionConstructor());
  if(homeScreen)setUnavailableReason('Speaking practice is unavailable in the iPhone/iPad home-screen app. You can use Listen and the written sound guides here.');
  const hidden=()=>{if(document.hidden&&session.current)finish(session.current,{kind:'retry',text:'Practice paused. Tap Practice speaking when you’re ready.'});};
  document.addEventListener('visibilitychange',hidden);
  return()=>{document.removeEventListener('visibilitychange',hidden);const current=session.current;session.current=null;if(current){if(current.timer)clearTimeout(current.timer);current.recognition.onresult=null;current.recognition.onerror=null;current.recognition.onend=null;try{current.recognition.abort();}catch{}}};
 },[language,finish]);
 function practice(key:string,phrase:string){
  if(session.current){const old=session.current;finish(old,{kind:'retry',text:'Practice stopped. You can try again anytime.'});if(old.key===key)return;}
  if(appleHomeScreen()||!window.isSecureContext)return;
  const Constructor=recognitionConstructor();if(!Constructor)return;
  let recognition:Recognition;
  try{recognition=new Constructor();}catch{setFeedback(previous=>({...previous,[key]:{kind:'unavailable',text:'Speaking practice is unavailable on this device. Please use Listen and the sound guide.'}}));return;}
  recognition.lang=language;recognition.continuous=false;recognition.interimResults=false;recognition.maxAlternatives=5;
  const current:Session={recognition,key,timer:null};session.current=current;setActive(key);
  setFeedback(previous=>{const next={...previous};delete next[key];return next;});
  recognition.onresult=event=>{
   if(session.current!==current)return;
   for(let i=event.resultIndex;i<event.results.length;i++){
    const result=event.results[i];if(!result.isFinal)continue;
    const alternatives=Array.from({length:result.length},(_,n)=>result[n].transcript.trim()).filter(Boolean);
    const match=alternatives.find(text=>understoodPhrase(phrase,text,language));
    finish(current,match?{kind:'success',text:'Well understood! Your words were recognized.',heard:match.slice(0,200)}:{kind:'retry',text:'Try again. Listen to the phrase, then say it slowly and clearly.',heard:alternatives[0]?.slice(0,200)});return;
   }
  };
  recognition.onerror=event=>{
   const errors:Record<string,string>={
    'not-allowed':'Microphone access was not allowed. You can enable it in your browser’s site settings, or keep practicing with Listen.',
    'service-not-allowed':'Speaking practice is unavailable in this browser. You can still use Listen and the sound guide.',
    'audio-capture':'No microphone was found. Check your device’s microphone and try again.',
    'language-not-supported':'Your browser cannot recognize this language. You can still use Listen and the sound guide.',
    network:'Speech recognition needs a connection. Check your internet and try again.',
   };
   finish(current,{kind:errors[event.error]?'unavailable':'retry',text:errors[event.error]||'I didn’t catch that. Try again when you’re ready.'});
  };
  recognition.onend=()=>finish(current,{kind:'retry',text:'I didn’t catch that. Tap Practice speaking to try again.'});
  try{recognition.start();current.timer=setTimeout(()=>{
   if(session.current!==current)return;
   try{recognition.stop();}catch{finish(current,{kind:'retry',text:'Practice ended. You can try again.'});return;}
   if(session.current===current)current.timer=setTimeout(()=>finish(current,{kind:'retry',text:'I didn’t catch that. You can try again.'}),3000);
  },10000);}catch{finish(current,{kind:'unavailable',text:'Speaking practice could not start. Check microphone access in your browser, then try again.'});}
 }
 return {available,unavailableReason,active,feedback,practice};
}
