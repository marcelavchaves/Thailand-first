import guide from './reading-guide.json';

export default function RecommendedReading({visible}:{visible:boolean}) {
 return <details id="more-reading" hidden={!visible} open className="day-disclosure destination-resources">
  <summary>Recommended reading &amp; viewing</summary>
  <div className="resources-content">
   <p>Books, cinema and cultural series for Vietnam, Cambodia &amp; Thailand, from your Southeast Asia Reading and Viewing Guide.</p>
   <p><a href="/documents/southeast-asia-reading-and-viewing-guide.docx" download>Download the full guide ↗</a></p>
   <details className="resource-category"><summary>Books <span>({guide.books.length})</span></summary><div className="resource-list">
    {guide.books.map(book=><article className="resource-card" key={book.title}>
     <h3>{book.title}</h3><p className="resource-byline">{book.byline}</p><p>{book.description}</p>
     <div className="reading-guide-links">{book.links.map(link=><a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`Find ${book.title} on ${link.label} (opens in a new tab)`}>{link.label} ↗</a>)}</div>
    </article>)}
   </div></details>
   <details className="resource-category"><summary>Films &amp; documentaries <span>({guide.films.length})</span></summary><div className="resource-list">
    {guide.films.map(film=><article className="resource-card" key={film.title}><h3>{film.title}</h3><p className="resource-byline">{film.byline}</p><p>{film.description}</p><p><strong>Where to watch:</strong> {film.availability}</p></article>)}
   </div></details>
   <details className="resource-category"><summary>Travel, culinary &amp; culture series <span>({guide.series.length})</span></summary><div className="resource-list">
    {guide.series.map(series=><article className="resource-card" key={series.title}><h3>{series.title}</h3><p className="resource-byline">{series.episodes}</p><p>{series.description}</p></article>)}
   </div></details>
   <p className="resource-byline">Viewing platforms and episode details are listed as provided in the guide. Availability may vary by region and change over time.</p>
   <details className="resource-category"><summary>4-week pre-departure plan</summary><div className="resource-list">{guide.weeks.map(week=><p key={week}>{week}</p>)}</div></details>
  </div>
 </details>;
}
