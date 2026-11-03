import { CheckoutError } from './checkout';
import { informationFields } from '../productInformation';

export function buildInformationPatch(body: Record<string, unknown>, existing: Record<string, unknown> = {}) {
  const data: Record<string, string> = {};
  for (const key of informationFields) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== 'string' || (body[key] as string).length > (key === 'nutritionBasis' ? 200 : 10000)) throw new CheckoutError('Product information must be plain text within the field limit.');
    data[key] = body[key] as string;
  }
  if (body.nutrients !== undefined || body.nutritionBasis !== undefined) {
    const nutrients = data.nutrients ?? existing.nutrients ?? '';
    const basis = data.nutritionBasis ?? existing.nutritionBasis ?? '';
    if (typeof nutrients !== 'string' || typeof basis !== 'string' || (!!nutrients.trim() !== !!basis.trim())) throw new CheckoutError('Provide approved nutrient information and its basis/units together, or clear both.');
  }
  return data;
}
