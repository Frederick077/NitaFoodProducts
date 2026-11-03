import { buildInformationPatch } from './productInformation';
import { CheckoutError } from './checkout';
import { buildImageUpdate } from './productImages';
import { buildVariantUpdate } from './productVariants';

/** A product patch contains only explicitly submitted fields. */
export function buildProductPatch(body: Record<string, unknown>, existing: { images: Parameters<typeof buildImageUpdate>[1]; variants: { id: string }[]; featuredImageUrl?: string; nutrients?: string; nutritionBasis?: string }) {
  const data: Record<string, any> = buildInformationPatch(body, existing);
  if (body.publicationStatus !== undefined) {
    if (!['DRAFT','PUBLISHED','ARCHIVED'].includes(body.publicationStatus as string)) throw new CheckoutError('Choose Draft, Published or Archived.');
    data.publicationStatus = body.publicationStatus;
  }
  for (const key of ['name','slug','shortDescription','description','ingredients','benefits']) if (body[key] !== undefined) {
    if (typeof body[key] !== 'string' || (key === 'name' && !body[key].trim())) throw new CheckoutError('Invalid product text field.');
    data[key] = body[key];
  }
  for (const key of ['available','isFeatured']) if (body[key] !== undefined) {
    if (typeof body[key] !== 'boolean') throw new CheckoutError('Invalid availability flag.');
    data[key] = body[key];
  }
  if (body.categoryId !== undefined) data.category = { connect: { id: body.categoryId } };
  if (body.featuredImageUrl !== undefined || body.image !== undefined) {
    const value = body.featuredImageUrl ?? body.image;
    if (typeof value !== 'string') throw new CheckoutError('Invalid featured image.');
    if (value !== existing.featuredImageUrl && body.featuredImagePublicId === undefined) throw new CheckoutError('A replacement featured image needs its own storage ID, or an explicit empty ID for an external image.');
    if (value) buildImageUpdate([{ imageUrl: value, storagePublicId: body.featuredImagePublicId ?? '' }], []);
    data.featuredImageUrl = value;
  }
  if (body.featuredImagePublicId !== undefined) {
    if (typeof body.featuredImagePublicId !== 'string') throw new CheckoutError('Invalid storage ID.');
    data.featuredImagePublicId = body.featuredImagePublicId;
  }
  if (body.images !== undefined || body.removedImageIds !== undefined) data.images = buildImageUpdate(body.images ?? [], existing.images, body.removedImageIds ?? []);
  if (body.variants !== undefined) data.variants = buildVariantUpdate(body.variants, existing.variants);
  else if (body.sizes !== undefined) throw new CheckoutError('Submit variants with their existing IDs when editing sizes.');
  return data;
}
