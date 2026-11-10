import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {writeFile} from 'node:fs/promises';
import sharp from 'sharp';
await build({stdin:{contents:'export {renderMealGuestTablePdf} from "./netlify/lib/meal-guest-table-pdf.mjs";export {mealReport,menus} from "./lib/meal-choices";',resolveDir:process.cwd(),loader:'ts'},outfile:'.pdf-build/meal-guest-table.mjs',bundle:true,platform:'node',format:'esm',external:['pdfkit','sharp']});
const {renderMealGuestTablePdf,mealReport,menus}=await import('../.pdf-build/meal-guest-table.mjs');
const {getDocument,OPS}=await import('pdfjs-dist/legacy/build/pdf.mjs');
const photo='data:image/jpeg;base64,'+(await sharp({create:{width:96,height:112,channels:3,background:'#4F6B5D'}}).jpeg().toBuffer()).toString('base64');
const guests=Array.from({length:34},(_,i)=>({id:String(i+1),name:i===0?'Sample Full Name for Restaurant':'Sample Traveler '+(i+1),number:i+1,photo:i===0?photo:i===1?'data:image/jpeg;base64,broken':undefined,pinReady:false,submission:i===2?null:{selections:Object.fromEntries(menus.map(m=>[m.id,Object.fromEntries(m.courses.map(c=>[c.id,c.options[0].id]))])),dietary:i===0?'Severe peanut allergy':i===1?'Long dietary note '.repeat(120)+'LAST_NOTE_WORD':'',status:i===1?'draft':'submitted',submittedAt:'2026-11-01T00:00:00Z',updatedAt:'2026-11-01T00:00:00Z'}}));
for(const meal of ['vedana','all']){
 const bytes=await renderMealGuestTablePdf(mealReport(guests,meal),guests);await writeFile('/tmp/meal-guest-table-'+meal+'.pdf',bytes);
 const pdf=await getDocument({data:new Uint8Array(bytes),useSystemFonts:true,isEvalSupported:false}).promise;
 let text='',images=0;
 for(let i=1;i<=pdf.numPages;i++){
  const page=await pdf.getPage(i),view=page.getViewport({scale:1});assert(view.width>view.height,'Every page is landscape');
  const content=await page.getTextContent();text+=content.items.map(x=>x.str||'').join(' ')+' ';
  for(const item of content.items.filter(x=>x.str)){
   assert(item.transform[4]>=30&&item.transform[4]+item.width<view.width-25,'Text fits horizontally: '+item.str);
   assert(item.transform[5]>12&&item.transform[5]<view.height-15,'Text fits vertically: '+item.str);
  }
  images+=(await page.getOperatorList()).fnArray.filter(x=>x===OPS.paintImageXObject).length;
 }
 assert(images>0,'Embedded guest photo');for(const value of ['Guest #','Guest full name','Meal choices','Allergies / restrictions','Sample Full Name','Severe peanut allergy','No photo','LAST_NOTE_WORD','Status: draft','Status: not started','Sample Traveler 34'])assert(text.includes(value),value);
 if(meal==='all')for(const menu of menus){assert(text.includes(menu.title));for(const course of menu.courses)assert(text.includes(course.title+':'),course.title);}
 console.log('PASS landscape',meal,pdf.numPages,'pages: photos, no-photo fallback, line breaks, long notes, statuses, all guests and page bounds.');
}
const empty=await renderMealGuestTablePdf(mealReport([],'all'),[]);assert.equal(Buffer.from(empty).subarray(0,4).toString(),'%PDF');
