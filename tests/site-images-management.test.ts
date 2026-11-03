import { siteImageSection, InputError, imageRecordValidation, reorderValidation } from '../src/server/validation';
import { logApiError } from '../src/server/httpSecurity';
﻿import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import crypto from 'node:crypto';
import express from 'express';
import ts from 'typescript';
import { createAuthentication } from '../src/server/auth';

// Execute only the actual auth middleware and site-image registrations, never the
// server entry point or Prisma client. In-memory delegates keep this DB-free.
const source = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
const routes = source.slice(source.indexOf('// --- SITE IMAGES ('), source.indexOf('// --- MESSAGES ---'));
const secret = 'isolated-site-image-test-secret-32-bytes';
const token = (exp = Date.now() + 60000) => {
  const body = Buffer.from(JSON.stringify({ id: 'test-admin', name: 'Test Admin', email: 'admin@example.invalid', role: 'Admin', exp })).toString('base64');
  return `${body}.${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
};
async function fixture(run: (base: string, calls: { reads: any[]; updates: any[] }) => Promise<void>) {
  const rows = [
    { id: 'visible', section: 'PRODUCTION', imageUrl: '/visible.webp', enabled: true, position: 1 },
    { id: 'hidden', section: 'PRODUCTION', imageUrl: '/hidden.webp', enabled: false, position: 0 },
  ];
  const calls = { reads: [] as any[], updates: [] as any[] };
  const prisma = { siteImage: {
    findMany: async (query: any) => { calls.reads.push(JSON.parse(JSON.stringify(query))); return rows.filter(row => Object.entries(query.where).every(([key, value]) => row[key as keyof typeof row] === value)).sort((a,b) => a.position-b.position); },
    findUnique: async ({where}: any) => rows.find(row => row.id === where.id),
    update: async (query: any) => { calls.updates.push(JSON.parse(JSON.stringify(query))); return {...rows.find(row=>row.id===query.where.id),...query.data}; },
  } };
  const app = express(); app.use(express.json());
  const { requireAuth } = createAuthentication(secret, () => ({ admin: { findUnique: async () => ({ id: 'test-admin', name: 'Test Admin', email: 'admin@example.invalid', passwordHash: '' }) } }));
  runInNewContext(ts.transpileModule(routes, {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText, {app,prisma,requireAuth,siteImageSection,InputError,imageRecordValidation,reorderValidation,logApiError,Buffer,console,retainMediaForReview:async()=>{}});
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  try { await run(`http://127.0.0.1:${(server.address() as any).port}`,calls); }
  finally { await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve())); }
}

test('public site images exclude disabled rows; authenticated management includes them in saved order', async()=>fixture(async(base,calls)=>{
  const publicRows = await (await fetch(base+'/api/site-images?section=production')).json();
  assert.deepEqual(publicRows.map((row:any)=>row.id),['visible']);
  const response = await fetch(base+'/api/admin/site-images',{headers:{Authorization:'Bearer '+token()}});
  assert.equal(response.status,200);
  assert.deepEqual((await response.json()).map((row:any)=>row.id),['hidden','visible']);
  assert.deepEqual(calls.reads.map(query=>query.where),[{enabled:true,section:'PRODUCTION'},{}]);
}));

test('reorder reaches the dedicated protected route rather than updating an image named reorder',async()=>fixture(async(base,calls)=>{
  const response=await fetch(base+'/api/admin/site-images/reorder',{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token()},body:JSON.stringify({items:[{id:'visible',position:0},{id:'hidden',position:1}]})});
  assert.equal(response.status,200);assert.equal((await response.json()).success,true);
  assert.deepEqual(calls.updates,[{where:{id:'visible'},data:{position:0}},{where:{id:'hidden'},data:{position:1}}]);
}));

test('management reads and reorder reject missing, forged and expired tokens before data access',async()=>fixture(async(base,calls)=>{
  for(const authorization of ['', 'Bearer forged.token', 'Bearer '+token(Date.now()-1000)]){
    for(const [path,method] of [['/api/admin/site-images','GET'],['/api/admin/site-images/reorder','PUT']]){
      const response=await fetch(base+path,{method,headers:authorization?{Authorization:authorization}:{}});
      assert.equal(response.status,401);
    }
  }
  assert.equal(calls.reads.length,0);assert.equal(calls.updates.length,0);
}));
