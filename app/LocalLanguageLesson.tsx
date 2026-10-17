type Phrase = [english: string, local: string, pronunciation: string];
const shared: Phrase[] = [
  ['Thank you', 'Terima kasih', 'tuh-ree-mah kah-see'],
  ['You’re welcome', 'Sama-sama', 'sah-mah sah-mah'],
  ['Please (when asking for help)', 'Tolong', 'toh-long'],
  ['Yes', 'Ya', 'yah'],
  ['No', 'Tidak', 'tee-dahk'],
];
const malay: Phrase[] = [
  ['Hello (casual)', 'Hai', 'hi'],
  ['Good morning', 'Selamat pagi', 'suh-lah-maht pah-gee'],
  ['Good afternoon (around midday)', 'Selamat tengah hari', 'suh-lah-maht tuh-ngah hah-ree'],
  ['Good afternoon / early evening', 'Selamat petang', 'suh-lah-maht puh-tahng'],
  ['Good evening / good night', 'Selamat malam', 'suh-lah-maht mah-lahm'],
  ['Goodbye / see you again', 'Jumpa lagi', 'joom-pah lah-gee'],
  ...shared,
  ['Excuse me / I’m sorry', 'Maaf', 'mah-ahf'],
  ['How are you?', 'Apa khabar?', 'ah-pah kah-bar'],
];
const indonesian: Phrase[] = [
  ['Hello (casual)', 'Halo', 'hah-loh'],
  ['Good morning', 'Selamat pagi', 'suh-lah-maht pah-gee'],
  ['Good day / early afternoon', 'Selamat siang', 'suh-lah-maht see-ahng'],
  ['Good afternoon (late afternoon)', 'Selamat sore', 'suh-lah-maht soh-reh'],
  ['Good evening (after dark)', 'Selamat malam', 'suh-lah-maht mah-lahm'],
  ['Good night (at bedtime)', 'Selamat tidur', 'suh-lah-maht tee-door'],
  ['Goodbye / see you', 'Sampai jumpa', 'sahm-pie joom-pah'],
  ...shared,
  ['Excuse me (getting attention / passing)', 'Permisi', 'puhr-mee-see'],
  ['How are you?', 'Apa kabar?', 'ah-pah kah-bar'],
  ['Ma’am / Mrs. / Ms. (respectful address)', 'Ibu', 'ee-boo'],
  ['Sir / Mr. (respectful address)', 'Bapak', 'bah-pahk'],
];
export default function LocalLanguageLesson({region}: {region: string}) {
  const singapore = region === 'Singapore';
  const phrases = singapore ? malay : indonesian;
  return <section className="local-language-lesson" aria-labelledby="language-lesson-heading">
    <span className="eyebrow">A FEW WORDS GO A LONG WAY</span>
    <h2 id="language-lesson-heading">Local Language Lesson</h2>
    <p className="language-destination">{singapore ? 'Singapore · Malay (Bahasa Melayu)' : `${region} · Indonesian (Bahasa Indonesia)`}</p>
    <p>{singapore ? 'English is widely spoken in Singapore. Malay is one of its official languages; try these friendly phrases with Malay speakers.' : 'Indonesian is used across Java, Bali and Komodo. These phrases work throughout this part of our journey, alongside the local languages.'}</p>
    <p className="language-pronunciation-key">Say it using the English sound guide. These are approximate sounds: “ah” as in father, “ee” as in see, “ng” as in sing, and “g” as in go. Keep the syllables gentle and even.</p>
    <div className="language-phrase-grid">
      {phrases.map(([english,local,pronunciation]) => <div className="language-phrase" key={english}>
        <span className="language-meaning">{english}</span>
        <strong lang={singapore ? 'ms' : 'id'}>{local}</strong>
        <span className="language-sound">Say: {pronunciation}</span>
      </div>)}
    </div>
    {!singapore && <p className="language-culture-note"><strong>A little local courtesy:</strong> Ibu and Bapak literally mean mother and father, but are also respectful ways to address adults. You may hear the shorter forms Bu (“boo”) and Pak (“pahk”). At Amanjiwo, staff use them as a warm sign of respect. Use Selamat malam to greet someone after dark; Selamat tidur wishes someone a good sleep.</p>}
    <p className="language-source">Phrase reference: <a href={`https://www.omniglot.com/language/phrases/${singapore ? 'malay' : 'indonesian'}.php`} target="_blank" rel="noopener noreferrer">{singapore ? 'Malay' : 'Indonesian'} phrase guide</a></p>
  </section>;
}
