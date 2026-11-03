import { logApiError } from './httpSecurity';
import { buildInformationPatch } from './productInformation';
import { Router, type RequestHandler } from 'express';
import type { PrismaClient } from '@prisma/client';
import { CheckoutError } from './checkout';
import { buildProductPatch } from './productData';
import { buildVariantUpdate } from './productVariants';
import { buildImageUpdate, retainMediaForReview } from './productImages';
import { formatProduct } from './formatProduct';
export function productWriteRoutes(requireAuth: RequestHandler, database: () => PrismaClient) {
 const router = Router();
 const include = { category: true, images: { orderBy: { position: 'asc' as const } }, variants: { orderBy: { price: 'asc' as const } } };
// Create product
router.post('/products', requireAuth, async (req, res) => {
  try {
    const {
      name,
      slug,
      shortDescription,
      description,
      categoryId,
      featuredImageUrl,
      image,
      available,
      isFeatured,
      ingredients,
      benefits,
      images,
      variants,
      sizes,
      price,
    } = req.body;

    if (typeof name !== 'string' || !name.trim() || !description || typeof categoryId !== 'string' || !categoryId) {
      return res.status(400).json({ error: 'Name, description, and category are required.' });
    }

    if (!await database().category.findUnique({ where: { id: categoryId } })) return res.status(400).json({ error: 'Choose an existing category.' });

    for (const key of ['name','description','slug','shortDescription','ingredients','benefits','featuredImageUrl','featuredImagePublicId']) if (req.body[key] !== undefined && typeof req.body[key] !== 'string') throw new CheckoutError('Invalid product text field.');
    for (const key of ['available','isFeatured']) if (req.body[key] !== undefined && typeof req.body[key] !== 'boolean') throw new CheckoutError('Invalid availability flag.');
    const publicationStatus = req.body.publicationStatus ?? 'DRAFT';
    if (!['DRAFT','PUBLISHED','ARCHIVED'].includes(publicationStatus)) throw new CheckoutError('Choose Draft, Published or Archived.');
    const generatedSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Ensure unique slug
    const finalSlug = generatedSlug || `product-${Date.now()}`;

    const information = buildInformationPatch(req.body);
    const imagesCreate = (buildImageUpdate(images ?? (featuredImageUrl || image ? [{ imageUrl: featuredImageUrl || image, storagePublicId: req.body.featuredImagePublicId || '', altText: name, position: 0 }] : []), []).create || []) as any[];
    const variantsCreate = buildVariantUpdate(variants, []).create as any[];

    const product = await database().product.create({
      include,
      data: {
        name,
        ...information,
        slug: finalSlug,
        publicationStatus,
        shortDescription: shortDescription || '',
        description,
        categoryId,
        featuredImageUrl: featuredImageUrl || image || (imagesCreate[0]?.imageUrl || ''),
        featuredImagePublicId: req.body.featuredImagePublicId || '',
        available: available !== undefined ? Boolean(available) : true,
        isFeatured: Boolean(isFeatured),
        ingredients: ingredients || '',
        benefits: benefits || '',
        images: {
          create: imagesCreate,
        },
        variants: {
          create: variantsCreate,
        },
      },
    });

    res.status(201).json(formatProduct(product));
  } catch (err: any) {
    logApiError('create.product.error.', err, res.locals.requestId);
    res.status(err instanceof CheckoutError ? 400 : 500).json({ error: err instanceof CheckoutError ? err.message : 'Product could not be saved.' });
  }
});

// Update product
router.put('/products/:id', requireAuth, async (req, res) => {
  try {
    database();
    const {
      name,
      slug,
      shortDescription,
      description,
      categoryId,
      featuredImageUrl,
      featuredImagePublicId,
      image,
      available,
      isFeatured,
      ingredients,
      benefits,
      images,
      variants,
      sizes,
      price,
    } = req.body;

    const existing = await database().product.findUnique({
      where: { id: req.params.id },
      include,
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (categoryId !== undefined && (typeof categoryId !== 'string' || !await database().category.findUnique({ where: { id: categoryId } }))) return res.status(400).json({ error: 'Choose an existing category.' });
    if (name !== undefined && (typeof name !== 'string' || !name.trim())) return res.status(400).json({ error: 'Product name is required.' });
    if (variants !== undefined) buildVariantUpdate(variants, existing.variants);

    const updateData = buildProductPatch(req.body, existing);

    const updated = await database().product.update({
      where: { id: req.params.id },
      data: updateData,
      include,
    });

    for (const image of existing.images) {
      const current = updated.images.find(row => row.id === image.id);
      if (!current || current.imageUrl !== image.imageUrl || current.storagePublicId !== image.storagePublicId) await retainMediaForReview(image.storagePublicId, image.imageUrl);
    }
    if (existing.featuredImageUrl !== updated.featuredImageUrl) await retainMediaForReview(existing.featuredImagePublicId, existing.featuredImageUrl);
    res.json(formatProduct(updated));
  } catch (err: any) {
    logApiError('update.product.error.', err, res.locals.requestId);
    res.status(err instanceof CheckoutError ? 400 : 500).json({ error: err instanceof CheckoutError ? err.message : 'Product could not be updated.' });
  }
});

// Delete product
router.delete('/products/:id', requireAuth, async (req, res) => {
  try {
    const existing = await database().product.findUnique({
      where: { id: req.params.id },
      include,
    });

    if (existing) {
      if (existing.featuredImagePublicId || existing.featuredImageUrl) {
        await retainMediaForReview(existing.featuredImagePublicId, existing.featuredImageUrl);
      }
      for (const img of existing.images) {
        if (img.storagePublicId || img.imageUrl) {
          await retainMediaForReview(img.storagePublicId, img.imageUrl);
        }
      }
    }

    const deleted = await database().product.delete({
      where: { id: req.params.id },
      include,
    });

    res.json({ message: 'Product deleted successfully', product: formatProduct(deleted) });
  } catch (err: any) {
    logApiError('delete.product.error.', err, res.locals.requestId);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});


return router;
}
