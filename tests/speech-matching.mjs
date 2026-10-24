import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
const directory=await mkdtemp(join(tmpdir(),'wondercase-speech-'));
try{
 const outfile=join(directory,'matching.mjs');
 await build({entryPoints:['app/speech-matching.ts'],outfile,bundle:true,platform:'node',format:'esm'});
 const {understoodPhrase}=await import(pathToFileURL(outfile).href);
 assert(understoodPhrase('Xin chào',' Xin chào! ','vi-VN'));
 assert(understoodPhrase('Cảm ơn','CẢM ƠN'.normalize('NFD'),'vi-VN'));
 assert(!understoodPhrase('Cảm ơn','cam on','vi-VN'),'Vietnamese tone/diacritic changes must not earn a match');
 assert(!understoodPhrase('Xin chào','Xin chào và tạm biệt','vi-VN'),'A phrase inside a different sentence must not earn a match');
 assert(understoodPhrase('អរគុណ','អរគុណ។','km-KH'));
 assert(understoodPhrase('សូម','សូ\u200bម','km-KH'));
 assert(understoodPhrase('สวัสดี','สวัสดีครับ','th-TH'));
 assert(understoodPhrase('ขอบคุณ','ขอบคุณค่ะ','th-TH'));
 assert(!understoodPhrase('น้ำ','นํา','th-TH'),'Do not strip Thai marks to approximate a match');
 assert(!understoodPhrase('','', 'vi-VN'));
 assert(!understoodPhrase('សូម','', 'km-KH'));
 console.log('Speech matching: native-script, Unicode, Thai courtesy endings, empty/mismatched phrases and accent preservation passed.');
}finally{await rm(directory,{recursive:true,force:true});}
