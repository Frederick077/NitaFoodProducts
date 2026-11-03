import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { buildImageUpdate, validateImageOrder } from '../src/server/productImages';
import { buildProductPatch } from '../src/server/productData';
import { buildVariantUpdate } from '../src/server/productVariants';
import { productMediaRoutes } from '../src/server/productMedia';
import { productReadRoutes } from '../src/server/productReads';
import { productWriteRoutes } from '../src/server/productWrites';
import { formatProduct } from '../src/server/formatProduct';
import { matchesProductSearch, resolveCategory, getProductImages } from '../src/catalog';
import { createCheckout, CheckoutPriceChanged, requireCheckoutQuote } from '../src/server/checkout';
import { addCartItem, acceptCartPriceChanges } from '../src/context/cartState';

const images = [0,1].map(i => ({ id:'i'+i, productId:'p', imageUrl:'https://example.invalid/'+i, storagePublicId:'shared-'+i, altText:'Pack '+i, position:i }));
const variant = { id:'v', name:'Pack', size:'', price:20, stock:4, available:true, sku:'' };
const product = { id:'p', slug:'pack', name:'Fixture pack', description:'Roasted seeds', shortDescription:'Breakfast', ingredients:'Chia', categoryId:'c', category:{name:'Seeds'}, available:true, publicationStatus:'PUBLISHED', isFeatured:true, featuredImageUrl:images[1].imageUrl, images, variants:[variant] };

test('narrow product patches preserve image identities and untouched concurrent images', () => {
  assert.deepEqual(buildProductPatch({description:'Edited'}, product), {description:'Edited'});
  assert.equal(buildProductPatch({variants:[variant]}, product).images, undefined);
  const update:any = buildImageUpdate([{id:'i0',altText:'New alt'}], images);
  assert.deepEqual(update.update, [{where:{id:'i0'},data:{...images[0],id:undefined,productId:undefined,altText:'New alt'}}].map(r=>({where:r.where,data:{imageUrl:r.data.imageUrl,storagePublicId:r.data.storagePublicId,altText:r.data.altText,position:r.data.position}})));
  assert.deepEqual(update.create, []); assert.deepEqual(update.deleteMany, {id:{in:[]}});
  assert.throws(()=>buildImageUpdate([{id:'foreign'}],images));
  assert.throws(()=>buildImageUpdate([{id:'i0',imageUrl:'https://replacement.invalid'}],images));
  assert.throws(()=>buildImageUpdate([],images,['foreign']));
  assert.deepEqual(validateImageOrder([{id:'i1'},{id:'i0'}],images),[{id:'i1',position:0},{id:'i0',position:1}]);
  assert.throws(()=>validateImageOrder([{id:'i0'},{id:'i0'}],images));
});

test('variants reject empty/coerced values and active duplicate labels/SKUs; omission archives IDs',()=>{
  for (const patch of [{price:''},{price:'20'},{available:'true'},{compareAtPrice:''}]) assert.throws(()=>buildVariantUpdate([{...variant,...patch}],[variant]));
  assert.throws(()=>buildVariantUpdate([{...variant,id:undefined,name:'',size:''}],[]));
  assert.throws(()=>buildVariantUpdate([variant,{...variant,id:undefined,name:' PACK '}],[variant]));
  assert.throws(()=>buildVariantUpdate([{...variant,sku:'A'},{...variant,id:undefined,name:'Other',sku:'a'}],[variant]));
  const result = buildVariantUpdate([variant],[variant,{id:'historic'}]);
  assert.deepEqual(result.updateMany,{where:{id:{in:['historic']}},data:{available:false}});
  assert.equal(result.deleteMany,undefined);
});

