import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {renderItinerary,hydrateContent} from '../scripts/render-itinerary.mjs';
const snapshot=JSON.parse(await readFile('netlify/data/itinerary-content.json','utf8'));
const content=hydrateContent(snapshot);const day=content.data.days.find(d=>d.date===8);
const original=day.events[0][1];day.events=[['10:15 AM','TIMELINE-SYNC-CHECK: revised meeting in the hotel lobby.'],['DINNER','TIMELINE-SYNC-CHECK: new dinner location.']];day.note='TIMELINE-SYNC-CHECK: remember the new departure time.';
const guest=content.sections.find(s=>s.title==='The Guest List').blocks.find(b=>b.guestId==='1');guest.text=guest.text.replace('Introduction coming soon.','PROFILE-SYNC-CHECK: happy to join the journey.');
const {bytes,manifest}=await renderItinerary(content,{root:process.cwd(),baseUrl:snapshot.baseUrl,testEdition:true});
const doc=await getDocument({data:new Uint8Array(bytes),useSystemFonts:true,isEvalSupported:false}).promise;let text='';
for(let i=1;i<=doc.numPages;i++){const p=await doc.getPage(i);text+=' '+(await p.getTextContent()).items.filter(x=>'str'in x).map(x=>x.str).join(' ');}
assert.ok(text.replace(/\s+/g,'').includes('PROFILE-SYNC-CHECK:happytojointhejourney.'));assert.ok(manifest.requiredText.includes(guest.text));assert.ok(text.includes('TIMELINE-SYNC-CHECK: revised meeting'));assert.ok(text.includes('TIMELINE-SYNC-CHECK: new dinner'));assert.ok(text.includes(day.note));assert.ok(!manifest.requiredText.includes(original));assert.ok(text.includes(content.data.days[4].events[0][1]));
await writeFile('.pdf-build/timeline-updated-verification.pdf',bytes);
console.log('PASS: live PDF renderer includes revised activities/reminder, removes replaced schedule text and retains neighboring days and includes the revised guest introduction.');
