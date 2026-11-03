import * as httpSecurity from '../src/server/httpSecurity';
import * as validation from '../src/server/validation';
import * as rateLimits from '../src/server/rateLimits';
import * as uploadPolicy from '../src/uploadPolicy';
import * as uploadValidation from '../src/server/uploadValidation';
import * as redisRateStore from '../src/server/redisRateStore';
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import path from 'node:path';
import ts from 'typescript';
import express from 'express';
import bcrypt from 'bcryptjs';
import { createAuthentication, requireJwtSecret, type AuthenticationDatabase } from '../src/server/auth';

const secret = 'isolated-authentication-secret-32-bytes';
const identity = { id: 'persisted-admin', name: 'Test Administrator', email: 'admin@example.invalid', role: 'Admin' as const };
const password = 'isolated-test-password';
const record = { ...identity, passwordHash: bcrypt.hashSync(password, 4) };
const db = (findUnique: AuthenticationDatabase['admin']['findUnique']): AuthenticationDatabase => ({ admin: { findUnique } });
const signed = (payload: unknown, signingSecret = secret) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `${body}.${crypto.createHmac('sha256', signingSecret).update(body).digest('hex')}`;
};

test('secret configuration rejects missing, short, default and placeholder values without disclosing them', () => {
  for (const value of [undefined, null, '', ' ', 'short', 'a'.repeat(32), 'nita-food-jwt-secret-key-2026', 'nita-food-secure-jwt-secret-key-2026', 'your-signing-secret-at-least-32-bytes', ' placeholder-secret-at-least-32-bytes ']) {
    assert.throws(() => requireJwtSecret(value), { message: 'JWT_SECRET must be configured with at least 32 bytes and must not be a default or placeholder.' });
    assert.throws(() => createAuthentication(value, () => { throw Error('must not access database'); }));
  }
  assert.equal(requireJwtSecret(secret), secret);
});

test('existing HMAC token format stays compatible and uses the configured secret for signing and verification', () => {
  const auth = createAuthentication(secret, () => db(async () => record));
  const token = auth.generateToken(identity);
  assert.equal(token.split('.').length, 2);
  const payload = auth.verifyToken(token)!;
  assert.equal(payload.id, identity.id);
  assert.ok(payload.exp > Date.now() && payload.exp <= Date.now() + 86400000);
  const legacyPayload = { ...identity, exp: Date.now() + 60000 };
  assert.deepEqual(auth.verifyToken(signed(legacyPayload)), legacyPayload);
  assert.equal(createAuthentication('a-different-isolated-secret-32-bytes', () => db(async () => record)).verifyToken(token), null);
});

test('verification rejects invalid signatures, noncanonical encoding and extra token segments', () => {
  const auth = createAuthentication(secret, () => db(async () => record));
  const token = auth.generateToken(identity);
  const [body, signature] = token.split('.');
  for (const value of [undefined, null, {}, '', 'forged.token', token + '.extra', body + '.' + '0'.repeat(64), body + '.' + signature.slice(1), body + '.' + 'g'.repeat(64), '!' + token, 'x'.repeat(8193)]) {
    assert.equal(auth.verifyToken(value), null);
  }
});

