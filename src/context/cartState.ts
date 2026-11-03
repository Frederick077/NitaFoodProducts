import { variantLabel } from '../variantLabel';
import type { PriceChange } from '../types';
﻿import { Product } from '../types';
export interface CartItem { productId: string; variantId: string; productName: string; variantName: string; imageUrl: string; unitPrice: number; quantity: number }
export const cartKey = (item: Pick<CartItem, 'productId' | 'variantId'>) => JSON.stringify([item.productId, item.variantId]);
export function addCartItem(items: CartItem[], product: Product, variantId: string, quantity: number): CartItem[] {
  const variant = product.variants.find(v => v.id === variantId);
  if ((product.publicationStatus && product.publicationStatus !== 'PUBLISHED') || !product.available || !variant?.available || !Number.isFinite(variant.price) || variant.price < 0 || !Number.isSafeInteger(quantity) || quantity < 1) throw new Error('Select an available variant and a valid quantity.');
  const key = cartKey({ productId: product.id, variantId });
  const existing = items.find(i => cartKey(i) === key);
  if (existing && existing.unitPrice !== variant.price) throw new Error('This pack has changed price. Review the price at checkout before adding more.');
  const total = (items.find(i => cartKey(i) === key)?.quantity || 0) + quantity;
  if (total > 100000) throw new Error('Quantity must not exceed 100,000 per pack.');
  const item: CartItem = { productId: product.id, variantId, productName: product.name, variantName: variantLabel(variant), imageUrl: product.featuredImageUrl || product.images[0]?.imageUrl || '', unitPrice: variant.price, quantity: total };
  return items.some(i => cartKey(i) === key) ? items.map(i => cartKey(i) === key ? item : i) : [...items, item];
}
export function acceptCartPriceChanges(items: CartItem[], changes: PriceChange[]) {
  if (!Array.isArray(changes) || !changes.length) throw new Error('No updated prices to accept.');
  const seen = new Set<string>();
  for (const change of changes) {
    const key = cartKey(change), item = items.find(i => cartKey(i) === key);
    if (seen.has(key) || !item || item.quantity !== change.quantity || item.unitPrice !== change.previousPrice || !Number.isFinite(change.currentPrice) || change.currentPrice < 0) throw new Error('Your cart changed. Please submit it again for a fresh price review.');
    seen.add(key);
  }
  return items.map(item => { const change = changes.find(c => cartKey(c) === cartKey(item)); return change ? { ...item, unitPrice: change.currentPrice } : item; });
}
export function updateCartQuantity(items: CartItem[], key: string, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100000) throw new Error('Quantity must be a positive whole number.');
  return items.map(i => { if (cartKey(i) !== key) return i; return { ...i, quantity }; });
}
export function restoreCart(raw: string | null): CartItem[] {
  try {
    const value: unknown = JSON.parse(raw || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((i): i is CartItem => i && ['productId','variantId','productName','variantName','imageUrl'].every(k => typeof i[k] === 'string') && Number.isSafeInteger(i.quantity) && i.quantity > 0 && Number.isFinite(i.unitPrice) && i.unitPrice >= 0 && i.quantity <= 100000).slice(0,100).map(({stock: _legacyStock, ...item}: CartItem & {stock?: unknown}) => item);
  } catch { return []; }
}
