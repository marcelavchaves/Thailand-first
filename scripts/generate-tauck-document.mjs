import {PDFDocument, PDFName, PDFString, StandardFonts, rgb} from 'pdf-lib';
import {readFile,writeFile} from 'node:fs/promises';
const base=process.env.NEXT_PUBLIC_APP_ENV==='test'?'https://kingdoms-dragons-new-edition-test.netlify.app':'https://kingdoms-dragons-new-edition.netlify.app';
const pdf=await PDFDocument.load(await readFile('assets/tauck-itinerary-sanitized.pdf'));
const font=await pdf.embedFont(StandardFonts.Helvetica);
for(const page of pdf.getPages()){
 const w=page.getWidth();
 page.drawRectangle({x:0,y:0,width:w,height:28,color:rgb(.88,.94,.91)});
 page.drawRectangle({x:0,y:27,width:w,height:3,color:rgb(.79,.64,.32)});
 page.drawRectangle({x:20,y:4,width:154,height:20,color:rgb(.08,.27,.22)});
 page.drawText('BACK TO APP',{x:42,y:11,size:10,font,color:rgb(1,1,1)});
 page.drawText(`Page ${pdf.getPages().indexOf(page)+1} of ${pdf.getPageCount()}`,{x:w-102,y:11,size:9,font,color:rgb(.08,.27,.22)});
 const annotation=pdf.context.register(pdf.context.obj({Type:'Annot',Subtype:'Link',Rect:[20,4,174,24],Border:[0,0,0],A:{Type:'Action',S:'URI',URI:PDFString.of(base+'/?tab=info')}}));
 page.node.addAnnot(annotation);
}
await writeFile('public/documents/tauck-original-itinerary.pdf',await pdf.save());
console.log('Original Tauck reference: 30 numbered pages with return-to-app links.');
