import assert from 'node:assert/strict';
import {createWorker} from 'tesseract.js';
import sharp from 'sharp';
import {resolve} from 'node:path';
const image=await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="350"><rect width="1400" height="350" fill="white"/><g fill="black" font-family="DejaVu Sans" font-size="42"><text x="50" y="80">Test Traveler One</text><text x="50" y="160">Test Traveler Two</text><text x="50" y="240">Test Traveler Three</text></g></svg>')).png().toBuffer();
const worker=await createWorker('eng',1,{langPath:resolve('public/guest-scan'),cacheMethod:'none'});
try{const {data}=await worker.recognize(image);assert.match(data.text,/Test Traveler One/);assert.match(data.text,/Test Traveler Two/);assert.match(data.text,/Test Traveler Three/);console.log('PASS: bundled English OCR recognizes three guest rows from a synthetic image.');}finally{await worker.terminate();}
