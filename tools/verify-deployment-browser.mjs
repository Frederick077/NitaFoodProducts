import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { deploymentSimulator } from './deployment-simulator.mjs';
import { apiFixture } from '../tests/helpers/apiSecurityFixture.ts';

const fixture = await apiFixture({serveFrontend:false});
const server = deploymentSimulator({apiHandler:fixture.app});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const out=path.resolve('artifacts/phase2c-vercel-preparation');
const chrome=spawn('C:/Users/Lenovo/.cache/puppeteer/chrome/win64-150.0.7871.24/chrome-win64/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=9243',`--user-data-dir=${tmpdir()}/nita-phase2c-${Date.now()}`],{windowsHide:true,stdio:'ignore'});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const results={checks:[],runtimeErrors:[],cspViolations:[],forms:[]};
let ws;
try {
  let endpoint;
  for(let i=0;i<100;i++){try{endpoint=await(await fetch('http://127.0.0.1:9243/json/version')).json();break;}catch{await pause(200);}}
  ws=new WebSocket(endpoint.webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
  let id=0;const pending=new Map();
  ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.method==='Runtime.exceptionThrown')results.runtimeErrors.push(m.params.exceptionDetails);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});
  const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}));});
  const {targetId}=await send('Target.createTarget',{url:'about:blank'});const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});const call=(m,p)=>send(m,p,sessionId);
  await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
  await call('Page.addScriptToEvaluateOnNewDocument',{source:`window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push({directive:e.violatedDirective,blocked:e.blockedURI}));`});
  const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  for(const width of [1440,768,390]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});
    for(const route of ['/','/about','/products','/products/fixture-seeds','/contact','/gallery','/educational-hub','/admin/login']) {
      await call('Page.navigate',{url:base+route});
      let loaded=false;for(let i=0;i<100;i++){if(await evaluate(`document.readyState==='complete'&&!!document.querySelector('#nita-app-container')`)){loaded=true;break;}await pause(100);}assert.ok(loaded,route);
      await pause(250);
      const check=await evaluate(`({title:document.title,overflow:document.documentElement.scrollWidth>innerWidth,brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.getAttribute('src')),csp:window.__csp,body:document.body.innerText.length,login:location.pathname.includes('/admin')?{email:document.querySelector('input[type=email]')?.value,password:document.querySelector('input[type=password]')?.value}:undefined})`);
      results.checks.push({route,width,...check});results.cspViolations.push(...check.csp);
      assert.equal(check.overflow,false,`${route} ${width}`);assert.deepEqual(check.brokenImages,[],`${route} images`);assert.ok(check.body>100);
      if(check.login){assert.equal(check.login.email,'');assert.equal(check.login.password,'');}
      if(width===390&&['/about','/admin/login'].includes(route)){const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,route==='/about'?'about-390.png':'admin-390.png'),Buffer.from(shot.data,'base64'));}
    }
  }
  // Real request through emitted routes and the fixture's actual contact handler.
  const form=await evaluate(`fetch('/api/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Browser fixture',email:'browser@example.invalid',message:'Offline deployment verification'})}).then(async r=>({status:r.status,body:await r.json()}))`);
  assert.equal(form.status,201);results.forms.push(form);assert.equal(fixture.writes.messages.length,1);
  assert.deepEqual(results.runtimeErrors,[]);assert.deepEqual(results.cspViolations,[]);
  fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(results,null,2));
  console.log(`Browser verification passed: ${results.checks.length} desktop/tablet/mobile route checks; no CSP violations, overflow, broken remaining image elements or runtime exceptions. Contact write used only a fixture.`);
}finally{ws?.close();chrome.kill();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await fixture.close();}
