// Dependency-free Chromium CDP verification against a static Vite preview.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
const out = resolve('artifacts/logo-verification');
await mkdir(out, {recursive:true});
const chrome = spawn('C:/Users/Lenovo/.cache/puppeteer/chrome/win64-150.0.7871.24/chrome-win64/chrome.exe', ['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=9238',`--user-data-dir=${tmpdir()}/nita-logo-cdp-${Date.now()}`], {windowsHide:true,stdio:'ignore'});
const pause = ms => new Promise(r=>setTimeout(r,ms));
let ws;
try {
  let endpoint;
  for(let i=0;i<100;i++){try{endpoint=await (await fetch('http://127.0.0.1:9238/json/version')).json();break;}catch{await pause(300);}}
  ws=new WebSocket(endpoint.webSocketDebuggerUrl);
  await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  let id=0; const waiting=new Map();
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=waiting.get(m.id);waiting.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});
  const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;waiting.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}));});
  const {targetId}=await send('Target.createTarget',{url:'about:blank'});
  const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
  const call=(m,p)=>send(m,p,sessionId);
  await call('Page.enable'); await call('Runtime.enable');
  await call('Network.enable'); await call('Network.setCacheDisabled',{cacheDisabled:true});
  await call('Page.addScriptToEvaluateOnNewDocument',{source:`const nativeFetch=window.fetch;window.fetch=(url,...args)=>String(url).startsWith('/api/')?Promise.resolve(new Response('[]',{headers:{'Content-Type':'application/json'}})):nativeFetch(url,...args);`});
  const evaluate=async expression=>(await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
  const results=[];
  for(const [label,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:label==='mobile'});
    await call('Page.navigate',{url:'http://127.0.0.1:4179/about'});
    for(let i=0;i<100;i++){if(await evaluate(`!!document.querySelector('#nita-brand-logo img')?.complete`))break;await pause(300);}
    await pause(1000);
    results.push({label,checks:await evaluate(`(()=>{const img=document.querySelector('#nita-brand-logo img'),footer=document.querySelector('#footer-logo img');return {navbarSource:img?.getAttribute('src'),navbarLoaded:img?.naturalWidth===900,footerLoaded:footer?.naturalWidth===900,navbarHref:img?.closest('a').getAttribute('href'),navbarBounds:img?.getBoundingClientRect().toJSON(),horizontalOverflow:document.documentElement.scrollWidth>innerWidth,iconLinks:[...document.querySelectorAll('link[rel="icon"]')].map(e=>e.href)}})()`)});
    await writeFile(`${out}/${label}-navbar.png`,Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
    if(label==='mobile'){
      await evaluate(`document.querySelector('#mobile-menu-toggle-btn').click()`);await pause(300);
      results.push({mobileMenuOpens:await evaluate(`!!document.querySelector('#mobile-nav-drawer')`)});
      await writeFile(`${out}/mobile-menu.png`,Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
    }
    await evaluate(`document.querySelector('#nita-brand-logo').click()`);await pause(500);
    results.push({label,homeNavigation:await evaluate(`location.pathname==='/'`),menuClosed:await evaluate(`!document.querySelector('#mobile-nav-drawer')`)});
    await evaluate(`document.querySelector('#main-footer').scrollIntoView();window.scrollBy(0,-100)`);await pause(300);
    await writeFile(`${out}/${label}-footer.png`,Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
  }
  results.push({assets:await evaluate(`Promise.all(['/assets/nita-logo-transparent.png','/favicon.png?v=nita-transparent-20261029','/favicon.ico?v=nita-transparent-20261029'].map(async url=>{const response=await fetch(url,{cache:'reload'});const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);return {url,status:response.status,mime:response.headers.get('content-type'),width:img.naturalWidth,height:img.naturalHeight,cornerAlpha:ctx.getImageData(0,0,1,1).data[3]}}))`)});
  for (const row of results) {
    if (row.checks && (row.checks.navbarSource !== '/assets/nita-logo-transparent.png' || !row.checks.navbarLoaded || !row.checks.footerLoaded || row.checks.horizontalOverflow)) throw new Error(`Logo verification failed: ${JSON.stringify(row)}`);
    if (row.homeNavigation === false || row.menuClosed === false || row.mobileMenuOpens === false) throw new Error('Navigation verification failed');
    if (row.assets?.some(asset=>asset.status!==200 || asset.cornerAlpha!==0)) throw new Error('Asset decoding/transparency verification failed');
  }
  await writeFile(`${out}/browser-results.json`,JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
} finally {ws?.close();chrome.kill();chrome.unref();}
