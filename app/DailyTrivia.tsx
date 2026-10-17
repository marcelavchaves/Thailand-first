"use client";

import { useEffect, useState } from "react";

type Question = { question: string; options: string[]; answer: number; fact: string };

function displayed(question: Question, date: number, index: number): Question {
  const shift = (date + index) % question.options.length;
  return {
    ...question,
    options: question.options.map((_, i) => question.options[(i - shift + question.options.length) % question.options.length]),
    answer: (question.answer + shift) % question.options.length,
  };
}

const trivia: Record<number, Question[]> = {
  2: [
    { question: "Boston Logan Airport is named for which Massachusetts figure?", options: ["John Hancock", "Edward Lawrence Logan", "Paul Revere"], answer: 1, fact: "General Edward Lawrence Logan was a Boston-born soldier, lawyer, and public official." },
    { question: "What three-letter airport code belongs to Boston Logan?", options: ["BOS", "LOG", "BSA"], answer: 0, fact: "BOS is the international airport code used on tickets and baggage tags." },
    { question: "Which ocean will your flight cross on the way to Hong Kong?", options: ["Atlantic", "Indian", "Pacific"], answer: 2, fact: "The long-haul route travels westward across the Pacific region." },
  ],
  3: [
    { question: "Cathay Pacific is based in which city?", options: ["Singapore", "Hong Kong", "Bangkok"], answer: 1, fact: "Cathay Pacific’s home hub is Hong Kong International Airport." },
    { question: "The Airbus A350 is built mainly from what lightweight material?", options: ["Wood", "Composite materials", "Copper"], answer: 1, fact: "More than half of the A350 airframe is made from carbon-fiber-reinforced composite materials." },
    { question: "Hong Kong time is how many hours ahead of Eastern Daylight Time?", options: ["8 hours", "12 hours", "16 hours"], answer: 1, fact: "In September, Hong Kong is 12 hours ahead of Boston’s Eastern Daylight Time." },
  ],
  4: [
    { question: "Singapore is both a city and what else?", options: ["A country", "A province", "An island of Malaysia"], answer: 0, fact: "Singapore is a sovereign city-state made up of one main island and smaller islands." },
    { question: "Which creature is the symbol of Singapore?", options: ["Merlion", "Dragon", "Garuda"], answer: 0, fact: "The Merlion combines a lion’s head with a fish’s body." },
    { question: "What does the name Singapore derive from?", options: ["Lion City", "Garden Island", "Golden Port"], answer: 0, fact: "Singapore comes from the Sanskrit words singa, lion, and pura, city." },
  ],
  5: [
    { question: "Raffles Singapore first opened in which century?", options: ["18th century", "19th century", "20th century"], answer: 1, fact: "The hotel opened in 1887 and became one of Singapore’s great historic landmarks." },
    { question: "Which cocktail is famously associated with Raffles?", options: ["Singapore Sling", "Mai Tai", "Bellini"], answer: 0, fact: "The Singapore Sling was created at Raffles’ Long Bar in the early 20th century." },
    { question: "Singapore has how many official languages?", options: ["Two", "Three", "Four"], answer: 2, fact: "English, Malay, Mandarin Chinese, and Tamil are Singapore’s four official languages." },
  ],
  6: [
    { question: "What was the Singapore River historically central to?", options: ["Skiing", "Trade and commerce", "Tea farming"], answer: 1, fact: "Warehouses, boats, and merchants made the river the commercial heart of early Singapore." },
    { question: "Traditional Singapore bumboats were once used mainly for what?", options: ["Carrying goods", "Whale watching", "Racing"], answer: 0, fact: "Bumboats transported cargo between ships and the river’s busy quays." },
    { question: "Which neighborhood is known for colorful Peranakan shophouses?", options: ["Katong", "Sentosa", "Jurong"], answer: 0, fact: "Katong and nearby Joo Chiat are celebrated for Peranakan culture and ornate shophouses." },
  ],
  7: [
    { question: "How tall are the tallest Supertrees at Gardens by the Bay?", options: ["About 16 feet", "About 160 feet", "About 500 feet"], answer: 1, fact: "The Supertrees range up to about 50 meters, or roughly 164 feet." },
    { question: "Which indoor waterfall is inside the Cloud Forest?", options: ["A towering man-made waterfall", "Niagara Falls", "A geothermal geyser"], answer: 0, fact: "Cloud Forest’s misty mountain is built around a dramatic indoor waterfall." },
    { question: "The Flower Dome holds a world record for being what?", options: ["Largest glass greenhouse", "Oldest botanical garden", "Tallest hotel"], answer: 0, fact: "Guinness recognized it as the world’s largest glass greenhouse when it opened." },
  ],
  8: [
    { question: "Borobudur is located on which Indonesian island?", options: ["Java", "Bali", "Sumatra"], answer: 0, fact: "Borobudur rises in Central Java near Yogyakarta." },
    { question: "Borobudur is a monument of which faith?", options: ["Buddhism", "Hinduism", "Shinto"], answer: 0, fact: "The vast 8th- and 9th-century complex is one of the world’s greatest Buddhist monuments." },
    { question: "What are the bell-shaped structures crowning Borobudur called?", options: ["Stupas", "Minarets", "Pagodas"], answer: 0, fact: "Dozens of perforated stupas surround the great central stupa." },
  ],
  9: [
    { question: "Borobudur’s design is often interpreted as a journey toward what?", options: ["Enlightenment", "The ocean", "A royal palace"], answer: 0, fact: "Ascending its terraces symbolically moves from the earthly realm toward enlightenment." },
    { question: "What material was used to build Borobudur?", options: ["Volcanic stone", "Marble", "Adobe"], answer: 0, fact: "Millions of blocks of dark volcanic andesite stone form the monument." },
    { question: "Which nearby volcano dominates many Borobudur views?", options: ["Mount Merapi", "Mount Fuji", "Krakatoa"], answer: 0, fact: "Active Mount Merapi is a defining feature of Central Java’s landscape." },
  ],
  10: [
    { question: "Prambanan is Indonesia’s largest temple complex dedicated to which faith?", options: ["Hinduism", "Buddhism", "Jainism"], answer: 0, fact: "Prambanan’s soaring temples honor the Hindu trinity of Shiva, Vishnu, and Brahma." },
    { question: "The Ramayana tells the story of Rama rescuing whom?", options: ["Sita", "Draupadi", "Shakuntala"], answer: 0, fact: "The epic follows Rama’s quest to rescue his wife Sita from the demon king Ravana." },
    { question: "Yogyakarta is especially famous for which wax-resist textile art?", options: ["Batik", "Tartan", "Ikat from Peru"], answer: 0, fact: "Yogyakarta is one of Indonesia’s great centers for handmade batik." },
  ],
  11: [
    { question: "Bali is known as the Island of the what?", options: ["Gods", "Whales", "Palaces"], answer: 0, fact: "The Island of the Gods reflects Bali’s thousands of temples and rich spiritual life." },
    { question: "The Sacred Monkey Forest in Ubud is home mainly to which primate?", options: ["Long-tailed macaques", "Orangutans", "Gibbons"], answer: 0, fact: "Hundreds of Balinese long-tailed macaques live in the forest sanctuary." },
    { question: "What is the predominant religion practiced in Bali?", options: ["Balinese Hinduism", "Shinto", "Sikhism"], answer: 0, fact: "Balinese Hinduism blends Hindu traditions with local customs and ancestral beliefs." },
  ],
  12: [
    { question: "What are the small daily Balinese offerings called?", options: ["Canang sari", "Origami", "Tumpeng"], answer: 0, fact: "Canang sari are woven palm-leaf trays filled with flowers, incense, and symbolic gifts." },
    { question: "Bali’s traditional cooperative irrigation system is called what?", options: ["Subak", "Ryokan", "Souk"], answer: 0, fact: "Subak coordinates water, farming, and temple life across Bali’s rice terraces." },
    { question: "Before entering many Balinese temples, visitors wear what?", options: ["A sarong and sash", "Wooden shoes", "A black tie"], answer: 0, fact: "A sarong and sash show respect and are commonly required at temple sites." },
  ],
  13: [
    { question: "Which fragrant leaf often flavors Balinese desserts and rice?", options: ["Pandan", "Bay laurel", "Maple"], answer: 0, fact: "Pandan gives many Southeast Asian sweets their distinctive aroma and green color." },
    { question: "What does nasi mean in Indonesian?", options: ["Rice", "Tea", "Fish"], answer: 0, fact: "Nasi means cooked rice, as in nasi goreng, Indonesia’s famous fried rice." },
    { question: "Ubud became internationally known as a center for what?", options: ["Arts and culture", "Heavy industry", "Winter sports"], answer: 0, fact: "Painting, carving, dance, music, and craft traditions flourish throughout Ubud." },
  ],
  14: [
    { question: "Labuan Bajo lies on which island?", options: ["Flores", "Lombok", "Borneo"], answer: 0, fact: "Labuan Bajo is a harbor town on the western end of Flores." },
    { question: "Flores received its name from explorers speaking which language?", options: ["Portuguese", "Dutch", "French"], answer: 0, fact: "Portuguese sailors named the island Cabo de Flores, meaning Cape of Flowers." },
    { question: "Komodo National Park is part of which country?", options: ["Indonesia", "Philippines", "Australia"], answer: 0, fact: "The park protects islands and marine waters within Indonesia’s Lesser Sunda Islands." },
  ],
  15: [
    { question: "Komodo dragons are the world’s largest living what?", options: ["Lizards", "Crocodiles", "Snakes"], answer: 0, fact: "Adult Komodo dragons can grow to about 10 feet and weigh well over 150 pounds." },
    { question: "Komodo dragons naturally live on how many Indonesian islands?", options: ["A small handful", "More than 100", "Only Bali"], answer: 0, fact: "Their wild range is limited to a few islands in and around Komodo National Park." },
    { question: "Which sense helps a Komodo dragon locate food from far away?", options: ["Its tongue-assisted sense of smell", "Echolocation", "Infrared vision"], answer: 0, fact: "Like other monitor lizards, it samples scent particles with its forked tongue." },
  ],
  16: [
    { question: "The famous Kecak performance is powered primarily by what?", options: ["A chanting male chorus", "A string orchestra", "Electronic music"], answer: 0, fact: "Dozens of performers create rhythmic interlocking chants with no traditional gamelan orchestra." },
    { question: "Jimbaran Bay faces which ocean?", options: ["Indian Ocean", "Arctic Ocean", "Atlantic Ocean"], answer: 0, fact: "Jimbaran sits on Bali’s southwestern coast facing the Indian Ocean." },
    { question: "Traditional Balinese kites were historically linked to what?", options: ["Agricultural and religious traditions", "Military signaling", "Indoor theater"], answer: 0, fact: "Kite flying is woven into village life, seasonal winds, and religious expression." },
  ],
  17: [
    { question: "Uluwatu Temple stands dramatically on what?", options: ["A sea cliff", "A river island", "A glacier"], answer: 0, fact: "The temple is perched high above the Indian Ocean on Bali’s southern cliffs." },
    { question: "Garuda Wisnu Kencana depicts Vishnu riding which mythical bird?", options: ["Garuda", "Phoenix", "Roc"], answer: 0, fact: "Garuda is Vishnu’s great eagle-like mount and Indonesia’s national emblem." },
    { question: "What does pura mean in Balinese place names?", options: ["Temple", "Beach", "Market"], answer: 0, fact: "Pura is the Balinese word commonly used for a Hindu temple." },
  ],
  18: [
    { question: "Jimbaran is especially famous for sunset dinners featuring what?", options: ["Fresh seafood", "Fondue", "Dim sum"], answer: 0, fact: "Seafood restaurants line the beach, with tables set directly on the sand." },
    { question: "Which Indonesian phrase means thank you?", options: ["Terima kasih", "Buongiorno", "Mahalo"], answer: 0, fact: "Terima kasih is the standard Indonesian expression of thanks." },
    { question: "Bali belongs to which chain of islands?", options: ["Lesser Sunda Islands", "Hawaiian Islands", "Canary Islands"], answer: 0, fact: "Bali sits at the western end of Indonesia’s Lesser Sunda island chain." },
  ],
  19: [
    { question: "Singapore Changi Airport is famous for an indoor waterfall named what?", options: ["Rain Vortex", "Cloud Cascade", "Merlion Falls"], answer: 0, fact: "The Rain Vortex at Jewel Changi is the world’s tallest indoor waterfall." },
    { question: "Which road is Singapore’s best-known shopping boulevard?", options: ["Orchard Road", "Sunset Boulevard", "Nathan Road"], answer: 0, fact: "Orchard Road is lined with major malls, hotels, and flagship stores." },
    { question: "Singapore’s currency is the what?", options: ["Singapore dollar", "Singapore pound", "Singapore rupee"], answer: 0, fact: "The Singapore dollar uses the code SGD and the symbol S$." },
  ],
  20: [
    { question: "Traveling east across the International Date Line generally does what?", options: ["Subtracts a calendar day", "Adds two days", "Changes nothing"], answer: 0, fact: "Crossing eastward generally moves the calendar back one day." },
    { question: "What is Hong Kong’s airport code?", options: ["HKG", "HKA", "HON"], answer: 0, fact: "HKG is the familiar three-letter code for Hong Kong International Airport." },
    { question: "Which souvenir best captures the real treasure of a journey?", options: ["Shared memories", "An airport receipt", "A baggage tag"], answer: 0, fact: "The app’s journal keeps the stories, discoveries, and family comments together long after the trip." },
  ],
};

