'use client';
import {useId,useState} from 'react';
import {languageFor} from './language-content';
export default function LanguageQuiz({region}:{region:string}){
 const lesson=languageFor(region),id=useId();
 const [answers,setAnswers]=useState<Record<number,number>>({}),[attempt,setAttempt]=useState(0);
 const phrases=lesson.phrases.filter((_,i)=>i<4||i>=lesson.phrases.length-2);
 const questions=phrases.map(([english,local],i)=>{
  const pool=lesson.phrases.filter(p=>p[1]!==local);
  const options=[local,pool[(i+attempt)%pool.length][1],pool[(i+attempt+2)%pool.length][1]];
  const shift=(i+attempt+1)%3;
  return {english,local,options:options.slice(shift).concat(options.slice(0,shift))};
 });
 const score=questions.filter((q,i)=>q.options[answers[i]]===q.local).length;
 return <section className="language-quiz" aria-labelledby={id}><h2 id={id}>Language test</h2><p>Practice {lesson.name} for {region}. Choose the phrase with the matching meaning.</p>{questions.map((q,i)=><fieldset key={`${attempt}-${i}`}><legend>{i+1}. How do you say “{q.english}”?</legend>{q.options.map((option,j)=><label key={option}><input type="radio" name={`${id}-${i}`} value={j} checked={answers[i]===j} disabled={answers[i]!==undefined} onChange={()=>setAnswers({...answers,[i]:j})}/><span lang={lesson.lang}>{option}</span></label>)}{answers[i]!==undefined&&<p role="status">{q.options[answers[i]]===q.local?'Correct!':`The correct answer is ${q.local}.`}</p>}</fieldset>)}<p aria-live="polite">Score: {score} / {questions.length} · {Object.keys(answers).length} answered</p><button type="button" onClick={()=>{setAnswers({});setAttempt(attempt+1);}}>Try again</button></section>;
}
