import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';
const base=process.argv[2],root=resolve(process.argv[3]||'.'),destination=root+'/assets/tutorial/demo-screens';await mkdir(destination,{recursive:true});
const target=await(await fetch('http://127.0.0.1:9265/json/new?about:blank',{method:'PUT'})).json(),ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let seq=0;const pending=new Map(),errors=[];const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(m.error):p?.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);};
await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:720,height:1280,deviceScaleFactor:1,mobile:false});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,userGesture:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value;};
async function wait(exp){for(let i=0;i<120;i++){if(await evaluate(exp))return;await new Promise(r=>setTimeout(r,80));}throw Error('Timeout '+exp);}
const hotspots=[];
for(let step=0;step<30;step++){
 await send('Page.navigate',{url:base+'/tutorial-explore.html?capture=1&step='+step});
 await wait('document.querySelector(".is-capture")?.dataset.step==="'+step+'"&&document.readyState==="complete"');
 await evaluate('document.documentElement.style.overflow="hidden";document.body.style.overflow="hidden"');await evaluate('document.fonts.ready');await evaluate('Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))');
 await new Promise(r=>setTimeout(r,380));
 const text=await evaluate('document.body.innerText');assert(!/Xavier|2026|November|December|Tauck/.test(text));
 assert.equal(await evaluate('document.querySelectorAll(".demo-nav button").length'),6);
 if([7,10,11,12,14].includes(step))await evaluate('document.querySelector(".demo-content").scrollTop=1000');
 if(step===12){await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Hotel details")).click()');await evaluate('document.querySelector(".demo-content").scrollTop=1000');}
 if(step===25)await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Reveal answer").click()');
 await evaluate('window.scrollTo(0,0)');
 const nav=await evaluate('(()=>{const r=document.querySelector(".demo-nav [aria-pressed=true]").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()');
 const feature=await evaluate('(()=>{const el=document.querySelector(".demo-tiles .is-highlighted")||document.querySelector(".demo-content .demo-card:last-child h3")||document.querySelector(".demo-content h2");const r=el.getBoundingClientRect();return {x:Math.max(70,Math.min(650,r.x+r.width/2)),y:Math.max(260,Math.min(1000,r.y+r.height/2))};})()');
 hotspots.push({step,nav,feature});
 const shot=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width:720,height:1280,scale:1}});await writeFile(destination+'/step-'+String(step).padStart(2,'0')+'.png',Buffer.from(shot.data,'base64'));
}
await writeFile(destination+'/hotspots.json',JSON.stringify(hotspots,null,2)+'\n');
assert.equal(errors.length,0,errors.join('\n'));await send('Target.closeTarget',{targetId:target.id});ws.close();console.log('Captured and checked all 30 tab/feature demonstration states for '+base);
