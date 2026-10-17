import {mkdir,copyFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
const target='public/guest-scan';await mkdir(target,{recursive:true});
await copyFile('node_modules/tesseract.js/dist/worker.min.js',join(target,'worker.min.js'));
for(const file of await readdir('node_modules/tesseract.js-core'))if(file.endsWith('.wasm.js'))await copyFile(join('node_modules/tesseract.js-core',file),join(target,file));
await copyFile('node_modules/@tesseract.js-data/eng/4.0.0/eng.traineddata.gz',join(target,'eng.traineddata.gz'));
await copyFile('node_modules/pdfjs-dist/build/pdf.worker.min.mjs',join(target,'pdf.worker.min.mjs'));
