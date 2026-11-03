import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { apiFixture, fixturePassword } from './helpers/apiSecurityFixture';
import { contactInput, analyticsInput, orderCustomerInput, imageRecordInput, InputError } from '../src/server/validation';
import { securityHeaders, apiBodyParser, apiErrorHandler, logApiError } from '../src/server/httpSecurity';
import { imageExtension, uploadCategory } from '../src/server/uploadValidation';
import { IMAGE_UPLOAD_MAX_BYTES } from '../src/uploadPolicy';
import { createApiRateLimits, developmentRateStore, rateLimitClient } from '../src/server/rateLimits';
import { redisRateStore, configuredRateStore } from '../src/server/redisRateStore';

const contact = { name: 'Fixture Customer', email: 'customer@example.invalid', phone: '+255 700 000 000', message: 'Fixture enquiry' };
const order = { customerName: 'Fixture Customer', phone: '+255 700 000 000', items: [{ productId: 'p1', variantId: 'v1', quantity: 2, expectedUnitPrice: 12000 }], total: 1 };
const request = (base: string, endpoint: string, body: unknown, authorization?: string) => fetch(base + endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(authorization ? { Authorization: authorization } : {}) }, body: JSON.stringify(body) });

test('contact, order customer and analytics validation enforce types, lengths and remove analytics query data', () => {
  assert.equal(contactInput(contact).name, contact.name);
  for (const patch of [{ name: {} }, { name: ' ' }, { name: 'x'.repeat(121) }, { phone: [] }, { phone: 'x'.repeat(41) }, { email: 'invalid' }, { message: 'x'.repeat(5001) }, { subject: 'x'.repeat(161) }, { message: 'bad\u0000data' }]) assert.throws(() => contactInput({ ...contact, ...patch }), InputError);
  for (const body of [null, [], 'text', JSON.parse('{"__proto__":{}}')]) assert.throws(() => contactInput(body), InputError);
  assert.equal(analyticsInput({ path: '/products/fixture?email=private#fragment' }), '/products/fixture');
  for (const path of ['https://invalid.test', '//invalid.test', '/bad\\path', '/bad path', 'x'.repeat(2049), {}]) assert.throws(() => analyticsInput({ path }), InputError);
  assert.throws(() => orderCustomerInput({ ...order, email: 'invalid' }), InputError);
  assert.throws(() => orderCustomerInput({ ...order, notes: 'x'.repeat(2001) }), InputError);
});

test('actual public contact/order/analytics handlers reject malformed input before any write and keep authoritative prices', async () => {
  const api = await apiFixture();
  try {
    assert.equal((await request(api.base, '/api/messages', { ...contact, email: 'bad' })).status, 400);
    assert.equal(api.writes.messages.length, 0);
    const sent = await request(api.base, '/api/messages', contact);
    assert.equal(sent.status, 201); assert.deepEqual(await sent.json(), { success: true });
    assert.equal(api.writes.messages.length, 1);
    assert.equal((await request(api.base, '/api/orders', { ...order, customerName: {} })).status, 400);
    assert.equal(api.writes.orders.length, 0);
    const saved = await request(api.base, '/api/orders', order);
    assert.equal(saved.status, 201);
    assert.equal(api.writes.orders[0].total.toString(), '24000');
    assert.equal((await request(api.base, '/api/orders', { ...order, items: [{ ...order.items[0], expectedUnitPrice: 1 }] })).status, 409);
    assert.equal(api.writes.orders.length, 1);
    assert.equal((await request(api.base, '/api/analytics/visit', { path: {} })).status, 400);
    assert.equal((await request(api.base, '/api/analytics/visit', { path: '/about?private=query' })).status, 200);
    assert.equal(api.writes.analytics[0].page, '/about');
  } finally { await api.close(); }
});

test('API parsing enforces per-route limits, JSON object bodies and supported encoding', async () => {
  const api = await apiFixture();
  try {
    for (const [endpoint, size] of [['/api/auth/login', 4096], ['/API/AUTH/LOGIN/', 4096], ['/api/messages', 16384], ['/API/MESSAGES/', 16384], ['/api/analytics/visit', 2048], ['/api/orders', 65536]] as const) {
      const response = await request(api.base, endpoint, { text: 'x'.repeat(size) });
      assert.equal(response.status, 413);
      assert.ok(!(await response.text()).includes('stack'));
    }
    for (const body of ['{"broken":', '[]', 'null']) {
      const response = await fetch(api.base + '/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      assert.equal(response.status, 400);
    }
    assert.equal((await fetch(api.base + '/api/messages', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'text' })).status, 415);
    assert.equal((await fetch(api.base + '/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' }, body: '{}' })).status, 415);
    assert.equal(api.writes.messages.length + api.writes.analytics.length + api.writes.orders.length, 0);
  } finally { await api.close(); }
});

