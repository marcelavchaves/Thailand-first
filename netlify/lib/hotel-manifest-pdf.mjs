import PDFDocument from 'pdfkit';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {hotelManifestReport} from '../../lib/hotel-manifest-report';
export async function hotelManifestPdf(data,hotel,roster){
 const body=await readFile(join(process.cwd(),'scripts/fonts/DejaVuSans.ttf')),bold=await readFile(join(process.cwd(),'scripts/fonts/DejaVuSans-Bold.ttf'));
 const doc=new PDFDocument({size:'A4',layout:'landscape',margin:32,font:body,bufferPages:true,info:{Title:'Hotel guest manifest',Author:'Wondercase'}}),chunks=[];
 const done=new Promise((resolve,reject)=>{doc.on('data',c=>chunks.push(c));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});doc.registerFont('Body',body);doc.registerFont('Bold',bold);
 const report=hotelManifestReport(data,hotel,roster),left=32,width=doc.page.width-64,bottom=doc.page.height-38;
 const widths=[48,210,95,95,width-448],xs=widths.map((_,i)=>left+widths.slice(0,i).reduce((a,b)=>a+b,0)),green='#4F6B5D',red='#B42318';let y=0,page=0;
 function text(value,x,top,w,size=9,font='Body',color='#222'){
  doc.font(font).fontSize(size);const measured=doc.widthOfString(String(value));if(measured>w)doc.fontSize(size*w/measured);doc.fillColor(color).text(String(value),x,top,{lineBreak:false});
 }
 function wrap(value,w,font='Body'){
  doc.font(font).fontSize(9);const lines=[];
  for(const paragraph of String(value).split('\n')){let line='';for(const word of paragraph.split(/\s+/).filter(Boolean)){
   if(line&&doc.widthOfString(line+' '+word)>w){lines.push(line);line='';}
   if(doc.widthOfString(word)<=w){line+=(line?' ':'')+word;continue;}
   for(const char of word){if(line&&doc.widthOfString(line+char)>w){lines.push(line);line='';}line+=char;}
  }lines.push(line.trim());}return lines;
 }
 function header(){
  if(page)doc.addPage();page++;
  text(report.title,left,26,width,17,'Bold',green);text(report.hotel,left,51,width,13,'Bold');
  y=72;for(const line of report.meta){text(line,left,y,width,9);y+=17;}y+=2;
  doc.rect(left,y,width,26).fill('#EEF1E9');report.columns.forEach((h,i)=>text(h,xs[i]+6,y+8,widths[i]-12,8,'Bold',green));y+=26;
 }
 function row(cells,{notesRed=true,boldName=true}={}){
  const lines=cells.map((v,i)=>wrap(v,widths[i]-12,i===1&&boldName?'Bold':'Body')),total=Math.max(1,...lines.map(l=>l.length));let offset=0;
  while(offset<total){
   if(bottom-y<39)header();
   const count=Math.min(total-offset,Math.max(1,Math.floor((bottom-y-14)/12))),height=Math.max(38,count*12+14);
   doc.rect(left,y,width,height).fill('#FCFBF7');doc.lineWidth(.4).strokeColor('#D9D5C8').rect(left,y,width,height).stroke();xs.slice(1).forEach(x=>doc.moveTo(x,y).lineTo(x,y+height).stroke());
   lines.forEach((cell,i)=>{let fragment=cell.slice(offset,offset+count);if(offset&&i===0)fragment=[String(cells[0])];if(offset&&i===1)fragment=['Continued'];fragment.forEach((line,n)=>text(line,xs[i]+6,y+7+n*12,widths[i]-12,9,i===1&&boldName?'Bold':'Body',i===4&&notesRed?red:'#222'));});
   y+=height;offset+=count;if(offset<total)header();
  }
 }
 header();
 for(const cells of report.rows)row(cells);
 if(y+30>bottom)header();text(report.summary,left,y+13,width,9,'Bold',green);
 const pages=doc.bufferedPageRange().count;for(let i=0;i<pages;i++){doc.switchToPage(i);text(`Prepared ${new Date().toISOString().slice(0,10)} · Page ${i+1} of ${pages}`,left,doc.page.height-23,width,7,'Body','#555');}
 doc.end();await done;return Buffer.concat(chunks);
}
