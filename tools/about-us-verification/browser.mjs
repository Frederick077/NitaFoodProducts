import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const out = resolve('artifacts/about-us-verification');
const base = 'http://127.0.0.1:4181';
await mkdir(out, { recursive: true });
const chrome = spawn('C:/Users/Lenovo/.cache/puppeteer/chrome/win64-150.0.7871.24/chrome-win64/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9239', `--user-data-dir=${tmpdir()}/nita-about-${Date.now()}`], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(r => setTimeout(r, ms));
const results = { responsive: [], redirects: [], links: [], keyboard: [], media: [], runtimeErrors: [] };
let ws;
try {
  let endpoint;
  for (let i = 0; i < 100; i++) {
    try { endpoint = await (await fetch('http://127.0.0.1:9239/json/version')).json(); break; } catch { await pause(300); }
  }
  ws = new WebSocket(endpoint.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const waiting = new Map();
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.exceptionThrown') results.runtimeErrors.push(m.params.exceptionDetails);
    if (m.id) { const p = waiting.get(m.id); waiting.delete(m.id); m.error ? p.reject(m.error) : p.resolve(m.result); }
  });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const n = ++id;
    waiting.set(n, { resolve, reject });
    ws.send(JSON.stringify({ id: n, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const call = (m, p) => send(m, p, sessionId);
  await call('Page.enable');
  await call('Runtime.enable');
  await call('Network.enable');
  await call('Network.setCacheDisabled', { cacheDisabled: true });
  // These static browser checks never contact the application server/database.
  await call('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__apiCalls = [];
    const nativeFetch = window.fetch;
    window.fetch = (input, ...args) => {
      const url = String(input);
      if (!url.startsWith('/api/')) return nativeFetch(input, ...args);
      window.__apiCalls.push(url);
      let data = [];
      const mode = sessionStorage.getItem('about-media-fixture');
      if (url.includes('site-images') && mode) data = [
        {id:'disabled',imageUrl:'/not-used.jpg',enabled:false,position:-1},
        {id:'fixture',imageUrl:mode==='broken'?'/missing-about-fixture.jpg':'/images/education/IMG-20261027-WA0070.jpg',altText:'Browser layout fixture; not evidence of production',enabled:true,position:0}
      ];
      return Promise.resolve(new Response(JSON.stringify(data), {headers:{'Content-Type':'application/json'}}));
    };
  ` });
  const evaluate = async expression => {
    const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  const waitFor = async expression => {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await pause(100); }
    throw new Error(`Timed out: ${expression}`);
  };
  const go = async path => {
    await call('Page.navigate', { url: `${base}${path}` });
    await waitFor(`document.readyState==='complete' && !!document.querySelector('#nita-public-header')`);
    await pause(200);
  };
  const key = async name => {
    await call('Page.bringToFront');
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code: name, windowsVirtualKeyCode: name === 'Enter' ? 13 : name === 'Escape' ? 27 : name === 'ArrowDown' ? 40 : 9, ...(name === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {}) });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code: name });
    await pause(100);
  };
  const screenshot = async name => {
    await evaluate(`Promise.all([...document.querySelectorAll('#about-page img')].map(img=>{img.loading='eager';return img.decode().catch(()=>{})}))`);
    const { cssContentSize } = await call('Page.getLayoutMetrics');
    const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: cssContentSize.width, height: cssContentSize.height, scale: 1 } });
    await writeFile(`${out}/${name}.png`, Buffer.from(shot.data, 'base64'));
  };

  for (const width of [1440, 1024, 768, 390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 640 });
    await go('/about');
    await waitFor(`!!document.querySelector('#about-page')`);
    await screenshot(`about-${width}`);
    const checks = await evaluate(`(()=>{
      const page=document.querySelector('#about-page');
      return {
        width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,
        sections:[...page.querySelectorAll('.nita-page-inner > section')].map(e=>e.id),
        h1:page.querySelector('h1').textContent.replace(/\\s+/g,' ').trim(),
        purpose:[...page.querySelectorAll('#mission > div > p:last-child')].map(e=>e.textContent),
        founder:page.querySelector('#story').textContent.includes('Lilian Mmbando'),
        captions:page.querySelectorAll('figcaption').length,
        placeholders:page.querySelectorAll('.company-photo-placeholder').length,
        images:[...page.querySelectorAll('img')].map(img=>({alt:img.alt,loaded:img.complete&&img.naturalWidth>0,ratio:img.getBoundingClientRect().width/img.getBoundingClientRect().height,natural:img.naturalWidth/img.naturalHeight})),
        desktopAbout:[...document.querySelectorAll('#desktop-main-navigation a')].filter(e=>e.textContent==='About Us').map(e=>({href:e.getAttribute('href'),arrow:e.querySelectorAll('svg').length})),
        aboutDisclosure:!!document.querySelector('#nav-dropdown-about-btn,#about-dropdown-menu'),
        proposed:page.querySelector('#values').textContent.includes('proposed value themes'),
        trustClaims:/BRELA|137-003|452567|TBS Certified|TRA Tax Cleared|GAIN|TAHA|Farm Africa/.test(page.textContent)
      }
    })()`);
    assert.equal(checks.overflow, false);
    assert.deepEqual(checks.sections, ['introduction', 'mission', 'story', 'products', 'values', 'production', 'community', 'discover']);
    assert.equal(checks.h1, 'Rooted in Arusha. Nourishing Communities.');
    assert.deepEqual(checks.purpose, [
      'To reduce malnutrition, combat chronic diseases, and improve livelihoods among families and societies across the world.',
      'Provision of premium, healthy, and accessible food products to communities anywhere in the world.',
    ]);
    assert.equal(checks.founder, true);
    assert.equal(checks.captions, 0);
    assert.equal(checks.placeholders, 2);
    assert.deepEqual(checks.desktopAbout, [{ href: '/about', arrow: 0 }]);
    assert.equal(checks.aboutDisclosure, false);
    assert.equal(checks.proposed, true);
    assert.equal(checks.trustClaims, false);
    for (const image of checks.images) { assert.ok(image.alt); assert.ok(image.loaded); assert.ok(Math.abs(image.ratio - image.natural) < .01); }
    if (width < 1024) {
      await evaluate(`document.querySelector('#mobile-menu-toggle-btn').focus()`);
      await key('Enter');
      assert.equal(await evaluate(`document.querySelectorAll('#mobile-nav-drawer a[href="/about"]').length`), 1, JSON.stringify(await evaluate(`({focus:document.activeElement.id,hasFocus:document.hasFocus(),expanded:document.querySelector('#mobile-menu-toggle-btn').getAttribute('aria-expanded'),viewport:innerWidth})`)));
      assert.equal(await evaluate(`!!document.querySelector('#mobile-nav-drawer button[aria-controls="mobile-about-links"]')`), false);
      await evaluate(`document.querySelector('#mobile-nav-link-about').focus()`);
      await key('Enter');
      assert.equal(await evaluate(`!document.querySelector('#mobile-nav-drawer') && location.pathname==='/about'`), true);
      await evaluate(`document.querySelector('#mobile-menu-toggle-btn').focus()`);
      await key('Enter'); await key('Escape');
      assert.equal(await evaluate(`!document.querySelector('#mobile-nav-drawer') && document.activeElement.id==='mobile-menu-toggle-btn'`), true);
      results.keyboard.push({ width, mobileAboutEnter: true, mobileEscape: true });
    }
    results.responsive.push(checks);
  }

  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await go('/contact');
  await evaluate(`document.querySelector('#nav-link-about').focus()`); await key('Enter');
  await waitFor(`location.pathname==='/about' && !!document.querySelector('#about-page')`);
  results.keyboard.push({ desktopAboutEnter: true });
  for (const [menu, expected] of [['explore', ['Gallery', 'FAQs', 'Stockists & Retailers']], ['shop', ['Shop all']], ['education', ['Community & Clinic Demonstrations', 'Maternal & Lactation Support', 'Sustainable Agriculture & Post-Harvest Training']]]) {
    await evaluate(`document.querySelector('#nav-dropdown-${menu}-btn').focus()`); await key('Enter');
    await waitFor(`!!document.querySelector('#${menu}-dropdown-menu')`);
    const links = await evaluate(`[...document.querySelectorAll('#${menu}-dropdown-menu a')].map(e=>e.textContent)`);
    assert.deepEqual(links, expected);
    await key('ArrowDown');
    assert.equal(await evaluate(`!!document.activeElement.closest('#${menu}-dropdown-menu')`), true);
    await key('Escape');
    assert.equal(await evaluate(`!document.querySelector('#${menu}-dropdown-menu')`), true);
    results.keyboard.push({ menu, entries: links, enterArrowEscape: true });
  }

  for (const [path, expected] of [
    ['/about/our-story', '/about#story'], ['/about/sustainability', '/about#community'],
    ['/about/our-story?from=bookmark#mission', '/about?from=bookmark#mission'],
    ['/about/sustainability#farmers', '/about#community'],
    ['/about/our-story#unknown-old-section', '/about#story'],
    ['/about/our-story#__proto__', '/about#story'],
    ['/about/sustainability#%E0%A4%A', '/about#community'],
    ['/about#production', '/about#production'], ['/about#sustainability', '/about#sustainability'],
  ]) {
    await go(path);
    await waitFor(`!!document.querySelector('#about-page')`);
    await pause(300);
    const actual = await evaluate(`location.pathname+location.search+location.hash`);
    assert.equal(actual, expected);
    const target = await evaluate(`document.activeElement.id`);
    assert.ok(['story', 'community', 'mission', 'production'].includes(target));
    assert.ok(await evaluate(`document.activeElement.getBoundingClientRect().top >= 88 && document.activeElement.getBoundingClientRect().top < 160`));
    results.redirects.push({ path, actual, focusedSection: target });
  }
  await go('/contact'); await go('/about/our-story');
  await evaluate(`history.back()`);
  await waitFor(`location.pathname==='/contact'`);
  results.redirects.push({ replaceHistory: true });

  await go('/about');
  const destinations = await evaluate(`[...document.querySelectorAll('#about-page a[href^="/"]')].map(e=>({label:e.textContent.trim(),href:e.getAttribute('href')}))`);
  for (const link of destinations) {
    await go('/about');
    await evaluate(`[...document.querySelectorAll('#about-page a')].find(e=>e.textContent.trim()===${JSON.stringify(link.label)}).click()`);
    await waitFor(`location.pathname===${JSON.stringify(link.href)}`);
    assert.equal(await evaluate(`!!document.querySelector('main h1')`), true);
    results.links.push({ ...link, passed: true });
  }
  await go('/about');
  await evaluate(`document.querySelector('a[href="#story"]').click()`);
  await waitFor(`location.hash==='#story'`);
  results.links.push({ href: '#story', passed: true });

  // Existing managed images retain natural portrait ratios; failures use the neutral slot.
  for (const mode of ['portrait', 'broken']) {
    await evaluate(`sessionStorage.setItem('about-media-fixture',${JSON.stringify(mode)})`);
    await go('/about');
    await evaluate(`document.querySelector('#production').scrollIntoView()`);
    await pause(500);
    if (mode === 'portrait') {
      await waitFor(`document.querySelector('#production img')?.naturalWidth>0`);
      const ratio = await evaluate(`(()=>{const img=document.querySelector('#production img');return img.getBoundingClientRect().width/img.getBoundingClientRect().height})()`);
      assert.ok(Math.abs(ratio - .75) < .01);
      results.media.push({ mode, naturalRatioPreserved: true });
    } else {
      await waitFor(`!!document.querySelector('#production .company-photo-placeholder')`);
      results.media.push({ mode, placeholderRestored: true });
    }
  }
  await evaluate(`sessionStorage.removeItem('about-media-fixture')`);
  assert.equal(results.runtimeErrors.length, 0);
  results.status = 'PASS';
  await writeFile(`${out}/browser-results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ status: results.status, widths: results.responsive.map(r => r.width), redirects: results.redirects.length, links: results.links.length, keyboard: results.keyboard.length, media: results.media, runtimeErrors: results.runtimeErrors.length }, null, 2));
} catch (error) {
  results.status = 'FAIL'; results.error = String(error);
  await writeFile(`${out}/browser-results.json`, JSON.stringify(results, null, 2));
  throw error;
} finally { ws?.close(); chrome.kill(); chrome.unref(); }
