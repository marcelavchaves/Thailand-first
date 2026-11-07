import {mkdir,cp,copyFile} from 'node:fs/promises';
await mkdir('public/booklet-assets',{recursive:true});
for(const folder of ['cmaps','standard_fonts','wasm'])await cp('node_modules/pdfjs-dist/'+folder,'public/booklet-assets/'+folder,{recursive:true});
await copyFile('node_modules/pdfjs-dist/LICENSE','public/booklet-assets/LICENSE');
