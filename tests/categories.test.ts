import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { Prisma, type PrismaClient } from '@prisma/client';
import { categoryRoutes } from '../src/server/categories';

test('category HTTP API enforces auth, validates names, preserves identity on rename and explains restricted deletion', async () => {
  const calls: { action: string; args: any }[] = [];
  const constraint = (code: string) => new Prisma.PrismaClientKnownRequestError('constraint', { code, clientVersion: '6.19.3' });
  const database = { category: {
    findMany: async () => [{ id: 'used', name: 'Seeds', slug: 'seeds', _count: { products: 2 } }],
    create: async (args: any) => { calls.push({ action: 'create', args }); if (args.data.name === 'Seeds') throw constraint('P2002'); return { id: 'new', ...args.data }; },
    update: async (args: any) => { calls.push({ action: 'update', args }); return { id: args.where.id, slug: 'seeds', ...args.data }; },
    delete: async (args: any) => { calls.push({ action: 'delete', args }); if (args.where.id === 'used') throw constraint('P2003'); if (args.where.id === 'missing') throw constraint('P2025'); return { id: args.where.id }; },
  } } as unknown as PrismaClient;
  const app = express(); app.use(express.json());
  app.use('/api/categories', categoryRoutes((req, res, next) => {
    if (req.headers.authorization !== 'Bearer test-admin') { res.status(401).end(); return; }
    next();
  }, () => database));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address() as { port: number };
  const request = (method: string, suffix = '', body?: unknown, authorized = true) => fetch(`http://127.0.0.1:${address.port}/api/categories${suffix}`, {
    method, headers: { 'Content-Type': 'application/json', ...(authorized ? { Authorization: 'Bearer test-admin' } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  try {
    assert.equal((await request('GET', '', undefined, false)).status, 200);
    for (const method of ['POST', 'PUT', 'DELETE']) assert.equal((await request(method, method === 'POST' ? '' : '/used', { name: 'New' }, false)).status, 401);
    assert.equal(calls.length, 0);
    for (const name of ['', '  ', 'All', 'x'.repeat(121), 12]) assert.equal((await request('POST', '', { name })).status, 400);
    const created = await request('POST', '', { name: '  New category  ' });
    assert.equal(created.status, 201); assert.equal((await created.json()).name, 'New category');
    assert.equal((await request('POST', '', { name: 'Seeds' })).status, 409);
    const renamed = await (await request('PUT', '/used', { name: 'Nuts' })).json();
    assert.equal(renamed.id, 'used'); assert.equal(renamed.slug, 'seeds');
    assert.deepEqual(calls.find(call => call.action === 'update')?.args.data, { name: 'Nuts' });
    const blocked = await request('DELETE', '/used'); assert.equal(blocked.status, 409); assert.match((await blocked.json()).error, /Reassign/);
    assert.equal((await request('DELETE', '/unused')).status, 204);
    assert.equal((await request('DELETE', '/missing')).status, 404);
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});
