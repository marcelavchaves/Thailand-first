import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,mkdir,cp,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),temp=await mkdtemp(join(root,'.meal-pdf-package-'));
try{
 const fn=join(temp,'function');await mkdir(fn,{recursive:true});
 const result=await build({stdin:{contents:'export {renderMealPdf} from "./netlify/lib/meal-report-pdf.mjs";export {menus,mealReport} from "./lib/meal-choices";',resolveDir:root,loader:'ts'},outfile:join(fn,'bundle.mjs'),bundle:true,platform:'node',format:'esm',external:['pdfkit'],metafile:true});
 const imported=Object.values(result.metafile.outputs).flatMap(o=>o.imports);
 assert(imported.some(i=>i.path==='pdfkit'&&i.external),'PDFKit must be visible to the function dependency tracer');
 // Copy a deployment-shaped dependency tree without standard-font assets.
 // The report must use its included TrueType fonts instead of a hidden Helvetica dependency.
 await cp(join(root,'node_modules/pdfkit'),join(temp,'node_modules/pdfkit'),{recursive:true,dereference:true,filter:source=>!source.includes('/js/data')&&!source.includes('/js/standard-fonts')});
 await mkdir(join(fn,'scripts/fonts'),{recursive:true});
 for(const file of ['DejaVuSans.ttf','DejaVuSans-Bold.ttf'])await cp(join(root,'scripts/fonts',file),join(fn,'scripts/fonts',file));
 await writeFile(join(fn,'run.mjs'),`import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';import {renderMealPdf,menus,mealReport} from './bundle.mjs';
 const selections=Object.fromEntries(menus.map(m=>[m.id,Object.fromEntries(m.courses.map(c=>[c.id,c.options[0].id]))]));
 const guests=[{id:'sample',name:'Sample Traveler',pinReady:false,submission:{selections,dietary:'Peanut allergy · vegetarian',status:'submitted',submittedAt:new Date().toISOString(),updatedAt:new Date().toISOString()}}];
 for(const id of ['vedana','all']){const bytes=await renderMealPdf(mealReport(guests,id),id);assert.equal(bytes.subarray(0,4).toString(),'%PDF');await writeFile('${temp.replaceAll('\\','\\\\')}/'+id+'.pdf',bytes);}
 const empty=await renderMealPdf(mealReport([],'all'),'all');assert.equal(empty.subarray(0,4).toString(),'%PDF');
 `);
 execFileSync(process.execPath,[join(fn,'run.mjs')],{cwd:fn,stdio:'pipe'});
 const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
 for(const id of ['vedana','all']){
  const pdf=await getDocument({data:new Uint8Array(await readFile(join(temp,id+'.pdf'))),useSystemFonts:true,isEvalSupported:false}).promise;let text='';
  for(let i=1;i<=pdf.numPages;i++)text+=' '+(await(await pdf.getPage(i)).getTextContent()).items.filter(x=>'str'in x).map(x=>x.str).join(' ');
  assert(text.includes('Sample Traveler'));assert(text.includes('Peanut allergy'));assert(text.includes('Deadline:'));
  if(id==='all')for(const m of ['Vedana lunch','Cu Chi lunch box','Sokkhak Lunch','Lakorn Lunch','Farewell Dinner'])assert(text.includes(m),m);
 }
 console.log('PASS packaged PDF: explicit external dependency, isolated function working directory, bundled TrueType fonts only, single/all-menu and empty-roster exports, readable traveler/allergy/deadline text.');
}finally{await rm(temp,{recursive:true,force:true});}
