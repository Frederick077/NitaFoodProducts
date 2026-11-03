import test from 'node:test';
import assert from 'node:assert/strict';
import { getProductPresentation } from '../src/productPresentation';
import type { Product, ProductVariant } from '../src/types';

const pack = (id: string, price: number, stock: number, compareAtPrice: number | null = null): ProductVariant =>
  ({ id, name: id, size: id, price, stock, available: stock > 0, compareAtPrice });
const product = (variants: ProductVariant[], extra: Partial<Product> = {}): Product =>
  ({ available: true, price: 1000, variants, ...extra } as Product);

test('card prices exclude unavailable cheaper packs and compare the same variant', () => {
  const variants = [pack('sold out', 1000, 0, 2000), pack('250g', 8000, 8, 10000), pack('500g', 12000, 8, 15000)];
  const result = getProductPresentation(product(variants));
  assert.equal(result.price, 8000);
  assert.equal(result.compareAtPrice, 10000);
  assert.equal(result.hasPriceRange, true);
  assert.equal(result.canQuickOrder, true);
  assert.deepEqual(variants.map(variant => variant.id), ['sold out', '250g', '500g']);
});

test('a discount on another pack does not create a discount on the displayed price', () => {
  const result = getProductPresentation(product([pack('250g', 8000, 4), pack('500g', 12000, 4, 15000)]));
  assert.equal(result.compareAtPrice, null);
  assert.equal(getProductPresentation(product([pack('250g', 8000, 4, 7000)])).compareAtPrice, null);
});

test('exhausted and disabled products cannot open a purchasing action', () => {
  const exhausted = getProductPresentation(product([pack('250g', 8000, 0)]));
  assert.equal(exhausted.available, false);
  assert.equal(exhausted.canQuickOrder, false);
  assert.equal(exhausted.price, 8000);
  const disabled = getProductPresentation(product([pack('250g', 8000, 8)], { available: false }));
  assert.equal(disabled.available, false);
  assert.equal(disabled.canQuickOrder, false);
});

test('legacy products keep their real price but require details when no cart variant exists', () => {
  const result = getProductPresentation(product([], { price: 9000, compareAtPrice: 10000 }));
  assert.equal(result.price, 9000);
  assert.equal(result.compareAtPrice, 10000);
  assert.equal(result.canQuickOrder, false);
  assert.equal(result.hasPriceRange, false);
});

test('invalid or missing prices do not become fabricated zero-price offers', () => {
  const invalid = getProductPresentation(product([pack('bad price', NaN, 5)]));
  assert.equal(invalid.price, null);
  assert.equal(invalid.canQuickOrder, false);
  assert.equal(invalid.available, true, 'a price-data problem must not invent an out-of-stock status');
  assert.equal(getProductPresentation(product([pack('missing price', NaN, 5), pack('unavailable', 1000, 0)])).price, null);
  assert.equal(getProductPresentation(product([], { price: undefined })).price, null);
  assert.equal(getProductPresentation(product([], { price: 0 })).price, 0);
});
