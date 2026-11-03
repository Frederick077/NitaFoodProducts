import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { deploymentSimulator } from '../tools/deployment-simulator.mjs';
import { productionSecurityHeaders } from '../deployment/security-policy.mjs';
import { isPublishedFile, isSourcePublicAsset } from '../deployment/output-policy.mjs';
import { apiFixture } from './helpers/apiSecurityFixture';
import * as validation from '../src/server/uploadValidation';

const png=Buffer.from([137,80,78,71,13,10,26,10]);

test('CDN publication allowlist rejects source/configuration/secrets and preserves required media',()=>{
  for(const file of ['server.cjs','server.cjs.map','.env','schema.prisma','package.json','images/SOURCES.md','src/app.ts','assets/app.js.map','node_modules/runtime.js']) assert.equal(isPublishedFile(file),false,file);
  for(const file of ['index.html','assets/index-ABCDEFGH.js','assets/index-ABCDEFGH.css','images/logo.svg','images/product.webp','fonts/body.woff2'])assert.equal(isPublishedFile(file),true,file);
  assert.equal(isSourcePublicAsset('index.html'),false);
  assert.equal(isSourcePublicAsset('assets/rogue.js'),false);
});

test('emitted Vercel static routing protects private files independently of Express',async()=>{
  let apiCalls=0;
  const server=deploymentSimulator({apiHandler:(req,res)=>{apiCalls++;res.setHeader('Content-Type','application/json');res.statusCode=404;res.end(JSON.stringify({url:req.url}));}});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${(server.address() as any).port}`;
  try {
    for(const endpoint of ['/server.cjs','/.env','/%2eenv','/prisma/schema.prisma','/dist/server/app.cjs','/node_modules/.prisma/client/index.js','/assets/missing.js','/images/SOURCES.md']){
      const response=await fetch(base+endpoint);assert.equal(response.status,404,endpoint);assert.ok(!(await response.text()).includes('<div id="root">'));
      for(const [name,value] of Object.entries(productionSecurityHeaders))assert.equal(response.headers.get(name),value);
    }
    assert.equal(apiCalls,0);
    const response=await fetch(base+'/api/missing?fixture=yes');assert.equal(response.status,404);assert.deepEqual(await response.json(),{url:'/api/missing?fixture=yes'});assert.equal(apiCalls,1);
    for(const endpoint of ['/about','/products/fixture-seeds','/admin/login']){const r=await fetch(base+endpoint);assert.equal(r.status,200);assert.ok((await r.text()).includes('<div id="root">'));}
  } finally {server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});

test('Prisma stays pinned, builds generate without migrations, and Linux engine is private',()=>{
  const manifest=JSON.parse(readFileSync('dist/server/release-manifest.json','utf8'));
  const pkg=JSON.parse(readFileSync('package.json','utf8'));
  assert.equal(pkg.dependencies['@prisma/client'],'6.19.3');assert.equal(pkg.devDependencies.prisma,'6.19.3');assert.equal(pkg.engines.node,'24.x');
  const config=JSON.parse(readFileSync('.vercel/output/functions/api.func/.vc-config.json','utf8'));
  assert.equal(config.runtime,'nodejs24.x');assert.equal(config.shouldAddHelpers,false);
  assert.ok(existsSync('.vercel/output/functions/api.func/node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node'));
  assert.ok(manifest.publicFiles.every((f:any)=>isPublishedFile(f.name)));
  assert.ok(!manifest.functionFiles.some((f:string)=>/\.map$|\.env|windows\.dll/.test(f)));
  assert.doesNotMatch(readFileSync('tools/build-production.mjs','utf8'), /['"](?:migrate|seed|db push|reset)['"]/);
});

test('production adapter never falls back to sample business records without PostgreSQL',async()=>{
  const exports:any={};const source=readFileSync('src/lib/prisma.ts','utf8');
  runInNewContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{exports,process:{env:{NODE_ENV:'production'}},require:(name:string)=>{if(name==='dotenv/config')return{};if(name==='@prisma/client')return{PrismaClient:class{}};throw Error('Unexpected import');}});
  for(const run of [()=>exports.prisma.product.findMany(),()=>exports.prisma.galleryItem.findMany(),()=>exports.prisma.message.create({data:{name:'Fixture'}})])await assert.rejects(run,/PostgreSQL is unavailable/);
});

test('production storage initialization/upload never creates or writes a local directory',async()=>{
  const exports:any={};let disk=0,cloud=0;
  const forbidden=()=>{disk++;throw Error('Unexpected filesystem access');};
  const fs={existsSync:forbidden,mkdirSync:forbidden,promises:{writeFile:forbidden}};
  const imports:any={fs,path,crypto:{},cloudinary:{v2:{config(){cloud++;}}},'./uploadValidation':validation,'./httpSecurity':{logApiError(){}}};
  runInNewContext(ts.transpileModule(readFileSync('src/server/imageStorage.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{exports,process:{env:{NODE_ENV:'production'},cwd:()=>'/isolated'},require:(name:string)=>{assert.ok(name in imports,name);return imports[name];}});
  await assert.rejects(exports.uploadImageFile(png,'fixture.png','image/png','products'),/Production image storage is unavailable/);
  assert.equal(disk,0);assert.equal(cloud,0);
});

test('Cloudinary outage returns sanitized JSON through output routing and never stores a file',async()=>{
  const fixture=await apiFixture({storageUnavailable:true,serveFrontend:false});const server=deploymentSimulator({apiHandler:fixture.app});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${(server.address() as any).port}`;
  try {
    const form=new FormData();form.append('image',new Blob([png],{type:'image/png'}),'fixture.png');
    const response=await fetch(base+'/api/admin/images/upload',{method:'POST',headers:{Authorization:fixture.authorization},body:form});
    assert.equal(response.status,503);assert.ok(response.headers.get('content-type')?.includes('application/json'));assert.doesNotMatch(await response.text(),/private cloud|stack|credential/);assert.equal(fixture.writes.uploads,0);
    const unauthorized=await fetch(base+'/api/admin/images/upload',{method:'POST',body:form});assert.equal(unauthorized.status,401);
  }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));await fixture.close();}
});
