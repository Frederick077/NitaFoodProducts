import type { Product } from './types';

export const informationFields = ['nutrients', 'nutritionBasis', 'howToUse'] as const;

/** Plain, owner-approved label content only; nutrition is never shown without its basis. */
export function getProductInformation(product: Pick<Product, 'description' | 'benefits' | 'ingredients' | 'nutrients' | 'nutritionBasis' | 'howToUse'>) {
  return [
    { id: 'description', title: 'Description', text: product.description },
    { id: 'benefits', title: 'Benefits of the Product', text: product.benefits },
    { id: 'nutrients', title: 'Nutrients Available', text: product.nutritionBasis?.trim() ? product.nutrients : '', basis: product.nutritionBasis },
    { id: 'ingredients', title: 'Ingredients', text: product.ingredients },
    { id: 'how-to-use', title: 'How to Use', text: product.howToUse },
  ].filter(section => typeof section.text === 'string' && section.text.trim());
}
