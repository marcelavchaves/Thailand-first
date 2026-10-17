import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('out');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.pdf':'application/pdf','.ttf':'font/ttf','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{try{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 let path=resolve(root,'.'+name);
 if(!path.startsWith(root+'/')&&path!==root)throw Error('Invalid path');
 for(const candidate of [path,path+'.html',path+'/index.html']){
  try{if((await stat(candidate)).isFile()){res.writeHead(200,{'Content-Type':mime[extname(candidate)]||'application/octet-stream'});res.end(await readFile(candidate));return;}}catch{}
 }
 res.writeHead(404);res.end('Not found');
}catch{res.writeHead(500);res.end('Error');}});
await new Promise(r=>server.listen(4173,'127.0.0.1',r));
const base='http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const routes=[];
async function walk(dir=''){for(const item of await readdir(resolve(root,dir),{withFileTypes:true})){const name=dir?dir+'/'+item.name:item.name;if(item.isDirectory())await walk(name);else if(name.endsWith('.html')&&!['404.html','_not-found.html'].includes(name))routes.push(name==='index.html'?'/':'/'+name.replace(/(?:\/index)?\.html$/,''));}}
await walk();
try{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  let safeUnlocked=false;
  const context=await browser.newContext({viewport,serviceWorkers:'block'});
  const errors=[];
  context.on('page',p=>p.on('pageerror',e=>{errors.push(e.message);console.error('BROWSER ERROR:',e.message);}));
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.origin!==base)return route.abort();
   if(!url.pathname.startsWith('/api/'))return route.continue();
   let body={items:{},entries:[],updates:[],comments:[],memories:[],attachments:[],documents:[],note:null,schedule:null,revision:null};
   if(url.pathname==='/api/guest-roster')body={guests:[],guestCount:0,revealed:false,revision:null};
   if(url.pathname==='/api/guest-profiles')body={};
   if(url.pathname==='/api/td-session'||url.pathname==='/api/master-admin')body={authenticated:false,configured:true};
   if(url.pathname==='/api/safe-session')body={authenticated:safeUnlocked,safeId:safeUnlocked?'TG01':null,displayName:'Synthetic Traveler'};
   if(url.pathname==='/api/safe-plans'){
    if(!safeUnlocked)return route.fulfill({status:401,contentType:'application/json',body:'{"error":"Unlock your Safe"}'});
    body={activities:[],revision:null};
   }
   if(url.pathname==='/api/director-photo')body={photo:null,revision:null};
   if(url.pathname==='/api/usage')return route.fulfill({status:401,contentType:'application/json',body:'{"error":"Sign in"}'});
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  const page=await context.newPage();
  for(const path of routes){
   const response=await page.goto(base+path,{waitUntil:'networkidle'});
   assert.equal(response.status(),200,path);
   assert.ok((await page.locator('body').innerText()).trim().length>20,'Empty page: '+path);
  }
  for(const tab of ['home','journey','hotels','info','more','gallery','td']){
   await page.goto(base+'/?tab='+tab,{waitUntil:'networkidle'});
   assert.ok((await page.locator('body').innerText()).length>40,'Empty tab: '+tab);
  }
  await page.goto(base+'/?tab=journey',{waitUntil:'networkidle'});
  assert.equal(await page.locator('.calendar-trip').count(),14);
  assert.match(await page.locator('.calendar-trip').first().getAttribute('aria-label'),/Saturday, October 17/);
  assert.match(await page.locator('.calendar-trip').last().getAttribute('aria-label'),/Friday, October 30/);
  await page.locator('.calendar-trip').first().click();
  await page.locator('.detail-date').waitFor({state:'attached',timeout:10000}).catch(async e=>{throw Error(e.message+'; errors='+JSON.stringify(errors)+'; body='+(await page.locator('body').innerText()).slice(0,2000));});
  assert.match(await page.locator('.detail-date').innerText(),/Saturday, October 17/);
  await page.getByRole('button',{name:'Next journey day'}).click();
  assert.match(await page.locator('.detail-date').innerText(),/Sunday, October 18/);
  await page.goto(base+'/?tab=journey&day=14',{waitUntil:'networkidle'});
  assert.match(await page.locator('.detail-date').innerText(),/Friday, October 30/);
  await page.goto(base+'/?tab=info',{waitUntil:'networkidle'});
  await page.getByText('The guest list is coming soon.',{exact:true}).waitFor();
  assert.equal(await page.locator('.guest-entry').count(),0);
  await page.goto(base+'/traveler-safe',{waitUntil:'networkidle'});
  assert.ok(await page.getByRole('heading',{name:'Unlock your Safe'}).isVisible());
  safeUnlocked=true;
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('.safe-calendar button').count(),18);
  assert.match(await page.locator('.safe-calendar button').first().innerText(),/PRE\s+Oct 15/);
  assert.match(await page.locator('.safe-calendar button').last().innerText(),/POST\s+Nov 1/);
  assert.equal(await page.locator('.safe-calendar .tour-day').count(),14);
  await page.locator('.safe-calendar button').last().click();
  assert.ok(await page.getByRole('heading',{name:'Sunday, November 1'}).isVisible());
  assert.deepEqual(errors,[],'Browser errors at viewport '+viewport.width);
  console.log('Passed '+routes.length+' routes, 7 tabs, journey navigation, empty guest list and Safe calendar at '+viewport.width+'px.');
  await context.close();
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
