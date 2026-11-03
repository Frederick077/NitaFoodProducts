import type { Product } from './types';

const validPrice = (price: unknown): price is number => typeof price === 'number' && Number.isFinite(price) && price >= 0;

/** Staff enable packs independently of legacy inventory; checkout rechecks current prices. */
export function getProductPresentation(product: Product) {
  const variants = product.variants || [];
  const activeVariants = variants.filter(variant => variant.available);
  const candidates = (activeVariants.length ? activeVariants : variants).filter(variant => validPrice(variant.price));
  const lowest = [...candidates].sort((a, b) => a.price - b.price)[0];
  const price = variants.length ? lowest?.price ?? null : validPrice(product.price) ? product.price : null;
  const comparison = variants.length ? lowest?.compareAtPrice : product.compareAtPrice;
  const available = product.available !== false && (!variants.length || activeVariants.length > 0);
  return {
    price,
    compareAtPrice: price !== null && validPrice(comparison) && comparison > price ? comparison : null,
    hasPriceRange: price !== null && candidates.some(variant => variant.price !== price),
    available,
    canQuickOrder: (!product.publicationStatus || product.publicationStatus === 'PUBLISHED') && product.available === true && activeVariants.some(variant => validPrice(variant.price)),
  };
}
