"""Generate the booklet and animated walkthrough from the same reviewed content."""
from pathlib import Path
import json,hashlib,math,subprocess
from PIL import Image,ImageDraw,ImageFont
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
import qrcode
root=Path(__file__).resolve().parent.parent
chapters=json.loads((root/'assets/tutorial/help-content.json').read_text())
out=root/'.tutorial-build';out.mkdir(exist_ok=True)
G='#18483f';GOLD='#bb9951';CREAM='#f8f4e9';INK='#263f38'
font=lambda n,b=False:ImageFont.truetype(str(root/'scripts/fonts'/('DejaVuSans-Bold.ttf' if b else 'DejaVuSans.ttf')),n)
def wrap(d,t,x,y,w,n,color=INK,b=False):
 line=''
 for word in t.split():
  v=(line+' '+word).strip()
  if d.textlength(v,font=font(n,b))>w and line:d.text((x,y),line,font=font(n,b),fill=color);y+=n+9;line=word
  else:line=v
 if line:d.text((x,y),line,font=font(n,b),fill=color);y+=n+9
 return y
# Purpose-built instructional diagrams avoid stale screenshots or test branding.
fps=12;duration=18
proc=subprocess.Popen(['ffmpeg','-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s','720x1280','-r',str(fps),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',str(root/'public/tutorial/traveler-tutorial.mp4')],stdin=subprocess.PIPE,stderr=subprocess.DEVNULL)
vtt=['WEBVTT','']
stamp=lambda t:f'{t//3600:02}:{t//60%60:02}:{t%60:02}.000'
for i,ch in enumerate(chapters):
 im=Image.new('RGB',(720,1280),CREAM);d=ImageDraw.Draw(im)
 d.rectangle((0,0,720,10),fill=GOLD);d.text((36,28),'K&D102  |  YOUR APP GUIDE',font=font(23,True),fill=G)
 d.text((36,72),f'{i+1:02} / {len(chapters):02}    •    October 3 - 16, 2026',font=font(18),fill=INK)
 y=wrap(d,ch['title'],36,125,648,33,G,True);wrap(d,ch['subtitle'],36,y+8,648,21,GOLD)
 d.rounded_rectangle((36,265,684,555),radius=22,fill=G)
 d.text((60,285),'LOOK FOR THESE IN THE APP',font=font(16,True),fill='#e1c989')
 for j,t in enumerate(ch['panel']):
  yy=329+j*70;d.rounded_rectangle((60,yy,660,yy+57),radius=10,fill='#eff4ed');wrap(d,t,79,yy+13,562,20,G,True)
 y=590
 for j,t in enumerate(ch['steps']):
  d.ellipse((36,y+3,67,y+34),fill=GOLD);d.text((44,y+7),str(j+1),font=font(17,True),fill='white')
  y=wrap(d,t,83,y,595,22,INK)+17
 assert y<1190,(i,y)
 d.text((36,1211),'Illustrated guide • Pause to read • Speed controls in the app',font=font(16),fill=G)
 im.save(out/f'guide-{i+1:02}.png')
 vtt.extend([f'{stamp(i*duration)} --> {stamp((i+1)*duration)}',ch['title']+'. '+' '.join(ch['steps']),''])
 for frame in range(duration*fps):
  pic=im.copy();draw=ImageDraw.Draw(pic);j=min(2,int(frame/(duration*fps/3)));yy=329+j*70
  draw.rounded_rectangle((57,yy-3,663,yy+60),radius=12,outline=GOLD,width=3+int(2*(1+math.sin(frame/fps*4))/2))
  draw.rectangle((36,1251,684,1257),fill='#dce1d8');draw.rectangle((36,1251,36+648*(i+frame/(duration*fps))/len(chapters),1257),fill=GOLD)
  proc.stdin.write(pic.tobytes())
proc.stdin.close();assert proc.wait()==0
(root/'public/tutorial/traveler-tutorial.vtt').write_text('\n'.join(vtt))
# Print-friendly interactive booklet, same chapters and instructions as the video.
for name,f in [('Guide','DejaVuSans.ttf'),('GuideBold','DejaVuSans-Bold.ttf')]:pdfmetrics.registerFont(TTFont(name,str(root/'scripts/fonts'/f)))
target=root/'public/tutorial/instruction-booklet.pdf';c=canvas.Canvas(str(target),pagesize=(595,842));c.setTitle('K&D102 - App Instruction Booklet')
base='https://kingdoms-dragons-new-edition.netlify.app/'
def txt(t,x,y,size=12,b=False,color=INK):c.setFillColor(color);c.setFont('GuideBold' if b else 'Guide',size);c.drawString(x,y,t)
def para(t,x,y,w,size=12,b=False,color=INK):
 line=''
 for word in t.split():
  val=(line+' '+word).strip()
  if pdfmetrics.stringWidth(val,'GuideBold' if b else 'Guide',size)>w and line:txt(line,x,y,size,b,color);y-=size*1.5;line=word
  else:line=val
 if line:txt(line,x,y,size,b,color);y-=size*1.5
 return y
n=len(chapters)+2
def page(number,title):
 c.setFillColor(CREAM);c.rect(0,0,595,842,fill=1,stroke=0);c.setStrokeColor(GOLD);c.rect(23,24,549,794,fill=0,stroke=1)
 txt('KINGDOMS & DRAGONS  /  102ND TOUR',42,791,10,True,G)
 c.setStrokeColor(GOLD);c.line(42,772,553,772)
 txt('BACK TO APP',42,46,10,True,G);c.linkURL(base+'?tab=info',(40,38,150,62),relative=0)
 txt('CONTENTS',250,46,10,True,G);c.linkRect('', 'contents',(245,38,333,62),relative=0,thickness=0)
 txt(f'{number} / {n}',500,46,10,False,G)
 c.bookmarkPage(f'page-{number}');c.addOutlineEntry(title,f'page-{number}',0,False)
page(1,'App instruction booklet');txt('K&D102',42,697,46,True,G);para('Your app, step by step',42,641,490,25,True,G)
para('Traveler Edition • October 3 - 16, 2026',42,591,490,13)
para('A practical guide to installation, the daily journey, hotels and flights, menus, guest introductions, and Chervil’s director tools.',42,548,490,16)
qr=qrcode.make(base).convert('RGB');qr.save(out/'live-app-qr.png');c.drawImage(ImageReader(qr),42,273,145,145)
para('OPEN THE LIVE APP',211,397,330,15,True,G);para('Scan this code with your phone camera, or tap here in the PDF.',211,366,314,13)
c.linkURL(base,(38,269,554,423),relative=0)
para('Use the clickable contents on the next page. Every page includes BACK TO APP. Videos and this booklet are in Info → Help & Video Tutorial.',42,223,490,13)
para('Updated September 26, 2026. Screens and browser labels may vary. Reopen the app for the newest trip details.',42,130,490,11)
c.showPage();page(2,'Contents');c.bookmarkPage('contents');txt('CONTENTS',42,717,32,True,G)
for i,ch in enumerate(chapters):
 y=670-i*31;txt(f'{i+1:02}',43,y,11,True,GOLD);txt(ch['title'],76,y,11,True,G);txt(str(i+3),523,y,11,True,G);c.linkRect('',f'page-{i+3}',(40,y-8,553,y+18),relative=0,thickness=0)
c.showPage()
for i,ch in enumerate(chapters):
 page(i+3,ch['title']);y=para(ch['title'],42,720,505,27,True,G);para(ch['subtitle'],42,y-8,500,13,False,GOLD)
 c.setFillColor('#e9efe8');c.roundRect(42,464,511,160,12,fill=1,stroke=0)
 for j,t in enumerate(ch['panel']):para(t,60,593-j*45,474,14,True,G)
 y=425
 for j,t in enumerate(ch['steps']):
  txt(f'{j+1:02}',42,y,14,True,GOLD);y=para(t,80,y,465,13)-25
 assert y>75,(i,y)
 if i in [1,2]:
  url=base+'installation-help.html?phone='+('iphone' if i==1 else 'android');txt('WATCH THE DETAILED INSTALLATION VIDEO →',80,y,10,True,G);c.linkURL(url,(76,y-6,548,y+16),relative=0)
 c.showPage()
c.save()
manifest={'contentSha256':hashlib.sha256((root/'assets/tutorial/help-content.json').read_bytes()).hexdigest(),'chapters':len(chapters),'durationSeconds':len(chapters)*duration,'bookletPages':n,'homeScreenName':'K&D102','liveUrl':base}
(root/'assets/tutorial/help-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Generated',n,'booklet pages and',len(chapters)*duration,'seconds of video',flush=True)
