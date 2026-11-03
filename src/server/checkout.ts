import { orderCustomerInput, InputError } from './validation';
import { variantLabel } from '../variantLabel';
import type { PriceChange } from '../types';
﻿import { Prisma } from '@prisma/client';

export class CheckoutError extends Error {}
export class CheckoutPriceChanged extends CheckoutError {
  constructor(public readonly changes: PriceChange[]) { super('Prices have changed. Review and accept the updated prices before submitting again.'); }
}
export interface RequestedItem { productId: string; variantId: string; quantity: number; expectedUnitPrice?: number }
export function requireCheckoutQuote(input: unknown) {
  if (!Array.isArray(input) || !input.length || input.some(i => typeof i?.expectedUnitPrice !== 'number' || !Number.isFinite(i.expectedUnitPrice) || i.expectedUnitPrice < 0)) throw new CheckoutError('Refresh checkout and submit the prices shown in your cart.');
}
export function validateItems(input: unknown): RequestedItem[] {
  if (!Array.isArray(input) || !input.length || input.length > 100) throw new CheckoutError('Cart must contain 1–100 items.');
  const combined = new Map<string, RequestedItem>();
  for (const item of input) {
    if (!item || typeof item.productId !== 'string' || !item.productId || item.productId.length > 200 || typeof item.variantId !== 'string' || item.variantId.length > 200 || !item.variantId || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100000) throw new CheckoutError('Each item needs a product, variant and positive whole quantity.');
    const key = JSON.stringify([item.productId, item.variantId]);
    if (item.expectedUnitPrice !== undefined && (typeof item.expectedUnitPrice !== 'number' || !Number.isFinite(item.expectedUnitPrice) || item.expectedUnitPrice < 0)) throw new CheckoutError('Invalid expected price.');
    if (combined.has(key) && combined.get(key)!.expectedUnitPrice !== item.expectedUnitPrice) throw new CheckoutError('Duplicate lines must agree on the displayed price.');
    const quantity = (combined.get(key)?.quantity || 0) + item.quantity;
    if (quantity > 100000) throw new CheckoutError('Quantity is too large.');
    combined.set(key, { productId: item.productId, variantId: item.variantId, quantity, ...(item.expectedUnitPrice === undefined ? {} : { expectedUnitPrice: item.expectedUnitPrice }) });
  }
  return [...combined.values()];
}
export async function createCheckout(tx: Prisma.TransactionClient, input: Record<string, unknown>) {
  let customer: ReturnType<typeof orderCustomerInput>;
  try { customer = orderCustomerInput(input); }
  catch (error) { if (error instanceof InputError) throw new CheckoutError(error.message); throw error; }
  const { customerName, phone, email, address, notes } = customer;
  const requested = validateItems(input.items);
  const products = await tx.product.findMany({ where: { id: { in: requested.map(i => i.productId) } }, include: { variants: true, images: { orderBy: { position: 'asc' } } } });
  const changes: PriceChange[] = [];
  const items = requested.map(item => {
    const product = products.find(p => p.id === item.productId);
    const variant = product?.variants.find(v => v.id === item.variantId);
    if (!product || (product.publicationStatus !== undefined && product.publicationStatus !== 'PUBLISHED') || !product.available || !variant || !variant.available) throw new CheckoutError('A selected product or variant is no longer available. Please update your cart.');
    if (!Number.isFinite(variant.price) || variant.price < 0) throw new CheckoutError('Invalid product price.');
    const unitPrice = new Prisma.Decimal(variant.price.toString()).toDecimalPlaces(2);
    if (item.expectedUnitPrice !== undefined && !unitPrice.equals(new Prisma.Decimal(item.expectedUnitPrice.toString()).toDecimalPlaces(2))) changes.push({ productId: product.id, variantId: variant.id, quantity: item.quantity, previousPrice: item.expectedUnitPrice, currentPrice: Number(unitPrice) });
    return { productId: product.id, variantId: variant.id, productName: product.name, variantName: variantLabel(variant), imageUrl: product.featuredImageUrl || product.images[0]?.imageUrl || '', unitPrice, quantity: item.quantity, subtotal: unitPrice.mul(item.quantity) };
  });
  if (changes.length) throw new CheckoutPriceChanged(changes);
  const subtotal = items.reduce((sum, item) => sum.add(item.subtotal), new Prisma.Decimal(0));
  return tx.order.create({ data: { orderNumber: `NITA-${crypto.randomUUID().toUpperCase()}`, customerName, phone, email: email || null, address: address || null, notes: notes || null, subtotal, total: subtotal, items: { create: items } }, include: { items: true } });
}
