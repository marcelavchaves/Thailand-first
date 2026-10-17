from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import subprocess,math,json,sys,textwrap
root=Path(__file__).resolve().parent.parent
out=root/'.installation-build';out.mkdir(exist_ok=True)
font=lambda n,b=False:ImageFont.truetype(str(root/'scripts/fonts'/('DejaVuSans-Bold.ttf' if b else 'DejaVuSans.ttf')),n)
G='#18483f';gold='#d5b76d';ink='#243e37';blue='#087abf'
# Screen illustrations are intentionally schematic, avoiding dependence on a particular OS layout.
iphone=[
('Start with Xavier’s email','email','Open Xavier’s email on your iPhone. Find the Kingdoms & Dragons app link. Keep Wi-Fi or mobile data on.',(365,510)),
('Open the app link','email','Tap the app link once. If it opens in Safari, continue to the app page. If it opens in another browser or inside email, follow the next steps.',(365,510)),
('If needed: copy the link','copy','Return to the email. Touch and hold the app link, then choose Copy Link or Copy. The link is now ready to paste.',(360,600)),
('Open Safari','safari','Find Safari, the blue compass icon. Tap it. Use Safari for this iPhone installation walkthrough.',(360,525)),
('Paste the app address','paste','Tap Safari’s address bar. Touch and hold inside it, then tap Paste and Go. If you see Paste instead, tap Paste, then Go.',(360,475)),
('Check the journey page','website','Wait for Kingdoms & Dragons to load. You should see the journey title. If the app was already open in Safari, start here.',(360,460)),
('Find the Share button','share','Tap Share: a square with an upward arrow. Depending on Safari’s layout, first tap the Page Menu, then Share.',(360,820)),
('Expand the Share sheet','sheet','Swipe upward on the Share sheet to reveal more actions. Look below the row of app icons for Add to Home Screen.',(360,690)),
('Tap Add to Home Screen','addhome','Tap Add to Home Screen. If it is missing, scroll to Edit Actions, then add the Add to Home Screen action.',(360,560)),
('Check the app options','confirm','Keep the suggested name K&D102. If Open as Web App appears, leave it switched on. Older iPhones may not show that switch.',(495,630)),
('Tap Add','confirm','Tap Add in the upper-right corner. Wait for the new icon to be placed on this iPhone’s Home Screen.',(525,305)),
('Find your new app icon','homescreen','Return to the Home Screen: swipe up from the bottom, or press the physical Home button. Swipe between pages to find K&D102.',(250,450)),
('Open your journey','finished','Tap the new app icon. Use it each day instead of finding the email again. Travelers do not need Xavier’s TD Login. Keep internet on for current updates.',(250,450)),
('If you need a little help','help','Cannot find the icon? Swipe down on the Home Screen and search its name. If installation did not finish, reopen the link in Safari and repeat Share → Add to Home Screen.',None)
]
android=[
('Start with Xavier’s email','email','Open Xavier’s email on your Android phone. Find the Kingdoms & Dragons app link. Keep Wi-Fi or mobile data on.',(365,510)),
('Tap the app link','email','Tap the app link once. Use Google Chrome for these steps. Otherwise, choose Open in Chrome if offered, or copy and paste using the next steps.',(365,510)),
('If needed: copy the link','copy','Return to the email. Touch and hold the app link, then choose Copy link address or Copy link.',(360,600)),
('Open Google Chrome','chrome','Find the round red, yellow, green and blue Chrome icon. Tap it to open the browser.',(360,525)),
('Paste and open the link','paste','Tap Chrome’s address bar. Touch and hold, then choose Paste. Tap Go or the arrow on the keyboard to open the app.',(360,475)),
('Check the journey page','website','Wait for Kingdoms & Dragons to load. If the link was already open in Chrome, you can start here.',(360,460)),
('Open Chrome’s menu','more','Tap the three vertical dots next to the address bar. The address bar may be at the top or bottom, depending on your settings.',(550,325)),
('Choose the install option','androidmenu','Look for Install and create shortcut, then Install. Other Chrome versions may say Install app or Add to Home screen.',(355,555)),
('Confirm installation','androidconfirm','Tap Install in the confirmation box. If your phone offers a shortcut instead, tap Add and follow the placement instructions.',(495,645)),
('Give it a moment','waiting','Allow the phone a moment to finish. Then go to your Home Screen using the Home button or your usual swipe-up gesture.',(360,800)),
('Find the new app','homescreen','Look for the K&D102 icon. Swipe between Home Screen pages. If you do not see it, open your app list and search for it.',(250,450)),
('If needed: place the icon','appdrawer','If the app is only in your app list, touch and hold its icon. Choose Add to Home, or drag it onto the Home Screen.',(250,450)),
('Tap to open your journey','finished','Tap the new icon. You can now open the journey without returning to the email. Travelers do not need Xavier’s TD Login. Keep internet on for current updates.',(250,450)),
('If Install is missing','help','Make sure the page is open in Chrome, not an email preview. Try a normal tab and reload. Check the app list first: Chrome may show Open app if it is already installed.',None)
]
def wrap(d,text,xy,width,size=25,color=ink,bold=False,gap=8):
 x,y=xy;words=text.split();line='';f=font(size,bold)
 for word in words:
  candidate=(line+' '+word).strip()
  if d.textlength(candidate,font=f)>width and line:d.text((x,y),line,font=f,fill=color);y+=size+gap;line=word
  else:line=candidate
 if line:d.text((x,y),line,font=f,fill=color);y+=size+gap
 return y

