"""Suitcase opening animation, using the supplied tutorial's closed-suitcase artwork."""
from PIL import Image,ImageDraw,ImageFont
import math

def render_opening(proc,fps,root,out):
 art=Image.open(root/'assets/tutorial/closed-suitcase.png').convert('RGBA')
 serif=lambda n,b=False:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif'+('-Bold' if b else '')+'.ttf',n)
 sans=lambda n:ImageFont.truetype(str(root/'scripts/fonts/DejaVuSans.ttf'),n)
 gold='#d7b86d';cream='#f7f0df';green='#1e3b2f'
 def center(d,text,y,size=26,fill=cream,b=False):
  f=serif(size,b);d.text(((720-d.textlength(text,font=f))/2,y),text,font=f,fill=fill)
 for frame in range(19*fps):
  t=frame/fps;im=Image.new('RGB',(720,1280),'#21150e');d=ImageDraw.Draw(im)
  # Warm radial leather background.
  for r in range(650,0,-10):
   c=int(30+22*(1-r/650));d.ellipse((360-r,620-r,360+r,620+r),fill=(c,int(c*.70),int(c*.48)))
  opening=max(0,min(1,(t-1.0)/2.1));rise=max(0,min(1,(t-2.3)/1.7));ease=1-(1-rise)**3
  if opening==0:
   pic=art.resize((720,720));im.paste(pic,(0,180),pic)
  else:
   # Gold-bound green case, stitched linen interior and raised lid.
   d.rounded_rectangle((124,470,596,931),26,fill=green,outline=gold,width=4)
   d.rounded_rectangle((140,485,580,914),21,fill='#eee5ca',outline='#bca66c',width=2)
   for x in range(147,576,5):d.line((x,495,x,903),fill='#e5dbc1')
   d.rounded_rectangle((154,502,566,898),10,outline='#a8976d',width=2)
   lid=art.resize((720,max(100,int(720*(1-opening*.84)))))
   im.paste(lid,(0,470-lid.height+int(opening*48)),lid)
   d=ImageDraw.Draw(im)
   # Journal, illustrated travel card and boarding pass rise out of the case.
   y=int(610-ease*85)
   d.rounded_rectangle((171,y+40,354,y+282),9,fill='#733445',outline=gold,width=2)
   d.ellipse((225,y+90,288,y+153),outline=gold,width=2);d.text((245,y+104),'W',font=serif(30),fill=gold)
   d.text((192,y+185),'JOURNAL',font=serif(18),fill=gold)
   d.rounded_rectangle((391,y+20,548,y+275),7,fill=cream,outline='#b9ab86',width=2)
   d.text((410,y+45),'Your journey',font=serif(17),fill='#554a32')
   for yy in range(y+95,y+230,28):d.line((411,yy,529,yy),fill='#b9ab86',width=2)
   d.rounded_rectangle((285,y-7,449,y+271),12,fill='#d5b578',outline='#a38c58',width=2)
   d.ellipse((385,y+16,433,y+64),fill='#f5d58d')
   d.polygon([(286,y+171),(325,y+139),(365,y+156),(407,y+201),(449,y+183),(449,y+271),(285,y+271)],fill='#567362')
   d.rounded_rectangle((286,y+197,449,y+271),6,fill=green)
   for k,line in enumerate(['Vietnam','Cambodia','& Thailand']):d.text((307,y+204+k*19),line,font=serif(16),fill=cream)
   # Destination card mirrors the reference's vintage route card.
   d.rounded_rectangle((24,385,326,466),9,fill=cream,outline=gold,width=2)
   for x in [54,167,280]:d.ellipse((x-4,430,x+4,438),fill='#a78b4d')
   d.line((54,434,280,434),fill='#baa36b',width=2)
   d.text((38,404),'Vietnam · Cambodia · Thailand',font=serif(15),fill=green)
  if t>=5:
   p=min(1,(t-5)/1.3);offset=int((1-p)*780)
   d.rounded_rectangle((100,250+offset,620,1000+offset),24,fill=cream,outline=gold,width=4)
   d.rounded_rectangle((118,267+offset,602,983+offset),15,outline='#aa9768',width=2)
   center(d,'WONDERCASE',300+offset,32,green,True)
   center(d,'Vietnam, Cambodia',360+offset,25,green)
   center(d,'& Thailand',397+offset,25,green)
   d.line((165,453+offset,555,453+offset),fill=gold,width=2)
   center(d,'Let’s explore together',485+offset,27,green)
   for k,line in enumerate(['A little guidance for your journey.','Pause whenever you like.','Choose a chapter or set your speed.','Your TD is here to help.']):center(d,line,550+offset+k*43,20,'#60563e')
   d.rounded_rectangle((120,785+offset,600,851+offset),14,fill=green,outline=gold,width=2)
   center(d,'Let our journey begin!',805+offset,23,cream,True)
   center(d,'Unpack · Discover · Enjoy',902+offset,18,'#89703c')
  if frame in [0,3*fps,7*fps]:im.save(out/f'opening-{int(t):02}.png')
  if frame==0:im.save(root/'public/tutorial/intro-poster.jpg')
  proc.stdin.write(im.tobytes())
