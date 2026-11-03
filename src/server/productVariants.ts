import { Prisma } from '@prisma/client';
import { CheckoutError } from './checkout';
export function buildVariantUpdate(input: unknown, existing: { id: string }[]): Prisma.ProductVariantUpdateManyWithoutProductNestedInput {
  if (!Array.isArray(input) || !input.length) throw new CheckoutError('At least one variant is required.');
  const ids = new Set<string>(), existingIds = new Set(existing.map(v => v.id));
  const labels = new Set<string>(), skus = new Set<string>();
  const rows = input.map((value: unknown) => {
    if (!value || typeof value !== 'object') throw new CheckoutError('Invalid variant.');
    const v = value as Record<string, unknown>;
    if (v.id !== undefined && (typeof v.id !== 'string' || !existingIds.has(v.id) || ids.has(v.id))) throw new CheckoutError('Invalid or duplicate variant ID.');
    if (typeof v.id === 'string') ids.add(v.id);
    if ((v.name !== undefined && typeof v.name !== 'string') || (v.size !== undefined && typeof v.size !== 'string') || typeof v.price !== 'number' || !Number.isFinite(v.price) || v.price < 0 || typeof v.available !== 'boolean' || (v.compareAtPrice != null && (typeof v.compareAtPrice !== 'number' || !Number.isFinite(v.compareAtPrice) || v.compareAtPrice < 0)) || (v.sku !== undefined && typeof v.sku !== 'string')) throw new CheckoutError('Invalid variant fields.');
    const name = (v.name as string | undefined)?.trim() || '', size = (v.size as string | undefined)?.trim() || '', sku = (v.sku as string | undefined)?.trim() || '';
    if (!v.id && !name && !size) throw new CheckoutError('Enter a variant name or pack size.');
    const label = (name || size || 'Standard').replace(/\s+/g, ' ').toLocaleLowerCase();
    if (v.available && (labels.has(label) || (sku && skus.has(sku.toLocaleLowerCase())))) throw new CheckoutError('Active variants need distinct labels and nonempty SKUs must be distinct.');
    if (v.available) { labels.add(label); if (sku) skus.add(sku.toLocaleLowerCase()); }
    return { id: v.id as string | undefined, data: { name, size, price: v.price, compareAtPrice: v.compareAtPrice as number | null ?? null, available: v.available, sku } };
  });
  return {
    update: rows.filter(v => v.id).map(v => ({ where: { id: v.id! }, data: v.data })),
    create: rows.filter(v => !v.id).map(v => v.data),
    updateMany: { where: { id: { in: [...existingIds].filter(id => !ids.has(id)) } }, data: { available: false } },
  };
}
