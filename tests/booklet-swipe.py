"""After `npx next build --webpack`, run with Python Playwright and Chromium installed.
Exercises browser input events against the built app; API responses are test fixtures.
"""
import json, os, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
root=Path(__file__).resolve().parents[1];books=json.loads((root/'shared/booklets.json').read_text());items={b['id']:{'id':b['id'],'title':b['title'],'group':'handouts','visible':True,'revision':None} for b in books}
state={'td':False};writes=[]
class QuietHandler(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(root/'out')))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}' 
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 ctx=browser.new_context(viewport={'width':390,'height':844},service_workers='block',has_touch=True);errors=[]
 def api(route):
  url=route.request.url;body={}
  if '/api/tour-resources' in url:
   if route.request.method=='PUT':
    d=route.request.post_data_json;writes.append(d);items[d['id']]['visible']=d['action']=='reveal';items[d['id']]['revision']='updated';body={'saved':True}
   else:body={'items':items}
  elif '/api/td-session' in url:body={'authenticated':state['td'],'configured':True,'masterAdmin':False}
  elif '/api/guest-roster' in url:body={'guests':[],'guestCount':0,'revealed':False}
  elif '/api/day-features' in url:body={'items':{}}
  else:body={'items':{},'entries':[],'updates':[],'comments':[],'memories':[],'attachments':[],'documents':[],'note':None,'schedule':None,'revision':None,'guests':[]}
  route.fulfill(json=body)
 ctx.route('**/api/**',api);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 def handouts():
  page.goto(base+'/?tab=hotels');page.get_by_role('button',name='Handouts',exact=True).click();page.locator('.booklet-cover-tile').first.wait_for()
 handouts();page.locator('.booklet-cover-tile').first.click()
 page.get_by_role('button',name='Go to Cover',exact=True).click()
 cdp=ctx.new_cdp_session(page)
 def swipe(x1,y1,x2,y2):
  cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x1,'y':y1}]})
  for i in range(1,11):
   cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x1+(x2-x1)*i/10,'y':y1+(y2-y1)*i/10}]});page.wait_for_timeout(20)
  cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_timeout(100)
 def current():return page.locator('.booklet-reader-footer>span').inner_text()
 swipe(300,400,80,410);assert '2 of 4' in current(),current()
 swipe(80,400,300,410);assert '1 of 4' in current(),current()
 swipe(200,300,210,550);assert '1 of 4' in current(),'Vertical pan turned page'
 swipe(200,400,180,402);assert '1 of 4' in current(),'Short gesture turned page'
 page.mouse.move(300,400);page.mouse.down();page.mouse.move(80,410,steps=10);page.mouse.up();assert '2 of 4' in current(),current()
 page.mouse.move(80,400);page.mouse.down();page.mouse.move(300,410,steps=10);page.mouse.up();assert '1 of 4' in current(),current()
 # Ordinary taps remain distinct from swipes.
 page.wait_for_timeout(550);page.locator('.booklet-page').click();assert 'booklet-controls-hidden' in page.locator('.booklet-reader').get_attribute('class')
 page.locator('.booklet-page').click();assert 'booklet-controls-hidden' not in page.locator('.booklet-reader').get_attribute('class')
 page.get_by_role('button',name='Next page',exact=True).click();assert '2 of 4' in current()
 page.get_by_role('button',name='Pages',exact=True).click();page.locator('.booklet-page-chooser button').first.click();assert '1 of 4' in current()
 page.get_by_role('button',name='＋ Zoom',exact=True).click();assert page.locator('.booklet-zoom').is_visible();page.keyboard.press('Escape')
 page.keyboard.press('Escape');page.set_viewport_size({'width':1200,'height':800});page.locator('.booklet-cover-tile').first.click()
 swipe(1100,400,850,410);assert '2 of 4' in current(),current()
 swipe(80,400,330,410);assert '1 of 4' in current(),current()
 # A gesture that starts on the page can end outside its bounds.
 page.mouse.move(800,400);page.mouse.down();page.mouse.move(30,410,steps=10);page.mouse.up();assert '2 of 4' in current()
 page.keyboard.press('Escape');page.locator('.booklet-cover-tile').first.click();expect(page.locator('.booklet-reader-footer>span')).to_contain_text('2 of 4')
 assert not errors,errors
 browser.close();server.shutdown()
 print('PASS: real browser touch and mouse swipes forward/back, landscape margins, capture outside page, vertical/short gestures, taps, buttons, zoom, chooser and remembered position.')
