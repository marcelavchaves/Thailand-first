import assert from 'node:assert/strict';import {writeFile,mkdir} from 'node:fs/promises';
const base=process.argv[2]||'http://127.0.0.1:3081';assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Use a local preview only');let logged=false,td=true,linked=true,loginCalls=0,recoveryCalls=0,signupCalls=0,googleCalls=0,updates=0,accessSaves=0;const exceptions=[];
let sharingRows=[],sendCalls=0,editCalls=0;const ownActivity={id:'00000000-0000-4000-8000-000000000100',time:'09:00',title:'My walking plan',place:'Hotel',note:''};let incomingActivity={id:'00000000-0000-4000-8000-000000000200',time:'10:00',title:'Incoming museum plan',place:'Museum',note:'Meet in the lobby'};
const email='guest@example.test',user={id:'identity-guest',email,confirmed_at:'2026-11-01T00:00:00Z',app_metadata:{provider:'email',roles:[]},user_metadata:{}};
const jwt=[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,email,exp:Math.floor(Date.now()/1000)+3600,aud:'authenticated'})).toString('base64url'),'testsignature'].join('.');
const target=await(await fetch('http://127.0.0.1:9265/json/new?about:blank',{method:'PUT'})).json(),ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let seq=0;const pending=new Map();
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
ws.onmessage=async e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(m.error):p?.resolve(m.result);return;}if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Page.javascriptDialogOpening'){await send('Page.handleJavaScriptDialog',{accept:true});return;}
 if(m.method==='Fetch.requestPaused'){const p=m.params,u=new URL(p.request.url);let body={items:{},entries:[],guests:[],revealed:false},status=200,mime='application/json',raw;
 if(u.pathname.startsWith('/.netlify/identity/')){
  const path=u.pathname.split('/').pop();
  if(path==='settings')body={autoconfirm:false,disable_signup:false,external:{google:true,email:true}};
  if(path==='token'){logged=true;loginCalls++;body={access_token:jwt,refresh_token:'test-refresh',expires_in:3600,token_type:'bearer'};}
  if(path==='user'){if(p.request.method==='PUT')updates++;body=user;}
  if(path==='logout'){logged=false;body={};}
  if(path==='signup'){signupCalls++;assert.equal(new URL(u.searchParams.get('redirect_to')).pathname,'/traveler-safe');body={...user,confirmed_at:null};}
  if(path==='recover'){recoveryCalls++;assert.equal(new URL(u.searchParams.get('redirect_to')).pathname,'/traveler-safe');body={};}
  if(path==='verify'){logged=true;body={access_token:jwt,refresh_token:'test-refresh',expires_in:3600,token_type:'bearer'};}
  if(path==='authorize'){googleCalls++;assert.equal(u.searchParams.get('provider'),'google');assert.equal(new URL(u.searchParams.get('redirect_to')).pathname,'/traveler-safe');logged=true;mime='text/html';raw=`<script>location.replace('/#access_token=${jwt}&refresh_token=test-refresh&token_type=bearer')</script>`;}
 }
 if(u.pathname==='/api/safe-session'){
  if(p.request.method==='DELETE'){logged=false;body={ok:true};}else body={authenticated:logged,identityAuthenticated:logged,email:logged?email:null,username:logged?'personal-test':null,safeId:'',nickname:'',displayName:'My Safe'};
 }
 if(u.pathname==='/api/safe-documents')body={documents:[{id:'doc1',name:'Existing private ticket.pdf',type:'application/pdf',size:100,created:'2026-11-01'}],revision:'docs1'};
 if(u.pathname==='/api/safe-plans')body={activities:[ownActivity],revision:'own1'};

 if(u.pathname==='/api/safe-sharing'){
  const id=u.searchParams.get('id');
  if(p.request.method==='POST'){
   const b=JSON.parse(p.request.postData);
   if(b.action==='create'){sendCalls++;assert.equal(b.email,'friend@example.test');assert.equal(b.permission,'view');sharingRows.push({id:'sent1',version:'v1',kind:b.kind,title:b.kind==='document'?'Existing private ticket.pdf':'My walking plan',toEmail:b.email,fromEmail:email,permission:b.permission,status:'pending',available:true,outgoing:true});}
   else{const row=sharingRows.find(s=>s.id===b.id);assert(row);row.status=b.action==='accept'?'accepted':b.action==='revoke'?'revoked':'declined';row.version='v2';}
   body={ok:true};
  }else if(p.request.method==='PUT'){const b=JSON.parse(p.request.postData);editCalls++;assert.equal(b.id,'incoming-plan');incomingActivity=b.activity;body={saved:true,activity:incomingActivity,revision:'edit2'};}
  else if(u.searchParams.get('download')==='1'){mime='application/pdf';raw='%PDF-1.4 Sample shared document';}
  else if(id){body={kind:'plan',date:'2026-11-16',permission:id==='readonly'?'view':'edit',activity:id==='readonly'?{...incomingActivity,title:'Read-only plan'}:incomingActivity,revision:'edit1'};}
  else body={incoming:sharingRows.filter(s=>!s.outgoing&&['pending','accepted'].includes(s.status)),outgoing:sharingRows.filter(s=>s.outgoing)};
 }
 if(u.pathname==='/api/td-session')body={authenticated:td,configured:true};
 if(u.pathname==='/api/guest-profiles')body={};
 if(u.pathname==='/api/safe-access'){if(p.request.method==='PUT'){accessSaves++;const b=JSON.parse(p.request.postData);assert.equal(b.guests[0].emails[0],email);linked=true;body={saved:true};}else body={revision:'a1',rosterRevision:'r1',guests:[{id:'guest1',name:'Sample Guest',safeId:'TG01',emails:linked?[email]:[]}]};}
 await send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:mime}],body:Buffer.from(raw||JSON.stringify(body)).toString('base64')}).catch(e=>{if(e.message!=='Invalid InterceptionId.')throw e;});}};
