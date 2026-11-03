import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Called only in a credential-free child process by verify-deployment.ts.
assert.equal(process.env.DATABASE_URL, undefined);
assert.equal(process.env.CLOUDINARY_API_SECRET, undefined);
const handler = createRequire(import.meta.url)(fileURLToPath(new URL('../.vercel/output/functions/api.func/index.cjs', import.meta.url)));
const server = createServer(handler);
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  const paths = process.env.JWT_SECRET ? [['/api/no-such-route?fixture=1',404],['/api/orders',401],['/api/products',503],['/api/gallery',503],['/api/site-images',503]] : [['/api/no-such-route',503]];
  for (const [endpoint, status] of paths) {
    const response = await fetch(base + endpoint);
    assert.equal(response.status,status,endpoint);
    assert.ok(response.headers.get('content-type').includes('application/json'));
    const body = await response.text();
    assert.doesNotMatch(body,/postgresql:|stack|JWT_SECRET|PrismaClient|schema\.prisma/);
    assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  }
  if (process.env.JWT_SECRET) {
    const response = await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@example.invalid',password:'fixture-password'})});
    assert.equal(response.status,503); // Shared Redis absent: no database/authentication attempt.
  }
  console.log(JSON.stringify({packagedFunction:'pass',configuration:process.env.JWT_SECRET?'isolated-secret-with-no-services':'missing-secret',requests:paths.length}));
} finally { server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }
