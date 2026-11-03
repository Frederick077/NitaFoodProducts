import type { Product, ProductImage, Category } from './types';

/** One small search contract for the API, header and catalog. */
export function matchesProductSearch(product: Pick<Product, 'name' | 'category' | 'shortDescription' | 'description' | 'ingredients'>, query: string) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const text = [product.name, product.category, product.shortDescription, product.description, product.ingredients].filter(Boolean).join(' ').toLocaleLowerCase();
  return words.every(word => text.includes(word));
}

export function categoryMatches(category: Pick<Category, 'id' | 'name' | 'slug'>, value: string) {
  return [category.id, category.slug, category.name].some(key => key.toLocaleLowerCase() === value.toLocaleLowerCase());
}
export function resolveCategory(categories: Category[], value: string) {
  const direct = categories.filter(c => categoryMatches(c, value));
  if (direct.length === 1) return direct[0];
  const normalized = value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const legacy = categories.filter(c => c.slug.replace(/-[0-9a-f]{8}-[0-9a-f-]{27}$/i, '') === normalized);
  return legacy.length === 1 ? legacy[0] : undefined;
}

/** Featured photo first, followed by ordered additional photos without duplicate URLs. */
export function getProductImages(product: Product): ProductImage[] {
  const images = product.images || [];
  const primary = product.featuredImageUrl || product.image;
  const featured = images.find(image => image.imageUrl === primary);
  const rows = primary ? [featured || { id: `featured-${product.id}`, imageUrl: primary, altText: product.name, position: -1 }, ...images] : images;
  const seen = new Set<string>();
  return rows.filter(image => image.imageUrl && !seen.has(image.imageUrl) && !!seen.add(image.imageUrl));
}