test('API errors and diagnostic logs do not serialize database secrets, stacks or customer values', async () => {
  const api = await apiFixture();
  const logs: string[] = [], previous = console.error;
  console.error = (...args) => { logs.push(args.map(String).join(' ')); };
  try {
    api.state.fail = true;
    for (const endpoint of ['/api/site-images', '/api/gallery', '/api/products']) {
      const response = await fetch(api.base + endpoint);
      assert.equal(response.status, 503);
      assert.ok(!/postgresql|secret|customer-personal-data|stack|internal/.test(await response.text()));
    }
    const response = await request(api.base, '/api/messages', contact);
    assert.equal(response.status, 503);
    logApiError('fixture.failed', Object.assign(new Error('private-detail'), { code: 'P1001', customer: contact }), 'fixture-request');
    assert.ok(logs.some(line => line.includes('P1001') && line.includes('fixture-request')));
    assert.ok(logs.every(line => !/postgresql|private-detail|customer-personal-data|customer@example/.test(line)));
  } finally { console.error = previous; await api.close(); }
});

test('public gallery excludes disabled records; authenticated management retains visibility', async () => {
  const api = await apiFixture();
  try {
    assert.deepEqual((await (await fetch(api.base + '/api/gallery')).json()).map((g: any) => g.id), ['visible']);
    assert.equal((await fetch(api.base + '/api/admin/gallery')).status, 401);
    const management = await fetch(api.base + '/api/admin/gallery', { headers: { Authorization: api.authorization } });
    assert.deepEqual((await management.json()).map((g: any) => g.id), ['visible', 'hidden']);
    assert.equal((await fetch(api.base + '/api/site-images?section[invalid]=x')).status, 400);
    assert.equal((await fetch(api.base + '/api/site-images?section=unknown')).status, 400);
  } finally { await api.close(); }
});

test('image metadata rejects coerced booleans, positions, URL schemes and invalid sections', () => {
  const value = { imageUrl: 'https://res.cloudinary.com/fixture/image/upload/pack.png', category: 'Products', enabled: false, position: 0 };
  assert.equal(imageRecordInput(value, 'gallery').enabled, false);
  for (const patch of [{ enabled: 'false' }, { position: '1' }, { imageUrl: 'javascript:alert(1)' }, { imageUrl: '//untrusted.test/image' }, { category: {} }]) assert.throws(() => imageRecordInput({ ...value, ...patch }, 'gallery'), InputError);
  assert.throws(() => imageRecordInput({ imageUrl: '/image.png', section: {} }, 'site'), InputError);
});

test('upload validation checks signature, MIME agreement, size and category traversal', () => {
  const png = Buffer.from([137,80,78,71,13,10,26,10]);
  assert.equal(imageExtension(png, 'image/png'), '.png');
  assert.equal(imageExtension(Buffer.from([255,216,255]), 'image/jpeg'), '.jpg');
  assert.throws(() => imageExtension(Buffer.from('<html>not an image</html>'), 'image/png'), InputError);
  assert.throws(() => imageExtension(png, 'image/jpeg'), InputError);
  assert.throws(() => imageExtension(Buffer.alloc(IMAGE_UPLOAD_MAX_BYTES + 1), 'image/png'), InputError);
  assert.throws(() => uploadCategory('../../private'), InputError);
  assert.equal(uploadCategory('Product_Images'), 'product_images');
});