const bonusTrivia: Record<number, Question> = {
  2: { question: "Which Massachusetts city is Boston Logan Airport located partly within?", options: ["Cambridge", "Boston", "Worcester"], answer: 1, fact: "Logan Airport occupies land in East Boston and borders Boston Harbor." },
  3: { question: "What does the airline name Cathay poetically refer to?", options: ["China", "Australia", "India"], answer: 0, fact: "Cathay is a historic European name for China, inspired by the Khitan people." },
  4: { question: "Singapore lies just north of which imaginary line?", options: ["The Equator", "The Arctic Circle", "The Prime Meridian"], answer: 0, fact: "Singapore sits about 1.3 degrees north of the Equator." },
  5: { question: "Which nut gives the Singapore Sling its characteristic liqueur note?", options: ["Cherry", "Hazelnut", "Almond"], answer: 0, fact: "Cherry liqueur is one of the cocktail’s best-known ingredients." },
  6: { question: "Clarke Quay is named after a former governor with which surname?", options: ["Clarke", "Raffles", "Orchard"], answer: 0, fact: "The riverside quay was named for Sir Andrew Clarke, Governor of the Straits Settlements." },
  7: { question: "What powers some environmental systems on Singapore’s Supertrees?", options: ["Solar energy", "Coal", "Geothermal steam"], answer: 0, fact: "Some Supertrees use photovoltaic cells to harvest solar energy for lighting." },
  8: { question: "Borobudur is recognized as a World Heritage Site by which organization?", options: ["UNESCO", "NATO", "OPEC"], answer: 0, fact: "UNESCO inscribed the Borobudur Temple Compounds on its World Heritage List in 1991." },
  9: { question: "At sunrise, Borobudur’s stone terraces often emerge through what?", options: ["Morning mist", "Desert sand", "Snow"], answer: 0, fact: "Central Java’s humid landscape often creates atmospheric morning mist around the monument." },
  10: { question: "Which Hindu deity is honored by Prambanan’s tallest central temple?", options: ["Shiva", "Ganesha", "Surya"], answer: 0, fact: "The central Shiva temple is the tallest and largest structure in the Prambanan complex." },
  11: { question: "Ubud’s name is connected to the Balinese word ubad, meaning what?", options: ["Medicine", "Mountain", "Music"], answer: 0, fact: "The name reflects the area’s traditional association with medicinal herbs and healing." },
  12: { question: "Which grain creates Bali’s famous emerald-green terraces?", options: ["Rice", "Wheat", "Barley"], answer: 0, fact: "Rice cultivation has shaped Bali’s landscape, communities, and temple traditions for centuries." },
  13: { question: "Which instrument family gives Balinese gamelan its shimmering sound?", options: ["Gongs and metallophones", "Bagpipes", "Electric guitars"], answer: 0, fact: "Layered bronze gongs and metallophones create gamelan’s distinctive interlocking rhythms." },
  14: { question: "Labuan Bajo is a principal gateway to see which famous animal?", options: ["Komodo dragon", "Giant panda", "Polar bear"], answer: 0, fact: "Boats depart Labuan Bajo for the islands and waters of Komodo National Park." },
  15: { question: "Komodo National Park also protects exceptionally rich what?", options: ["Marine ecosystems", "Alpine glaciers", "Prairie grasslands"], answer: 0, fact: "Its reefs, seagrass beds, and marine life make the park celebrated both above and below water." },
  16: { question: "The repeated syllable that gives Kecak its name sounds most like what?", options: ["Cak", "Om", "La"], answer: 0, fact: "The chorus repeats rhythmic cak sounds while forming dramatic interlocking patterns." },
  17: { question: "Uluwatu Temple is one of Bali’s directional temples believed to guard what?", options: ["The island", "A royal treasury", "A volcano crater"], answer: 0, fact: "Bali’s important sea and directional temples are traditionally understood as spiritual guardians of the island." },
  18: { question: "Jimbaran seafood is commonly grilled over what traditional fuel?", options: ["Coconut husks", "Pine logs", "Peat"], answer: 0, fact: "Many beachside kitchens use coconut husks to give grilled seafood a smoky aroma." },
  19: { question: "The Rain Vortex is located inside which Changi complex?", options: ["Jewel", "Marina Bay Sands", "Esplanade"], answer: 0, fact: "Jewel Changi Airport surrounds the Rain Vortex with gardens, shops, dining, and walkways." },
  20: { question: "What nickname is often given to Hong Kong International Airport?", options: ["Chek Lap Kok", "Kai Tak", "Victoria Peak"], answer: 0, fact: "The airport is commonly called Chek Lap Kok after the island on which it was built." },
};

function Celebration() {
  return <div className="trivia-celebration" aria-hidden="true">
    {Array.from({ length: 14 }, (_, index) => <i key={index} />)}
  </div>;
}

export const getDailyQuestions = (date: number) => bonusTrivia[date] ? [...(trivia[date] || []), bonusTrivia[date]] : (trivia[date] || []);

export default function DailyTrivia({ date }: { date: number }) {
  const questions = getDailyQuestions(date);
  const storageKey = `kd-trivia-${date}`;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  useEffect(() => {
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
