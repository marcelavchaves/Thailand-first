import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import {join} from 'node:path';
/** Portrait dietary report: color portrait and name together, compact notes column. */
export async function renderDietaryPortraitPdf(guests){
 const doc=new PDFDocument({size:'A4',margin:20,autoFirstPage:false,bufferPages:true,info:{Title:'Guest Allergies & Dietary Restrictions',Author:'Wondercase'}}),chunks=[];const ready=new Promise((resolve,reject)=>{doc.on('data',b=>chunks.push(b));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
 doc.registerFont('Body',join(process.cwd(),'scripts/fonts/DejaVuSans.ttf'));doc.registerFont('Bold',join(process.cwd(),'scripts/fonts/DejaVuSans-Bold.ttf'));
 doc.font('Body').fontSize(9);
 const notesWidth=Math.min(429.28,Math.max(20,...guests.flatMap(g=>String(g.dietary||'').split('\n').map(line=>doc.widthOfString(line.trim())))))+16;
 const widths=[110,Math.min(429.28,notesWidth)],width=widths[0]+widths[1],left=(595.28-width)/2,bottom=795;let y=0;
 const text=(v,x,top,w,size=9,bold=false,align='left')=>{doc.font(bold?'Bold':'Body').fontSize(size).fillColor('black').text(v,x,top,{width:w,lineBreak:false,align});};
 function lines(value,w,bold=false){doc.font(bold?'Bold':'Body').fontSize(9);const result=[];for(const p of String(value).trim().split('\n')){let line='';for(const c of p){if(line&&doc.widthOfString(line+c)>w){const cut=line.lastIndexOf(' ');if(cut>0){result.push(line.slice(0,cut));line=line.slice(cut+1);}else{result.push(line);line='';}}line+=c;}result.push(line.trim());}return result;}
 function page(){doc.addPage();text('Guest Allergies & Dietary Restrictions',28,24,539.28,13,true);y=52;const heading=lines('Dietary Notes',widths[1]-16,true),height=Math.max(22,heading.length*12+10);doc.lineWidth(.6).strokeColor('black').rect(left,y,width,height).stroke();text('Guest',left+6,y+6,98,9,true);heading.forEach((line,n)=>text(line,left+118,y+5+n*12,widths[1]-16,9,true));y+=height;}
 page();if(!guests.length)text('No guests have recorded allergies or dietary restrictions.',left,92,width,10);
 for(const g of guests){let photo=null;if(g.photo?.startsWith('data:image/jpeg;base64,')&&g.photo.length<2000000){try{photo=await sharp(Buffer.from(g.photo.split(',')[1],'base64'),{limitInputPixels:16000000}).rotate().resize(150,150,{fit:'inside'}).jpeg({quality:85}).toBuffer();}catch{}}
  const name=lines(g.name,94,true),notes=lines(g.dietary,widths[1]-16),portraitHeight=76+name.length*12;let offset=0;
  do{if(bottom-y<Math.max(100,portraitHeight))page();const count=Math.min(notes.length-offset,Math.max(1,Math.floor((bottom-y-16)/12))),height=Math.max(portraitHeight,count*12+16);doc.lineWidth(.4).strokeColor('black').rect(left,y,width,height).stroke();doc.moveTo(left+110,y).lineTo(left+110,y+height).stroke();
   if(photo)doc.image(photo,left+24,y+8,{fit:[62,62],align:'center',valign:'center'});else{doc.save();doc.lineWidth(1).roundedRect(left+34,y+22,42,30,3).stroke();doc.circle(left+45,y+31,3).stroke();doc.moveTo(left+38,y+48).lineTo(left+52,y+36).lineTo(left+61,y+43).lineTo(left+72,y+33).stroke();doc.restore();}
   name.forEach((line,n)=>text(line,left+8,y+76+n*12,94,9,true,'center'));
   notes.slice(offset,offset+count).forEach((line,n)=>text(line,left+118,y+8+n*12,widths[1]-16));y+=height;offset+=Math.max(1,count);
  }while(offset<notes.length);
 }
 const count=doc.bufferedPageRange().count;for(let i=0;i<count;i++){doc.switchToPage(i);text('TD report · Contains traveler dietary information',28,810,470,7);text(`${i+1} / ${count}`,520,810,47,7);}
 doc.end();return ready;
}
