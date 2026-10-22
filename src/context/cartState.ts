import { variantLabel } from '../variantLabel';
﻿import { Product } from '../types';
export interface CartItem { productId: string; variantId: string; productName: string; variantName: string; imageUrl: string; unitPrice: number; quantity: number; stock: number }
export const cartKey = (item: Pick<CartItem, 'productId' | 'variantId'>) => JSON.stringify([item.productId, item.variantId]);
export function addCartItem(items: CartItem[], product: Product, variantId: string, quantity: number): CartItem[] {
  const variant = product.variants.find(v => v.id === variantId);
  if (!product.available || !variant?.available || !Number.isSafeInteger(quantity) || quantity < 1) throw new Error('Select an available variant and a valid quantity.');
  const key = cartKey({ productId: product.id, variantId });
  const total = (items.find(i => cartKey(i) === key)?.quantity || 0) + quantity;
  if (total > variant.stock) throw new Error(`Only ${variant.stock} available, including items already in your cart.`);
  const item: CartItem = { productId: product.id, variantId, productName: product.name, variantName: variantLabel(variant), imageUrl: product.featuredImageUrl || product.images[0]?.imageUrl || '', unitPrice: variant.price, quantity: total, stock: variant.stock };
  return items.some(i => cartKey(i) === key) ? items.map(i => cartKey(i) === key ? item : i) : [...items, item];
}
export function updateCartQuantity(items: CartItem[], key: string, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error('Quantity must be a positive whole number.');
  return items.map(i => { if (cartKey(i) !== key) return i; if (quantity > i.stock) throw new Error(`Only ${i.stock} available.`); return { ...i, quantity }; });
}
export function restoreCart(raw: string | null): CartItem[] {
  try {
    const value: unknown = JSON.parse(raw || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((i): i is CartItem => i && ['productId','variantId','productName','variantName','imageUrl'].every(k => typeof i[k] === 'string') && Number.isSafeInteger(i.quantity) && i.quantity > 0 && Number.isFinite(i.unitPrice) && i.unitPrice >= 0 && Number.isSafeInteger(i.stock) && i.stock >= i.quantity).slice(0,100);
  } catch { return []; }
}
