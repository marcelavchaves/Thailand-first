import PDFDocument from 'pdfkit';
import path from 'node:path';
import {createHash} from 'node:crypto';
const clean=value=>value.replace(/\s+/g,' ').trim();
const digest=value=>createHash('sha256').update(value).digest('hex');
export async function renderItinerary(content,{root,baseUrl,testEdition=false}) {
const absolute=href=>new URL(href,baseUrl).href;
const { data, sourceHash } = content;
const dateRange = `${data.longTripDate(data.days[0].date)} – ${data.longTripDate(data.days.at(-1).date)}, ${data.tripDate(data.days[0].date).getUTCFullYear()}`;
const doc = new PDFDocument({ size: 'A4', margins: { top:48, left:48, right:48, bottom:20 }, bufferPages: true, autoFirstPage: false, info: { Title: 'Kingdoms & Dragons — 103rd Tour — Interactive Journey', Author: 'Kingdoms & Dragons Traveler Edition', Subject: `${dateRange} | App revision ${sourceHash.slice(0,12)}`, Keywords: 'Kingdoms Dragons 2026 103rd Tour itinerary' } });
const chunks=[]; const done=new Promise((resolve,reject)=>{doc.on('data',chunk=>chunks.push(chunk));doc.on('end',resolve);doc.on('error',reject);});
doc.registerFont('Body', path.join(root, 'scripts/fonts/DejaVuSans.ttf'));
doc.registerFont('Bold', path.join(root, 'scripts/fonts/DejaVuSans-Bold.ttf'));
doc.registerFont('Title', path.join(root, 'scripts/fonts/DejaVuSerif.ttf'));
const green = '#163E33', gold = '#96712E', ink = '#263D36';
const W = 499.28, BOTTOM = 765;
const requiredText = [], expectedLinks = new Set(), sections = [];
let y = 60;
function page() {
  doc.addPage({ size: 'A4', margins: { top: 48, left: 48, right: 48, bottom: 20 } }); y = 64;
  doc.rect(0,0,595.28,841.89).fill('#FCFAF4');
  doc.rect(0,0,12,841.89).fill('#287B79');
  doc.rect(12,0,583.28,12).fill('#D6B66D');
  doc.roundedRect(36,20,523,27,6).fill('#E4EEEA');
  doc.font('Bold').fontSize(8).fillColor(gold).text(`${content.title.toUpperCase()}  /  ${content.milestone.toUpperCase()}`,48,28,{width:W});
  doc.moveTo(48,47).lineTo(547,47).strokeColor('#D8CBAF').stroke();
}
function room(height) { if (y + height > BOTTOM) page(); }
function text(value, { size=10, bold=false, color=ink, link, dest, gap=9 } = {}) {
  value = clean(String(value)); if (!value) return;
  doc.font(bold?'Bold':'Body').fontSize(size);
  const height = doc.heightOfString(value, { width:W, lineGap:3 });
  if (height > BOTTOM-64) throw new Error(`Paragraph exceeds page: ${value.slice(0,80)}`);
  room(height + gap);
  doc.font(bold?'Bold':'Body').fontSize(size).fillColor(color).text(value,48,y,{width:W,lineGap:3,link,goTo:dest,underline:!!link});
  if (link) expectedLinks.add(link);
  requiredText.push(value);
  y += height + gap;
}
function heading(title, id, fresh=true) {
  doc.font('Bold').fontSize(23);
  const measuredTitleHeight=doc.heightOfString(title,{width:W,lineGap:3});
  if (fresh) page(); else room(measuredTitleHeight+90);
  doc.addNamedDestination(id, 'Fit');
  const pageNumber=doc.bufferedPageRange().count;
  sections.push({id,title,page:pageNumber});
  doc.outline.addItem(title, {pageNumber:pageNumber-1});
  doc.font('Bold').fontSize(23);
  const titleHeight=doc.heightOfString(title,{width:W,lineGap:3});
  doc.roundedRect(38,y-8,519,titleHeight+18,6).fill('#DDEDE8');
  text(title,{size:23,bold:true,color:green,gap:18});
}
function photo(src, height=160) {
  room(height+16);
  doc.image(path.join(root,'public',src.replace('kd14-raffles.png','kd14-raffles-pdf.jpg').replace('kd15-jimbaran.png','kd15-jimbaran-pdf.jpg')),48,y,{fit:[W,height],align:'center',valign:'center'});
  y += height+16;
}

page();
doc.image(path.join(root,'public/images/kd11-home.jpg'),48,64,{fit:[W,150],align:'center'});
doc.image(path.join(root,testEdition?'public/images/test-kd101-teal.png':'public/images/travelers-edition-emblem.png'),48,64,{fit:[40,40]});
y=224;
text(content.title,{size:32,bold:true,color:green,gap:17});
text(content.milestone,{size:28,bold:true,color:gold,gap:22});
text(dateRange,{size:14,gap:20});
text('Your interactive journey companion',{size:18,bold:true});
text('The itinerary, hotels and flights, fellow travelers, contacts, destination guides and daily trivia from your current journey app.');
text('Open the journey app',{link:baseUrl,color:gold,bold:true});
text('Export a section →',{link:baseUrl+'/export-pdf',color:green,bold:true,size:14});
text('Use the contents, bookmarks and page navigation to explore. Underlined links open websites, maps, email, phone contacts and the tutorial. Internet access is needed for these links.');
text('Daily schedules reflect saved changes when this PDF is generated. Reopen the travel book for the latest version. Approved guest introductions and profile photos reflect the latest saved profiles. Chervil’s announcements, memories, comments and album photographs remain live in the app.');
text(`App revision ${sourceHash.slice(0,12)} · Generated ${new Date().toISOString().slice(0,10)}`,{size:8});
if (testEdition) text('TEST EDITION · Review copy',{bold:true,color:gold});

// Reserve card-based contents pages before composing destinations.
const dayContentsPages=Math.ceil(data.days.length/6);
const referenceCount=1+1+1+data.hotels.length+content.sections.length+3;
const contentsPages=dayContentsPages+Math.ceil(referenceCount/7);
for(let i=0;i<contentsPages;i++){page();if(i===0)doc.addNamedDestination('contents','Fit');}

heading('October at a glance','calendar');
for (const day of data.days) {
  text(`DAY ${data.tauck(day.date)} · ${data.shortTripDate(day.date)} · ${day.title}`, {bold:true,dest:`day-${day.date}`,gap:6});
  text(day.region,{size:9,gap:12});
}
for (const day of data.days) {
  heading(`Day ${data.tauck(day.date)} · ${day.title}`,`day-${day.date}`);
  text(data.longTripDate(day.date),{bold:true,color:gold});
  text(day.region,{size:11});
  photo(`/images/${day.image.includes(".") ? day.image : day.image + ".jpg"}`,day.events.length >= 8 ? 65 : 120);
  text(day.intro,{size:11,gap:16});
  if (day.date === data.days[0].date) {
    const welcome = content.sections.find(s => s.title === 'Chervil’s Welcome Letter');
    for (const block of welcome?.blocks ?? []) text(block.text,{size:block.kind==='heading'?14:10,bold:block.kind==='heading',color:block.href?gold:ink,link:block.href});
    room(110);
    text('Today’s journey',{size:16,bold:true,color:green,gap:14});
  }
  if(day.updatedAt) text('Schedule updated by Chervil: '+day.updatedAt,{size:9,color:gold});
  for (const [time,event] of day.events) {
    room(55); text(time,{size:9,bold:true,color:gold,gap:4}); text(event);
  }
  text(day.note,{size:10,gap:14});
  for(const guide of data.localGuides||[]) if(guide.days.includes(day.date)) {room(200);text('Meet your local guide',{bold:true,size:15});photo('/images/'+guide.image,120);text(guide.name+' · '+guide.destination,{bold:true});text(guide.introduction);}
  const optional = content.optionalTours?.find(t=>t.date===day.date);
  if(optional) for(const block of optional.blocks) text(block.text,{size:block.kind==='heading'?14:10,bold:block.kind==='heading',link:block.href,color:block.href?gold:ink});
  for (const flight of data.internalFlights.filter(flight=>flight.date===day.date)) {
    room(130);
    text('Today’s internal flight',{size:15,bold:true,color:green});
    for (const key of ['route','airline','time','duration','detail']) if(flight[key]) text(flight[key],{bold:key==='route',gap:7});
  }
  const hotelIndex=data.hotels.findIndex(h=>h.name===day.hotel);
  text(`Stay: ${day.hotel}`,{bold:true,...(hotelIndex>=0?{link:absolute('/?tab=hotels&hotel=hotel-'+hotelIndex),color:gold}:{})});
  for(const story of data.storytelling||[]) if(story.days.includes(day.date)){room(80);text(story.title,{bold:true,size:14});text(story.description);text('Read the illustrated story',{link:absolute('/storytelling.html?story='+story.id+'&day='+data.tauck(day.date)),color:gold});}
  text(`Meals: ${day.meals}`);
  heading(`Local Language Lesson · Day ${data.tauck(day.date)}`,`language-${day.date}`);
  const lesson = content.languageLessons.find(item => item.date === day.date);
  for (const block of lesson.blocks) {
    if (block.text === 'Local Language Lesson') continue;
    text(block.text,{size:block.kind==='heading'?14:10,bold:block.kind==='heading',color:block.href?gold:ink,link:block.href,gap:7});
  }
}

heading('Hotels + Flights','hotels-flights');
for (const hotel of data.hotels) {
  heading(hotel.name,`hotel-${data.hotels.indexOf(hotel)}`,data.hotels.indexOf(hotel)>0);
  photo(`/images/${hotel.image}.jpg`,220);
  text(hotel.city,{bold:true,color:gold});
  text(`Check in: ${data.shortTripDate(hotel.checkin)} · Check out: ${data.shortTripDate(hotel.checkout)}`);
  text(`${hotel.checkout-hotel.checkin} nights · Days ${hotel.tauck}`);
  text(hotel.address);
  text(hotel.phone,{link:`tel:${hotel.phone.replace(/\s/g,'')}`});
  text('Hotel website',{link:hotel.website,color:gold});
  for(const menu of data.hotelResources||[]) if(menu.hotel===hotel.name){text(menu.category+' · '+menu.title,{bold:true});text(menu.note,{size:9});text('Open menu and return to hotels',{link:absolute('/hotel-menus.html?menu='+menu.id),color:gold});}
  for(const story of data.storytelling||[]) if(story.hotelIndex===data.hotels.indexOf(hotel)){text(story.category+' · '+story.title,{bold:true});text(story.description);text('Read the illustrated stay guide',{link:absolute('/storytelling.html?story='+story.id),color:gold});}
  text('View on map',{link:`https://maps.google.com/?q=${encodeURIComponent(hotel.name+' '+hotel.city)}`,color:gold});
}

heading('Internal flights','internal-flights');
for (const flight of data.internalFlights) {
  room(130);
  text(`${data.shortTripDate(flight.date)} · Day ${data.tauck(flight.date)}`,{bold:true,color:gold});
  for (const key of ['route','airline','time','duration','detail']) if(flight[key]) text(flight[key],{bold:key==='route',gap:7});
  y+=12;
}

for (const section of content.sections) {
  // Keep short contacts and practical sections together when they fit.
  const estimatedHeight = section.blocks.reduce((sum, block) => {
    doc.font(block.kind === 'heading' ? 'Bold' : 'Body').fontSize(block.kind === 'heading' ? 14 : 10);
    return sum + doc.heightOfString(block.text, { width: W, lineGap: 3 }) + 12;
  }, 65);
  heading(section.title,section.id,estimatedHeight > BOTTOM-y || section.id==='info-0');
  const isReading = /Java Guide|Bali Guide/.test(section.title);
  for (const [blockIndex,block] of section.blocks.entries()) {
    if(block.photo){room(90);doc.image(block.photo,48,y,{fit:[70,70]});y+=80;}
    if (block.text===section.title && block.kind==='heading') continue;
    if (block.kind==='heading') {
      let keepHeight=12;
      for(let j=blockIndex;j<section.blocks.length;j++){
        const next=section.blocks[j],isHeading=next.kind==='heading';
        doc.font(isHeading?'Bold':'Body').fontSize(isHeading?(isReading?12:14):(isReading?9.5:10));
        keepHeight+=doc.heightOfString(next.text,{width:W,lineGap:3})+12+(next.photo?80:0);
        if(j>blockIndex&&!isHeading)break;
      }
      room(Math.min(keepHeight,BOTTOM-64));
      room(block.keepHeight || (section.id==='tab-more' && /^(Books|Online resources|Films & videos|Blogs & traveler perspectives) \(/.test(block.text) ? 175 : section.id==='tab-more' && / · \d+ days$/.test(block.text) ? 145 : 64)); text(block.text,{size:isReading?12:14,bold:true,color:green,gap:isReading?7:11}); }
    else text(block.text,{link:block.href,color:block.href?gold:ink,size:isReading?9.5:10,gap:isReading?6:9});
  }
}

heading('Daily trivia','trivia');
text('The same questions and answer choices as the app. Answers and facts follow in a separate section. In the app, answer choices may appear in a different order.');
for (const daily of content.trivia) {
  room(120); text(`Day ${data.tauck(daily.date)} · ${data.shortTripDate(daily.date)}`,{size:16,bold:true,color:green});
  for (const [i,q] of daily.questions.entries()) {
    room(108); text(`${i+1}. ${q.question}`,{bold:true,gap:5});
    q.options.forEach((option,j)=>text(`${String.fromCharCode(65+j)}. ${option}`,{size:9,gap:3})); y+=10;
  }
}
heading('Trivia answers & facts','trivia-answers');
for (const daily of content.trivia) {
  room(120); text(`Day ${data.tauck(daily.date)} · ${data.shortTripDate(daily.date)}`,{size:16,bold:true,color:green});
  for (const [i,q] of daily.questions.entries()) {
    room(80); text(`${i+1}. ${q.options[q.answer]}`,{bold:true,gap:4}); text(q.fact);
  }
}
heading('Original guides & journey documents','documents');
text('Reference images are reproduced below. PDF and Word documents are linked in their original format. Select “Open original” to read or download a source document.');
for (const [i,item] of content.documents.entries()) {
  page(); doc.addNamedDestination(`document-${i}`,'Fit');
  text(item.title,{size:13,bold:true,gap:12});
  text('Open original',{link:absolute(item.src),color:gold,size:9});
  if(!/\.(?:png|jpe?g)$/i.test(item.src)){
    text('This reference is provided in its original document format. Use the link above to open it.',{size:10});
    continue;
  }
  const image=doc.openImage(path.join(root,'public',item.src));
  const height=BOTTOM-y-10;
  // One supplied Bali reading scan is sideways in the app; rotate only its
  // placement here to keep the complete original legible without cropping.
  if(item.src.endsWith('IMG_9429.jpeg') && image.width>image.height) {
    const scale=Math.min(W/image.height,height/image.width);
    doc.save().translate(48+(W-image.height*scale)/2,y+image.width*scale).rotate(-90).image(image,0,0,{width:image.width*scale}).restore();
  } else doc.image(image,48,y,{fit:[W,height],align:'center',valign:'center'});
}

const count=doc.bufferedPageRange().count;
const references=sections.filter(entry=>!/^day-|^language-/.test(entry.id));
if(references.length>7*(contentsPages-dayContentsPages))throw new Error('Contents cards overflow');
for(let part=0;part<contentsPages;part++) {
  doc.switchToPage(1+part);
  doc.rect(0,0,595.28,841.89).fill('#F5EFE3');
  doc.rect(22,18,551,812).lineWidth(1.3).strokeColor('#B69659').stroke();
  doc.rect(28,24,539,800).lineWidth(.5).strokeColor('#CDB78D').stroke();
  doc.font('Title').fontSize(32).fillColor(green).text('CONTENTS',48,62,{width:W,align:'center'});
  doc.font('Title').fontSize(14).fillColor(gold).text('Kingdoms & Dragons · 103rd Tour',48,108,{width:W,align:'center'});
  doc.moveTo(115,140).lineTo(480,140).strokeColor('#B69659').stroke();
  const isDays=part<dayContentsPages;
  doc.font('Body').fontSize(9).fillColor(gold).text(isDays?'YOUR JOURNEY · OCTOBER 17 – 30, 2026':'YOUR JOURNEY COMPANION · GUIDES & INFORMATION',48,153,{width:W,align:'center'});
  const entries=isDays?data.days.slice(part*6,(part+1)*6).map(day=>({...sections.find(e=>e.id===`day-${day.date}`),day})):references.slice((part-dayContentsPages)*7,(part-dayContentsPages+1)*7);
  const height=isDays?80:68, stride=isDays?94:80;
  entries.forEach((entry,index)=>{
    const top=187+index*stride;
    doc.roundedRect(48,top,W,height,7).lineWidth(.6).fillAndStroke('#FCF9F0','#D9CBAF');
    doc.circle(80,top+height/2,21).fill(green);
    doc.font('Bold').fontSize(entry.day?8:7).fillColor('#FFFDF3').text(entry.day?`DAY ${data.tauck(entry.day.date)}`:'INFO',57,top+height/2-5,{width:46,align:'center'});
    const title=entry.day?entry.day.title:entry.title;
    let size=14;doc.font('Title').fontSize(size);
    while(doc.heightOfString(title.toUpperCase(),{width:342})>35&&size>10){size-=.5;doc.fontSize(size);}
    doc.fillColor(green).text(title.toUpperCase(),116,top+12,{width:342});
    const titleHeight=doc.heightOfString(title.toUpperCase(),{width:342});
    if(entry.day){
      doc.font('Title').fontSize(9).fillColor(gold).text(entry.day.region,116,top+14+titleHeight,{width:342,height:12,ellipsis:true});
      doc.font('Body').fontSize(8).fillColor('#6F736C').text(data.longTripDate(entry.day.date),116,top+height-20,{width:275});
    }
    doc.font('Title').fontSize(20).fillColor(green).text(String(entry.page),476,top+height/2-15,{width:55,align:'center'});
    doc.font('Body').fontSize(6).fillColor(gold).text('GO TO PAGE',476,top+height/2+12,{width:55,align:'center'});
    doc.goTo(48,top,W,height,entry.id);
  });
  doc.font('Body').fontSize(8).fillColor(gold).text(`Select any card to open its section · Contents ${part+1} of ${contentsPages}`,48,760,{width:W,align:'center'});
}
for(let i=0;i<count;i++) {
  doc.switchToPage(i);
  doc.moveTo(48,785).lineTo(547,785).strokeColor('#D8CBAF').stroke();
  doc.font('Body').fontSize(8).fillColor(gold);
  doc.text('Contents',48,798,{width:75,goTo:'contents'});
  doc.roundedRect(120,790,120,25,5).fill(green);
  doc.fillColor('#FFFFFF').text('BACK TO APP',130,798,{width:103,link:baseUrl,align:'center'});
  doc.link(120,790,120,25,baseUrl);
  doc.fillColor(gold);
  doc.text(`${i+1} / ${count}`,260,798,{width:75,align:'center'});
  if(i>0) {doc.addNamedDestination(`page-${i}`,'Fit'); doc.text('Previous',395,798,{width:70,goTo:i===1?'cover':`page-${i-1}`});}
  else doc.addNamedDestination('cover','Fit');
  if(i<count-1) doc.text('Next',495,798,{width:52,align:'right',goTo:`page-${i+1}`});
}
doc.end(); await done;
const bytes=Buffer.concat(chunks);
const manifest={schema:1,sourceHash,pdfHash:digest(bytes),generatedAt:new Date().toISOString(),baseUrl,dateRange,pages:count,days:data.days.length,hotels:data.hotels.length,flights:data.internalFlights.length,guests:content.guests.length,trivia:content.trivia.reduce((n,d)=>n+d.questions.length,0),documents:content.documents,sections,requiredText,expectedLinks:[...expectedLinks]};
return {bytes,manifest};
}
export function hydrateContent(snapshot){
 const content=structuredClone(snapshot);
 content.data.tripDate=day=>new Date(content.dates[day].iso);
 content.data.shortTripDate=day=>content.dates[day].short;
 content.data.longTripDate=day=>content.dates[day].long;
 content.data.tauck=day=>content.dates[day].tauck;
 return content;
}
