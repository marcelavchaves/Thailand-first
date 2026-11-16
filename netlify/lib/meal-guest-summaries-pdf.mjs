import PDFDocument from 'pdfkit';
import {join} from 'node:path';
/** @param {Array<{number:number|string,name:string,dietary:string,meals:Array<{title:string,submitted:string,courses:Array<{title:string,choice:string}>}>}>} guests */
export async function renderGuestSummariesPdf(guests){
 const doc=new PDFDocument({size:'A4',layout:'landscape',margins:{top:40,left:44,right:44,bottom:20},autoFirstPage:false,bufferPages:true,info:{Title:'Wondercase — Guest Meal Summaries',Author:'Wondercase'}}),chunks=[];
 const ready=new Promise((resolve,reject)=>{doc.on('data',b=>chunks.push(b));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
 doc.registerFont('Body',join(process.cwd(),'scripts/fonts/DejaVuSans.ttf'));doc.registerFont('Bold',join(process.cwd(),'scripts/fonts/DejaVuSans-Bold.ttf'));
 const green='#526F60',width=754,bottom=542;let y=40,guest=null;
 function page(continued=false){doc.addPage();doc.rect(0,0,842,595).fill('#FCFAF4');doc.rect(0,0,842,8).fill('#BBA368');y=35;doc.font('Bold').fontSize(15).fillColor(green).text('WONDERCASE · Guest Meal Summaries',44,y,{width});y+=27;if(guest){doc.font('Bold').fontSize(13).text(String(guest.number).padStart(3,'0')+' · '+guest.name+(continued?' (continued)':''),44,y,{width});y+=28;}}
 function line(value,size=9,bold=false,color=green){
  doc.font(bold?'Bold':'Body').fontSize(size);const lines=String(value).split('\n');
  for(const paragraph of lines){let current='';const wrapped=[];for(const word of paragraph.split(/\s+/)){const next=current?current+' '+word:word;if(current&&doc.widthOfString(next)>width){wrapped.push(current);current=word;}else current=next;}wrapped.push(current);for(const text of wrapped){if(y+size*1.4>bottom)page(true);doc.font(bold?'Bold':'Body').fontSize(size).fillColor(color).text(text,44,y,{width,lineBreak:false});y+=size*1.4;}y+=3;}
 }
 if(!guests.length){page();line('No guests are currently listed.');}
 for(const g of guests){guest=g;page();line('Dietary Restrictions Or Allergies',10,true);line(g.dietary||'None provided',9,false,g.dietary?'#A43832':green);y+=6;for(const meal of g.meals){if(y+70>bottom)page(true);line(meal.title,11,true);line(meal.submitted,8);for(const c of meal.courses)line(c.title+': '+c.choice);y+=6;}}
 const count=doc.bufferedPageRange().count;for(let i=0;i<count;i++){doc.switchToPage(i);doc.font('Body').fontSize(8).fillColor(green).text('Guest Meal Summaries · Saved choices at download time',44,560,{width:600});doc.text(`${i+1} / ${count}`,735,560,{width:60,align:'right'});}
 doc.end();return ready;
}