def icon(im,x,y,size=72):
 logo=Image.open(root/'public/images/travelers-edition-emblem.png').convert('RGBA');logo.thumbnail((size,size));im.paste(logo,(x,y),logo)
def scene(platform,i,entry,total):
 title,state,caption,target=entry
 im=Image.new('RGB',(720,1280),'#f7f2e6');d=ImageDraw.Draw(im)
 d.rectangle((0,0,720,10),fill=gold);d.text((35,28),'KINGDOMS & DRAGONS',font=font(22,True),fill=G);d.text((35,64),f'{"iPhone · Safari" if platform=="iphone" else "Android · Chrome"}  |  HOME SCREEN SETUP',font=font(18),fill=G)
 d.rounded_rectangle((35,106,102,166),radius=15,fill=G);d.text((53,121),f'{i+1:02}',font=font(27,True),fill='#ffffff');wrap(d,title,(120,117),570,28,G,True)
 d.rounded_rectangle((115,195,605,965),radius=46,fill='#243e37');d.rounded_rectangle((128,210,592,949),radius=34,fill='#ffffff');d.text((153,232),'9:41',font=font(18,True),fill=ink);d.text((496,232),'▰  Wi-Fi',font=font(14),fill=ink);d.rounded_rectangle((284,220,436,241),radius=10,fill='#243e37')
 def txt(t,x,y,n=22,b=False,c=ink):d.text((x,y),t,font=font(n,b),fill=c)
 def row(t,y,fill='#eef2f1'):
  d.rounded_rectangle((151,y,569,y+59),radius=10,fill=fill);txt(t,170,y+16,19)
 if state in ['email','copy']:
  txt('Inbox',153,286,22,True);txt('From: Xavier',153,351,20);wrap(d,'Your Kingdoms & Dragons journey',(153,395),410,27,G,True);row('Open the journey app',487,'#e3f1f9');txt('Tap the link above to begin.',153,574,19)
  if state=='copy':d.rounded_rectangle((178,555,542,680),radius=16,fill='#f1f1f1',outline='#c6cecb');txt('Copy Link',215,588,26,True);txt('(wording may vary)',215,635,16)
 elif state in ['safari','chrome']:
  txt('Open your browser',171,325,27,True)
  if state=='safari':
   d.ellipse((282,443,438,599),fill='#168cdc',outline='#d1e8f1',width=8);d.polygon([(350,514),(397,476),(370,535)],fill='#e75b56');d.polygon([(350,514),(320,568),(370,535)],fill='#ffffff');txt('Safari',316,625,27,True)
  else:
   d.pieslice((282,443,438,599),180,300,fill='#e55345');d.pieslice((282,443,438,599),300,60,fill='#f7c642');d.pieslice((282,443,438,599),60,180,fill='#49a564');d.ellipse((322,483,398,559),fill='#348dcc',outline='white',width=5);txt('Chrome',301,625,27,True)
 elif state=='paste':
  txt('Safari' if platform=='iphone' else 'Chrome',155,300,24,True);row('Search or enter website',385);row('Paste and Go' if platform=='iphone' else 'Paste',447,'#ddecf5');txt('Use the link from Xavier’s email.',151,552,17);d.rounded_rectangle((151,685,569,846),radius=12,fill='#edf0f2');txt('Your phone keyboard',230,735,20);d.rounded_rectangle((472,789,555,833),radius=10,fill=blue);txt('Go',495,799,19,True,'white')
 elif state in ['website','share','more','finished']:
  if state!='finished':
   row('Journey app address',285)
   if platform=='android':txt('⋮',540,302,28,True)
  icon(im,167,379,62);txt('Kingdoms & Dragons',240,397,22,True,G);wrap(d,'Singapore to Bali',(165,502),380,38,G,True);txt('October 3 – 16',165,614,22);txt('102nd Tour',165,660,25,True);row('Today’s journey  →',718,'#e8eee5')
  if state=='share':
   d.line((346,815,346,837,376,837,376,815),fill=blue,width=4);d.line((361,825,361,792),fill=blue,width=4);d.line((351,803,361,792,371,803),fill=blue,width=4);txt('Share',329,853,19,True,blue)
  if state=='finished':txt('Home     Journey     Hotels     Info',153,865,17,False,G)
 elif state in ['sheet','addhome']:
  txt('Share',161,288,27,True);txt('Kingdoms & Dragons',161,337,20);row('Mail     Messages     More',398);row('Copy',468);row('Add to Home Screen',538,'#dcece5');row('Add Bookmark',608);row('Edit Actions…',770);txt('Swipe up to see more actions ↑',161,690,19,False,blue)
 elif state=='confirm':
  txt('Cancel',152,294,19,False,blue);txt('Add',503,294,22,True,blue);txt('Add to Home Screen',167,362,28,True);icon(im,320,426,80);row('K&D102',539);row('Open as Web App',609);d.rounded_rectangle((476,621,550,655),radius=17,fill='#389867');d.ellipse((518,625,544,651),fill='white');txt('If this option is shown',165,687,17)
 elif state=='androidmenu':
  txt('Chrome menu',163,294,27,True);row('New tab',362);row('History',432);row('Install and create shortcut',502,'#dcece5');row('Install',572,'#dcece5');wrap(d,'Other versions: Install app or Add to Home screen',(170,682),375,23)
 elif state=='androidconfirm':
  txt('Install app?',182,415,29,True);icon(im,181,470,70);wrap(d,'K&D102',(266,487),275,23,G,True);txt('Cancel',213,637,22,False,blue);d.rounded_rectangle((430,623,559,674),radius=20,fill=blue);txt('Install',454,635,23,True,'white')
 elif state=='waiting':
  txt('Adding your journey…',165,391,28,True);icon(im,316,496,88);wrap(d,'Please give your phone a moment to finish.',(179,638),360,25);d.line((300,864,420,864),fill=ink,width=5)
 elif state in ['homescreen','appdrawer']:
  txt('Home Screen' if state=='homescreen' else 'Your apps',164,298,28,True);icon(im,212,410,78);txt('K&D102',207,507,19)
  for x,y in [(400,410),(212,600),(400,600)]:d.rounded_rectangle((x,y,x+78,y+78),radius=17,fill='#e2eae7')
  if state=='appdrawer':row('Add to Home',757,'#dcece5')
  else:txt('Swipe to check other pages →',158,777,20)
 elif state=='help':
  txt('Quick checks',163,314,30,True)
  items=['Use '+('Safari' if platform=='iphone' else 'Chrome'),'Open Xavier’s app link','Check your Home Screen','Ask Xavier if you need help']
  for n,t in enumerate(items):row(t,403+n*92)
 d.rounded_rectangle((285,925,435,931),radius=3,fill=ink)
 d.rounded_rectangle((25,986,695,1199),radius=18,fill=G);wrap(d,caption,(45,1005),630,25,'#fff9e9',False,8)
 d.text((35,1215),'Illustrated guide • phone layouts and labels may vary',font=font(17),fill=ink)
 d.rectangle((35,1252,685,1257),fill='#d9dfd8');d.rectangle((35,1252,35+650*(i+1)/total,1257),fill=G)
 return im,(None if state=='finished' else target)

