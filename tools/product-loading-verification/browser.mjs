import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const out = resolve('artifacts/product-loading-verification');
const base = 'http://127.0.0.1:4185';
await mkdir(out, { recursive: true });
const chrome = spawn('C:/Users/Lenovo/.cache/puppeteer/chrome/win64-150.0.7871.24/chrome-win64/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9243', `--user-data-dir=${tmpdir()}/nita-cleanup-${Date.now()}`], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(r => setTimeout(r, ms));
const results = { responsive: [], redirects: [], links: [], forms: [], keyboard: [], regressions: [], runtimeErrors: [] };
let ws;
try {
  let endpoint;
  for (let i = 0; i < 100; i++) { try { endpoint = await (await fetch('http://127.0.0.1:9243/json/version')).json(); break; } catch { await pause(300); } }
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

  const fixtures = ['Seeds', 'Granola'].map((category, i) => ({ id: `loading-fixture-${i}`, slug: `loading-fixture-${i}`, name: `Loading fixture ${category}`, category, categoryId: `category-${i}`, publicationStatus: 'PUBLISHED', description: 'Offline verification only', shortDescription: 'Offline fixture', available: true, isFeatured: true, ingredients: 'Fixture', featuredImageUrl: '/assets/nita-logo-transparent.png', images: [], variants: [{ id: `variant-${i}`, name: 'Fixture pack', size: '250g', price: 1000, available: true }] }));
  await call('Page.addScriptToEvaluateOnNewDocument', { source: `
    const previousFetch=window.fetch;window.__productRequests=[];
    window.fetch=(input,options={})=>{
      const url=String(input),mode=sessionStorage.getItem('product-test-mode')||'success';
      if(url.startsWith('/api/products')){
        window.__productRequests.push(url);
        if(mode==='network')return Promise.reject(new Error('Offline fixture network error'));
        if(mode==='failure')return Promise.resolve(new Response(JSON.stringify({error:'Offline fixture failure'}),{status:500,headers:{'Content-Type':'application/json'}}));
        if(mode==='html')return Promise.resolve(new Response('<html>Fixture fallback</html>',{status:200,headers:{'Content-Type':'text/html'}}));
        if(mode==='object')return Promise.resolve(new Response(JSON.stringify({products:[]}),{status:200,headers:{'Content-Type':'application/json'}}));
        let data=${JSON.stringify(fixtures)};
        if(mode==='empty'||(mode==='featured-empty'&&url.includes('featured=true')))data=[];
        if(!url.includes('?')&&url!=='/api/products')data=data.find(p=>url.endsWith(p.id)||url.endsWith(p.slug))||{};
        const response=()=>new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
        if(mode==='loading')return new Promise(resolve=>setTimeout(()=>resolve(response()),2000));
        return Promise.resolve(response());
      }
      if(url==='/api/categories')return Promise.resolve(new Response(JSON.stringify([{id:'category-0',name:'Seeds',slug:'seeds'},{id:'category-1',name:'Granola',slug:'granola'}]),{headers:{'Content-Type':'application/json'}}));
      return previousFetch(input,options);
    };
  ` });
  results.states = [];
  await go('/');
  for (const path of ['/', '/products']) {
    const root = path === '/' ? '#our-products' : '#products-catalog-page';
    // Use the page's actual showcase region without depending on an editorial ID.
    const region = path === '/' ? `document.querySelector('#featured-products-title').closest('section')` : `document.querySelector('#products-catalog-page')`;
    for (const mode of ['success', 'empty', 'failure', 'html', 'object', 'network', 'loading']) {
      await evaluate(`sessionStorage.setItem('product-test-mode',${JSON.stringify(mode)})`);
      await go(path);
      await waitFor(path === '/' ? `!!document.querySelector('#featured-products-title')` : `!!document.querySelector('#products-catalog-page')`);
      if (mode === 'loading') {
        assert.equal(await evaluate(`(${region}).querySelector('[aria-busy]')?.getAttribute('aria-busy')==='true'||(${region}).getAttribute('aria-busy')==='true'||!!(${region}).querySelector('.nita-showcase-loading,.nita-page-state[role="status"]')`), true);
        await waitFor(`(${region}).querySelectorAll('.nita-product-card').length===2`);
      } else if (mode === 'success') {
        await waitFor(`(${region}).querySelectorAll('.nita-product-card').length===2`);
        const image = await evaluate(`(()=>{const img=(${region}).querySelector('.nita-product-card img');img.loading='eager';return img.decode().then(()=>({width:img.naturalWidth,href:img.closest('a').getAttribute('href')}))})()`);
        assert.ok(image.width > 0); assert.equal(image.href, '/products/loading-fixture-0');
      } else if (mode === 'empty') {
        await waitFor(`(${region}).textContent.includes(${JSON.stringify(path === '/' ? 'No products' : 'No products to display')})`);
        assert.equal(await evaluate(`(${region}).querySelectorAll('[role="alert"]').length`), 0);
      } else {
        await waitFor(`!!(${region}).querySelector('[role="alert"]')`);
        const before = await evaluate(`window.__productRequests.filter(p=>p.startsWith('/api/products')).length`);
        await evaluate(`sessionStorage.setItem('product-test-mode','success');(${region}).querySelector('[role="alert"] button').click()`);
        await waitFor(`(${region}).querySelectorAll('.nita-product-card').length===2`);
        assert.ok(await evaluate(`window.__productRequests.filter(p=>p.startsWith('/api/products')).length`) > before);
      }
      results.states.push({ path, mode, passed: true });
    }
  }
  await evaluate(`sessionStorage.setItem('product-test-mode','featured-empty')`); await go('/');
  await waitFor(`document.querySelectorAll('#home-page .nita-product-card').length===2`);
  const requests = await evaluate(`window.__productRequests`);
  assert.ok(requests.includes('/api/products?featured=true') && requests.includes('/api/products'));
  results.states.push({ homepageFeaturedEmptyFallsBackToPublicCatalogue: true });
  await evaluate(`sessionStorage.setItem('product-test-mode','success')`); await go('/products?categoryId=category-0');
  await waitFor(`document.querySelectorAll('.nita-catalog-results .nita-product-card').length===1`);
  assert.equal(await evaluate(`document.querySelector('.nita-catalog-results .nita-product-card h3').textContent`), 'Loading fixture Seeds');
  await evaluate(`document.querySelector('.nita-catalog-results .nita-product-card h3 a').click()`);
  await waitFor(`document.querySelector('main h1')?.textContent==='Loading fixture Seeds'`);
  results.regressions.push({ categoryFilterAndProductDetailLink: true });
  assert.equal(results.runtimeErrors.length, 0); results.status = 'PASS';
  await writeFile(`${out}/browser-results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ status: results.status, stateCases: results.states.length, categoryAndDetailChecks: true, runtimeErrors: results.runtimeErrors.length }, null, 2));
} catch (error) { results.status = 'FAIL'; results.error = String(error); await writeFile(`${out}/browser-results.json`, JSON.stringify(results, null, 2)); throw error; }
finally { ws?.close(); chrome.kill(); chrome.unref(); }