test('verification requires a future integer expiry and valid Admin identity claims', () => {
  const auth = createAuthentication(secret, () => db(async () => record));
  for (const exp of [undefined, null, '9999999999999', 0, Date.now() - 1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(auth.verifyToken(signed({ ...identity, exp })), null);
  }
  for (const patch of [{ id: '' }, { id: 1 }, { name: '' }, { email: null }, { role: 'Manager' }, { role: undefined }]) {
    assert.equal(auth.verifyToken(signed({ ...identity, exp: Date.now() + 60000, ...patch })), null);
  }
  for (const payload of [null, [], 'text']) assert.equal(auth.verifyToken(signed(payload)), null);
});

async function serve(database: AuthenticationDatabase, run: (base: string, auth: ReturnType<typeof createAuthentication>) => Promise<void>) {
  const auth = createAuthentication(secret, () => database);
  const app = express();
  app.use(express.json());
  app.post('/api/auth/login', auth.login);
  app.get('/protected', auth.requireAuth, (req, res) => res.json({ user: (req as any).user }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  try { await run(`http://127.0.0.1:${(server.address() as any).port}`, auth); }
  finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}
const postLogin = (base: string, body: unknown) => fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('persisted Admin password login and protected access remain functional without exposing hashes', async () => {
  const lookups: unknown[] = [];
  await serve(db(async args => { lookups.push(args); return record; }), async base => {
    const response = await postLogin(base, { email: ' ADMIN@EXAMPLE.INVALID ', password });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const data = await response.json();
    assert.deepEqual(data.user, identity);
    assert.equal(data.passwordHash, undefined);
    const protectedResponse = await fetch(base + '/protected', { headers: { Authorization: 'Bearer ' + data.token } });
    assert.equal(protectedResponse.status, 200);
    assert.deepEqual((await protectedResponse.json()).user, identity);
  });
  assert.deepEqual(lookups, [{ where: { email: identity.email } }, { where: { id: identity.id } }]);
});

test('missing persisted records cannot authenticate using former demo credentials', async () => {
  await serve(db(async () => null), async base => {
    const response = await postLogin(base, { email: 'admin@nitafoods.local', password: 'admin123' });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).token, undefined);
  });
});

test('incorrect passwords and invalid login input cannot authenticate', async () => {
  let reads = 0;
  await serve(db(async () => { reads++; return record; }), async base => {
    for (const body of [{}, { email: [], password }, { email: identity.email, password: {} }, { email: ' ', password }, { email: identity.email, password: 'x'.repeat(1025) }]) {
      assert.equal((await postLogin(base, body)).status, 400);
    }
    assert.equal(reads, 0);
    assert.equal((await postLogin(base, { email: identity.email, password: 'incorrect' })).status, 401);
    assert.equal((await postLogin(base, { email: identity.email, password: 'admin123' })).status, 401);
  });
});

test('database errors fail closed for login and protected requests, with sanitized responses', async () => {
  await serve(db(async () => { throw Error('private-database-error-detail'); }), async (base, auth) => {
    const login = await postLogin(base, { email: identity.email, password });
    assert.equal(login.status, 503);
    const body = await login.text();
    assert.ok(!body.includes('private-database-error-detail') && !body.includes('token'));
    const protectedResponse = await fetch(base + '/protected', { headers: { Authorization: 'Bearer ' + auth.generateToken(identity) } });
    assert.equal(protectedResponse.status, 503);
    assert.ok(!(await protectedResponse.text()).includes('private-database-error-detail'));
  });
});

test('protected requests require a valid token before any database access', async () => {
  let reads = 0;
  await serve(db(async () => { reads++; return record; }), async (base, auth) => {
    for (const authorization of ['', 'Bearer forged.token', 'Bearer ' + signed({ ...identity, exp: Date.now() - 1 }), 'Bearer ' + auth.generateToken(identity) + ' extra']) {
      assert.equal((await fetch(base + '/protected', { headers: authorization ? { Authorization: authorization } : {} })).status, 401);
    }
  });
  assert.equal(reads, 0);
});

test('a signed token for an absent Admin or changed email is rejected', async () => {
  for (const admin of [null, { ...record, email: 'changed@example.invalid' }]) {
    await serve(db(async () => admin), async (base, auth) => {
      assert.equal((await fetch(base + '/protected', { headers: { Authorization: 'Bearer ' + auth.generateToken(identity) } })).status, 401);
    });
  }
});

// Transpile the actual adapter with a fake Prisma constructor and no dotenv access.
// This verifies the production facade rather than substituting its behavior.
function loadAdapter(admin: unknown, configured = true) {
  const exports: any = {};
  const source = readFileSync(new URL('../src/lib/prisma.ts', import.meta.url), 'utf8');
  runInNewContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, process: { env: { NODE_ENV: 'production', ...(configured ? { DATABASE_URL: 'postgresql://fixture.invalid/test' } : {}) } },
    require: (name: string) => {
      if (name === 'dotenv/config') return {};
      if (name === '@prisma/client') return { PrismaClient: class { admin = admin; } };
      throw Error('Unexpected adapter dependency: ' + name);
    },
  });
  return exports.prisma;
}

test('actual admin facade uses only persisted delegates, preserves missing results and propagates errors', async () => {
  const failure = new Error('isolated database failure');
  for (const result of [record, null]) {
    const delegate = { findUnique: async () => result };
    const prisma = loadAdapter(delegate);
    assert.equal(prisma.admin, delegate);
    assert.equal(await prisma.admin.findUnique({ where: { email: identity.email } }), result);
  }
  await assert.rejects(loadAdapter({ findUnique: async () => { throw failure; } }).admin.findUnique({ where: { email: 'admin@nitafoods.local' } }), error => error === failure);
  assert.throws(() => loadAdapter(undefined, false).admin, /PostgreSQL is not configured/);
});

test('actual adapter initialization does not create Admin records or delete site images', () => {
  let operations = 0;
  loadAdapter(new Proxy({}, { get() { operations++; throw Error('Unexpected database access'); } }));
  assert.equal(operations, 0);
});

test('API module has no listener, startup provisioning or static/frontend server', () => {
  const source = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /ensureAdminExists|ensureDefaultSiteImages|ADMIN_INITIAL_PASSWORD|ADMIN_INITIAL_EMAIL|startServer|\.listen\(|express\.static|createViteServer/);
  assert.match(source, /createAuthentication\(process\.env\.JWT_SECRET, requireDatabase\)/);
  assert.match(source, /export default app/);
});

