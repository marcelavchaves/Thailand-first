'use client';
import {useState} from 'react';
import DailyTrivia from './DailyTrivia';
import LocalLanguageLesson from './LocalLanguageLesson';
import LanguageQuiz from './LanguageQuiz';
import BrandIcon from './BrandIcon';
import './learn-more.css';
type Day={date:number;title:string;region:string};
export default function LearnMore({days}:{days:Day[]}){
 const [day,setDay]=useState(days[0].date),[selected,setSelected]=useState<'trivia'|'language'|null>(null);
 const current=days.find(d=>d.date===day)||days[0];
 return <section id="more-learn" className="more-open-panel"><h2>Learn more</h2><label>Choose a journey day<select value={day} onChange={e=>setDay(Number(e.target.value))}>{days.map(d=><option key={d.date} value={d.date}>Day {d.date-4} · {d.title}</option>)}</select></label>
 <div className="learn-choice-grid"><button type="button" aria-expanded={selected==='trivia'} aria-controls="learn-trivia-panel" onClick={()=>setSelected(s=>s==='trivia'?null:'trivia')}><BrandIcon name="compass"/><strong>Trivia</strong><small>History, heritage &amp; discoveries</small></button><button type="button" aria-expanded={selected==='language'} aria-controls="learn-language-panel" onClick={()=>setSelected(s=>s==='language'?null:'language')}><BrandIcon name="book"/><strong>Language lesson</strong><small>Local phrases &amp; pronunciation</small></button></div>
 {selected==='trivia'&&<div id="learn-trivia-panel"><DailyTrivia key={day} date={day}/></div>}
 {selected==='language'&&<div id="learn-language-panel"><LocalLanguageLesson key={`lesson-${day}`} region={current.region}/><LanguageQuiz key={`quiz-${day}`} region={current.region}/></div>}
 </section>;
}
