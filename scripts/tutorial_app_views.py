"""Show real, privacy-filtered app tab screenshots before the explanation cards."""
from PIL import Image,ImageDraw
from functools import lru_cache
@lru_cache(maxsize=16)
def cached_view(path):return Image.open(path).convert("RGB")
views={2:('home',),3:('maps',),4:('essentials',),5:('gallery',),6:('group','group-details'),8:('more','more-details')}
def app_view(chapter,frame,fps,root):
 if chapter not in views or frame>=(5 if chapter==5 else 10)*fps:return None
 names=views[chapter];name=names[min(len(names)-1,int(frame/(5*fps)))]
 picture=cached_view(str(root/'assets/tutorial/app-tabs'/f'{name}.png')).copy()
 if picture.size!=(720,1280):raise ValueError('App screenshots must be 720 × 1280')
 draw=ImageDraw.Draw(picture)
 # Outline the actual selected bottom-tab button; keep the app navigation intact.
 index={2:0,3:1,4:2,5:3,6:4,8:5}[chapter]
 if frame%int(5*fps)<int(1.8*fps):
  x=index*120+7;draw.rounded_rectangle((x,1144,x+106,1263),radius=18,outline='#C9A962',width=3)
 return picture
