import assert from 'node:assert/strict';import {mkdir,writeFile,readFile} from 'node:fs/promises';import {resolve} from 'node:path';
const base=process.argv[2],root=resolve(process.argv[3]),dest=root+'/assets/tutorial/app-tabs';await mkdir(dest,{recursive:true});const sanitizeCode=await readFile(root+'/scripts/tutorial-capture-sanitize.js','utf8');
const target=await(await fetch('http://127.0.0.1:9265/json/new?about:blank',{method:'PUT'})).json(),ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let seq=0;const pending=new Map(),errors=[];
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
ws.onmessage=async e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(m.error):p?.resolve(m.result);return;}
if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
if(m.method==='Fetch.requestPaused'){const p=m.params,u=new URL(p.request.url);
if(u.origin!==new URL(base).origin){await send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:204}).catch(()=>{});return;}
if(!u.pathname.startsWith('/api/')){await send('Fetch.continueRequest',{requestId:p.requestId}).catch(()=>{});return;}
let body={items:{},entries:[],guests:[],revealed:false,authenticated:false,configured:true,activities:[],revision:null};
if(u.pathname==='/api/guest-roster')body={guests:[{id:'00000000-0000-4000-8000-000000000001',name:'Sample Traveler',origin:'Your hometown',bio:'',safeId:'TG01',shareContact:false}],guestCount:1,revealed:true,revision:'sample'};
if(u.pathname==='/api/guest-profiles')body={};
if(u.pathname==='/api/xavier-notes')body={note:{tripDate:Number(u.searchParams.get('day')||5),text:'Welcome! Check your daily schedule and the latest TD announcements as we travel.'}};
if(u.pathname==='/api/tour-resources')body={items:{'schedule-5':{id:'schedule-5',visible:true,group:'schedules',title:'Schedule'}}};
await send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify(body)).toString('base64')}).catch(()=>{});
}};
await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*'}]});await send('Emulation.setDeviceMetricsOverride',{width:360,height:640,deviceScaleFactor:2,mobile:true});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value;};
async function wait(exp){for(let i=0;i<160;i++){if(await evaluate(exp))return;await new Promise(r=>setTimeout(r,80));}throw Error('Timeout '+exp+'\n'+await evaluate('document.body.innerText.slice(0,1500)'));}
async function clickNav(label){await evaluate('[...document.querySelectorAll(".bottom-nav button")].find(b=>b.textContent.trim()==='+JSON.stringify(label)+').click()');await wait('document.querySelector(".bottom-nav button.active")?.textContent.trim()==='+JSON.stringify(label));await new Promise(r=>setTimeout(r,300));}
async function capture(name){await evaluate('document.fonts.ready');await evaluate(sanitizeCode);await new Promise(r=>setTimeout(r,250));const text=await evaluate('document.body.innerText');assert(!/Xavier|Brunelle|@/.test(text));assert(text.includes('Home')&&text.includes('Maps')&&text.includes('Gallery'));const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(dest+'/'+name+'.png',Buffer.from(shot.data,'base64'));}
await send('Page.navigate',{url:base+'/?tab=home'});await wait('document.querySelectorAll(".bottom-nav button").length===6');await new Promise(r=>setTimeout(r,500));await capture('home');
await clickNav('Maps');await wait('document.querySelectorAll(".city-map-tile").length===8');await evaluate('scrollTo(0,0)');await capture('maps');
await clickNav('Essentials');await wait('!!document.querySelector(".more-tile-grid")');await evaluate('scrollTo(0,0)');await capture('essentials');
await clickNav('The Group');await wait('document.body.innerText.includes("Sample Traveler")');await evaluate('scrollTo(0,0)');await capture('group');await evaluate('document.querySelector(".guests").scrollIntoView({block:"start"})');await capture('group-details');
await clickNav('More…');await evaluate('scrollTo(0,0)');await capture('more');await evaluate('[...document.querySelectorAll(".more-tile")].find(b=>b.textContent.includes("Learn more")).click()');await new Promise(r=>setTimeout(r,500));await capture('more-details');
await clickNav('Gallery');await wait('!!document.querySelector(".wondercase-gallery")');await evaluate('scrollTo(0,0)');await capture('gallery');
assert.equal(errors.length,0,errors.join('\n'));await send('Target.closeTarget',{targetId:target.id});ws.close();console.log('PASS all six real tabs captured; sample roster and sanitized text; gallery navigation blocked; all APIs mocked.');