await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*/api/*'},{urlPattern:'*/.netlify/identity/*'}]});
const evalJS=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value;},pause=()=>new Promise(r=>setTimeout(r,150));async function waitFor(exp){for(let i=0;i<120;i++){if(await evalJS(exp))return;await pause();}throw Error('Timed out '+exp+'\n'+await evalJS('document.body.innerText.slice(0,1400)'));}
const click=(text)=>evalJS(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)}).click()`);
async function fill(selector,value){await evalJS(`{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));}`);}

const captureDir=(process.argv[3]||process.cwd())+'/assets/tutorial/app-tabs';await mkdir(captureDir,{recursive:true});
async function capture(name,selector){
 await send('Emulation.setDeviceMetricsOverride',{width:360,height:640,deviceScaleFactor:2,mobile:true});
 await evalJS('document.documentElement.style.scrollbarWidth="none";document.body.style.scrollbarWidth="none"');
 await evalJS('(()=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(["SCRIPT","STYLE"].includes(n.parentElement?.tagName))continue;const t=n.textContent.replace(/\\b\\d{4}-\\d{2}-\\d{2}\\b/g,"Journey day");if(t!==n.textContent)n.textContent=t;}})()');
 await evalJS('document.querySelector('+JSON.stringify(selector)+').scrollIntoView({block:"start"})');
 await new Promise(r=>setTimeout(r,150));
 const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(captureDir+'/'+name+'.png',Buffer.from(shot.data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
}
sharingRows=[
{id:'incoming-plan',version:'v1',kind:'plan',date:'2026-11-16',permission:'edit',status:'pending',fromEmail:'friend@example.test',toEmail:email,title:'Incoming museum plan',available:true},
{id:'readonly',version:'v1',kind:'plan',date:'2026-11-16',permission:'view',status:'accepted',fromEmail:'friend@example.test',toEmail:email,title:'Read-only plan',available:true},
{id:'incoming-doc',version:'v1',kind:'document',permission:'view',status:'accepted',fromEmail:'friend@example.test',toEmail:email,title:'Shared travel note.pdf',available:true}
];
await send('Storage.clearDataForOrigin',{origin:base,storageTypes:'all'});
await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:'/tmp/safe-share-browser-downloads'});
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await send('Page.navigate',{url:base+'/traveler-safe.html'});
await waitFor('!!document.querySelector("input[type=email]")');
await fill('input[type=email]',email);await fill('input[type=password]','Some test password 123');await evalJS('document.querySelector("form").requestSubmit()');
await waitFor('document.body.innerText.includes("Existing private ticket.pdf")&&document.body.innerText.includes("Incoming museum plan")');
assert(!/Nickname|Your Safe name|Save nickname/.test(await evalJS('document.body.innerText')));await capture('safe-documents','.safe-account');await capture('safe-invitations','.safe-sharing');
await evalJS('document.querySelector(".safe-doc-list .safe-share-control>button").click()');
await fill('.safe-doc-list input[type=email]','friend@example.test');await capture('safe-share-form','.safe-doc-list .safe-share-control');
assert.equal(await evalJS('document.querySelector(".safe-doc-list select")'),null);
await evalJS('document.querySelector(".safe-doc-list .safe-share-control form").requestSubmit()');
await waitFor('document.body.innerText.includes("Awaiting acceptance")');assert.equal(sendCalls,1);await evalJS('document.querySelector(".safe-activity-list .safe-share-control>button").click()');await fill('.safe-activity-list input[type=email]','friend@example.test');await evalJS('(()=>{const s=document.querySelector(".safe-activity-list select");s.value="edit";s.dispatchEvent(new Event("change",{bubbles:true}));})()');await capture('safe-plan-share-form','.safe-activity-list .safe-share-control');await evalJS('document.querySelector(".safe-activity-list .safe-share-control>button").click()');
const itemButton=(title,text)=>evalJS('[...[...document.querySelectorAll(".safe-shared-list li")].find(li=>li.querySelector("strong").textContent==='+JSON.stringify(title)+').querySelectorAll("button")].find(b=>b.textContent==='+JSON.stringify(text)+').click()');
await itemButton('Incoming museum plan','Accept');await waitFor('document.body.innerText.includes("Item accepted.")');
await itemButton('Incoming museum plan','View shared plan');await waitFor('document.body.innerText.includes("Edit shared plan")');await click('Edit shared plan');await capture('safe-plan-edit','.safe-shared-plan');
await fill('.safe-shared-plan input[maxlength="160"]','Museum together');
await evalJS('window.dispatchEvent(new Event("safe-sharing-changed"))');
assert.equal(await evalJS('document.querySelectorAll(".safe-shared-plan input")[1].value'),'Museum together');
await evalJS('document.querySelector(".safe-shared-plan form").requestSubmit()');await waitFor('document.body.innerText.includes("Shared plan updated")');assert.equal(editCalls,1);
await itemButton('Read-only plan','View shared plan');await waitFor('document.querySelector(".safe-shared-plan")?.innerText.includes("Read-only plan")');assert(!await evalJS('document.querySelector(".safe-shared-plan").innerText.includes("Edit shared plan")'));
await capture('safe-plan-view','.safe-shared-plan');await itemButton('Shared travel note.pdf','Download shared document');await waitFor('document.body.innerText.includes("Downloaded copies remain")');
await evalJS('[...document.querySelectorAll(".safe-sharing h3")].find(h=>h.textContent==="Shared by me").id="capture-outgoing"');await capture('safe-stop-sharing','#capture-outgoing');await itemButton('Existing private ticket.pdf','Stop sharing');await waitFor('document.body.innerText.includes("Sharing stopped")');
for(const width of [320,390,768]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:true});assert(await evalJS('document.documentElement.scrollWidth<=innerWidth'));}
assert(await evalJS('document.querySelector(".safe-activity-list .safe-share-control button")?.textContent==="Share"'));
await send('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});await evalJS('document.querySelector(".safe-sharing").scrollIntoView({block:"start"})');const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/prototype-safe-sharing.png',Buffer.from(shot.data,'base64'));await click('Sign out');await waitFor('document.body.innerText.includes("Continue with Google")');assert(!await evalJS('document.body.innerText.includes("Incoming museum plan")'));
assert.equal(exceptions.length,0,exceptions.join('\n'));console.log('PASS captured sharing tutorial views; browser: no Safe-name UI; document invite; recipient acceptance; editable/read-only plans; unsaved edit survives background refresh; download; revocation; sign-out privacy and responsive layouts (API/provider mocked).');await send('Target.closeTarget',{targetId:target.id});ws.close();