// Exercise the entire real entry point with imports replaced before evaluation.
// No application adapter, network listener, dotenv file or storage SDK is loaded.
function bootstrapWithMocks(signingSecret: unknown, mode = 'production') {
  const calls = { listens: 0, databaseAccess: 0, routes: [] as { method: string; args: any[] }[], routerAuth: [] as unknown[] };
  const noop = () => {};
  const app = Object.fromEntries(['use', 'get', 'post', 'put', 'delete', 'all'].map(method => [method, (...args: any[]) => { calls.routes.push({ method, args }); }])) as any;
  app.listen = () => { calls.listens++; };
  const fakeExpress = Object.assign(() => app, { json: () => noop, urlencoded: () => noop, static: () => noop });
  const fakeMulter = Object.assign(() => ({ single: () => noop }), { memoryStorage: () => ({}) });
  const database = new Proxy({}, { get() { calls.databaseAccess++; throw Error('Database access during bootstrap'); } });
  let auth: ReturnType<typeof createAuthentication> | undefined;
  const routeModule = (name: string) => ({ [name]: (requireAuth: unknown) => { calls.routerAuth.push(requireAuth); return noop; } });
  const imports: Record<string, unknown> = {
    express: fakeExpress, path, multer: fakeMulter,
    vite: { createServer: async () => ({ middlewares: noop }) },
    '@prisma/client': { Prisma: {} },
    './src/server/httpSecurity': httpSecurity,
    './src/server/validation': validation,
    './src/server/rateLimits': rateLimits,
    './src/uploadPolicy': uploadPolicy,
    './src/server/uploadValidation': uploadValidation,
    './src/server/redisRateStore': redisRateStore,
    './src/server/auth': { createAuthentication: (...args: Parameters<typeof createAuthentication>) => (auth = createAuthentication(...args)) },
    './src/lib/prisma': { prisma: database, requireDatabase: () => { calls.databaseAccess++; throw Error('Database access during bootstrap'); } },
    './src/server/productWrites': routeModule('productWriteRoutes'),
    './src/server/productReads': routeModule('productReadRoutes'),
    './src/server/productMedia': routeModule('productMediaRoutes'),
    './src/server/categories': routeModule('categoryRoutes'),
    './src/server/productImages': { retainMediaForReview: noop },
    './src/server/checkout': {},
    './src/server/imageStorage': { uploadImageFile: noop, isCloudinaryConfigured: () => true, validateCloudinaryConfig: noop },
  };
  const source = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  const run = () => runInNewContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, {
    exports: {}, process: { env: { NODE_ENV: mode, JWT_SECRET: signingSecret }, cwd: () => '/isolated-project' },
    require: (name: string) => { assert.ok(name in imports, 'Unexpected bootstrap dependency: ' + name); return imports[name]; },
  });
  return { calls, run, auth: () => auth };
}

test('actual production entry point rejects missing/invalid secrets before binding a listener or accessing data', () => {
  for (const value of [undefined, '', 'short', 'nita-food-jwt-secret-key-2026']) {
    const boot = bootstrapWithMocks(value);
    assert.throws(boot.run, /JWT_SECRET must be configured/);
    assert.equal(boot.calls.listens, 0);
    assert.equal(boot.calls.databaseAccess, 0);
  }
});

test('actual API entry point imports without listeners/database operations and keeps protected routes authenticated', () => {
  const boot = bootstrapWithMocks(secret);
  boot.run();
  assert.equal(boot.calls.listens, 0);
  assert.equal(boot.calls.databaseAccess, 0);
  assert.equal(boot.calls.routerAuth.length, 4);
  assert.ok(boot.calls.routerAuth.every(auth => auth === boot.auth()!.requireAuth));
  for (const [method, endpoint] of [
    ['get', '/api/analytics'], ['get', '/api/orders'], ['get', '/api/admin/orders/:id'],
    ['put', '/api/orders/:id'], ['get', '/api/admin/images/status'],
    ['post', '/api/admin/images/upload'], ['post', '/api/admin/images/delete'],
    ['get', '/api/admin/site-images'], ['post', '/api/admin/site-images'],
    ['put', '/api/admin/site-images/reorder'], ['put', '/api/admin/site-images/:id'],
    ['delete', '/api/admin/site-images/:id'], ['get', '/api/messages'],
    ['post', '/api/gallery'], ['put', '/api/gallery/reorder'], ['put', '/api/gallery/:id'], ['delete', '/api/gallery/:id'],
  ]) {
    const route = boot.calls.routes.find(r => r.method === method && (Array.isArray(r.args[0]) ? r.args[0].includes(endpoint) : r.args[0] === endpoint));
    assert.ok(route?.args.includes(boot.auth()!.requireAuth), `${method} ${endpoint} must retain authentication`);
  }
});

test('admin login UI has no prefilled credentials or demo reset control', () => {
  const source = readFileSync(new URL('../src/pages/AdminDashboard.tsx', import.meta.url), 'utf8');
  assert.match(source, /\[email, setEmail\] = useState\(''\)/);
  assert.match(source, /\[password, setPassword\] = useState\(''\)/);
  assert.doesNotMatch(source, /admin123|admin@nitafoods\.local|Autofill|Seed Testing account Helper/);
  assert.match(source, /autoComplete="username"/);
  assert.match(source, /autoComplete="current-password"/);
});

test('development API import also performs zero database operations and never binds a listener', () => {
  const boot = bootstrapWithMocks(secret, 'development');
  boot.run();
  assert.equal(boot.calls.listens, 0);
  assert.equal(boot.calls.databaseAccess, 0);
});
