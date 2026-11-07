"""Render the filmed tab walkthrough from browser-captured sample app screens."""
from PIL import Image,ImageDraw
import json,math

def render_tabs(proc,fps,duration,chapters,root,out):
 folder=root/'assets/tutorial/demo-screens'
 hotspots=json.loads((folder/'hotspots.json').read_text())
 previous=None
 for chapter in range(len(chapters)):
  for phase in range(3):
   step=chapter*3+phase
   current=Image.open(folder/f'step-{step:02}.png').convert('RGB')
   for frame in range(duration*fps//3):
    seconds=frame/fps
    image=Image.blend(previous,current,min(1,seconds/.3)) if previous is not None and seconds<.3 else current.copy()
    draw=ImageDraw.Draw(image)
    point=hotspots[step]['nav' if phase==0 else 'feature']
    # A restrained tap ripple points to the selected tab or newly expanded feature.
    if .4<seconds<1.8:
     r=18+int(10*(seconds-.4)/1.4)
     draw.ellipse((point['x']-r,point['y']-r,point['x']+r,point['y']+r),outline='#C9A962',width=3)
     draw.ellipse((point['x']-4,point['y']-4,point['x']+4,point['y']+4),fill='#C9A962')
    draw.rectangle((24,1255,696,1261),fill='#e2e6da')
    progress=(step+frame/(duration*fps/3))/(len(chapters)*3)
    draw.rectangle((24,1255,24+672*progress,1261),fill='#C9A962')
    if frame==int(fps*2):image.save(out/f'demo-{step:02}.png')
    proc.stdin.write(image.tobytes())
   previous=current
