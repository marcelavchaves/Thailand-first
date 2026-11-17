export function snapshotPages(value:string,count:number):number[]{
 if(!value.trim())throw Error('Enter at least one page number.');
 const selected=new Set<number>();for(const part of value.split(',')){const match=part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);if(!match)throw Error('Use page numbers or ranges, such as 1, 3-5.');const first=Number(match[1]),last=Number(match[2]||match[1]);if(first<1||last>count||last<first)throw Error(`Choose pages between 1 and ${count}.`);for(let p=first;p<=last;p++)selected.add(p);}
 return [...selected].sort((a,b)=>a-b);
}
export async function selectedSnapshotPdf(bytes:Uint8Array,pages:number[]){
 const {PDFDocument,PDFName,PDFArray,PDFDict}=await import('pdf-lib');const source=await PDFDocument.load(bytes),out=await PDFDocument.create();
 if(!pages.length||pages.some(p=>!Number.isInteger(p)||p<1||p>source.getPageCount()))throw Error('Choose valid pages.');
 const copied=await out.copyPages(source,pages.map(p=>p-1));for(const page of copied){const annots=page.node.lookupMaybe(PDFName.of('Annots'),PDFArray);if(annots){for(let i=annots.size()-1;i>=0;i--){const a=annots.lookup(i,PDFDict),action=a.lookupMaybe(PDFName.of('A'),PDFDict);if(a.has(PDFName.of('Dest'))||action?.get(PDFName.of('S'))?.toString()==='/GoTo')annots.remove(i);}}out.addPage(page);}
 out.setTitle('Wondercase Offline Snapshot — Selected pages');out.setSubject('Selected pages from a dated snapshot. Saved copies may be out of date.');return out.save();
}
