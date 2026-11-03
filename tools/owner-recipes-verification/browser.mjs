import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const out = resolve('artifacts/owner-recipes-verification');
const base = 'http://127.0.0.1:4183';
await mkdir(out, { recursive: true });
const chrome = spawn('C:/Users/Lenovo/.cache/puppeteer/chrome/win64-150.0.7871.24/chrome-win64/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9241', `--user-data-dir=${tmpdir()}/nita-cleanup-${Date.now()}`], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(r => setTimeout(r, ms));
const results = { responsive: [], redirects: [], links: [], forms: [], keyboard: [], regressions: [], runtimeErrors: [] };
let ws;
try {
  let endpoint;
  for (let i = 0; i < 100; i++) { try { endpoint = await (await fetch('http://127.0.0.1:9241/json/version')).json(); break; } catch { await pause(300); } }
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

  const expectedRecipes = JSON.parse(await readFile(new URL('../../tests/fixtures/owner-recipes.json', import.meta.url), 'utf8'));
  const approvedMessage = 'Hello NITA Food Products! I am visiting your website and I would like to learn more about your nutritional seed products and healthy services. How can I place an order or get started? 🌿';
  const names = ['NITA Pumpkin Seed Powder', 'NITA Chia Seeds', 'NITA Pumpkin Seeds (Roasted & Salted)', 'NITA Flour', 'NITA Pumpkin Powder', 'NITA Granola Cereals', 'NITA Sunflower Seeds', 'NITA Sesame Seeds'];
  const products = names.map((name, i) => ({ id: `fixture-${i}`, name, category: 'Seeds', categoryId: 'seed', publicationStatus: 'PUBLISHED', description: 'Browser-only fixture', available: true, variants: [{ id: `v-${i}`, size: '250g', name: '250g', available: true, price: 1000 }], images: [] }));
  products.push({ ...products[0], id: 'wrong-bar', name: 'NITA Granola Snack Bar' }, { ...products[0], id: 'draft', publicationStatus: 'DRAFT' });
  await call('Page.addScriptToEvaluateOnNewDocument', { source: `
    const previousFetch=window.fetch;const fixtureProducts=${JSON.stringify(products)};
    window.fetch=(input,options={})=>{
      const url=String(input),mode=sessionStorage.getItem('recipe-catalogue');
      if(url==='/api/products')return Promise.resolve(new Response(JSON.stringify(mode==='empty'?[]:fixtureProducts),{status:mode==='failure'?500:200,headers:{'Content-Type':'application/json'}}));
      if(url.startsWith('/api/products/')){const product=fixtureProducts.find(p=>p.id===decodeURIComponent(url.split('/').pop()));return Promise.resolve(new Response(JSON.stringify(product||{}),{status:product?200:404,headers:{'Content-Type':'application/json'}}));}
      return previousFetch(input,options);
    };
  ` });
  results.recipes = [];
  for (const width of [1440, 768, 390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 640 });
    await go('/explore/recipes'); await waitFor(`document.querySelectorAll('.nita-recipe-list article').length===3`);
    await waitFor(`!!document.querySelector('.nita-recipe-shop a[href="/products/fixture-0"]')`);
    const displayed = await evaluate(`[...document.querySelectorAll('.nita-recipe-list article')].map(a=>({title:a.querySelector('h2').textContent,desc:a.querySelector('.nita-recipe-intro > p').textContent,meta:a.querySelector('.nita-recipe-meta').textContent,ingredients:[...a.querySelectorAll('.nita-recipe-method ul li')].map(e=>e.textContent),instructions:[...a.querySelectorAll('.nita-recipe-method ol li')].map(e=>e.textContent),labels:[...a.querySelectorAll('.nita-recipe-method h3')].map(e=>e.textContent)}))`);
    const expected = expectedRecipes.map(({ prepTime, servings, ...r }) => ({ ...r, meta: `Prep Time: ${prepTime} | Servings: ${servings}`, labels: ['Ingredients:', 'Instructions:'] }));
    assert.deepEqual(displayed, expected);
    assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth`), false);
    assert.equal(await evaluate(`document.querySelectorAll('main figcaption').length`), 0);
    assert.equal(await evaluate(`document.querySelectorAll('.nita-recipe-shop > a').length`), 3);
    assert.equal(await evaluate(`!!document.querySelector('a[href="/explore/news"],a[href="/products/wrong-bar"],a[href="/products/draft"]')`), false);
    const indices = await evaluate(`[...document.querySelectorAll('.nita-recipe-index a')].map(a=>({text:a.textContent,href:a.getAttribute('href')}))`);
    assert.deepEqual(indices, expectedRecipes.map((r, i) => ({ text: r.title, href: `#recipe-${i + 1}` })));
    await screenshot(`recipes-${width}`);
    await evaluate(`document.querySelector('.nita-recipe-index a[href="#recipe-2"]').click()`); await pause(250);
    assert.equal(await evaluate(`location.hash`), '#recipe-2');
    assert.ok(await evaluate(`document.querySelector('#recipe-2').getBoundingClientRect().top>=88`));
    results.recipes.push({ width, characterExact: true, orderAndNavigation: true, noOverflow: true });

    await go('/contact'); await waitFor(`document.querySelector('.nita-contact-banner-photo')?.naturalWidth>0`);
    const contact = await evaluate(`(()=>{const a=document.querySelector('#contact-whatsapp');return {phones:[...document.querySelectorAll('a[href^="tel:"]')].map(e=>({href:e.getAttribute('href'),text:e.textContent})),whatsapp:a.href,label:a.getAttribute('aria-label'),svg:!!a.querySelector('svg'),hero:document.querySelector('.nita-contact-banner-photo').getAttribute('src'),overflow:document.documentElement.scrollWidth>innerWidth,title:document.querySelector('#contact-title').textContent,icons:document.querySelectorAll('.nita-contact-method svg').length}})()`);
    assert.ok(contact.phones.every(p => p.href === 'tel:+255757542585' && p.text === '0757 542 585'));
    assert.equal(new URL(contact.whatsapp).pathname, '/255757542585');
    assert.equal(new URL(contact.whatsapp).searchParams.get('text'), approvedMessage);
    assert.ok(contact.svg && contact.label); assert.equal(contact.icons, 3); assert.equal(contact.title, 'Say Hello!'); assert.equal(contact.overflow, false);
    assert.equal(contact.hero, '/images/headers/contact-phone-notepad-communication.jpg');
    await screenshot(`contact-${width}`);
    await evaluate(`document.activeElement?.blur();document.querySelector('#main-footer').scrollIntoView()`);
    await waitFor(`!!document.querySelector('#nita-whatsapp-dock a')`);
    assert.equal(await evaluate(`new URL(document.querySelector('#nita-whatsapp-dock a').href).searchParams.get('text')`), approvedMessage);
    results.responsive.push({ width, ...contact, footerWhatsAppExact: true });
  }

  // Every product detail action resolves using an ID actually returned by the fixture catalogue.
  await go('/explore/recipes'); await waitFor(`!!document.querySelector('.nita-recipe-shop a[href="/products/fixture-0"]')`);
  const detailLinks = await evaluate(`[...document.querySelectorAll('.nita-recipe-shop li a')].map(a=>({href:a.getAttribute('href'),name:a.textContent}))`);
  assert.equal(detailLinks.length, 8);
  for (const link of detailLinks) { await go('/explore/recipes'); await waitFor(`!!document.querySelector('.nita-recipe-shop a[href="${link.href}"]')`); await evaluate(`document.querySelector('.nita-recipe-shop a[href="${link.href}"]').click()`); await waitFor(`document.querySelector('main h1')?.textContent===${JSON.stringify(link.name)}`); results.links.push(link); }
  // Product-specific messages retain context and switch only their destination number.
  await go('/products/fixture-6'); await waitFor(`document.querySelector('#floating-whatsapp-btn')?.href.includes('Sunflower')`);
  const specialized = new URL(await evaluate(`document.querySelector('#floating-whatsapp-btn').href`));
  assert.equal(specialized.pathname, '/255757542585'); assert.ok(specialized.searchParams.get('text').includes('NITA Sunflower Seeds')); assert.ok(specialized.searchParams.get('text').includes('250g')); results.regressions.push({ specializedProductContext: true });

  for (const mode of ['empty', 'failure']) {
    await evaluate(`sessionStorage.setItem('recipe-catalogue',${JSON.stringify(mode)})`); await go('/explore/recipes'); await pause(400);
    const fallback = await evaluate(`[...document.querySelectorAll('.nita-recipe-shop li a')].map(a=>a.getAttribute('href'))`);
    assert.equal(fallback.length, 8); assert.ok(fallback.every(href => href.startsWith('/products?search=')));
    await evaluate(`document.querySelector('.nita-recipe-shop li a').click()`); await waitFor(`location.pathname==='/products'`);
    assert.equal(await evaluate(`new URLSearchParams(location.search).get('search')`), 'Pumpkin Seed Powder');
    results.regressions.push({ mode, workingSearchFallback: true });
  }
  await evaluate(`sessionStorage.removeItem('recipe-catalogue')`);
  await go('/explore/faqs');
  for (const href of await evaluate(`[...document.querySelectorAll('a[href^="https://wa.me/"]')].map(a=>a.href)`)) { const url = new URL(href); assert.equal(url.pathname, '/255757542585'); assert.equal(url.searchParams.get('text'), approvedMessage); }
  assert.equal(await evaluate(`document.querySelector('.nita-page-banner-photo').getAttribute('src')`), '/images/headers/explore-pumpkin-seeds-dark-bowl.jpg');
  assert.equal(await evaluate(`document.querySelectorAll('#faqs-section details').length`), 5);
  await go('/explore/news'); await waitFor(`location.pathname==='/explore'`); results.regressions.push({ exploreHeroAndFaqsPreservedNewsStillRetired: true });
  await go('/explore/recipes'); await evaluate(`document.querySelector('#mobile-menu-toggle-btn').focus()`); await key('Enter'); await evaluate(`document.querySelector('#mobile-nav-drawer button[aria-controls="mobile-explore-links"]').click()`);
  assert.equal(await evaluate(`!!document.querySelector('#mobile-explore-links a[href="/explore/recipes"]')`), true); results.keyboard.push({ mobileRecipeNavigation: true });
  assert.equal(results.runtimeErrors.length, 0); results.status = 'PASS';
  await writeFile(`${out}/browser-results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ status: results.status, exactRecipeWidths: results.recipes.length, contactWidths: results.responsive.length, productLinks: results.links.length, runtimeErrors: results.runtimeErrors.length }, null, 2));
} catch (error) { results.status = 'FAIL'; results.error = String(error); await writeFile(`${out}/browser-results.json`, JSON.stringify(results, null, 2)); throw error; }
finally { ws?.close(); chrome.kill(); chrome.unref(); }
