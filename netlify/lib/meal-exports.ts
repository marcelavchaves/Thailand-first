import {createRequire} from 'node:module';
import {join} from 'node:path';
import {type mealReport} from '../../lib/meal-choices';
type Report=ReturnType<typeof mealReport>;
const headers=['Meal','Restaurant','Deadline (Hanoi time)','Course','Traveler','Choice','Dietary restrictions or allergies','Status','Submitted at'];
function tables(report:Report){return [
 {name:'Traveler choices',rows:[headers,...report.rows.map(r=>[r.meal,r.restaurant,new Date(r.deadline).toLocaleString('en-US',{timeZone:'Asia/Ho_Chi_Minh'}),r.course,r.traveler,r.choice,r.dietary,r.status,r.submittedAt])]},
 {name:'Submitted dish totals',rows:[['Meal','Course','Choice','Count'],...report.totals.map(r=>[r.meal,r.course,r.choice,r.count])]}
];}
function csvCell(value:string|number){let text=String(value);if(/^\s*[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';}
const xml=(v:unknown)=>String(v).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!)).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'');
function crc32(data:Buffer){let crc=0xffffffff;for(const byte of data){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^(0xedb88320&-(crc&1));}return (crc^0xffffffff)>>>0;}
// A standards-compliant, uncompressed ZIP archive keeps the workbook dependency-free.
function zip(files:{name:string;data:string}[]){const parts:Buffer[]=[],central:Buffer[]=[];let offset=0;
 for(const file of files){const name=Buffer.from(file.name),data=Buffer.from(file.data),crc=crc32(data),local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt32LE(crc,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(name.length,26);parts.push(local,name,data);
 const entry=Buffer.alloc(46);entry.writeUInt32LE(0x02014b50);entry.writeUInt16LE(20,4);entry.writeUInt16LE(20,6);entry.writeUInt32LE(crc,16);entry.writeUInt32LE(data.length,20);entry.writeUInt32LE(data.length,24);entry.writeUInt16LE(name.length,28);entry.writeUInt32LE(offset,42);central.push(entry,name);offset+=local.length+name.length+data.length;}
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...parts,directory,end]);}
function workbook(report:Report){const sheets=tables(report);return zip([
 {name:'[Content_Types].xml',data:`<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`},
 {name:'_rels/.rels',data:'<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
 {name:'xl/workbook.xml',data:`<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s,i)=>`<sheet name="${xml(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`},
 {name:'xl/_rels/workbook.xml.rels',data:`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="styles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}</Relationships>`},
 {name:'xl/styles.xml',data:'<?xml version="1.0"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF0E3"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'},
 ...sheets.map((s,i)=>({name:`xl/worksheets/sheet${i+1}.xml`,data:`<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${(i===0?[25,35,25,18,25,45,55,18,25]:[25,18,45,12]).map((width,c)=>`<col min="${c+1}" max="${c+1}" width="${width}" customWidth="1"/>`).join('')}</cols><sheetData>${s.rows.map((row,n)=>`<row r="${n+1}">${row.map((v,c)=>`<c r="${String.fromCharCode(65+c)}${n+1}" s="${n===0?1:0}" t="${typeof v==='number'?'n':'inlineStr'}">${typeof v==='number'?`<v>${v}</v>`:`<is><t xml:space="preserve">${xml(v)}</t></is>`}</c>`).join('')}</row>`).join('')}</sheetData></worksheet>`}))
]);}
async function pdf(report:Report,meal:string){
 const require=createRequire(import.meta.url),PDFDocument=require('pdfkit');
 const doc=new PDFDocument({size:'A4',margin:44,info:{Title:'Wondercase · Meal choices',Author:'Wondercase'}}),chunks:Buffer[]=[];
 const ready=new Promise<Buffer>((resolve,reject)=>{doc.on('data',(b:Buffer)=>chunks.push(b));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
 doc.registerFont('Body',join(process.cwd(),'scripts/fonts/DejaVuSans.ttf'));doc.registerFont('Bold',join(process.cwd(),'scripts/fonts/DejaVuSans-Bold.ttf'));
 const line=(text:string,size=10,bold=false)=>{doc.font(bold?'Bold':'Body').fontSize(size).fillColor('#315c4f').text(text,{lineGap:3});doc.moveDown(.35);};
 line('WONDERCASE · Meal choices',20,true);line(meal==='all'?'All five menus':'Restaurant report',12);line('Each meal closes at its own deadline. Times below are Hanoi time.',9);line('Dish totals count submitted choices only. Drafts and missing submissions are labeled below.',9);
 for(const menu of [...new Set(report.rows.map(r=>r.meal))]){
  doc.addPage();line(menu,18,true);line(report.rows.find(r=>r.meal===menu)?.restaurant||'',11);line('Deadline: '+new Date(report.rows.find(r=>r.meal===menu)!.deadline).toLocaleString('en-US',{timeZone:'Asia/Ho_Chi_Minh'})+' · Hanoi time',9);
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
export async function exportMeals(report:Report,format:string,meal:string){
 if(format==='csv')return {bytes:Buffer.from('\ufeff'+tables(report).map(t=>[t.name,...t.rows.map(row=>row.map(csvCell).join(','))].join('\r\n')).join('\r\n\r\n')),type:'text/csv; charset=utf-8'};
 if(format==='xlsx')return {bytes:workbook(report),type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
 return {bytes:await pdf(report,meal),type:'application/pdf'};
}
