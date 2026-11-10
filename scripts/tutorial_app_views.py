"""Show real, privacy-filtered app tab screenshots before the explanation cards."""
from PIL import Image,ImageDraw
from functools import lru_cache
import json
@lru_cache(maxsize=16)
def cached_view(path):return Image.open(path).convert("RGB")
def app_view(chapter,frame,fps,root):
 title=json.loads((root/'assets/tutorial/help-content.json').read_text())[chapter]['title']
 names=None;index=None
 tab_views={'Home':(('home',),0),'Maps':(('maps',),1),'Essentials':(('essentials',),2),'Gallery':(('gallery',),3),'The Group':(('group','group-details'),4),'More':(('more','more-details'),5)}
 prefix=title.split(' · ')[0]
 if prefix in tab_views:names,index=tab_views[prefix]
 if title=='Your private Traveler Safe':names=('safe-documents',)
 if title=='Safe · Share a selected item':names=('safe-share-form','safe-plan-share-form')
 if title=='Safe · Accept and use shared items':names=('safe-invitations','safe-plan-edit')
 if title=='Safe · Manage or stop sharing':names=('safe-stop-sharing','safe-plan-view')
 if not names or frame>=(5 if prefix=='Gallery' else 10)*fps:return None
 name=names[min(len(names)-1,int(frame/(5*fps)))]
 picture=cached_view(str(root/'assets/tutorial/app-tabs'/f'{name}.png')).copy()
 if picture.size!=(720,1280):raise ValueError('App screenshots must be 720 × 1280')
 draw=ImageDraw.Draw(picture)
 # Outline the actual selected bottom-tab button; keep the app navigation intact.
 if index is not None and frame%int(5*fps)<int(1.8*fps):
  x=index*120+7;draw.rounded_rectangle((x,1144,x+106,1263),radius=18,outline='#C9A962',width=3)
 return picture
