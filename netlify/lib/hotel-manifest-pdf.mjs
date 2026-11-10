import PDFDocument from 'pdfkit';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {roomGroups,guestDisplayName,manifestHotels} from '../../lib/hotel-manifest';
export async function hotelManifestPdf(data,hotel,roster){
 const body=await readFile(join(process.cwd(),'scripts/fonts/DejaVuSans.ttf')),bold=await readFile(join(process.cwd(),'scripts/fonts/DejaVuSans-Bold.ttf'));
 const doc=new PDFDocument({size:'A4',layout:'landscape',margin:32,font:body,bufferPages:true,info:{Title:'Hotel guest manifest',Author:'Wondercase'}}),chunks=[];
 const done=new Promise((resolve,reject)=>{doc.on('data',c=>chunks.push(c));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});doc.registerFont('Body',body);doc.registerFont('Bold',bold);
 const sheet=data.hotels[hotel],name=manifestHotels.find(h=>h.id===hotel).name,groups=roomGroups(data,hotel,roster),left=32,width=doc.page.width-64,bottom=doc.page.height-38;
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
  text('WONDERCASE · HOTEL GUEST MANIFEST',left,26,width,17,'Bold',green);text(name,left,51,width,13,'Bold');
  text(`${data.tourName} · Tour number: ${data.tourNumber||'Not specified'} · Tour director: ${data.director}`,left,72,width,9);
  text(`Hotel arrival: ${sheet.arrival} · Departure: ${sheet.departure} · Tour dates: ${data.start} to ${data.end}`,left,88,width,9);
  y=108;if(data.nonSmoking){text('Non-smoking rooms requested for all guests unless otherwise noted.',left,y,width,8);y+=17;}
  doc.rect(left,y,width,26).fill('#EEF1E9');['Guest #','Full name (preferred name)','Room type','Bed type','Notes'].forEach((h,i)=>text(h,xs[i]+6,y+8,widths[i]-12,8,'Bold',green));y+=26;
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
 if(sheet.notes||sheet.important)row(['—','Hotel notes','','',[sheet.notes,sheet.important&&`IMPORTANT: ${sheet.important}`].filter(Boolean).join('\n')]);
 for(const group of groups)for(const guest of group.guests){
  const details=data.guests[guest.id],entry=sheet.entries[guest.id];
  const companions=details.travelGroup?groups.filter(other=>other.key!==group.key&&other.guests.some(g=>data.guests[g.id].travelGroup===details.travelGroup)):[];
  const travel=details.travelGroup?`Traveling together: ${details.travelGroup}${companions.length?' · Traveling with room group '+companions.map(other=>`${other.key} (${other.guests.filter(g=>data.guests[g.id].travelGroup===details.travelGroup).map(g=>`${data.guests[g.id].number} ${guestDisplayName({...g,preferredName:data.guests[g.id].preferredName||g.preferredName})}`).join('; ')})`).join('; '):''}`:'';
  const notes=[details.dietary&&`Dietary restrictions: ${details.dietary}`,details.notes,details.important&&`IMPORTANT: ${details.important}`,entry.notes,entry.important&&`IMPORTANT: ${entry.important}`,travel].filter(Boolean).join('\n')||'—';
  row([details.number,guestDisplayName({...guest,preferredName:details.preferredName||guest.preferredName}),`${group.type}\nRoom group ${group.key}`,entry.bed==='Two beds'?'Two Beds':entry.bed||'Not specified',notes]);
 }
 if(data.staffRoom)row(['—',`${data.director} · TD (staff)`,'Single','Not specified','Staff room']);
 const counts=[1,2,3,4].map(n=>groups.filter(g=>g.guests.length===n).length),summary=`Summary: ${counts[0]} Singles, ${counts[1]} Doubles, ${counts[2]} Triples, ${counts[3]} Quads = ${roster.length} guests${data.staffRoom?' plus 1 staff single room':''}.`;
 if(y+30>bottom)header();text(summary,left,y+13,width,9,'Bold',green);
 const pages=doc.bufferedPageRange().count;for(let i=0;i<pages;i++){doc.switchToPage(i);text(`Prepared ${new Date().toISOString().slice(0,10)} · Page ${i+1} of ${pages}`,left,doc.page.height-23,width,7,'Body','#555');}
 doc.end();await done;return Buffer.concat(chunks);
}
