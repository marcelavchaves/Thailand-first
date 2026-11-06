"use client";

import { useEffect, useState } from "react";
import tourTrivia from "./tour-trivia.json";

type Question = { question: string; options: string[]; answer: number; fact: string };

function displayed(question: Question, date: number, index: number): Question {
  const shift = (date + index) % question.options.length;
  return {
    ...question,
    options: question.options.map((_, i) => question.options[(i - shift + question.options.length) % question.options.length]),
    answer: (question.answer + shift) % question.options.length,
  };
}

const trivia: Record<number, Question[]> = tourTrivia;

function Celebration() {
  return <div className="trivia-celebration" aria-hidden="true">
    {Array.from({ length: 14 }, (_, index) => <i key={index} />)}
  </div>;
}

export const getDailyQuestions = (date: number) => trivia[date] || [];

export default function DailyTrivia({ date }: { date: number }) {
  const questions = getDailyQuestions(date);
  const storageKey = `wondercase-vct-trivia-v1-${date}`;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  useEffect(() => {
    setAnswers([]);
    setIndex(0);
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved)) {
        setAnswers(saved.slice(0, questions.length));
        setIndex(Math.min(saved.length, Math.max(questions.length - 1, 0)));
      }
    } catch {}
  }, [storageKey, questions.length]);

  function choose(option: number) {
    if (answers[index] !== undefined) return;
    const next = [...answers];
    next[index] = option;
    setAnswers(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function reset() {
    setAnswers([]);
    setIndex(0);
    localStorage.removeItem(storageKey);
  }

  if (!questions.length) return null;
  const question = displayed(questions[index], date, index);
  const selected = answers[index];
  const answered = selected !== undefined;
  const complete = answers.length === questions.length;
  const score = answers.reduce((total, answer, i) => total + (answer === displayed(questions[i], date, i)?.answer ? 1 : 0), 0);

  return <section className="trivia-card">
    <div className="trivia-heading"><div><span className="eyebrow">A LITTLE FUN FOR TODAY</span><h2>Today’s Trivia</h2></div><span className="trivia-score">{complete ? `${score}/${questions.length}` : `${index + 1}/${questions.length}`}</span></div>
    <div className="trivia-progress" aria-hidden="true"><i style={{ width: `${((answered ? index + 1 : index) / questions.length) * 100}%` }} /></div>
    <h3>{question.question}</h3>
    <div className="trivia-options">{question.options.map((option, optionIndex) => {
      const state = answered ? optionIndex === question.answer ? "correct" : optionIndex === selected ? "wrong" : "" : "";
      return <button className={state} key={option} onClick={() => choose(optionIndex)} disabled={answered}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}</button>;
    })}</div>
    {answered && selected === question.answer && <Celebration />}
    {answered && <div className={selected === question.answer ? "trivia-result correct" : "trivia-result wrong"} aria-live="polite"><strong>{selected === question.answer ? "Correct! ✦" : `The answer is ${question.options[question.answer]}.`}</strong><p>{question.fact}</p></div>}
    {answered && !complete && <button className="trivia-next" onClick={() => setIndex(index + 1)}>NEXT QUESTION <span>→</span></button>}
    {complete && <div className="trivia-finish"><strong>{score === questions.length ? "Perfect score!" : score >= 2 ? "Beautifully played!" : "A wonderful warm-up!"}</strong><p>You scored {score} out of {questions.length}.</p><button onClick={reset}>PLAY AGAIN</button></div>}
  </section>;
}
