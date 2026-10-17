export function HelpAndTutorials(){
 return <section id="more-help" className="more-open-panel journey-extras">
  <span className="eyebrow">A LITTLE GUIDANCE, WHENEVER YOU NEED IT</span>
  <h2>Help &amp; Tutorials</h2><p>Make yourself at home in Wondercase. Start with a question, or follow a quick guide.</p>
  <details open><summary>How do I…?</summary>
   <details><summary>Open My Safe</summary><p>Go to Travelers, find your own guest card and tap <strong>Open My Safe</strong>. Enter your Safe password on the sign-in screen. If the guest list is still hidden or you need help with your password, ask Xavier.</p><a href="/?tab=info">Go to Travelers →</a></details>
   <details><summary>Find today’s schedule</summary><p>Open Journey and choose your journey day. Look for the day’s activities and Xavier’s latest notes. Check back for updates as you travel.</p><a href="/?tab=journey">Open Journey →</a></details>
   <details><summary>Find trip documents</summary><p>Open your Safe for personal documents. Shared destination information and handouts are available in the journey’s resource sections.</p><a href="/?tab=journey">Explore journey resources →</a></details>
   <details><summary>Add Wondercase to my phone</summary><p>Follow the illustrated installation guide for iPhone or Android, then open Wondercase from your home screen.</p><a href="/installation-help/">Show me how →</a></details>
   <details><summary>Find our shared photos</summary><p>Open Gallery and follow the PhotoCircle link when your group’s album is available.</p><a href="/?tab=gallery">Go to Gallery →</a></details>
  </details>
  <details><summary>Frequently Asked Questions</summary>
   <details><summary>Why can’t I see the guest list yet?</summary><p>Xavier controls when the list is revealed. If it is hidden, you will see a message until it is ready.</p></details>
   <details><summary>Do I need internet access?</summary><p>Connect to the internet for the latest schedule, shared photos, feedback and Safe content. Previously viewed pages may be available offline, but reconnect to check for updates.</p></details>
   <details><summary>Can I update my feedback?</summary><p>Yes. Return to Help Wondercase Grow using the same browser and device, then choose “Add to or update my thoughts.”</p></details>
   <details><summary>Who can help with my Safe password?</summary><p>Ask Xavier for help accessing your assigned Safe. Please keep your password private.</p></details>
  </details>
  <details><summary>Watch a Tutorial</summary><p>A short introduction to your travel companion.</p><video controls preload="none" playsInline aria-label="Wondercase introduction tutorial" src="/tutorial/k-d102-v0.003.mp4"/><div className="extras-links"><a href="/tutorial/k-d102-v0.003.html">Open the tutorial guide →</a><a href="/instruction-booklet/">Read the instruction booklet →</a></div></details>
  <details><summary>Something Not Working?</summary><p>Check your internet connection, close and reopen Wondercase, and try again. For a Safe password or trip question, contact Xavier through Travelers.</p><p>For an app issue, tell us what you were trying to do, what happened, and which phone or browser you used. Please leave passwords and personal documents out of your message.</p><a href="/?tab=info">Find Xavier’s contact details →</a></details>
 </section>;
}

const concepts=[
 {icon:'book',title:'Your Journey, Bound in a Book',tag:'PHOTOBOOKS',description:'A beautiful home for your favorite moments, from Singapore’s skyline to Bali’s golden light.',detail:'Imagine choosing your favorite photographs, adding little captions and turning the trip into a keepsake book. Formats and ordering options will be explored later.'},
 {icon:'journal',title:'Little Things for Big Adventures',tag:'TRAVEL COMPANIONS',description:'Travel journals, thoughtful accessories and useful things to take along.',detail:'A curated collection could include a pocket journal, luggage accessories and practical travel essentials. This sample collection has no products available to purchase yet.'},
 {icon:'craft',title:'Made Where Memories Happen',tag:'LOCAL CRAFTS',description:'Discover the stories behind batik, Balinese crafts and keepsakes inspired by the journey.',detail:'Future collections could introduce local makers and explain the traditions behind their work, with carefully selected links to their shops.'},
 {icon:'map',title:'Bring a Little of the Journey Home',tag:'TRIP INSPIRATIONS',description:'Books, flavors and discoveries connected to the places we explore.',detail:'Imagine a selection of destination books, recipes and cultural discoveries tied to each stop. For now, explore the recommended reading already available in More.'},
];
export function JourneyShop(){
 return <section id="more-shop" className="more-open-panel journey-extras"><span className="eyebrow">A LITTLE WONDER TO TAKE HOME</span><h2>Journey Shop</h2><p>Keep the memories close. Explore a few ideas for things inspired by your travels.</p><p className="shop-preview-note">Prototype preview · sample collections, with shopping to come.</p><div className="journey-shop-grid">{concepts.map(item=><article className="journey-shop-card" key={item.icon}><div className="shop-card-art" aria-hidden="true"><svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">{item.icon==='book'?<><path d="M20 25q15-8 30 0q15-8 30 0v50q-15-8-30 0q-15-8-30 0zM50 25v50"/><path d="M28 36h13M28 45h13M59 36h13M59 45h13"/></>:item.icon==='journal'?<><rect x="27" y="17" width="46" height="66" rx="4"/><path d="M37 17v66M46 38h18M46 48h18M46 58h12"/></>:item.icon==='craft'?<><path d="M22 50 50 20l28 30-28 30zM35 50l15-16 15 16-15 16z"/><circle cx="50" cy="50" r="4"/></>:<><path d="m17 28 22-8 22 8 22-8v55l-22 8-22-8-22 8zM39 20v55M61 28v55"/><path d="M52 46a7 7 0 1 0-14 0c0 6 7 13 7 13s7-7 7-13z"/></>}</svg></div><span className="eyebrow">{item.tag}</span><h3>{item.title}</h3><p>{item.description}</p><details><summary>Explore the idea</summary><p>{item.detail}</p></details></article>)}</div></section>;
}