test('price aliases, featured gallery, shared search and stable category identity agree',()=>{
  const formatted:any=formatProduct({...product,variants:[{...variant,id:'cheap',price:1,stock:0},variant]});
  assert.equal(formatted.price,1);assert.equal(getProductImages(formatted)[0].id,'i1');assert.equal(getProductImages(formatted).length,2);
  assert.equal(matchesProductSearch(formatted,'chia breakfast'),true);
  const category:any={id:'c',name:'Renamed',slug:'seeds-12345678-1234-1234-1234-123456789abc'};
  assert.equal(resolveCategory([category],'c')?.name,'Renamed');assert.equal(resolveCategory([category],'Seeds')?.id,'c');
  assert.equal(Object.hasOwn(formatProduct({...product,variants:[{...variant,stock:undefined}]}).variants[0],'stock'),false);
});

async function serve(app:ReturnType<typeof express>, run:(base:string)=>Promise<void>) {
  const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
  try {await run('http://127.0.0.1:'+(server.address() as any).port);} finally {await new Promise<void>((r,j)=>server.close(e=>e?j(e):r()));}
}
const auth:express.RequestHandler=(req,res,next)=>req.headers.authorization==='Bearer fixture'?next():void res.status(401).json({error:'Unauthorized'});
const headers={'Content-Type':'application/json',Authorization:'Bearer fixture'};

