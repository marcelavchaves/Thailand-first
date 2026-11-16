import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import {join} from 'node:path';
/** @param {Array<{name:string,dietary:string,photo?:string|null}>} guests */
export async function renderDietaryPortraitPdf(guests){
 const doc=new PDFDocument({size:'A4',margin:20,autoFirstPage:false,bufferPages:true,info:{Title:'Guest Allergies & Dietary Restrictions',Author:'Wondercase'}}),chunks=[];const ready=new Promise((resolve,reject)=>{doc.on('data',b=>chunks.push(b));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
 doc.registerFont('Body',join(process.cwd(),'scripts/fonts/DejaVuSans.ttf'));doc.registerFont('Bold',join(process.cwd(),'scripts/fonts/DejaVuSans-Bold.ttf'));
 const left=28,widths=[56,160,323.28],xs=[28,84,244],width=539.28,bottom=795;let y=0;
 const text=(v,x,top,w,size=9,bold=false)=>{doc.font(bold?'Bold':'Body').fontSize(size);const measured=doc.widthOfString(v);if(measured>w)doc.fontSize(size*w/measured);doc.fillColor('black').text(v,x,top,{lineBreak:false});};
 function lines(value,w){doc.font('Body').fontSize(9);const result=[];for(const p of String(value).split('\n')){let line='';for(const c of p){if(line&&doc.widthOfString(line+c)>w){const cut=line.lastIndexOf(' ');if(cut>0){result.push(line.slice(0,cut));line=line.slice(cut+1);}else{result.push(line);line='';}}line+=c;}result.push(line.trim());}return result;}
 function page(){doc.addPage();text('Guest Allergies & Dietary Restrictions',left,24,width,14,true);y=52;doc.lineWidth(.6).strokeColor('black').rect(left,y,width,20).stroke();['Photo','Guest Name','Allergy / Dietary Restriction'].forEach((v,i)=>text(v,xs[i]+5,y+5,widths[i]-10,9,true));y+=20;}
 page();if(!guests.length)text('No guests have recorded allergies or dietary restrictions.',left,92,width,10);
 for(const g of guests){let photo=null;if(g.photo?.startsWith('data:image/jpeg;base64,')&&g.photo.length<2000000){try{photo=await sharp(Buffer.from(g.photo.split(',')[1],'base64'),{limitInputPixels:16000000}).rotate().greyscale().resize(100,100,{fit:'inside'}).jpeg({quality:80}).toBuffer();}catch{}}
  const cells=[lines(g.name,widths[1]-10),lines(g.dietary,widths[2]-10)],total=Math.max(...cells.map(c=>c.length));let offset=0;
  while(offset<total){if(bottom-y<52)page();const count=Math.min(total-offset,Math.max(1,Math.floor((bottom-y-10)/12))),height=Math.max(52,count*12+10);doc.lineWidth(.4).strokeColor('black').rect(left,y,width,height).stroke();xs.slice(1).forEach(x=>doc.moveTo(x,y).lineTo(x,y+height).stroke());
   cells.forEach((cell,i)=>{const fragment=i===0&&offset?[g.name+' (continued)']:cell.slice(offset,offset+count);fragment.forEach((line,n)=>text(line,xs[i+1]+5,y+5+n*12,widths[i+1]-10,9,i===0));});
   if(photo)doc.image(photo,left+8,y+6,{fit:[40,40],align:'center',valign:'center'});else{doc.save();doc.strokeColor('black').lineWidth(1).roundedRect(left+9,y+11,38,29,3).stroke();doc.circle(left+19,y+20,3).stroke();doc.moveTo(left+12,y+36).lineTo(left+25,y+25).lineTo(left+32,y+32).lineTo(left+43,y+23).stroke();doc.restore();}
   y+=height;offset+=count;
  }
 }
 const count=doc.bufferedPageRange().count;for(let i=0;i<count;i++){doc.switchToPage(i);text('TD report · Contains traveler dietary information',left,810,width-60,7);text(`${i+1} / ${count}`,left+width-50,810,50,7);}
 doc.end();return ready;
}
