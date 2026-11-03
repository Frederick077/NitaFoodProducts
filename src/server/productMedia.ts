import { Router, type RequestHandler } from 'express';
import type { PrismaClient } from '@prisma/client';
import { CheckoutError } from './checkout';
import { buildImageUpdate, validateImageOrder, retainMediaForReview } from './productImages';
import { formatProduct } from './formatProduct';

const include = { category: true, images: { orderBy: { position: 'asc' as const } }, variants: { orderBy: { price: 'asc' as const } } };

/** Product-only mutations. Never accept a whole product or delete stored binaries. */
export function productMediaRoutes(auth: RequestHandler, database: () => PrismaClient) {
  const router = Router();
  const handle = (operation: (tx: any, id: string, body: any, imageId?: string) => Promise<unknown>): RequestHandler => async (req, res) => {
    try {
      const product = await database().$transaction(tx => operation(tx, String(req.params.productId), req.body || {}, req.params.imageId as string | undefined));
      res.json({ success: true, product, cleanupRequired: true, message: 'Database references saved; stored assets retained.' });
    } catch (error) {
      res.status(error instanceof CheckoutError ? 400 : 503).json({ error: error instanceof CheckoutError ? error.message : 'Image changes could not be saved. Refresh and try again. Assets have been retained.' });
    }
  };
  const find = async (tx: any, id: string) => {
    const product = await tx.product.findUnique({ where: { id }, include });
    if (!product) throw new CheckoutError('Product not found.');
    return product;
  };
  router.post('/admin/products/:productId/images', auth, handle(async (tx, id, body) => {
    const p = await find(tx, id);
    if (body.id !== undefined) throw new CheckoutError('Use the image editor to update an existing image.');
    const data = buildImageUpdate([{ ...body, position: body.position ?? (Math.max(-1, ...p.images.map((i: any) => i.position)) + 1) }], []).create;
    return formatProduct(await tx.product.update({ where: { id }, data: { images: { create: data } }, include }));
  }));
  router.put('/admin/products/:productId/featured-image', auth, handle(async (tx, id, body) => {
    const p = await find(tx, id);
    let imageUrl = body.imageUrl, publicId = body.storagePublicId;
    if (body.imageId !== undefined) {
      const row = p.images.find((i: any) => i.id === body.imageId);
      if (!row) throw new CheckoutError('The featured image must belong to this product.');
      imageUrl = row.imageUrl; publicId = row.storagePublicId || '';
    }
    if (typeof imageUrl !== 'string' || typeof publicId !== 'string') throw new CheckoutError('Provide an image URL and storage ID, or a current product image ID.');
    if (imageUrl) buildImageUpdate([{ imageUrl, storagePublicId: publicId }], []);
    const updated = await tx.product.update({ where: { id }, data: { featuredImageUrl: imageUrl, featuredImagePublicId: publicId }, include });
    if (p.featuredImageUrl !== imageUrl) await retainMediaForReview(p.featuredImagePublicId, p.featuredImageUrl);
    return formatProduct(updated);
  }));
  router.put('/admin/products/:productId/images/reorder', auth, handle(async (tx, id, body) => {
    const p = await find(tx, id), rows = validateImageOrder(body.items, p.images);
    for (const row of rows) {
      const result = await tx.productImage.updateMany({ where: { id: row.id, productId: id }, data: { position: row.position } });
      if (result.count !== 1) throw new CheckoutError('Images changed while reordering. Refresh and try again.');
    }
    return formatProduct(await find(tx, id));
  }));
  router.delete('/admin/products/:productId/images/:imageId', auth, handle(async (tx, id, _body, imageId) => {
    const p = await find(tx, id);
    if (!p.images.some((image: any) => image.id === imageId)) throw new CheckoutError('Image does not belong to this product.');
    const result = await tx.productImage.deleteMany({ where: { id: imageId, productId: id } });
    if (result.count !== 1) throw new CheckoutError('Image changed. Refresh and try again.');
    const removed = p.images.find((image: any) => image.id === imageId);
    await retainMediaForReview(removed?.storagePublicId, removed?.imageUrl);
    return formatProduct(await find(tx, id));
  }));
  return router;
}