test('real media HTTP routes enforce ownership, retain metadata and roll back failed reorder',async()=>{
  let state=structuredClone(product);let fail=false;
  const database:any={$transaction:async(fn:any)=>{
    const draft=structuredClone(state);let updates=0;
    const tx={product:{findUnique:async()=>draft,update:async({data}:any)=>{Object.assign(draft,data);return draft;}},productImage:{updateMany:async({where,data}:any)=>{if(fail && ++updates===2)throw Error('DB failure');const image=draft.images.find(i=>i.id===where.id&&i.productId===where.productId);if(image)Object.assign(image,data);return {count:image?1:0};},deleteMany:async({where}:any)=>{const before=draft.images.length;draft.images=draft.images.filter(i=>i.id!==where.id||i.productId!==where.productId);return{count:before-draft.images.length};}}};
    const result=await fn(tx);state=draft;return result;
  }};
  const app=express();app.use(express.json());app.use('/api',productMediaRoutes(auth,()=>database));
  await serve(app,async base=>{
    const request=(path:string,method:string,body?:any)=>fetch(base+'/api/admin/products/p/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
    assert.equal((await fetch(base+'/api/admin/products/p/images/i0',{method:'DELETE'})).status,401);
    assert.equal((await request('images/foreign','DELETE')).status,400);
    assert.equal((await request('images/reorder','PUT',{items:[{id:'i1'},{id:'foreign'}]})).status,400);
    fail=true;assert.equal((await request('images/reorder','PUT',{items:[{id:'i1'},{id:'i0'}]})).status,503);assert.deepEqual(state,product);
    fail=false;assert.equal((await request('images/reorder','PUT',{items:[{id:'i1'},{id:'i0'}]})).status,200);
    assert.equal(state.images[0].position,1);assert.equal(state.images[0].storagePublicId,'shared-0');
    const before=structuredClone(state.variants);await request('featured-image','PUT',{imageId:'i0',variants:[{price:0}]});assert.deepEqual(state.variants,before);
    const response=await request('images/i0','DELETE');assert.equal((await response.json()).cleanupRequired,true);assert.equal(state.images.length,1);assert.equal(state.featuredImageUrl,images[0].imageUrl);
  });
});

test('public list/detail/featured hide drafts and archives; sold-out published stays; preview protected',async()=>{
  const rows=[product,{...product,id:'draft',slug:'draft',publicationStatus:'DRAFT'},{...product,id:'archive',slug:'archive',publicationStatus:'ARCHIVED'},{...product,id:'sold',variants:[{...variant,stock:0}]}];let analytics=0;
  const db={product:{findMany:async()=>rows,findUnique:async({where}:any)=>rows.find(p=>p.id===where.id||p.slug===where.slug)},analyticsEvent:{create:async()=>{analytics++;}}};
  const app=express();app.use('/api',productReadRoutes(auth,()=>db));
  await serve(app,async base=>{
    for(const path of ['/products','/products?featured=true']){const r=await fetch(base+'/api'+path);assert.deepEqual((await r.json()).map((p:any)=>p.id),['p','sold']);}
    for(const id of ['draft','archive'])assert.equal((await fetch(base+'/api/products/'+id)).status,404);
    assert.equal(analytics,0);
    assert.equal((await fetch(base+'/api/admin/products/draft/preview')).status,401);
    const preview=await fetch(base+'/api/admin/products/draft/preview',{headers});assert.equal(preview.status,200);assert.equal(preview.headers.get('cache-control'),'no-store');assert.equal((await preview.json()).publicationStatus,'DRAFT');assert.equal(analytics,0);
  });
});

test('product write HTTP contract defaults new products to Draft and never supplies invented stock',async()=>{
  let created:any,patched:any;
  const db:any={category:{findUnique:async()=>({id:'c'})},product:{findUnique:async()=>structuredClone(product),create:async({data}:any)=>{created=data;return{...product,...data,images:[],variants:data.variants.create};},update:async({data}:any)=>{patched=data;return{...product,...data};}}};
  const app=express();app.use(express.json());app.use('/api',productWriteRoutes(auth,()=>db));
  await serve(app,async base=>{
    const post=(body:any)=>fetch(base+'/api/products',{method:'POST',headers,body:JSON.stringify(body)});
    const valid={name:'Fixture',description:'Fixture description',categoryId:'c',variants:[{...variant,id:undefined}]};
    assert.equal((await post(valid)).status,201);assert.equal(created.publicationStatus,'DRAFT');assert.equal(Object.hasOwn(created.variants.create[0],'stock'),false);
    for(const stock of ['',undefined,'50']){assert.equal((await post({...valid,variants:[{...variant,id:undefined,stock}]})).status,201);assert.equal(Object.hasOwn(created.variants.create[0],'stock'),false);}
    const r=await fetch(base+'/api/products/p',{method:'PUT',headers,body:JSON.stringify({description:'Changed only'})});assert.equal(r.status,200);assert.deepEqual(patched,{description:'Changed only'});
    assert.equal((await post({...valid,publicationStatus:'UNKNOWN'})).status,400);
  });
});

test('changed checkout prices require acceptance before a single authoritative snapshot write',async()=>{
  let writes=0;const tx:any={product:{findMany:async()=>[product]},order:{create:async({data}:any)=>{writes++;return data;}}};
  const input={customerName:'Fixture',phone:'fixture',items:[{productId:'p',variantId:'v',quantity:2,expectedUnitPrice:10}]};
  assert.throws(()=>requireCheckoutQuote([{productId:'p'}]));
  let changes:any;try{await createCheckout(tx,input);assert.fail('must reject');}catch(e){assert.ok(e instanceof CheckoutPriceChanged);changes=e.changes;}assert.equal(writes,0);
  const cart=addCartItem([],formatProduct({...product,variants:[{...variant,price:10}]} ) as any,'v',2);
  const accepted=acceptCartPriceChanges(cart,changes);assert.equal(cart[0].unitPrice,10);assert.equal(accepted[0].unitPrice,20);
  assert.throws(()=>acceptCartPriceChanges([{...cart[0],quantity:3}],changes));
  const order=await createCheckout(tx,{...input,items:[{...input.items[0],expectedUnitPrice:accepted[0].unitPrice}]});assert.equal(writes,1);assert.equal(order.total.toString(),'40');assert.equal((order as any).items.create[0].unitPrice.toString(),'20');
  for(const publicationStatus of ['DRAFT','ARCHIVED']){const blocked:any={...tx,product:{findMany:async()=>[{...product,publicationStatus}]}};await assert.rejects(createCheckout(blocked,input));}assert.equal(writes,1);
});
