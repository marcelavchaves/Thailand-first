import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

/** Landscape restaurant handoff: one guest row with individual courses on separate lines. */
export async function renderMealGuestTablePdf(report, guests){
 const body=await readFile(join(process.cwd(),'scripts/fonts/DejaVuSans.ttf'));
 const bold=await readFile(join(process.cwd(),'scripts/fonts/DejaVuSans-Bold.ttf'));
 const doc=new PDFDocument({size:'A4',layout:'landscape',margin:32,font:body,info:{Title:'Wondercase · Guest meal choices',Author:'Wondercase'}}),chunks=[];
 const ready=new Promise((resolve,reject)=>{doc.on('data',b=>chunks.push(b));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
 doc.registerFont('Body',body);doc.registerFont('Bold',bold);
 const photos=new Map();
 for(const guest of guests){
  if(typeof guest.photo!=='string'||!guest.photo.startsWith('data:image/jpeg;base64,')||guest.photo.length>2000000)continue;
  try{photos.set(guest.id,await sharp(Buffer.from(guest.photo.split(',')[1],'base64'),{limitInputPixels:16000000}).rotate().resize(112,112,{fit:'inside',withoutEnlargement:true}).jpeg({quality:75}).toBuffer());}catch{/* A missing or damaged photo must not prevent the restaurant report. */}
 }
 const left=32,width=doc.page.width-64,bottom=doc.page.height-36;
 const widths=[48,160,280,212,width-700],headers=['Guest #','Guest full name','Meal choices','Allergies / restrictions','Photo'];
 const xs=widths.map((_,i)=>left+widths.slice(0,i).reduce((a,b)=>a+b,0));
 const green='#4F6B5D',gold='#C9A962',red='#9C3333';let page=0,y=0;
 function text(value,x,top,w,size=9,font='Body',color=green){doc.font(font).fontSize(size);const measured=doc.widthOfString(String(value));if(measured>w)doc.fontSize(size*w/measured);doc.fillColor(color).text(String(value),x,top,{lineBreak:false});}
 function lines(value,w,font='Body'){
  doc.font(font).fontSize(9);const result=[];
  for(const paragraph of String(value).split('\n')){
   let line='';
   for(const word of paragraph.split(/\s+/).filter(Boolean)){
    if(line&&doc.widthOfString(line+' '+word)>w){result.push(line);line='';}
    if(doc.widthOfString(word)<=w){line+=(line?' ':'')+word;continue;}
    for(const char of word){if(line&&doc.widthOfString(line+char)>w){result.push(line);line='';}line+=char;}
   }
   result.push(line.trim());
  }
  return result;
 }
 function startPage(menu,first){
  if(page)doc.addPage();page++;
  text('WONDERCASE · Guest meal choices',left,27,width,18,'Bold');
  text(menu,left,54,width,13,'Bold');
  const row=report.rows.find(r=>r.meal===menu);
  if(row)text(row.restaurant+' · Deadline: '+new Date(row.deadline).toLocaleString('en-US',{timeZone:'Asia/Ho_Chi_Minh'})+' (Hanoi time)',left,75,width,9);
  text('Guest numbers follow the current guest list. Draft and missing choices are labeled.'+(first?'':' · Continued'),left,92,width,8);
  y=111;doc.rect(left,y,width,27).fill('#EEF1E9');
  headers.forEach((h,i)=>text(h,xs[i]+6,y+8,widths[i]-12,8,'Bold'));y+=27;
  text('TD restaurant report · Contains traveler information',left,doc.page.height-23,width-60,7);
  text(String(page),doc.page.width-60,doc.page.height-23,28,7);
 }
 const menus=[...new Set([...report.rows.map(r=>r.meal),...report.totals.map(t=>t.meal)])];
 for(const menu of menus){
  startPage(menu,true);
  if(!guests.length)text('No guests in the current guest list.',left+6,y+14,width-12,10);
  for(const guest of guests){
   const rows=report.rows.filter(r=>r.meal===menu&&r.travelerId===guest.id);
   const dietary=rows[0]?.dietary||'None provided';
   const status=rows[0]?.status||'not started';
   const cells=[String(guest.number),rows[0]?.traveler||guest.name,rows.map(r=>`${r.course}: ${r.choice}`).join('\n')+`\nStatus: ${status}`,dietary];
   const wrapped=cells.map((v,i)=>lines(v,widths[i]-12,i===1?'Bold':'Body'));let offset=0;
   const total=Math.max(...wrapped.map(l=>l.length),1);
   while(offset<total){
    if(bottom-y<68)startPage(menu,false);
    const capacity=Math.max(1,Math.floor((bottom-y-14)/12));
    const count=Math.min(total-offset,capacity),height=Math.max(66,count*12+14);
    doc.rect(left,y,width,height).fill(offset%2?'#FFFFFF':'#FBFAF5');
    doc.lineWidth(.4).strokeColor('#DDD9CA').rect(left,y,width,height).stroke();
    xs.slice(1).forEach(x=>doc.moveTo(x,y).lineTo(x,y+height).stroke());
    wrapped.forEach((cell,i)=>{
     let fragment=cell.slice(offset,offset+count);
     if(offset&&i===0)fragment=[String(guest.number)];
     if(offset&&i===1)fragment=['Guest '+guest.number+' (continued)'];
     fragment.forEach((line,n)=>text(line,xs[i]+6,y+7+n*12,widths[i]-12,9,i===1?'Bold':'Body',i===3&&dietary!=='None provided'?red:green));
    });
    const image=photos.get(guest.id),photoX=xs[4]+(widths[4]-50)/2;
    if(image)doc.image(image,photoX,y+7,{fit:[50,50],align:'center',valign:'center'});
    else {
     // Friendly vector photo placeholder: a framed landscape, sun and sparkle.
     const px=photoX,py=y+7;doc.save();doc.roundedRect(px,py,50,50,9).fill('#EEF1E9');
     doc.lineWidth(1.3).strokeColor(green).roundedRect(px+8,py+12,34,27,4).stroke();
     doc.circle(px+18,py+21,3).fill(gold);doc.strokeColor(green).lineJoin('round').moveTo(px+10,py+35).lineTo(px+21,py+26).lineTo(px+28,py+32).lineTo(px+33,py+28).lineTo(px+40,py+35).stroke();
     doc.strokeColor(gold).lineWidth(1.5).moveTo(px+39,py+5).lineTo(px+39,py+11).moveTo(px+36,py+8).lineTo(px+42,py+8).stroke();doc.restore();
    }
    y+=height;offset+=count;
    if(offset<total)startPage(menu,false);
   }
  }
 }
 if(!menus.length){startPage('Meal choices',true);text('No meal choices available.',left+6,y+14,width-12,10);}
 doc.end();return ready;
}
