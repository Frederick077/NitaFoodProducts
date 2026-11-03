import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const out = resolve('artifacts/footer-contact-explore-verification');
const base = 'http://127.0.0.1:4182';
await mkdir(out, { recursive: true });
const chrome = spawn('C:/Users/Lenovo/.cache/puppeteer/chrome/win64-150.0.7871.24/chrome-win64/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9240', `--user-data-dir=${tmpdir()}/nita-cleanup-${Date.now()}`], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(r => setTimeout(r, ms));
const results = { responsive: [], redirects: [], links: [], forms: [], keyboard: [], regressions: [], runtimeErrors: [] };
let ws;
try {
  let endpoint;
  for (let i = 0; i < 100; i++) { try { endpoint = await (await fetch('http://127.0.0.1:9240/json/version')).json(); break; } catch { await pause(300); } }
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
  const expectedOrder = 'https://wa.me/255712345678?text=' + encodeURIComponent('Hello NITA FOOD PRODUCTS, I would like to order your products.');

  for (const width of [1440, 1024, 768, 390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 640 });
    for (const page of ['contact', 'explore']) {
      await go(`/${page}`); await waitFor(`!!document.querySelector('#${page === 'contact' ? 'contact-page' : 'explore-hub-page'}')`);
      const checks = await evaluate(`(()=>{
        const footer=document.querySelector('#main-footer'),scope=document.querySelector('main');
        const images=[...scope.querySelectorAll('img')];
        return {width:innerWidth,page:${JSON.stringify(page)},overflow:document.documentElement.scrollWidth>innerWidth,
          headings:[...scope.querySelectorAll('h1')].map(e=>e.textContent),
          footerColumns:getComputedStyle(document.querySelector('.nita-footer-grid')).gridTemplateColumns.split(' ').length,
          footerLinks:[...footer.querySelectorAll('nav a')].map(e=>({text:e.textContent,href:e.getAttribute('href')})),
          obsoleteLinks:!!document.querySelector('a[href="/quality"],a[href="/explore/news"],nav a[href="/explore/recipes"]'),
          footerLogo:footer.querySelector('img').getAttribute('src'),
          instagram:[...document.querySelectorAll('a[href="https://www.instagram.com/nitafoodproducts/"]')].map(a=>({label:a.getAttribute('aria-label'),svg:!!a.querySelector('svg'),text:a.textContent.trim(),width:a.getBoundingClientRect().width,height:a.getBoundingClientRect().height})),
          contactIcons:${page === 'contact' ? `[...scope.querySelectorAll('.nita-contact-method')].map(e=>!!e.querySelector('svg'))` : '[]'},
          hero:scope.querySelector('img').getAttribute('src'),captions:scope.querySelectorAll('figcaption').length,
          news:scope.textContent.includes('News from NITA')||!!scope.querySelector('#news-section'),
          tabs:[...scope.querySelectorAll('.nita-explore-nav a')].map(e=>e.textContent),
          form:${page === 'contact' ? `!!scope.querySelector('form input[type="email"]')` : 'null'}
        }
      })()`);
      assert.equal(checks.overflow, false); assert.equal(checks.obsoleteLinks, false); assert.equal(checks.captions, 0); assert.equal(checks.news, false);
      assert.equal(checks.footerLogo, '/assets/nita-logo-transparent.png');
      assert.equal(checks.footerColumns, width >= 1100 ? 4 : width >= 640 ? 2 : 1);
      assert.equal(new Set(checks.footerLinks.map(e => e.href)).size, checks.footerLinks.length);
      for (const icon of checks.instagram) { assert.ok(icon.svg && icon.label.includes('Visit NITA')); assert.equal(icon.text, ''); assert.ok(icon.width >= 44 && icon.height >= 44); }
      if (page === 'contact') { assert.deepEqual(checks.contactIcons, [true, true, true]); assert.equal(checks.form, true); assert.equal(checks.headings[0], 'Say Hello!'); assert.equal(await evaluate(`document.querySelector('#contact-whatsapp').href`), expectedOrder); }
      else { assert.deepEqual(checks.tabs, ['FAQs', 'Stockists']); assert.equal(checks.headings[0], 'Explore NITA'); }
      await screenshot(`${page}-${width}`);
      await evaluate(`document.activeElement?.blur();document.querySelector('#main-footer').scrollIntoView();window.scrollBy(0,-100)`);
      await waitFor(`!!document.querySelector('#nita-whatsapp-dock #floating-whatsapp-btn')`);
      const dock = await evaluate(`(()=>{const a=document.querySelector('#nita-whatsapp-dock a');return {href:a.href,label:a.getAttribute('aria-label'),text:a.textContent.trim(),svg:!!a.querySelector('svg'),count:document.querySelectorAll('#main-footer a[href^="https://wa.me/"]').length}})()`);
      assert.equal(dock.href, expectedOrder); assert.equal(dock.text, ''); assert.equal(dock.svg, true); assert.equal(dock.count, 1); assert.ok(dock.label.startsWith('Order directly'));
      results.responsive.push({ ...checks, dock });
    }
  }

  for (const [path, expected, section] of [
    ['/about/our-story', '/about#story', 'story'], ['/about/sustainability', '/about#community', 'community'],
    ['/quality', '/about#production', 'production'], ['/quality?from=bookmark#certifications', '/about?from=bookmark#production', 'production'],
    ['/quality#unknown', '/about#production', 'production'], ['/quality#%E0%A4%A', '/about#production', 'production'],
    ['/explore/news', '/explore', null],
  ]) {
    await go(path); await pause(300); assert.equal(await evaluate(`location.pathname+location.search+location.hash`), expected);
    if (section) { assert.equal(await evaluate(`document.activeElement.id`), section); assert.equal(await evaluate(`document.querySelectorAll('#about-page .nita-page-inner > section').length`), 8); }
    results.redirects.push({ path, expected, section });
  }
  await go('/contact'); await go('/quality'); await evaluate(`history.back()`); await waitFor(`location.pathname==='/contact'`); results.redirects.push({ historyReplace: true });
  await go('/explore/faqs'); const faqText = await evaluate(`document.querySelector('#faqs-section').textContent`); assert.equal(await evaluate(`document.querySelectorAll('#faqs-section details').length`), 5);
  await evaluate(`document.querySelectorAll('#faqs-section summary')[1].focus()`); await key('Enter'); assert.equal(await evaluate(`document.querySelectorAll('#faqs-section details')[1].open`), true); results.keyboard.push({ faqEnter: true });
  for (const path of ['/gallery', '/explore/stockists', '/explore/recipes', '/educational-hub', '/educational-hub/community-clinic-training', '/products', '/checkout', '/admin']) { await go(path); assert.ok(await evaluate(`!!document.querySelector('main h1,main h2')`)); results.regressions.push({ path, rendered: true }); }
  await go('/about'); assert.equal(await evaluate(`document.querySelector('#products img').getAttribute('alt')`), 'Two NITA pumpkin seed powder jars in different sizes');
  assert.equal(await evaluate(`!!document.querySelector('#production')`), true); results.regressions.push({ suppliedAboutPhotoAndQualitySection: true, faqText });

  // Keyboard focus and Enter reach the direct mobile About link and social actions.
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 1000, deviceScaleFactor: 1, mobile: true });
  await go('/contact'); await evaluate(`document.querySelector('#mobile-menu-toggle-btn').focus()`); await key('Enter');
  assert.equal(await evaluate(`document.querySelectorAll('#mobile-nav-drawer a[href="/about"]').length`), 1);
  await evaluate(`document.querySelector('#mobile-nav-link-about').focus()`); await key('Enter'); await waitFor(`location.pathname==='/about'`);
  assert.equal(await evaluate(`!!document.querySelector('#mobile-nav-drawer,#about-dropdown-menu')`), false); results.keyboard.push({ mobileAboutEnter: true });
  await go('/contact'); await evaluate(`document.querySelector('.nita-contact-social a').focus()`); await key('Tab');
  assert.equal(await evaluate(`document.activeElement.id`), 'contact-whatsapp');
  assert.ok(await evaluate(`getComputedStyle(document.activeElement).outlineStyle !== 'none'`)); results.keyboard.push({ socialTabAndFocus: true });

  // Exact form payload, browser validation, success reset and recoverable errors.
  const fill = async (id, value) => {
    await evaluate(`(()=>{const el=document.getElementById(${JSON.stringify(id)});el.focus();const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await pause(50);
  };
  const validForm = async () => { await fill('contact-name', 'Local Browser Test'); await fill('contact-email', 'test@example.invalid'); await fill('contact-phone', '+255 700 000 000'); await fill('contact-message', 'Fixture enquiry only; never sent to a server.'); };
  await go('/contact?subject=Community%20%26%20Clinic%20Partnership%20Training#nita-contact-form-panel');
  assert.equal(await evaluate(`document.querySelector('#contact-subject').value`), 'Community & Clinic Partnership Training');
  assert.equal(await evaluate(`document.querySelector('button[type="submit"]').disabled`), true);
  await validForm(); await fill('contact-email', 'invalid-email'); await evaluate(`document.querySelector('button[type="submit"]').click()`);
  assert.equal(await evaluate(`window.__apiCalls.filter(c=>c.url==='/api/messages').length`), 0);
  await fill('contact-email', 'test@example.invalid'); await evaluate(`document.querySelector('button[type="submit"]').click()`);
  assert.equal(await evaluate(`document.querySelector('button[type="submit"]').disabled`), true);
  await waitFor(`!!document.querySelector('.nita-contact-success')`);
  const payload = await evaluate(`JSON.parse(window.__apiCalls.find(c=>c.url==='/api/messages').body)`);
  assert.deepEqual(payload, { name: 'Local Browser Test', email: 'test@example.invalid', phone: '+255 700 000 000', message: 'Fixture enquiry only; never sent to a server.', subject: 'Community & Clinic Partnership Training' });
  await evaluate(`document.querySelector('.nita-contact-success button').click()`); assert.equal(await evaluate(`document.querySelector('#contact-name').value`), ''); results.forms.push({ successResetValidationAndSubject: true, payload });
  for (const mode of ['failure', 'network']) {
    await evaluate(`sessionStorage.setItem('contact-response',${JSON.stringify(mode)})`); await go('/contact'); await validForm();
    await evaluate(`document.querySelector('button[type="submit"]').click()`); await waitFor(`!!document.querySelector('[role="alert"]')`);
    assert.equal(await evaluate(`document.querySelector('#contact-name').value`), 'Local Browser Test'); assert.equal(await evaluate(`document.querySelector('button[type="submit"]').disabled`), false);
    results.forms.push({ mode, errorShownAndRetryEnabled: true });
  }
  await evaluate(`sessionStorage.removeItem('contact-response')`);

  // Product-specific WhatsApp messages still take precedence when the control docks.
  await go('/products/fixture'); await waitFor(`document.querySelector('main h1')?.textContent==='Fixture pumpkin seeds'`);
  await evaluate(`document.querySelector('#main-footer').scrollIntoView()`); await waitFor(`!!document.querySelector('#nita-whatsapp-dock a')`);
  const productWhatsApp = await evaluate(`document.querySelector('#floating-whatsapp-btn').href`);
  assert.ok(decodeURIComponent(productWhatsApp).includes('Fixture pumpkin seeds')); assert.ok(decodeURIComponent(productWhatsApp).includes('250g')); results.regressions.push({ productWhatsAppContextPreserved: true });

  await go('/contact');
  const footerLinks = await evaluate(`[...document.querySelectorAll('#main-footer nav a')].map(e=>e.getAttribute('href'))`);
  for (const href of footerLinks) { await go('/contact'); await evaluate(`document.querySelector('#main-footer a[href="${href}"]').click()`); await waitFor(`location.pathname===${JSON.stringify(href)}`); results.links.push({ href, passed: true }); }
  assert.equal(results.runtimeErrors.length, 0); results.status = 'PASS';
  await writeFile(`${out}/browser-results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ status: results.status, responsiveCases: results.responsive.length, redirects: results.redirects.length, forms: results.forms.length, links: results.links.length, keyboard: results.keyboard.length, regressions: results.regressions.length, runtimeErrors: results.runtimeErrors.length }, null, 2));
} catch (error) { results.status = 'FAIL'; results.error = String(error); await writeFile(`${out}/browser-results.json`, JSON.stringify(results, null, 2)); throw error; }
finally { ws?.close(); chrome.kill(); chrome.unref(); }
