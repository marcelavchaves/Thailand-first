export async function scanGuestList(file:File,onProgress:(message:string)=>void,signal:AbortSignal):Promise<string>{
 if(file.size>15*1024*1024)throw Error('Choose a file under 15 MB.');
 const check=()=>{if(signal.aborted)throw Error('Scan canceled.');};
 check();
 if(/\.(txt|csv|tsv)$/i.test(file.name))return await file.text();
 let worker:Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>>|undefined;
 const cancel=()=>{void worker?.terminate();};signal.addEventListener('abort',cancel);
 async function recognize(image:HTMLCanvasElement){
  check();
  if(!worker){onProgress('Loading the scanner…');const {createWorker}=await import('tesseract.js');worker=await createWorker('eng',1,{workerPath:'/guest-scan/worker.min.js',corePath:'/guest-scan',langPath:'/guest-scan',logger:m=>{if(!signal.aborted&&m.status==='recognizing text')onProgress(`Reading text… ${Math.round(m.progress*100)}%`);}});}
  if(signal.aborted){await worker.terminate();worker=undefined;check();}const result=await worker!.recognize(image);check();return result.data.text;
 }
 try{
  if(file.type==='application/pdf'||/\.pdf$/i.test(file.name)){
   const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc='/guest-scan/pdf.worker.min.mjs';
   const loading=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())});
   const doc=await loading.promise;
   try{if(doc.numPages>10)throw Error('Choose a PDF with 10 pages or fewer.');const pages:string[]=[];
    for(let n=1;n<=doc.numPages;n++){
     check();onProgress(`Reading page ${n} of ${doc.numPages}…`);const page=await doc.getPage(n);const content=await page.getTextContent();
     const rows=new Map<number,{x:number;text:string}[]>();
     for(const item of content.items){if('str' in item&&item.str.trim()){const y=Math.round(item.transform[5]/3)*3;const row=rows.get(y)||[];row.push({x:item.transform[4],text:item.str});rows.set(y,row);}}
     let text=[...rows].sort((a,b)=>b[0]-a[0]).map(([,items])=>items.sort((a,b)=>a.x-b.x).map(i=>i.text).join(' ')).join('\n');
     if(text.trim().length<20){const base=page.getViewport({scale:1});const viewport=page.getViewport({scale:Math.min(2,2200/Math.max(base.width,base.height))});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvas,canvasContext:canvas.getContext('2d')!,viewport}).promise;text=await recognize(canvas);canvas.width=canvas.height=0;}
     pages.push(text);page.cleanup();
    }return pages.join('\n');
   }finally{await loading.destroy();}
  }
  if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw Error('Choose a PDF, JPEG, PNG, WebP, CSV or text file.');
  const bitmap=await createImageBitmap(file);try{const scale=Math.min(1,2500/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);return await recognize(canvas);}finally{bitmap.close();}
 }finally{signal.removeEventListener('abort',cancel);if(worker&&!signal.aborted)await worker.terminate();}
}
