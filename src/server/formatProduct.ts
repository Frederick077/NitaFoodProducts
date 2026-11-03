import { getProductPresentation } from '../productPresentation';
import type { Product } from '../types';
export function formatProduct(p: any) {
  const images = (p.images || []).map((img: any) => ({
    id: img.id,
    productId: img.productId,
    imageUrl: img.imageUrl || '',
    storagePublicId: img.storagePublicId || '',
    altText: img.altText || p.name || 'Product Image',
    position: img.position ?? 0,
    createdAt: img.createdAt ? (typeof img.createdAt === 'string' ? img.createdAt : img.createdAt.toISOString()) : new Date().toISOString(),
  }));

  const variants = (p.variants || []).map((v: any) => ({
    id: v.id,
    productId: v.productId,
    name: v.name || '',
    size: v.size || '',
    price: typeof v.price === 'number' && Number.isFinite(v.price) ? v.price : null,
    compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
    available: v.available !== undefined ? Boolean(v.available) : true,
    sku: v.sku || '',
    createdAt: v.createdAt ? (typeof v.createdAt === 'string' ? v.createdAt : v.createdAt.toISOString()) : new Date().toISOString(),
    updatedAt: v.updatedAt ? (typeof v.updatedAt === 'string' ? v.updatedAt : v.updatedAt.toISOString()) : new Date().toISOString(),
  }));

  // Derive primary image
  const primaryImage = p.featuredImageUrl || (images.length > 0 ? images[0].imageUrl : '') || p.imageUrl || '';

  // Derive sizes array
  const sizes = variants.length > 0 ? variants.map((v: any) => v.size) : (p.sizes ? p.sizes.map((s: any) => (typeof s === 'string' ? s : s.size)) : []);

  const result = {
    id: p.id,
    name: p.name,
    slug: p.slug || p.id,
    shortDescription: p.shortDescription || '',
    description: p.description || '',
    category: typeof p.category === 'string' ? p.category : p.category?.name || '',
    categoryId: p.categoryId,
    featuredImageUrl: primaryImage,
    featuredImagePublicId: p.featuredImagePublicId || '',
    available: p.available !== undefined ? Boolean(p.available) : true,
    isFeatured: Boolean(p.isFeatured),
    publicationStatus: p.publicationStatus || 'PUBLISHED',
    ingredients: p.ingredients || '',
    benefits: p.benefits || '',
    nutrients: p.nutrients || '',
    nutritionBasis: p.nutritionBasis || '',
    howToUse: p.howToUse || '',
    images,
    variants,
    // Convenience backward-compatibility properties:
    price: typeof p.price === 'number' && Number.isFinite(p.price) ? p.price : null,
    compareAtPrice: null,
    image: primaryImage,
    sizes,
    createdAt: p.createdAt ? (typeof p.createdAt === 'string' ? p.createdAt : p.createdAt.toISOString()) : new Date().toISOString(),
    updatedAt: p.updatedAt ? (typeof p.updatedAt === 'string' ? p.updatedAt : p.updatedAt.toISOString()) : new Date().toISOString(),
  };
  const display = getProductPresentation(result as unknown as Product);
  return { ...result, price: display.price, compareAtPrice: display.compareAtPrice };
}
