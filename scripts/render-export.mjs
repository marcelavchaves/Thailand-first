import PDFDocument from 'pdfkit';
import path from 'node:path';
/** @param {any} content @param {{root:string,baseUrl:string,section:string,days?:number[]}} options */
export async function renderExport(content,{root,baseUrl,section,days=[]}) {
 const doc=new PDFDocument({size:'A4',margins:{top:48,left:48,right:48,bottom:20},bufferPages:true,autoFirstPage:false});
 const chunks=[];const done=new Promise((resolve,reject)=>{doc.on('data',c=>chunks.push(c));doc.on('end',resolve);doc.on('error',reject);});
 doc.registerFont('Body',path.join(root,'scripts/fonts/DejaVuSans.ttf'));doc.registerFont('Bold',path.join(root,'scripts/fonts/DejaVuSans-Bold.ttf'));
 const green='#163E33',gold='#96712E';let y=70;const width=499;
 const abs=u=>new URL(u,baseUrl).href;
 function page(){doc.addPage();doc.rect(0,0,595,842).fill('#FCFAF4');doc.rect(0,0,595,10).fill('#D6B66D');doc.font('Bold').fontSize(9).fillColor(green).text('KINGDOMS & DRAGONS · 102ND TOUR',48,30);y=70;}
 function text(value,{size=11,bold=false,link}={}){if(!value)return;doc.font(bold?'Bold':'Body').fontSize(size);const h=doc.heightOfString(String(value),{width,lineGap:3});if(y+h>755)page();doc.font(bold?'Bold':'Body').fontSize(size).fillColor(link?gold:green).text(String(value),48,y,{width,lineGap:3,link,underline:!!link});y+=h+10;}
 function measure(value,size=11,bold=false){doc.font(bold?'Bold':'Body').fontSize(size);return doc.heightOfString(String(value||''),{width,lineGap:3})+10;}
 function keep(height){if(y+height>755)page();}
 function title(value){keep(measure(value,20,true)+100);if(y>70)y+=12;text(value,{size:20,bold:true});}
 function blocks(items=[],skipTitle=''){
  const list=items.filter(b=>!(b.kind==='heading'&&(b.text===skipTitle||b.text==='Local Language Lesson')));
  for(let i=0;i<list.length;i++){
   const b=list[i];const heading=b.kind==='heading';
   // Keep heading chains and their first paragraph together, using actual heights.
   if(heading||/^OPTIONAL TOUR/.test(b.text)){
    let h=measure(b.text,heading?15:11,heading),j=i+1;
    for(;j<list.length;j++){const n=list[j];h+=measure(n.text,n.kind==='heading'?15:11,n.kind==='heading');if(n.kind!=='heading')break;}
    keep(Math.min(h+12,685));if(heading&&y>70)y+=10;
   }
   text(b.text,{size:heading?15:11,bold:heading,link:b.href});
  }
 }
 function hotel(h){title(h.name);text(h.city,{bold:true});text(`Check in: ${content.data.shortTripDate(h.checkin)} · Check out: ${content.data.shortTripDate(h.checkout)}`);text(h.address);text(h.phone,{link:'tel:'+h.phone.replace(/\s/g,'')});text('Hotel website',{link:h.website});for(const r of content.data.hotelResources||[])if(r.hotel===h.name){keep(measure(r.category+' · '+r.title,11,true)+measure(r.note)+40);text(r.category+' · '+r.title,{bold:true});text(r.note);text('Open menu',{link:abs('/hotel-menus?menu='+r.id)});}}
 page();const label=section==='days'?'Selected journey days':section==='hotels'?'Hotels & flights':'Guides & resources';title(label);text('Generated '+new Date().toISOString().slice(0,10)+'. Saved schedules are current at download time. Live announcements, memories and album photos remain in the app.',{size:9});
 if(section==='days')for(const number of days){const d=content.data.days.find(d=>content.data.tauck(d.date)===number);page();title(`Day ${number} · ${d.title}`);text(content.data.longTripDate(d.date),{bold:true});text(d.region);text(d.intro);if(number===1)blocks(content.sections.find(s=>s.title==='Chervil’s Welcome Letter')?.blocks);title('Today’s journey');for(const [time,event] of d.events){keep(measure(time,11,true)+measure(event));text(time,{bold:true});text(event);}text(d.note);if(d.updatedAt)text('Schedule updated by Chervil: '+d.updatedAt,{size:9});
 for(const g of content.data.localGuides||[])if(g.days.includes(d.date)){title('Meet your local guide');text(g.name+' · '+g.destination,{bold:true});text(g.introduction);}
 blocks(content.optionalTours?.find(t=>t.date===d.date)?.blocks);
 for(const f of content.data.internalFlights.filter(f=>f.date===d.date)){title('Today’s internal flight');for(const k of ['route','airline','time','duration','detail'])text(f[k],{bold:k==='route'});}
 title('Tonight’s stay');text(d.hotel,{bold:true});const hi=content.data.hotels.findIndex(h=>h.name===d.hotel);if(hi>=0)text('Open hotel details',{link:abs('/?tab=hotels&hotel=hotel-'+hi)});text('Meals: '+d.meals);
 for(const story of content.data.storytelling||[])if(story.days.includes(d.date)){keep(measure(story.title,11,true)+measure(story.description)+40);text(story.title,{bold:true});text(story.description);text('Read the illustrated story',{link:abs('/storytelling?story='+story.id+'&day='+number)});}
 title('A little language lesson');blocks(content.languageLessons.find(l=>l.date===d.date)?.blocks);
 const quiz=content.trivia.find(t=>t.date===d.date);if(quiz){title('How about some trivia?');for(const [i,q] of quiz.questions.entries()){keep(measure(`${i+1}. ${q.question}`,11,true)+q.options.reduce((n,o)=>n+measure(o),0)+measure(`Answer: ${q.options[q.answer]}. ${q.fact}`,9));text(`${i+1}. ${q.question}`,{bold:true});q.options.forEach((o,j)=>text(`${String.fromCharCode(65+j)}. ${o}`));text(`Answer: ${q.options[q.answer]}. ${q.fact}`,{size:9});}}
 text('Open this journey day',{link:abs('/?tab=journey&day='+number)});
 }
 if(section==='hotels'){for(const h of content.data.hotels){page();hotel(h);}page();title('Internal flights');for(const f of content.data.internalFlights){if(y>600)page();text(`${content.data.shortTripDate(f.date)} · Day ${content.data.tauck(f.date)}`,{bold:true});for(const k of ['route','airline','time','duration','detail'])text(f[k],{bold:k==='route'});}}
 if(section==='guides'){for(const s of content.sections.filter(s=>/Guide|Recommendations|Food|Dining|Useful Contacts/i.test(s.title))){page();title(s.title);blocks(s.blocks,s.title);}page();title('Destination resources');const more=content.sections.find(s=>s.id==='tab-more');const bs=more?.blocks||[];const start=bs.findIndex(b=>b.text.startsWith('If you want to learn more'));const end=bs.findIndex(b=>b.text.startsWith('If you enjoyed this journey'));blocks(bs.slice(start,end>start?end:undefined));page();title('Illustrated stories');for(const story of content.data.storytelling||[]){keep(measure(story.title,11,true)+measure(story.description)+40);text(story.title,{bold:true});text(story.description);text('Read story',{link:abs('/storytelling?story='+story.id)});}}
 const count=doc.bufferedPageRange().count;for(let i=0;i<count;i++){doc.switchToPage(i);doc.roundedRect(48,788,130,27,6).fill(green);doc.font('Bold').fontSize(9).fillColor('#FFFFFF').text('BACK TO APP',55,796,{width:116,align:'center',link:baseUrl});doc.link(48,788,130,27,baseUrl);doc.fillColor(gold).text('EXPORT A SECTION',200,796,{width:180,align:'center',link:abs('/export-pdf')});doc.font('Body').fontSize(9).text(`${i+1} / ${count}`,445,796,{width:100,align:'right'});}
 doc.end();await done;return Buffer.concat(chunks);
}