test('actual authenticated upload route rejects forged, oversized and extra multipart data before storage', async () => {
  const api = await apiFixture();
  const upload = (contents: Uint8Array, extra = false, authorization = api.authorization) => {
    const data = new FormData(); data.append('image', new Blob([contents as BlobPart], { type: 'image/png' }), 'image.html'); data.append('category', 'products');
    if (extra) data.append('unexpected', 'value');
    return fetch(api.base + '/api/admin/images/upload', { method: 'POST', headers: { Authorization: authorization }, body: data });
  };
  try {
    assert.equal((await upload(Buffer.from('not png'))).status, 400);
    assert.equal((await upload(Buffer.alloc(IMAGE_UPLOAD_MAX_BYTES + 1))).status, 413);
    assert.equal((await upload(Buffer.from([137,80,78,71,13,10,26,10]), true)).status, 400);
    assert.equal((await upload(Buffer.from('not png'), false, 'Bearer invalid')).status, 401);
    assert.equal(api.writes.uploads, 0);
    assert.equal((await upload(Buffer.from([137,80,78,71,13,10,26,10]))).status, 200);
    assert.equal(api.writes.uploads, 1);
  } finally { await api.close(); }
});

test('production headers cover HTML/API and block private server output, including encoded paths', async () => {
  const api = await apiFixture();
  try {
    for (const endpoint of ['/about', '/api/gallery']) {
      const response = await fetch(api.base + endpoint);
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(response.headers.get('x-powered-by'), null);
      assert.equal(response.headers.get('x-frame-options'), 'DENY');
      assert.ok(response.headers.get('content-security-policy')?.includes("script-src 'self'"));
      assert.ok(response.headers.get('content-security-policy')?.includes('https://fonts.googleapis.com'));
      assert.ok(response.headers.get('content-security-policy')?.includes('https://fonts.gstatic.com'));
      if (endpoint.startsWith('/api')) assert.ok(response.headers.get('x-request-id'));
    }
    for (const endpoint of ['/server.cjs', '/server.cjs.map', '/%73erver.cjs', '/assets/../server.cjs']) assert.equal((await fetch(api.base + endpoint)).status, 404);
  } finally { await api.close(); }
});

test('production submissions fail closed without shared rate storage; product pages skip telemetry and remain readable', async () => {
  const api = await apiFixture({ missingStore: true });
  try {
    for (const [endpoint, body] of [['/api/auth/login', { email: 'admin@example.invalid', password: fixturePassword }], ['/api/messages', contact], ['/api/orders', order], ['/api/analytics/visit', { path: '/about' }]] as const) {
      assert.equal((await request(api.base, endpoint, body)).status, 503);
    }
    assert.equal((await fetch(api.base + '/api/products/fixture-seeds')).status, 200);
    assert.equal(api.writes.messages.length + api.writes.orders.length + api.writes.analytics.length, 0);
  } finally { await api.close(); }
});

test('public submission and telemetry limits return 429/Retry-After and do not write after budget exhaustion', async () => {
  const api = await apiFixture();
  try {
    for (let i=0; i<5; i++) assert.equal((await request(api.base, '/api/messages', contact)).status, 201);
    const blocked = await request(api.base, '/api/messages', contact);
    assert.equal(blocked.status, 429); assert.ok(Number(blocked.headers.get('retry-after')) > 0);
    assert.equal(api.writes.messages.length, 5);
    for (let i=0; i<10; i++) assert.equal((await request(api.base, '/api/orders', order)).status, 201);
    assert.equal((await request(api.base, '/api/orders', order)).status, 429);
    assert.equal(api.writes.orders.length, 10);
    for (let i=0; i<60; i++) assert.equal((await request(api.base, '/api/analytics/visit', { path: '/about' })).status, 200);
    assert.equal((await request(api.base, '/api/analytics/visit', { path: '/about' })).status, 429);
    assert.equal(api.writes.analytics.length, 60);
  } finally { await api.close(); }
});

test('login budgets are shared between independently initialized application instances', async () => {
  const store = { ...developmentRateStore(), shared: true };
  const first = await apiFixture({ store }), second = await apiFixture({ store });
  try {
    for (let i=0; i<10; i++) assert.equal((await request(i%2 ? first.base : second.base, '/api/auth/login', { email: 'admin@example.invalid', password: 'incorrect' })).status, 401);
    assert.equal((await request(second.base, '/api/auth/login', { email: 'admin@example.invalid', password: fixturePassword })).status, 429);
  } finally { await first.close(); await second.close(); }
});

