import PDFDocument from 'pdfkit';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {roomGroups,guestDisplayName,manifestHotels} from '../../lib/hotel-manifest';
export async function hotelManifestPdf(data,hotel,roster){
 const doc=new PDFDocument({size:'A4',margin:42,bufferPages:true,autoFirstPage:false,info:{Title:'Hotel guest manifest',Author:'Wondercase'}});const chunks=[];const done=new Promise((r,j)=>{doc.on('data',c=>chunks.push(c));doc.on('end',r);doc.on('error',j);});
 doc.registerFont('Body',await readFile(join(process.cwd(),'scripts/fonts/DejaVuSans.ttf')));doc.registerFont('Bold',await readFile(join(process.cwd(),'scripts/fonts/DejaVuSans-Bold.ttf')));
 const sheet=data.hotels[hotel],name=manifestHotels.find(h=>h.id===hotel).name;let y=42;const width=511;
 function page(){doc.addPage();y=42;doc.font('Bold').fontSize(12).fillColor('#4f6b5d').text('WONDERCASE · HOTEL GUEST MANIFEST',42,y);y+=24;doc.font('Bold').fontSize(10).fillColor('#222').text(name,42,y);y+=22;}
 function line(text,{bold=false,red=false,size=10,indent=0}={}){if(!text)return;doc.font(bold?'Bold':'Body').fontSize(size);const h=doc.heightOfString(text,{width:width-indent,lineGap:3});if(y+h>770)page();doc.fillColor(red?'#b42318':'#222').text(text,42+indent,y,{width:width-indent,lineGap:3});y+=h+7;}
 page();line(data.tourName,{bold:true,size:13});line(`Tour number: ${data.tourNumber||'Not specified'} · Tour dates: ${data.start} to ${data.end}`);line(`Tour director: ${data.director}`);line(`Hotel arrival: ${sheet.arrival} · Departure: ${sheet.departure}`);
 if(data.nonSmoking)line('Non-smoking rooms requested for all guests unless otherwise noted.');line(sheet.notes);line(sheet.important?`IMPORTANT: ${sheet.important}`:'',{red:true,bold:true});
 if(data.staffRoom)line(`TD · ${data.director} · Single room (staff)`,{bold:true});
 const groups=roomGroups(data,hotel,roster);
 for(const group of groups){
  if(y>660)page();doc.moveTo(42,y).lineTo(553,y).strokeColor('#aeb9b0').stroke();y+=10;
  const bed=group.guests.map(g=>sheet.entries[g.id].bed).find(Boolean)||'Bed preference not specified';line(`Room group ${group.key} · ${group.type} · ${bed}`,{bold:true});
  for(const g of group.guests){const details=data.guests[g.id],entry=sheet.entries[g.id];line(`${details.number}  ${guestDisplayName({...g,preferredName:details.preferredName})}`,{bold:true});if(details.travelGroup){const companions=roster.filter(o=>o.id!==g.id&&data.guests[o.id].travelGroup===details.travelGroup).map(o=>`${data.guests[o.id].number} ${guestDisplayName({...o,preferredName:data.guests[o.id].preferredName})}`);line(`Traveling together: ${details.travelGroup}${companions.length?' · '+companions.join('; '):''}`,{size:9,indent:12});}line(details.notes,{indent:12});line(details.important?`IMPORTANT: ${details.important}`:'',{red:true,indent:12,bold:true});line(entry.notes,{indent:12});line(entry.important?`IMPORTANT: ${entry.important}`:'',{red:true,indent:12,bold:true});}
 }
 const counts=[1,2,3,4].map(n=>groups.filter(g=>g.guests.length===n).length);line(`Summary: ${counts[0]} Singles, ${counts[1]} Doubles, ${counts[2]} Triples, ${counts[3]} Quads = ${roster.length} guests${data.staffRoom?' plus 1 staff single room':''}.`,{bold:true});
 const pages=doc.bufferedPageRange().count;for(let i=0;i<pages;i++){doc.switchToPage(i);doc.font('Body').fontSize(8).fillColor('#555').text(`Prepared ${new Date().toISOString().slice(0,10)} · Page ${i+1} of ${pages}`,42,795,{width,align:'right'});}
 doc.end();await done;return Buffer.concat(chunks);
}
