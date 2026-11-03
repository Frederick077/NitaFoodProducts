import fs from 'node:fs';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import {PrismaClient} from '@prisma/client';
import {productReadRoutes} from '../../src/server/productReads';

// No application server or network listener is started. Exercise production read
// handlers directly using a read-only transaction; analytics writes are blocked.
dotenv.config({quiet:true});
const client=new PrismaClient({errorFormat:'minimal',log:[]});
const result:any={checkedAt:new Date().toISOString(),checks:[],applicationStarted:false,liveAuthenticatedUiVerified:false};
const check=(name:string,pass:boolean)=>{result.checks.push({name,pass});assert.ok(pass,name);};
try {
 const target=new URL(process.env.DATABASE_URL!);
 assert.equal(target.hostname,'ep-dry-wind-axm517bt.c-4.us-east-2.aws.neon.tech');assert.equal(target.pathname,'/neondb');
 await client.$transaction(async tx=>{
  await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
  const include={category:true,images:{orderBy:{position:'asc' as const}},variants:{orderBy:{price:'asc' as const}}};
  let blockedAnalyticsWrites=0;
  const database={product:{findMany:(args:any={})=>tx.product.findMany({...args,include}),findUnique:(args:any)=>tx.product.findUnique({...args,include})},analyticsEvent:{create:()=>{blockedAnalyticsWrites++;return Promise.reject(new Error('WRITE_SUPPRESSED_BY_READONLY_HARNESS'));}}};
  const router:any=productReadRoutes((_req,_res,next)=>next(),()=>database);
  const invoke=async(path:string,query:any={},params:any={})=>{
   const layer=router.stack.find((l:any)=>l.route?.path===path);
   let status=200,body:any;
   const response:any={status:(s:number)=>{status=s;return response;},json:(v:any)=>{body=v;return response;},setHeader:()=>response};
   await layer.route.stack.at(-1).handle({query,params},response,()=>{});
   return {status,body};
  };
  const all=await invoke('/products');check('public listing returns three products',all.status===200&&Array.isArray(all.body)&&all.body.length===3);
  check('all legacy products are published',all.body.every((p:any)=>p.publicationStatus==='PUBLISHED'));
  check('product IDs, detail identifiers, category IDs and variants are available',all.body.every((p:any)=>p.id&&p.slug&&p.categoryId&&Array.isArray(p.variants)&&p.variants.length>0));
  const featured=await invoke('/products',{featured:'true'});check('homepage featured query succeeds',featured.status===200&&Array.isArray(featured.body)&&featured.body.every((p:any)=>p.isFeatured));
  const categories=await tx.category.findMany({include:{_count:{select:{products:true}}}});check('category reads succeed',categories.length===2);
  const selected=await invoke('/products',{categoryId:categories[0].id});check('category-filtered product reads succeed',selected.status===200&&selected.body.every((p:any)=>p.categoryId===categories[0].id));
  const detail=await invoke('/products/:identifier',{}, {identifier:all.body[0].slug});check('product detail handler reads by slug',detail.status===200&&detail.body.id===all.body[0].id);
  const admin=await invoke('/admin/products');check('admin listing handler reads successfully',admin.status===200&&admin.body.length===3);
  const preview=await invoke('/admin/products/:id/preview',{}, {id:all.body[0].id});check('admin preview handler reads successfully',preview.status===200&&preview.body.id===all.body[0].id);
  const [events,products,orders]=await Promise.all([tx.analyticsEvent.findMany({orderBy:{createdAt:'desc'},take:2000}),database.product.findMany(),tx.order.findMany({include:{items:true},orderBy:{createdAt:'desc'}})]);
  check('analytics product/event/order queries succeed',Array.isArray(events)&&products.length===3&&orders.length===2);
  result.blockedAnalyticsWrites=blockedAnalyticsWrites;
  check('detail analytics write was suppressed',blockedAnalyticsWrites===1);
  const urls=[...new Set(all.body.flatMap((p:any)=>[p.featuredImageUrl,...(p.images||[]).map((i:any)=>i.imageUrl)]).filter((u:any)=>typeof u==='string'&&u.startsWith('https://')))];
  result.imageReferencesToCheck=urls;
 },{maxWait:10000,timeout:60000});
 // Public image HEAD requests do not touch the application/database. No URL is logged.
 const urls=result.imageReferencesToCheck as string[];delete result.imageReferencesToCheck;
 result.imageHeadChecks=await Promise.all(urls.map(async url=>{try{const r=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(15000)});return {ok:r.ok,status:r.status,imageContentType:(r.headers.get('content-type')||'').startsWith('image/')};}catch{return {ok:false,error:'NETWORK_UNAVAILABLE'};}}));
 result.status='PASS: production read handlers and queries verified without restarting application';
}catch(e:any){delete result.imageReferencesToCheck;result.status='FAILED';result.errorCode=e?.code||'CHECK_FAILED';process.exitCode=1;}
finally{await client.$disconnect();fs.writeFileSync('artifacts/product-loading-verification/post-repair-handler-smoke.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));}
