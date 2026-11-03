import { InputError } from './validation';
import { IMAGE_UPLOAD_MAX_BYTES } from '../uploadPolicy';

export function uploadCategory(value: unknown): string {
  const category = value === undefined ? 'general' : value;
  if (typeof category !== 'string' || !/^[a-zA-Z0-9_-]{1,40}$/.test(category)) throw new InputError('Invalid image category.');
  return category.toLowerCase();
}

export function imageExtension(buffer: Buffer, declaredMime: string): string {
  if (!buffer.length || buffer.length > IMAGE_UPLOAD_MAX_BYTES) throw new InputError('Invalid image size. Maximum allowed size is 4 MB.');
  const mime = declaredMime.toLowerCase().replace('image/jpg', 'image/jpeg');
  if (mime === 'image/jpeg' && buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return '.jpg';
  if (mime === 'image/png' && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return '.png';
  if (mime === 'image/webp' && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return '.webp';
  if (mime === 'image/avif' && buffer.toString('ascii', 4, 8) === 'ftyp' && /avif|avis/.test(buffer.toString('ascii', 8, Math.min(buffer.length, 64)))) return '.avif';
  throw new InputError('Image contents do not match a supported JPG, PNG, WebP or AVIF file.');
}
