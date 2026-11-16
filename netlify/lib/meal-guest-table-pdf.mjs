import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
/** One landscape A4 page per restaurant, fitting every guest without dropping notes or courses. */
export async function renderMealGuestTablePdf(report,guests,reportHeaders={},options={}){
 const body=await readFile(join(process.cwd(),'scripts/fonts/DejaVuSans.ttf')),bold=await readFile(join(process.cwd(),'scripts/fonts/DejaVuSans-Bold.ttf'));
 const doc=new PDFDocument({size:'A4',layout:'landscape',margin:12,font:body,autoFirstPage:false,info:{Title:'Tauck IC54 Meal Choices',Author:'Wondercase'}}),chunks=[];
 const ready=new Promise((resolve,reject)=>{doc.on('data',b=>chunks.push(b));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});doc.registerFont('Body',body);doc.registerFont('Bold',bold);
 const includePhotos=options.includePhotos===true;const photos=new Map();for(const g of includePhotos?guests:[]){if(typeof g.photo!=='string'||!g.photo.startsWith('data:image/jpeg;base64,')||g.photo.length>2000000)continue;try{photos.set(g.id,await sharp(Buffer.from(g.photo.split(',')[1],'base64'),{limitInputPixels:16000000}).rotate().greyscale().resize(72,72,{fit:'inside',withoutEnlargement:true}).jpeg({quality:75}).toBuffer());}catch{}}
 const left=18,width=805.89,widths=includePhotos?[27,145,330,263.89,40]:[27,145,350,283.89],xs=widths.map((_,i)=>left+widths.slice(0,i).reduce((a,b)=>a+b,0)),green='#000000',red='#000000',gold='#000000';
 function text(value,x,y,w,size=8,font='Body',color=green){doc.font(font).fontSize(size);const measured=doc.widthOfString(String(value));if(measured>w&&measured)doc.fontSize(size*w/measured);doc.fillColor(color).text(String(value),x,y,{lineBreak:false});}
 function wrap(value,w,font='Body'){
  doc.font(font).fontSize(8);const result=[];for(const paragraph of String(value).split('\n')){let line='';for(const word of paragraph.split(/\s+/).filter(Boolean)){if(line&&doc.widthOfString(line+' '+word)>w){result.push(line);line='';}for(const char of word){if(line&&doc.widthOfString(line+char)>w){result.push(line);line='';}line+=char;}line+=' ';}result.push(line.trim());}return result;
 }
 const menus=[...new Set([...report.rows.map(r=>r.meal),...report.totals.map(t=>t.meal)])];if(!menus.length)menus.push('Meal choices');
 for(const [page,menu]of menus.entries()){
  doc.addPage();text(reportHeaders[menu]||`Tauck IC54 Meal Choices · ${menu}`,left,14,width,10,'Bold');

  const headerY=32,headerHeight=16,bodyY=headerY+headerHeight,available=565-bodyY;
  doc.rect(left,headerY,width,headerHeight).fill('#FFFFFF');['Guest #','Guest Full Name','Meal Choices','Allergies / Restrictions',...(includePhotos?['Photo']:[])].forEach((h,i)=>text(h,xs[i]+3,headerY+4,widths[i]-6,7,'Bold'));
  const prepared=guests.map(g=>{const rows=report.rows.filter(r=>r.meal===menu&&r.travelerId===g.id),dietary=rows[0]?.dietary||'None provided';const cells=[[String(g.number)],wrap(rows[0]?.traveler||g.name,widths[1]-6,'Bold'),rows.length?rows.map(r=>`${r.course}: ${r.choice}`):['No choice selected'],wrap(dietary,widths[3]-6)];return {guest:g,dietary,cells,height:Math.max(includePhotos?20:12,Math.max(...cells.map(c=>c.length))*8.6+2)};});
  const total=prepared.reduce((sum,r)=>sum+r.height,0),scale=Math.min(1,available/Math.max(total,1));let y=bodyY;
  for(const [index,row]of prepared.entries()){
   const height=row.height*scale;doc.rect(left,y,width,height).fill('#FFFFFF');doc.lineWidth(.3).strokeColor('#000000').rect(left,y,width,height).stroke();xs.slice(1).forEach(x=>doc.moveTo(x,y).lineTo(x,y+height).stroke());
   row.cells.forEach((cell,i)=>cell.forEach((line,n)=>text(line,xs[i]+3,y+(1+n*8.6)*scale,widths[i]-6,8*scale,i===1?'Bold':'Body',i===3&&row.dietary!=='None provided'?red:green)));
   if(includePhotos){const size=Math.min(24,Math.max(1,height-4)),px=xs[4]+(widths[4]-size)/2,py=y+(height-size)/2,image=photos.get(row.guest.id);
   if(image)doc.image(image,px,py,{fit:[size,size],align:'center',valign:'center'});else{doc.save();doc.roundedRect(px,py,size,size,size*.15).fill('#FFFFFF');doc.lineWidth(Math.max(.3,size*.025)).strokeColor(green).roundedRect(px+size*.12,py+size*.2,size*.76,size*.58,size*.08).stroke();doc.circle(px+size*.32,py+size*.38,size*.06).fill(gold);doc.strokeColor(green).moveTo(px+size*.17,py+size*.7).lineTo(px+size*.43,py+size*.45).lineTo(px+size*.62,py+size*.62).lineTo(px+size*.76,py+size*.48).stroke();doc.restore();}
   }
   y+=height;
  }
  if(!guests.length)text('No guests in the current guest list.',left+3,bodyY+8,width-6,9);
  text('TD restaurant report · Guest numbers follow the current guest list · Contains traveler information',left,575,width-50,6);text(String(page+1),left+width-35,575,35,6);
 }
 doc.end();return ready;
}
