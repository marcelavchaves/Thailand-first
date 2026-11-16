import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {build} from 'esbuild';
import sharp from 'sharp';
import {getDocument,OPS} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {hydrateContent} from '../scripts/render-itinerary.mjs';
import {renderOfflineSnapshot} from '../netlify/lib/offline-snapshot-pdf.mjs';
const avatar='data:image/jpeg;base64,'+(await sharp({create:{width:180,height:220,channels:3,background:'#526F60'}}).jpeg().toBuffer()).toString('base64');
const state={roster:null,photoReads:0};globalThis.snapshotTileTest=state;
const temp=await mkdtemp(join(process.cwd(),'.snapshot-tiles-test-'));
try{
 await build({stdin:{contents:"export {loadCurrentContent} from './netlify/lib/current-itinerary';export {GUEST_LIST_VERSION,GUEST_ORDER_VERSION} from './netlify/lib/safe-roster';",resolveDir:process.cwd(),loader:'ts'},outfile:join(temp,'loader.mjs'),bundle:true,platform:'node',format:'esm',packages:'external',plugins:[{name:'mock-store',setup(b){b.onResolve({filter:/^@netlify\/blobs$/},()=>({path:'store',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:`export function getStore({name}){return {get:async key=>{if(name==='guest-profiles'&&key==='roster')return structuredClone(globalThis.snapshotTileTest.roster);if(name==='guest-profiles'&&key.startsWith('guest/')){globalThis.snapshotTileTest.photoReads++;return {photo:globalThis.snapshotTileTest.avatar,intro:'Public intro'};}return null;},list:async()=>({blobs:[]})};}`}));}}]});
 const {loadCurrentContent,GUEST_LIST_VERSION,GUEST_ORDER_VERSION}=await import(join(temp,'loader.mjs'));
 const g={id:'11111111-1111-4111-8111-111111111111',name:'Ms. Sample Traveler',preferredName:'Sunny',origin:'Boston, MA',bio:'',phone:'PRIVATE_PHONE',email:'PRIVATE_EMAIL',social:'',shareContact:false};state.avatar=avatar;state.roster={guests:[g],revealed:true,guestListVersion:GUEST_LIST_VERSION,guestOrderVersion:GUEST_ORDER_VERSION};
 let loaded=await loadCurrentContent();assert.deepEqual(loaded.content.guestTiles,[{name:'Ms. Sample Traveler (Sunny)',origin:'Boston, MA',photo:avatar}]);assert(!JSON.stringify(loaded.content.guestTiles).includes('PRIVATE_'));
 state.roster.revealed=false;state.photoReads=0;loaded=await loadCurrentContent();assert.deepEqual(loaded.content.guestTiles,[]);assert.deepEqual(loaded.content.guests,[]);assert.equal(state.photoReads,0);
 const content=hydrateContent(JSON.parse(await readFile('netlify/data/itinerary-content.json','utf8')));content.guests=[];content.guestTiles=Array.from({length:20},(_,i)=>({name:'Tile Guest '+String(i+1).padStart(2,'0'),origin:'Hometown '+String(i+1).padStart(2,'0'),photo:i%7===0?avatar:i===1?'data:image/jpeg;base64,broken':null,email:'PRIVATE_EMAIL'}));
 const bytes=await renderOfflineSnapshot({content,root:process.cwd(),baseUrl:'https://example.com',downloadedAt:'2026-11-16T12:00:00Z'});await writeFile('/tmp/offline-guest-tiles.pdf',bytes);const task=getDocument({data:new Uint8Array(bytes),useSystemFonts:true}),pdf=await task.promise;const index=async id=>1+await pdf.getPageIndex((await pdf.getDestination(id))[0]);const first=await index('group'),last=await index('help');assert(last-first>1,'Guest tiles paginate');let all='',images=0;
 for(let n=first;n<last;n++){const p=await pdf.getPage(n);all+=(await p.getTextContent()).items.map(x=>x.str).join(' ');images+=(await p.getOperatorList()).fnArray.filter(x=>x===OPS.paintImageXObject).length;}
 for(const guest of content.guestTiles){assert(all.includes(guest.name));assert(all.includes(guest.origin));}assert.equal(images,3);assert(!all.includes('PRIVATE_EMAIL'));
 const items=(await(await pdf.getPage(first)).getTextContent()).items,a=items.find(x=>x.str==='Tile Guest 01'),b=items.find(x=>x.str==='Tile Guest 02'),c=items.find(x=>x.str==='Tile Guest 03');assert(a.transform[4]<b.transform[4]&&c.transform[4]<b.transform[4]);assert(c.transform[5]<a.transform[5]);await task.destroy();
 assert(!(await readFile('app/TravelerApp.tsx','utf8')).includes('Download a dated PDF copy'));
 console.log('PASS visible roster names/preferred names, hometowns and photos; hidden roster excluded; 20 tiles in row order; missing/damaged photo fallback; privacy and removed tile subtitle.');
}finally{delete globalThis.snapshotTileTest;await rm(temp,{recursive:true,force:true});}
