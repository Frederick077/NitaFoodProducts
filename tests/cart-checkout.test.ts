import test from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { addCartItem, cartKey, restoreCart, updateCartQuantity } from '../src/context/cartState';
import { createCheckout, validateItems } from '../src/server/checkout';
import type { Product } from '../src/types';
const product = {id:'a',name:'Original product',available:true,featuredImageUrl:'image',images:[],variants:[{id:'v1',name:'Original variant',size:'250g',price:10.15,stock:10,available:true},{id:'v2',name:'Large',size:'500g',price:20,stock:10,available:true}]} as Product;
test('cart merges identical variants, separates others and products, persists, updates and removes',()=>{
 let cart=addCartItem([],product,'v1',1);
 cart=addCartItem(cart,{...product,id:'b'},'v1',2);cart=addCartItem(cart,{...product,id:'c'},'v1',1);assert.equal(cart.length,3);
 cart=addCartItem(cart,product,'v1',2);assert.equal(cart[0].quantity,3);
 cart=addCartItem(cart,product,'v2',1);assert.equal(cart.length,4);
 cart=updateCartQuantity(cart,cartKey(cart[0]),2);assert.equal(cart[0].quantity,2);
 assert.deepEqual(restoreCart(JSON.stringify(cart)),cart);
 assert.equal(cart.filter(i=>cartKey(i)!==cartKey(cart[0])).length,3);
 assert.throws(()=>addCartItem(cart,product,'v1',20));assert.throws(()=>updateCartQuantity(cart,cartKey(cart[0]),0));assert.throws(()=>addCartItem([], {...product,available:false},'v1',1));assert.deepEqual(restoreCart('{invalid'),[]);
});
test('checkout combines duplicate lines and rejects invalid quantities',()=>{
 assert.equal(validateItems([{productId:'a',variantId:'v1',quantity:1},{productId:'a',variantId:'v1',quantity:2}])[0].quantity,3);
 for(const quantity of [0,-1,1.5,'2',NaN]) assert.throws(()=>validateItems([{productId:'a',variantId:'v1',quantity}]));
});
function transaction(products: Product[]) {
 const writes: unknown[]=[];
 const tx={product:{findMany:async()=>products},order:{create:async(args: {data:unknown})=>{writes.push(args.data);return args.data;}}} as unknown as Prisma.TransactionClient;
 return {tx,writes};
}
test('one nested order write uses authoritative Decimal prices and immutable snapshots',async()=>{
 const {tx,writes}=transaction([product]);
 const order=await createCheckout(tx,{customerName:'Customer',phone:'123',total:1,items:[{productId:'a',variantId:'v1',quantity:3,unitPrice:0},{productId:'a',variantId:'v2',quantity:2}]});
 assert.equal(writes.length,1);assert.equal(order.total.toString(),'70.45');
 const data=writes[0] as {items:{create:{productName:string;variantName:string;unitPrice:Prisma.Decimal}[]}};
 assert.equal(data.items.create.length,2); const copy=structuredClone(product);copy.name='New product';copy.variants[0].name='New variant';copy.variants[0].price=999;
 assert.equal(data.items.create[0].productName,'Original product');assert.equal(data.items.create[0].variantName,'Original variant / 250g');assert.equal(data.items.create[0].unitPrice.toString(),'10.15');
});
test('invalid or unavailable items prevent every write',async()=>{
 for(const items of [[{productId:'missing',variantId:'v1',quantity:1}],[{productId:'a',variantId:'wrong',quantity:1}],[{productId:'a',variantId:'v1',quantity:11}]]) {
 const {tx,writes}=transaction([product]);await assert.rejects(createCheckout(tx,{customerName:'Customer',phone:'123',items}));assert.equal(writes.length,0);
 }
});

import { buildVariantUpdate } from '../src/server/productVariants';
import { variantLabel } from '../src/variantLabel';
test('empty variant names preserve IDs and use size or Standard across cart and checkout', async () => {
 for (const size of ['500g', '']) {
   const variant = { ...product.variants[0], name: '  ', size };
   const edited = { ...product, variants: [variant] };
   const update = buildVariantUpdate([variant], [{ id: variant.id }]);
   const rows = update.update as { where: { id: string }; data: { name: string } }[];
   assert.equal(rows[0].where.id, variant.id);
   assert.equal(rows[0].data.name, '');
   assert.deepEqual(update.create, []);
   assert.equal(variantLabel(variant), size || 'Standard');
   const cart = addCartItem([], edited, variant.id, 5);
   assert.equal(cart.length, 1);
   assert.equal(cart[0].variantName, size || 'Standard');
   const { tx } = transaction([edited]);
   const order = await createCheckout(tx, { customerName: 'Customer', phone: '123', items: cart });
   assert.equal((order as unknown as { items: { create: { variantName: string }[] } }).items.create[0].variantName, size || 'Standard');
 }
 assert.equal(variantLabel({ name: '500g', size: '500g' }), '500g');
 assert.doesNotThrow(() => buildVariantUpdate([{ ...product.variants[0], name: undefined, size: undefined }], [{ id: 'v1' }]));
});
test('variant editing retains IDs, creates only new rows, and archives only intentionally removed rows',()=>{
 const variant = {...product.variants[0],name:'Renamed',size:'New size',sku:'NEW',compareAtPrice:0};
 const result=buildVariantUpdate([variant,{...product.variants[1],id:undefined}],[{id:'v1'},{id:'removed'}]);
 assert.deepEqual(result.update,[{where:{id:'v1'},data:{name:'Renamed',size:'New size',sku:'NEW',compareAtPrice:0,price:10.15,stock:10,available:true}}]);
 assert.equal((result.create as unknown[]).length,1);
 assert.deepEqual(result.updateMany,{where:{id:{in:['removed']}},data:{available:false}});
 assert.equal(result.deleteMany,undefined);
 assert.throws(()=>buildVariantUpdate([{...variant,id:'foreign'}],[{id:'v1'}]));
 assert.throws(()=>buildVariantUpdate([variant,variant],[{id:'v1'}]));
 assert.throws(()=>buildVariantUpdate([{...variant,stock:-1}],[{id:'v1'}]));
});
