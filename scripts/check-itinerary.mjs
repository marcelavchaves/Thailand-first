import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readAppContent, digest, sourceHash, root, absolute } from './pdf-content.mjs';

export const normalized = text => text.normalize('NFKC').replace(/\s+/g,'').toLowerCase();
export function checkRequired(pdfText, required) {
  const text=normalized(pdfText);
  for(const value of required) assert.ok(text.includes(normalized(value)),`PDF is missing current app content: ${value.slice(0,120)}`);
}
const manifest=JSON.parse(await readFile('public/itinerary-manifest.json','utf8'));
assert.equal(manifest.sourceHash,await sourceHash(),'PDF is stale: run npm run build to regenerate');
const bytes=await readFile('public/kingdoms-and-dragons-itinerary.pdf');
assert.equal(digest(bytes),manifest.pdfHash,'PDF bytes do not match manifest');
assert.equal(digest(await readFile('public/kingdoms-and-dragons-itinerary-repaired.pdf')),manifest.pdfHash,'Legacy PDF alias is stale');
const pdf=await getDocument({data:new Uint8Array(bytes),useSystemFonts:true,isEvalSupported:false}).promise;
assert.equal(pdf.numPages,manifest.pages);
const rawDestinations=await pdf.getDestinations();
const destinations=rawDestinations instanceof Map ? Object.fromEntries(rawDestinations) : rawDestinations;
const urls=new Set(); let pdfText='',annotations=0;
for(let i=1;i<=pdf.numPages;i++) {
  const page=await pdf.getPage(i), extracted=await page.getTextContent();
  const pageText=extracted.items.filter(x=>'str'in x).map(x=>x.str).join(' ');
  assert.ok(pageText.trim(),`Blank page ${i}`); pdfText+=' '+pageText;
  for(const item of extracted.items.filter(x=>'str'in x && x.str.trim())) {
    const [, , , ,x,y]=item.transform;
    assert.ok(x>=25 && y>=20 && y<=825 && x+item.width<=575,`Text outside safe page bounds on page ${i}: ${item.str}`);
  }
  for(const a of await page.getAnnotations()) {
    if(a.subtype!=='Link') continue;
    annotations++;
    if(a.url||a.unsafeUrl) urls.add(a.url||a.unsafeUrl);
    if(typeof a.dest==='string') assert.ok(destinations[a.dest],`Broken PDF destination ${a.dest}`);
    assert.ok(a.rect[0]>=0 && a.rect[1]>=0 && a.rect[2]<=596 && a.rect[3]<=843,`Link outside page ${i}`);
  }
}
checkRequired(pdfText,manifest.requiredText);
// Independently reread current app records/components; the manifest alone is
// insufficient evidence of synchronization.
const current=await readAppContent();
const required=[current.title,current.milestone,...current.guests,current.data.xavierEmail,current.data.xavierPhoneDisplay];
for(const day of current.data.days) required.push(day.title,day.region,day.intro,day.note,day.hotel,day.meals,current.data.longTripDate(day.date),...day.events.flat());
for(const hotel of current.data.hotels) required.push(hotel.name,hotel.city,hotel.address,hotel.phone,current.data.shortTripDate(hotel.checkin),current.data.shortTripDate(hotel.checkout));
for(const menu of current.data.hotelResources||[]) required.push(menu.title,menu.note);
for(const flight of current.data.internalFlights) required.push(flight.route,flight.airline,flight.time,flight.detail,...(flight.duration?[flight.duration]:[]));
for(const section of current.sections) required.push(...section.blocks.map(b=>b.text));
assert.equal(current.languageLessons.length,14,"Every journey day must include a language lesson");
for(const tour of current.optionalTours||[]) required.push(...tour.blocks.map(b=>b.text));
for(const lesson of current.languageLessons) required.push(...lesson.blocks.map(b=>b.text));
for(const day of current.trivia) for(const q of day.questions) required.push(q.question,...q.options,q.fact);
for(const story of current.data.storytelling||[]) {
 required.push(story.title,story.description);
 const destinations=story.hotelIndex>=0?['/storytelling.html?story='+story.id]:story.days.map(d=>'/storytelling.html?story='+story.id+'&day='+current.data.tauck(d));
 for(const target of destinations) assert.ok(urls.has(absolute(target)), 'Missing story link: '+target);
 await access(root+'/public/documents/storytelling/'+story.id+'.pdf');
}
checkRequired(pdfText,required);
for(const href of [...manifest.expectedLinks,...current.links]) {
  assert.ok(urls.has(href)||urls.has(new URL(href).href),`Missing clickable link: ${href}`);
  if(href.startsWith(manifest.baseUrl+'/')) {
    const p=new URL(href).pathname;
    if(p==='/storytelling.html') await access(root+'/app/storytelling/page.tsx');
    else if(p==='/hotel-menus.html') await access(root+'/app/hotel-menus/page.tsx');
    else if(p==='/instruction-booklet.html') await access(root+'/app/instruction-booklet/page.tsx');
    else if(p==='/installation-help.html') await access(root+'/app/installation-help/page.tsx');
    else if(p==='/tauck-itinerary.html') await access(root+'/app/tauck-itinerary/page.tsx');
    else if(p==='/export-pdf') await access(root+'/app/export-pdf/page.tsx');
    else if(p!=='/') {
      try { await access(root+'/app'+decodeURIComponent(p)+'/page.tsx'); }
      catch { await access(root+'/public'+decodeURIComponent(p)); }
    }
  }
}
const currentGroupLinks = current.links.filter(u => new URL(u).hostname === 'chat.whatsapp.com');
const pdfGroupLinks = [...urls].filter(u => new URL(u).hostname === 'chat.whatsapp.com');
assert.deepEqual(pdfGroupLinks.sort(), currentGroupLinks.sort(), 'PDF WhatsApp invitations do not match the current app');
for(const item of current.documents) {await access(root+'/public'+item.src);assert.ok(urls.has(absolute(item.src)),`Missing original document ${item.src}`);}
for(const s of manifest.sections) assert.ok(destinations[s.id],`Missing contents target ${s.id}`);
for(const target of Object.values(destinations)) {
  const index=typeof target[0]==='number'?target[0]:await pdf.getPageIndex(target[0]);
  assert.ok(index>=0 && index<pdf.numPages,'Destination points to nonexistent page');
}
// Negative regression checks demonstrate that stale guest/contact/itinerary
// content is rejected rather than merely accepting a self-generated manifest.
for(const value of [current.data.xavierEmail,current.data.days[0].title,current.data.internalFlights[0].airline]) {
  assert.throws(()=>checkRequired(pdfText,[value+' CHANGED-REGRESSION-CHECK']),/missing current app content/);
}
if(process.argv.includes('--export')) {
  assert.equal(digest(await readFile('out/kingdoms-and-dragons-itinerary.pdf')),manifest.pdfHash,'Exported PDF differs');
  const viewer=await readFile('out/travel-book.html','utf8');
  assert.ok(viewer.includes(manifest.pdfHash.slice(0,12)),'Viewer references stale PDF revision');
  assert.ok(!/<img\b[^>]*\bsrc=["']\/travel-book\/page-/i.test(viewer),'Viewer still uses old page images');
}
console.log(`PASS: ${pdf.numPages} pages, ${required.length} current app content checks, ${urls.size} external links, ${annotations} link annotations, ${Object.keys(destinations).length} destinations; stale-content regressions rejected.`);
