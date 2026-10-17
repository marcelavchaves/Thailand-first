import {PDFDocument,StandardFonts,rgb,PDFString} from 'pdf-lib';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const stories=JSON.parse(await readFile('app/storytelling.json','utf8'));
const base=process.env.NEXT_PUBLIC_APP_ENV==='test'?'https://kingdoms-dragons-new-edition-test.netlify.app':'https://kingdoms-dragons-new-edition.netlify.app';
await mkdir('public/documents/storytelling',{recursive:true});
for(const story of stories){
 const input=await PDFDocument.load(await readFile(`assets/storytelling/${story.id}.pdf`));
 if(input.getPageCount()!==story.pages)throw Error('Story page count differs: '+story.id);
 const out=await PDFDocument.create(),font=await out.embedFont(StandardFonts.HelveticaBold);
 for(const original of input.getPages()){
  const embedded=await out.embedPage(original),{width,height}=original.getSize(),page=out.addPage([width,height+32]);
  page.drawPage(embedded,{x:0,y:32,width,height});page.drawRectangle({x:0,y:0,width,height:32,color:rgb(.14,.36,.33)});
  page.drawText(story.hotelIndex>=0?'BACK TO APP - HOTEL':'BACK TO APP - JOURNEY',{x:16,y:12,font,size:9,color:rgb(1,1,1)});
  page.node.addAnnot(out.context.register(out.context.obj({Type:'Annot',Subtype:'Link',Rect:[0,0,width,32],Border:[0,0,0],A:{S:'URI',URI:PDFString.of(base+story.returnTo)}})));
 }
 out.setTitle(story.title);await writeFile(`public/documents/storytelling/${story.id}.pdf`,await out.save());
}
console.log('Five storytelling PDFs generated with return links on all 32 pages.');
