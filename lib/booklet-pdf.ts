export async function bookletEngine(){
 const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc='/guest-scan/pdf.worker.min.mjs';return pdfjs;
}
export const bookletPdfOptions={isEvalSupported:false,cMapUrl:'/booklet-assets/cmaps/',cMapPacked:true,standardFontDataUrl:'/booklet-assets/standard_fonts/',wasmUrl:'/booklet-assets/wasm/'};
export async function validateBookletPdf(bytes:ArrayBuffer){
 const pdfjs=await bookletEngine();const task=pdfjs.getDocument({data:new Uint8Array(bytes),...bookletPdfOptions});
 try{const doc=await task.promise;if(doc.numPages>500)throw Error('Choose a PDF with 500 pages or fewer.');return doc.numPages;}
 catch(e){if((e as Error).name==='PasswordException')throw Error('Use an unlocked PDF to create a booklet.');throw Error((e as Error).message||'This PDF could not be opened. Choose a valid PDF.');}
 finally{await task.destroy();}
}
