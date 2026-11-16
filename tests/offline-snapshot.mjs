import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {renderOfflineSnapshot} from '../netlify/lib/offline-snapshot-pdf.mjs';
import {hydrateContent} from '../scripts/render-itinerary.mjs';
const content=hydrateContent(JSON.parse(await readFile('netlify/data/itinerary-content.json','utf8')));content.guests=['Sample Traveler'];
const bytes=await renderOfflineSnapshot({content,root:process.cwd(),baseUrl:'https://example.com',downloadedAt:'2026-11-16T12:00:00Z',announcements:{5:{text:'Published announcement preserved.'}},resources:[{title:'Shared handout',url:'/api/tour-resources?file=sample'}],maps:[{name:'Hanoi',url:'https://maps.google.com'}]});
await writeFile('/tmp/styled-offline-snapshot.pdf',bytes);
const task=getDocument({data:new Uint8Array(bytes),useSystemFonts:true,isEvalSupported:false}),pdf=await task.promise;
const normalize=v=>v.replace(/\s+/g,' ').trim();let all='';
for(let n=1;n<=pdf.numPages;n++){
 const page=await pdf.getPage(n),items=(await page.getTextContent()).items.filter(i=>i.str),text=normalize(items.map(i=>i.str).join(' '));all+=text+' ';
 assert(text.includes('Downloaded 16 Nov 2026, 12:00 UTC'),'Date on page '+n);assert(text.includes('Saved copy may be out of date'),'Warning on page '+n);
 assert(text.includes('CONTENTS')&&text.includes('CALENDAR'),'Return navigation on page '+n);
 for(const a of await page.getAnnotations())if(a.dest){const dest=typeof a.dest==='string'?await pdf.getDestination(a.dest):a.dest;assert(dest,'Destination exists: '+a.dest);const index=await pdf.getPageIndex(dest[0]);assert(index>=0&&index<pdf.numPages);}
 for(const item of items){assert(item.transform[4]>=19,'Text inside left frame: '+item.str);assert(item.transform[4]+item.width<577,'Text inside right frame: '+item.str);assert(item.transform[5]>20,'Text above lower frame: '+item.str);}
}
for(const day of content.data.days){for(const [time,event]of day.events){assert(all.includes(normalize(time)),time);assert(all.includes(normalize(event)),event);}assert(await pdf.getDestination('day-'+day.date));}
assert(all.includes('Published announcement preserved.'));assert(all.includes('Sample Traveler'));assert(!all.includes('Historical trivia'));assert(!all.includes('Language lessons'));assert(!all.includes('Updated:'));
const calendar=await pdf.getPage(3),links=(await calendar.getAnnotations()).filter(a=>typeof a.dest==='string'&&a.dest.startsWith('day-'));
assert.equal(links.length,16);assert(links.find(a=>a.dest==='day-5').rect[0]>100,'Monday start has leading Sunday blank');assert(Math.abs(links.find(a=>a.dest==='day-11').rect[0]-44)<1,'Day 7 falls on Sunday');
const toc=(await(await pdf.getPage(2)).getAnnotations()).filter(a=>a.rect[3]-a.rect[1]>50&&['journey','hotels','maps','group','help','guide'].includes(a.dest));assert.equal(toc.length,6);
const outline=await pdf.getOutline();assert.equal(outline.filter(o=>o.title.startsWith('Day ')).length,16);assert(bytes.length<6*1024*1024,'Mobile-friendly PDF size');
console.log(`PASS ${pdf.numPages} styled pages: contents cards, calendar alignment, all destinations/bookmarks, all schedule text, footer dates, page bounds and excluded learning content. ${(bytes.length/1024/1024).toFixed(1)} MB.`);
await task.destroy();
