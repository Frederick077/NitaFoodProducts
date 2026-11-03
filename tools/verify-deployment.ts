import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { deploymentSimulator } from './deployment-simulator.mjs';
import { apiFixture, fixturePassword } from '../tests/helpers/apiSecurityFixture';
import { productionSecurityHeaders } from '../deployment/security-policy.mjs';
import { isPublishedFile } from '../deployment/output-policy.mjs';
import { listFiles } from './build-production.mjs';

const evidence = path.resolve('artifacts/phase2c-vercel-preparation');
fs.mkdirSync(evidence,{recursive:true});
const results: any = {routes:[],privatePaths:[],configuration:[],uploads:[]};
const output = path.resolve('.vercel/output');
const manifest = JSON.parse(fs.readFileSync('dist/server/release-manifest.json','utf8'));
assert.equal(manifest.prisma,'6.19.3'); assert.equal(manifest.node,'24.x');
assert.ok(listFiles(path.join(output,'static')).every(isPublishedFile));
assert.ok(manifest.functionFiles.includes('node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node'));
assert.ok(!manifest.functionFiles.some((name:string)=>/\.map$|\.env|windows\.dll/.test(name)));
const fixture = await apiFixture({serveFrontend:false});
const server = deploymentSimulator({apiHandler:fixture.app});
await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
const base = `http://127.0.0.1:${(server.address() as any).port}`;
const headers = (response:Response) => {for(const [name,value] of Object.entries(productionSecurityHeaders)) assert.equal(response.headers.get(name),value,name);};
try {
  for (const endpoint of ['/','/about','/products','/products/fixture-seeds','/admin/login','/contact','/gallery','/educational-hub']) {
    const response = await fetch(base+endpoint); assert.equal(response.status,200); headers(response);
    assert.ok((await response.text()).includes('<div id="root">'));results.routes.push({endpoint,status:response.status,type:'html'});
  }
  const asset = manifest.publicFiles.find((f:any)=>/^assets\/.*\.js$/.test(f.name)).name;
  for(const endpoint of ['/'+asset,'/images/headers/contact-phone-notepad-communication.jpg']) {
    const response=await fetch(base+endpoint);assert.equal(response.status,200);headers(response);
    if(endpoint.startsWith('/assets/'))assert.ok(response.headers.get('cache-control')?.includes('immutable'));
    results.routes.push({endpoint,status:response.status,type:response.headers.get('content-type')});await response.arrayBuffer();
  }
  for(const endpoint of ['/server.cjs','/server.cjs.map','/dist/server/app.cjs','/dist/server/release-manifest.json','/.env','/%2eenv','/prisma/schema.prisma','/prisma/migrations/fixture.sql','/src/lib/prisma.ts','/node_modules/.prisma/client/index.js','/.vercel/output/functions/api.func/index.cjs','/deployment/security-policy.mjs','/images/SOURCES.md','/assets/missing.js','/uploads/missing.png','/package.json']) {
    const response=await fetch(base+endpoint);assert.equal(response.status,404,endpoint);headers(response);assert.ok(!(await response.text()).includes('<div id="root">'));results.privatePaths.push(endpoint);
  }
  for(const [endpoint,status] of [['/api/no-such-route?private=1',404],['/API/no-such-route/',404],['/api/orders',401],['/api/gallery',200],['/api/products/fixture-seeds',200]] as const) {
    const response=await fetch(base+endpoint);assert.equal(response.status,status,endpoint);headers(response);assert.ok(response.headers.get('content-type')?.includes('application/json'));await response.json();results.routes.push({endpoint,status,type:'json'});
  }
  const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@example.invalid',password:fixturePassword})});assert.equal(login.status,200);assert.ok((await login.json()).token);
  const form=new FormData();form.append('image',new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'}),'fixture.png');form.append('category','products');
  const upload=await fetch(base+'/api/admin/images/upload',{method:'POST',headers:{Authorization:fixture.authorization},body:form});assert.equal(upload.status,200);assert.equal(fixture.writes.uploads,1);results.uploads.push({case:'raw multipart through output routing',status:200});
  const contact=await fetch(base+'/api/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Fixture',email:'fixture@example.invalid',message:'Isolated routing test'})});assert.equal(contact.status,201);assert.equal(fixture.writes.messages.length,1);
} finally {server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));await fixture.close();}

// Never inherit project credentials into the executable packaged-function smoke test.
for(const secret of [undefined,'isolated-deployment-secret-at-least-32-bytes']) {
  const env:NodeJS.ProcessEnv={NODE_ENV:'production'};
  for(const name of ['SystemRoot','WINDIR','PATH','TEMP','TMP']) if(process.env[name])env[name]=process.env[name];
  if(secret)env.JWT_SECRET=secret;
  const run=spawnSync(process.execPath,['--require',path.resolve('tests/helpers/block-environment-files.cjs'),path.resolve('tools/smoke-packaged-function.mjs')],{env,encoding:'utf8',timeout:30000,windowsHide:true});
  assert.equal(run.status,0,run.stderr);results.configuration.push(JSON.parse(run.stdout.trim()));
}
results.publicFileCount=manifest.publicFiles.length;results.functionBytes=manifest.functionBytes;
fs.writeFileSync(path.join(evidence,'deployment-results.json'),JSON.stringify(results,null,2));
console.log(`Deployment output verification passed: ${results.routes.length} routes, ${results.privatePaths.length} private/missing paths, packaged function with/without secret, mocked multipart/login/contact. No live database access.`);
