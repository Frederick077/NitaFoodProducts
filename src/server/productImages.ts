import crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import { CheckoutError } from './checkout';

export interface SavedImage { id: string; productId?: string; imageUrl: string; storagePublicId?: string | null; altText?: string; position: number }

/** No storage deletion: removing a database reference never proves an asset is unused. */
export async function retainMediaForReview(publicId?: string | null, imageUrl?: string | null) {
  if (publicId || imageUrl) console.info('[Media cleanup review]', JSON.stringify({ retained: true, fingerprint: crypto.createHash('sha256').update(publicId || imageUrl || '').digest('hex').slice(0, 16) }));
  return false;
}

export function buildImageUpdate(input: unknown, existing: SavedImage[], removed: unknown = []): Prisma.ProductImageUpdateManyWithoutProductNestedInput {
  if (!Array.isArray(input) || input.length > 100) throw new CheckoutError('Submit up to 100 product images.');
  if (!Array.isArray(removed) || new Set(removed).size !== removed.length || removed.some(id => typeof id !== 'string' || !existing.some(image => image.id === id))) throw new CheckoutError('Invalid image removal IDs.');
  const seen = new Set<string>();
  const rows = input.map((value: unknown, index) => {
    const row = typeof value === 'string' ? { imageUrl: value } : value as Record<string, unknown>;
    if (!row || typeof row !== 'object') throw new CheckoutError('Invalid image record.');
    const old = row.id === undefined ? undefined : existing.find(image => image.id === row.id);
    if (row.id !== undefined && (!old || seen.has(String(row.id)))) throw new CheckoutError('Invalid, duplicate or mismatched product image ID.');
    if (old) seen.add(old.id);
    if (old && removed.includes(old.id)) throw new CheckoutError('An image cannot be edited and removed together.');
    const imageUrl = row.imageUrl === undefined ? old?.imageUrl : row.imageUrl;
    const storagePublicId = row.storagePublicId === undefined ? old?.storagePublicId || '' : row.storagePublicId;
    if (old && imageUrl !== old.imageUrl && row.storagePublicId === undefined) throw new CheckoutError('A replacement URL needs its own storage ID, or an explicit empty ID for an external image.');
    const altText = row.altText === undefined ? old?.altText || '' : row.altText;
    const position = row.position === undefined ? old?.position ?? index : row.position;
    if (typeof imageUrl !== 'string' || (imageUrl !== old?.imageUrl && !/^(https?:\/\/|\/(?!\/))/.test(imageUrl)) || typeof storagePublicId !== 'string' || typeof altText !== 'string' || typeof position !== 'number' || !Number.isSafeInteger(position) || position < 0) throw new CheckoutError('Images need a valid URL, text metadata and nonnegative whole position.');
    return { id: old?.id, data: { imageUrl, storagePublicId, altText, position } };
  });
  return {
    update: rows.filter(row => row.id).map(row => ({ where: { id: row.id! }, data: row.data })),
    create: rows.filter(row => !row.id).map(row => row.data),
    deleteMany: { id: { in: removed as string[] } },
  };
}

export function validateImageOrder(input: unknown, existing: SavedImage[]) {
  if (!Array.isArray(input) || input.length !== existing.length) throw new CheckoutError('Refresh images before reordering: submit every current image exactly once.');
  const seen = new Set<string>();
  return input.map((row, position) => {
    if (!row || typeof row.id !== 'string' || seen.has(row.id) || !existing.some(image => image.id === row.id)) throw new CheckoutError('Invalid, duplicate or mismatched product image ID.');
    seen.add(row.id);
    return { id: row.id as string, position };
  });
}
