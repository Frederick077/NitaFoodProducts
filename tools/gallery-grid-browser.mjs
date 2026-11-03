import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const out = resolve('artifacts/gallery-grid-verification');
const base = 'http://127.0.0.1:4185';
await mkdir(out, { recursive: true });
const chrome = spawn('C:/Users/Lenovo/.cache/puppeteer/chrome/win64-150.0.7871.24/chrome-win64/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9244', `--user-data-dir=${tmpdir()}/nita-cleanup-${Date.now()}`], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(r => setTimeout(r, ms));
const results = { responsive: [], redirects: [], links: [], forms: [], keyboard: [], regressions: [], runtimeErrors: [] };
let ws;
try {
  let endpoint;
  for (let i = 0; i < 100; i++) { try { endpoint = await (await fetch('http://127.0.0.1:9244/json/version')).json(); break; } catch { await pause(300); } }
  ws = new WebSocket(endpoint.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const waiting = new Map();
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.exceptionThrown') results.runtimeErrors.push(m.params.exceptionDetails);
    if (m.id) { const p = waiting.get(m.id); waiting.delete(m.id); m.error ? p.reject(m.error) : p.resolve(m.result); }
  });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const n = ++id; waiting.set(n, { resolve, reject }); ws.send(JSON.stringify({ id: n, method, params, ...(sessionId ? { sessionId } : {}) })); });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const call = (m, p) => send(m, p, sessionId);
  await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable');
  await call('Network.setCacheDisabled', { cacheDisabled: true });
  // All app API calls, including form writes, are in-browser test doubles.
  await call('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__apiCalls=[]; const nativeFetch=window.fetch;
    window.fetch=(input,options={})=>{
      const url=String(input);if(!url.startsWith('/api/'))return nativeFetch(input,options);
      window.__apiCalls.push({url,method:options.method||'GET',body:options.body});
      let data=[];let status=200;
      if(url==='/api/messages'){
        const mode=sessionStorage.getItem('contact-response');
        if(mode==='network')return Promise.reject(new Error('Fixture network failure'));
        status=mode==='failure'?500:200;data={ok:status===200};
        return new Promise(resolve=>setTimeout(()=>resolve(new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}})),350));
      }
      if(url==='/api/products/fixture')data={id:'fixture',name:'Fixture pumpkin seeds',category:'Seeds',categoryId:'seeds',description:'Browser fixture only',available:true,publicationStatus:'PUBLISHED',featuredImageUrl:'/images/headers/contact-pumpkin-seeds-white-bowl.jpg',images:[],variants:[{id:'v1',name:'250g pack',size:'250g',price:8000,available:true}]};
      return Promise.resolve(new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}));
    };
  ` });
  const evaluate = async expression => { const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
  const waitFor = async expression => { for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await pause(100); } throw new Error(`Timed out: ${expression}`); };
  const go = async path => { await call('Page.navigate', { url: `${base}${path}` }); await waitFor(`document.readyState==='complete' && !!document.querySelector('#nita-public-header')`); await pause(250); };
  const key = async name => { await call('Page.bringToFront'); await call('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code: name, windowsVirtualKeyCode: name === 'Enter' ? 13 : name === 'Escape' ? 27 : 9, ...(name === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {}) }); await call('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code: name }); await pause(100); };
  const screenshot = async name => { await evaluate(`Promise.all([...document.querySelectorAll('img')].map(img=>{img.loading='eager';return img.decode().catch(()=>{})}))`); const { cssContentSize } = await call('Page.getLayoutMetrics'); const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: cssContentSize.width, height: cssContentSize.height, scale: 1 } }); await writeFile(`${out}/${name}.png`, Buffer.from(shot.data, 'base64')); };

  const photos = (await import('node:fs')).readdirSync('dist/assets').filter(n=>/hero-[123].*webp|NITA Pumpkin.*png/.test(n)).map(n=>'/assets/'+n);
  await call('Page.addScriptToEvaluateOnNewDocument',{source:`
    const earlierFetch=window.fetch;
    window.fetch=(input,options={})=>{
      if(String(input)==='/api/gallery'){
        const count=Number(sessionStorage.getItem('gallery-count')||10);
        const photos=${JSON.stringify(photos)};
        return Promise.resolve(new Response(JSON.stringify(Array.from({length:count},(_,i)=>({id:'fixture-'+i,title:'NITA photo '+i,altText:'NITA gallery fixture '+i,imageUrl:photos[i%photos.length],category:i%2?'Packaging':'Products',enabled:true,position:i}))),{status:200,headers:{'Content-Type':'application/json'}}));
      }
      return earlierFetch(input,options);
    };
  `});
  results.layouts=[];
  for(const width of [360,768,1440]){
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<700});
    for(const count of [1,2,3,7,8,10,17]){
      await go('/gallery');await evaluate(`sessionStorage.setItem('gallery-count','${count}')`);await go('/gallery');
      await waitFor(`document.querySelectorAll('.nita-gallery-group figure').length===${count}`);
      await evaluate(`Promise.all([...document.querySelectorAll('.nita-gallery-photo')].map(i=>{i.loading='eager';return i.decode().catch(()=>{})}))`);
      const layout=await evaluate(`(()=>{const figures=[...document.querySelectorAll('.nita-gallery-group figure')];const boxes=figures.map(e=>e.getBoundingClientRect());return {count:figures.length,overflow:document.documentElement.scrollWidth>innerWidth,background:getComputedStyle(document.querySelector('#gallery-page')).backgroundColor,transparentGrid:getComputedStyle(document.querySelector('.nita-gallery-grid')).backgroundColor,broken:document.querySelectorAll('.nita-gallery-photo:not(img)').length,decoded:[...document.querySelectorAll('img.nita-gallery-photo')].every(i=>i.naturalWidth>0),overlap:boxes.some((a,i)=>boxes.some((b,j)=>i<j&&a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1)),smallest:Math.min(...boxes.map(b=>Math.min(b.width,b.height)))}})()`);
      assert.equal(layout.count,count);assert.equal(layout.overflow,false);assert.equal(layout.background,'rgb(255, 255, 255)');assert.equal(layout.transparentGrid,'rgba(0, 0, 0, 0)');assert.equal(layout.broken,0);assert.equal(layout.decoded,true);assert.equal(layout.overlap,false);assert.ok(layout.smallest>40);
      if(width===1440&&count>=8){const dominant=await evaluate(`(()=>{const a=document.querySelector('.nita-gallery-group figure:first-child').getBoundingClientRect(),b=document.querySelector('.nita-gallery-group figure:nth-child(2)').getBoundingClientRect();return a.width>b.width*2&&a.height>b.height*1.3})()`);assert.equal(dominant,true);}
      results.layouts.push({width,count,...layout});
      if(count===10)await screenshot('gallery-'+width);
    }
  }
  await evaluate(`document.querySelector('.nita-gallery-photo-button').focus()`);await key('Enter');await waitFor(`document.querySelector('dialog.nita-gallery-dialog').open`);await key('Escape');await waitFor(`!document.querySelector('dialog.nita-gallery-dialog').open`);assert.equal(await evaluate(`document.activeElement.classList.contains('nita-gallery-photo-button')`),true);
  await evaluate(`document.querySelector('.nita-gallery-filters button:nth-child(2)').click()`);await waitFor(`document.querySelectorAll('.nita-gallery-group figure').length===9`);
  results.lightboxKeyboard='PASS';results.categoryFilter='PASS';assert.equal(results.runtimeErrors.length,0);
  await writeFile(out+'/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify({status:'PASS',layoutCases:results.layouts.length,keyboard:results.lightboxKeyboard,filter:results.categoryFilter,runtimeErrors:results.runtimeErrors.length}));
} finally {ws?.close();chrome.kill();}
