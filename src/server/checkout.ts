import { variantLabel } from '../variantLabel';
﻿import { Prisma } from '@prisma/client';

export class CheckoutError extends Error {}
export interface RequestedItem { productId: string; variantId: string; quantity: number }
export function validateItems(input: unknown): RequestedItem[] {
  if (!Array.isArray(input) || !input.length || input.length > 100) throw new CheckoutError('Cart must contain 1–100 items.');
  const combined = new Map<string, RequestedItem>();
  for (const item of input) {
    if (!item || typeof item.productId !== 'string' || typeof item.variantId !== 'string' || !item.variantId || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100000) throw new CheckoutError('Each item needs a product, variant and positive whole quantity.');
    const key = JSON.stringify([item.productId, item.variantId]);
    const quantity = (combined.get(key)?.quantity || 0) + item.quantity;
    if (quantity > 100000) throw new CheckoutError('Quantity is too large.');
    combined.set(key, { productId: item.productId, variantId: item.variantId, quantity });
  }
  return [...combined.values()];
}
export async function createCheckout(tx: Prisma.TransactionClient, input: Record<string, unknown>) {
  const text = (key: string, required = false) => {
    const value = input[key];
    if (value !== undefined && value !== null && typeof value !== 'string') throw new CheckoutError(`Invalid ${key}.`);
    const result = typeof value === 'string' ? value.trim() : '';
    if ((required && !result) || result.length > 2000) throw new CheckoutError(`Invalid ${key}.`);
    return result;
  };
  const customerName = text('customerName', true), phone = text('phone', true);
  const email = text('email'), address = text('address'), notes = text('notes');
  const requested = validateItems(input.items);
  const products = await tx.product.findMany({ where: { id: { in: requested.map(i => i.productId) } }, include: { variants: true, images: { orderBy: { position: 'asc' } } } });
  const items = requested.map(item => {
    const product = products.find(p => p.id === item.productId);
    const variant = product?.variants.find(v => v.id === item.variantId);
    if (!product || !product.available || !variant || !variant.available) throw new CheckoutError('A selected product or variant is no longer available. Please update your cart.');
    if (item.quantity > variant.stock) throw new CheckoutError(`${product.name} / ${variantLabel(variant)}: only ${variant.stock} available.`);
    if (!Number.isFinite(variant.price) || variant.price < 0) throw new CheckoutError('Invalid product price.');
    const unitPrice = new Prisma.Decimal(variant.price.toString()).toDecimalPlaces(2);
    return { productId: product.id, variantId: variant.id, productName: product.name, variantName: variantLabel(variant), imageUrl: product.featuredImageUrl || product.images[0]?.imageUrl || '', unitPrice, quantity: item.quantity, subtotal: unitPrice.mul(item.quantity) };
  });
  const subtotal = items.reduce((sum, item) => sum.add(item.subtotal), new Prisma.Decimal(0));
  return tx.order.create({ data: { orderNumber: `NITA-${crypto.randomUUID().toUpperCase()}`, customerName, phone, email: email || null, address: address || null, notes: notes || null, subtotal, total: subtotal, items: { create: items } }, include: { items: true } });
}
