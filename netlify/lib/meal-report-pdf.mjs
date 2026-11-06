import PDFDocument from 'pdfkit';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

export async function renderMealPdf(report,meal){
 const root=process.cwd(),bodyFont=await readFile(join(root,'scripts/fonts/DejaVuSans.ttf')),boldFont=await readFile(join(root,'scripts/fonts/DejaVuSans-Bold.ttf'));
 const doc=new PDFDocument({size:'A4',margin:44,font:bodyFont,info:{Title:'Wondercase · Meal choices',Author:'Wondercase'}}),chunks=[];
 const ready=new Promise((resolve,reject)=>{doc.on('data',(b)=>chunks.push(b));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
 doc.registerFont('Body',bodyFont);doc.registerFont('Bold',boldFont);
 const line=(text,size=10,bold=false)=>{doc.font(bold?'Bold':'Body').fontSize(size).fillColor('#315c4f').text(text,{lineGap:3});doc.moveDown(.35);};
 line('WONDERCASE · Meal choices',20,true);line(meal==='all'?'All five menus':'Restaurant report',12);line('Each meal closes at its own deadline. Times below are Hanoi time.',9);line('Dish totals count submitted choices only. Drafts and missing submissions are labeled below.',9);
 for(const menu of [...new Set(report.rows.map(r=>r.meal))]){
  doc.addPage();line(menu,18,true);line(report.rows.find(r=>r.meal===menu)?.restaurant||'',11);line('Deadline: '+new Date(report.rows.find(r=>r.meal===menu).deadline).toLocaleString('en-US',{timeZone:'Asia/Ho_Chi_Minh'})+' · Hanoi time',9);
  line('Submitted dish totals',13,true);
  for(const t of report.totals.filter(t=>t.meal===menu))line(`${t.course} · ${t.choice}: ${t.count}`);
  doc.moveDown();line('Traveler choices & dietary notes',13,true);
  const rows=report.rows.filter(r=>r.meal===menu);
  for(const id of [...new Set(rows.map(r=>r.travelerId))]){
   if(doc.y>650)doc.addPage();const person=rows.filter(r=>r.travelerId===id);line(`${person[0].traveler} · ${person[0].status}`,11,true);
   for(const r of person)line(`${r.course}: ${r.choice}`);
   line(`Dietary restrictions or allergies: ${person[0].dietary||'None provided'}`,9);doc.moveDown(.45);
  }
 }
 doc.end();return ready;
}
