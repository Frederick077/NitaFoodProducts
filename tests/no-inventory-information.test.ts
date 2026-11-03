import test from 'node:test';
import assert from 'node:assert/strict';
import { createCheckout, CheckoutPriceChanged } from '../src/server/checkout';
import { buildVariantUpdate } from '../src/server/productVariants';
import { buildProductPatch } from '../src/server/productData';
import { buildInformationPatch } from '../src/server/productInformation';
import { formatProduct } from '../src/server/formatProduct';
import { getProductInformation } from '../src/productInformation';
import { getProductPresentation } from '../src/productPresentation';
import { addCartItem, restoreCart, updateCartQuantity, cartKey } from '../src/context/cartState';
import { educationalHubLinks } from '../src/data/educationalHub';

const variant = {id:'v',name:'Fixture pack',size:'',price:12000,available:true};
const product:any={id:'p',name:'Fixture',description:'Existing description',benefits:'Existing approved benefits',ingredients:'Existing ingredients',available:true,publicationStatus:'PUBLISHED',variants:[variant],images:[]};

test('legacy zero, missing and unknown stock never gate valid cart or order requests',async()=>{
  for(const stock of [0,undefined,null,-1,'unknown']){
    const saved={...product,variants:[{...variant,stock}]};let writes=0;
    const tx:any={product:{findMany:async()=>[saved]},order:{create:async({data}:any)=>{writes++;return data;}}};
    const before=structuredClone(saved);
    const cart=addCartItem([],saved,'v',20);assert.equal(cart[0].quantity,20);assert.equal(Object.hasOwn(cart[0],'stock'),false);
    assert.equal(updateCartQuantity(cart,cartKey(cart[0]),50)[0].quantity,50);
    const restored=restoreCart(JSON.stringify([{...cart[0],stock:0}]));assert.equal(restored[0].quantity,20);assert.equal(Object.hasOwn(restored[0],'stock'),false);
    const order=await createCheckout(tx,{customerName:'Fixture',phone:'Fixture',items:[{productId:'p',variantId:'v',quantity:20,expectedUnitPrice:12000}]});assert.equal(writes,1);assert.equal(order.total.toString(),'240000');assert.deepEqual(saved,before);
    assert.equal(getProductPresentation(saved).canQuickOrder,true);assert.equal(Object.hasOwn(formatProduct(saved).variants[0],'stock'),false);
    await assert.rejects(createCheckout(tx,{customerName:'Fixture',phone:'Fixture',items:[{productId:'p',variantId:'v',quantity:20,expectedUnitPrice:11000}]}),CheckoutPriceChanged);assert.equal(writes,1);
  }
});

test('variant mutations cannot alter historical stock; archived products and inactive packs remain protected',async()=>{
  const patch:any=buildVariantUpdate([{...variant,stock:999}],[{id:'v'}]);assert.equal(patch.update[0].where.id,'v');assert.equal(Object.hasOwn(patch.update[0].data,'stock'),false);
  assert.equal(Object.hasOwn((buildVariantUpdate([{...variant,id:undefined}],[]).create as any[])[0],'stock'),false);
  for(const p of [{...product,publicationStatus:'DRAFT'},{...product,publicationStatus:'ARCHIVED'},{...product,available:false},{...product,variants:[{...variant,available:false}]}]){
    const tx:any={product:{findMany:async()=>[p]},order:{create:async()=>assert.fail('No order allowed')}};
    await assert.rejects(createCheckout(tx,{customerName:'Fixture',phone:'Fixture',items:[{productId:'p',variantId:'v',quantity:1,expectedUnitPrice:12000}]}));
    assert.throws(()=>addCartItem([],p,'v',1));
  }
});

test('product information preserves content/order and omits missing or unbased nutrient text',()=>{
  const complete={...product,nutrients:'Fixture nutrient statement with units',nutritionBasis:'Fixture basis: per 100 g',howToUse:'Fixture approved instructions'};
  assert.deepEqual(getProductInformation(complete).map(s=>s.title),['Description','Benefits of the Product','Nutrients Available','Ingredients','How to Use']);
  assert.equal(getProductInformation(complete)[2].basis,complete.nutritionBasis);
  assert.deepEqual(getProductInformation({...product,benefits:' ',ingredients:'',nutrients:'Unbased information'}).map(s=>s.title),['Description']);
  assert.deepEqual(buildInformationPatch({nutrients:complete.nutrients,nutritionBasis:complete.nutritionBasis,howToUse:complete.howToUse}),{nutrients:complete.nutrients,nutritionBasis:complete.nutritionBasis,howToUse:complete.howToUse});
  assert.throws(()=>buildInformationPatch({nutrients:'Unbased'}));assert.throws(()=>buildInformationPatch({howToUse:42}));assert.throws(()=>buildInformationPatch({nutritionBasis:''},complete));
  assert.deepEqual(buildProductPatch({howToUse:'Approved use'},product),{howToUse:'Approved use'});assert.equal(getProductInformation(complete)[0].text,product.description);
});

test('Educational Hub has three distinct owner-requested routes without invented programme content',()=>{
  assert.deepEqual(educationalHubLinks.map(item=>item.path),['/educational-hub/community-clinic-training','/educational-hub/maternal-lactation-support','/educational-hub/sustainable-farming-education']);
  assert.equal(new Set(educationalHubLinks.map(item=>item.path)).size,3);
});
