import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import sharp from 'sharp';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {renderDietaryPortraitPdf} from '../netlify/lib/meal-dietary-portrait-pdf.mjs';
const photo='data:image/jpeg;base64,'+(await sharp({create:{width:120,height:120,channels:3,background:'#208060'}}).jpeg().toBuffer()).toString('base64');
const bytes=await renderDietaryPortraitPdf([{name:'Color Photo Guest',dietary:'Severe peanut allergy',photo},{name:'No Photo Guest',dietary:'Vegetarian'},{name:'Long Notes Guest',dietary:'Long dietary restrictions '.repeat(150)+'FINAL_NOTE'}]);
await writeFile('/tmp/dietary-report-layout.pdf',bytes);
const pdf=await getDocument({data:new Uint8Array(bytes),useSystemFonts:true}).promise;let text='';
for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),v=page.getViewport({scale:1});assert(v.width<v.height);const content=await page.getTextContent();text+=content.items.map(i=>i.str||'').join(' ');for(const i of content.items.filter(i=>i.str))assert(i.transform[4]>=85&&i.transform[4]+i.width<=510&&i.transform[5]>20,'Text stays within narrow report columns');if(n===1){const name=content.items.find(i=>i.str==='Color Photo');assert(name||content.items.some(i=>(i.str||'').includes('Color Photo')));}}
assert(text.includes('FINAL_NOTE'));assert(text.includes('No Photo'));assert(text.includes('Severe peanut allergy'));
assert.equal(spawnSync('pdftoppm',['-f','1','-singlefile','-scale-to-x','595','-scale-to-y','842','-png','/tmp/dietary-report-layout.pdf','/tmp/dietary-report-layout']).status,0);
const {data}=await sharp('/tmp/dietary-report-layout.png').removeAlpha().raw().toBuffer({resolveWithObject:true});const index=(110*595+140)*3;assert(data[index+1]>data[index]+20,'Portrait preserves color');
console.log('PASS portrait report: color photos, narrow columns, name/photo layout, missing-photo icon, long notes and page bounds.');