def run(platform):
 entries=iphone if platform=='iphone' else android;duration=11;fps=16
 target=root/f'public/tutorial/install-{platform}.mp4';p=subprocess.Popen(['ffmpeg','-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s','720x1280','-r',str(fps),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',str(target)],stdin=subprocess.PIPE,stderr=subprocess.DEVNULL)
 vtt=['WEBVTT',''];frames=[]
 def stamp(n):return f'{n//3600:02}:{n//60%60:02}:{n%60:02}.000'
 for i,entry in enumerate(entries):
  base,point=scene(platform,i,entry,len(entries));base.save(out/f'{platform}-{i+1:02}.png');frames.append({'step':i+1,'title':entry[0],'caption':entry[2]})
  vtt += [f'{stamp(i*duration)} --> {stamp((i+1)*duration)}',entry[0]+'. '+entry[2],'']
  for f in range(duration*fps):
   im=base.copy();d=ImageDraw.Draw(im)
   if point:
    x,y=point;r=23+int(8*(1+math.sin(f/fps*4))/2);d.ellipse((x-r,y-r,x+r,y+r),outline='#d59d36',width=5);d.ellipse((x-5,y-5,x+5,y+5),fill='#d59d36')
   d.rectangle((35,1252,35+650*(i+f/(duration*fps))/len(entries),1257),fill=gold)
   p.stdin.write(im.tobytes())
 p.stdin.close();assert p.wait()==0
 (root/f'public/tutorial/install-{platform}.vtt').write_text('\n'.join(vtt));(root/f'assets/tutorial/install-{platform}-storyboard.json').write_text(json.dumps(frames,indent=2,ensure_ascii=False)+'\n');print(platform,'complete:',len(entries)*duration,'seconds')
if __name__=='__main__':run(sys.argv[1])
