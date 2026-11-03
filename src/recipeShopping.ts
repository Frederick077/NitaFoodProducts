import type { Product } from './types';

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Match names only: a product merely containing an ingredient is not a substitute.
export function recipeIngredientMatches(name: string, ingredient: string): boolean {
  const product = normalize(name);
  const wanted = normalize(ingredient).replace(/^nita /, '');
  if (/\b(bar|bars|butter|oil|spread|spreads)\b/.test(product)) return false;
  if (wanted === 'roasted pumpkin seeds') {
    return /\broasted\b/.test(product) && /\bpumpkin seeds?\b/.test(product) && !/\b(powder|flour|granola|cereal|cereals)\b/.test(product);
  }
  if (wanted === 'nita flour' || normalize(ingredient) === 'nita flour') return /\bnita flour\b/.test(product);
  if (wanted === 'granola cereals') return /\bgranola cereals?\b/.test(product);
  if (wanted.endsWith('seeds') && /\b(granola|cereal|cereals|powder|flour)\b/.test(product)) return false;
  return (` ${product} `).includes(` ${wanted} `);
}

export function recipeIngredientLinks(ingredients: string[], products: Pick<Product, 'id' | 'name' | 'publicationStatus'>[]) {
  return ingredients.flatMap(ingredient => {
    const matches = products.filter(product => product.id && product.name && (!product.publicationStatus || product.publicationStatus === 'PUBLISHED') && recipeIngredientMatches(product.name, ingredient));
    return matches.length
      ? matches.map(product => ({ label: product.name, href: `/products/${encodeURIComponent(product.id)}` }))
      : [{ label: ingredient, href: `/products?search=${encodeURIComponent(ingredient.replace(/^NITA /, ''))}` }];
  }).filter((link, index, links) => links.findIndex(other => other.href === link.href) === index);
}
