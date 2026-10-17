import {PDFDocument,StandardFonts,rgb,PDFString} from 'pdf-lib';
import {readFile,writeFile} from 'node:fs/promises';
const menus=JSON.parse(await readFile('app/hotel-resources.json','utf8'));
const base=process.env.NEXT_PUBLIC_APP_ENV==='test'?'https://kingdoms-dragons-new-edition-test.netlify.app':'https://kingdoms-dragons-new-edition.netlify.app';
for(const menu of menus){
 const input=await PDFDocument.load(await readFile(`assets/hotel-menus/${menu.id}.pdf`));
 if(input.getPageCount()!==menu.pages)throw Error('Menu page count differs: '+menu.id);
 const out=await PDFDocument.create(),font=await out.embedFont(StandardFonts.HelveticaBold);
 for(const [i,original] of input.getPages().entries()){
  const embedded=await out.embedPage(original);const {width,height}=original.getSize();const page=out.addPage([width,height+40]);page.drawPage(embedded,{x:0,y:40,width,height});page.drawRectangle({x:0,y:0,width,height:40,color:rgb(.14,.36,.33)});page.drawText('BACK TO APP - HOTELS',{x:18,y:15,font,size:10,color:rgb(1,1,1)});page.drawText(`${i+1} / ${menu.pages}`,{x:width-65,y:15,font,size:10,color:rgb(1,1,1)});
  page.node.addAnnot(out.context.register(out.context.obj({Type:'Annot',Subtype:'Link',Rect:[12,5,225,35],Border:[0,0,0],A:{S:'URI',URI:PDFString.of(base+'/?tab=hotels')}})));
 }
 out.setTitle(menu.title+' | '+menu.hotel);await writeFile(`public/documents/hotel-menus/${menu.id}.pdf`,await out.save());
}
console.log('Generated four complete menus with return-to-app links.');