test('local development counters expire and untrusted forwarded headers cannot rotate client identities', async () => {
  let time = 0;
  const store = developmentRateStore(() => time);
  assert.equal((await store.consume('fixture', 1000)).count, 1);
  assert.equal((await store.consume('fixture', 1000)).count, 2);
  time = 1000; assert.equal((await store.consume('fixture', 1000)).count, 1);
  const req = { headers: { 'x-forwarded-for': '192.0.2.8', 'x-vercel-forwarded-for': '192.0.2.9' }, socket: { remoteAddress: '::ffff:127.0.0.1' } } as any;
  assert.equal(rateLimitClient(req, false), '127.0.0.1'); assert.equal(rateLimitClient(req, true), '192.0.2.9');
  assert.equal(rateLimitClient({ ...req, headers: { 'x-vercel-forwarded-for': '2001:db8::1' } }, true), rateLimitClient({ ...req, headers: { 'x-vercel-forwarded-for': '2001:db8::ffff' } }, true));
});

test('Redis REST adapter uses an atomic EVAL with expiry and never sends raw identifiers', async () => {
  const commands: any[] = [];
  const store = redisRateStore('https://fixture.upstash.io', 'fixture-token', 'fixture', async (_url, options) => {
    commands.push(JSON.parse(options!.body as string));
    assert.equal(options?.redirect, 'error');
    return new Response(JSON.stringify({ result: [1, 60000] }));
  });
  assert.deepEqual(await store.consume('hashed-identity', 60000), { count: 1, retryAfter: 60 });
  assert.equal(commands[0][0], 'EVAL'); assert.ok(commands[0][1].includes("redis.call('INCR'")); assert.ok(commands[0][1].includes('PEXPIRE'));
  assert.equal(commands[0][3], 'fixture:hashed-identity');
  for (const response of [new Response('private error', { status: 500 }), new Response(JSON.stringify({ result: [1, -1] })), new Response(JSON.stringify({ error: 'private error' }))]) {
    await assert.rejects(redisRateStore('https://fixture.upstash.io', 'fixture-token', 'fixture', async () => response).consume('key', 60000));
  }
  assert.equal(configuredRateStore({}), undefined);
  assert.throws(() => configuredRateStore({ UPSTASH_REDIS_REST_URL: 'https://fixture.upstash.io' }));
  assert.throws(() => redisRateStore('http://fixture.upstash.io', 'token', 'fixture'));
});

test('production refuses process-local stores and shared-store failures cannot enable writes', async () => {
  for (const store of [developmentRateStore(), { shared: true, consume: async () => { throw new Error('private redis credentials'); } }]) {
    const api = await apiFixture({ store });
    try {
      const response = await request(api.base, '/api/messages', contact);
      assert.equal(response.status, 503); assert.ok(!(await response.text()).includes('private redis'));
      assert.equal(api.writes.messages.length, 0);
    } finally { await api.close(); }
  }
});

test('per-account login budget survives IP changes and limiter keys contain no raw email or IP', async () => {
  const backing = developmentRateStore();
  const keys: string[] = [];
  const limits = createApiRateLimits({ production: true, onVercel: true, secret: 'isolated-rate-limit-secret', store: {
    shared: true, consume: async (key, window) => { keys.push(key); return backing.consume(key, window); },
  } });
  let accepted = 0, status = 0;
  for (let i=0; i<11; i++) {
    const req = { body: { email: 'admin@example.invalid' }, headers: { 'x-vercel-forwarded-for': `192.0.2.${i+1}` }, socket: {} } as any;
    const res = { locals: {}, setHeader() {}, status(value: number) { status = value; return this; }, json() {} } as any;
    await limits.login(req, res, () => { accepted++; });
  }
  assert.equal(accepted, 10); assert.equal(status, 429);
  assert.ok(keys.every(key => /^nita:rate:[a-f0-9]{64}$/.test(key)));
});

test('product-detail analytics stop at their shared budget without blocking product reads', async () => {
  const api = await apiFixture();
  try {
    for (let i=0; i<62; i++) assert.equal((await fetch(api.base + '/api/products/fixture-seeds')).status, 200);
    assert.equal(api.writes.analytics.length, 60);
  } finally { await api.close(); }
});

test('central API handler redacts arbitrary internal errors regardless of supplied status/message', async () => {
  const app = express(); app.use(securityHeaders(false)); app.use(apiBodyParser);
  app.get('/api/failure', () => { throw Object.assign(new Error('postgresql://secret/customer-data'), { status: 418 }); });
  app.use(apiErrorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${(server.address() as any).port}/api/failure`);
    assert.equal(response.status, 500);
    const body = await response.text();
    assert.ok(!/postgresql|secret|customer-data|stack|418/.test(body));
    assert.ok(response.headers.get('x-request-id'));
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});
