import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Check if Cloudinary is configured with all 3 required environment variables
 */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Validate Cloudinary configuration at boot time without leaking secrets
 */
export function validateCloudinaryConfig(): { configured: boolean; cloudName: string | null } {
  const configured = isCloudinaryConfigured();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || null;
  if (configured) {
    console.log(`[Storage] Cloudinary initialized successfully. Cloud: "${cloudName}".`);
  } else {
    console.warn('[Storage] Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) not fully set. Using local disk fallback.');
  }
  return { configured, cloudName };
}

/**
 * Get configured Cloudinary instance
 */
export function getCloudinaryClient() {
  if (!isCloudinaryConfigured()) return null;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

// Ensure local uploads directory exists for local fallback or development
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.warn('[Storage] Could not create uploads directory:', err);
  }
}

export interface UploadResult {
  imageUrl: string;
  publicId: string;
  provider: 'cloudinary' | 'local';
}

/**
 * Upload an image buffer to Cloudinary (or local disk fallback)
 */
export async function uploadImageFile(
  buffer: Buffer,
  originalFilename: string,
  mimetype: string,
  category: string = 'general'
): Promise<UploadResult> {
  const cld = getCloudinaryClient();

  if (cld) {
    return new Promise((resolve, reject) => {
      const sanitizedCategory = category.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const folder = `nita_food_products/${sanitizedCategory}`;

      const uploadStream = cld.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          fetch_format: 'auto',
          quality: 'auto',
          tags: ['nita_foods', sanitizedCategory],
        },
        (error, result) => {
          if (error || !result) {
            console.error('[Cloudinary Upload Error]', error);
            return reject(new Error(error?.message || 'Failed to upload image to Cloudinary'));
          }

          resolve({
            imageUrl: result.secure_url,
            publicId: result.public_id,
            provider: 'cloudinary',
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  // Fallback to local server disk storage
  const ext = path.extname(originalFilename).toLowerCase() || getExtensionFromMime(mimetype) || '.jpg';
  const uniqueId = `nita_local_${category}_${crypto.randomBytes(8).toString('hex')}`;
  const filename = `${uniqueId}${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  await fs.promises.writeFile(filePath, buffer);

  const imageUrl = `/uploads/${filename}`;
  return {
    imageUrl,
    publicId: uniqueId,
    provider: 'local',
  };
}

/**
 * Extract Cloudinary public ID from a Cloudinary URL
 */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
  return match && match[1] ? match[1] : null;
}

/**
 * Delete an image from Cloudinary or local disk
 */
export async function deleteImageFile(publicId?: string | null, imageUrl?: string | null): Promise<boolean> {
  if (!publicId && !imageUrl) return false;

  const cld = getCloudinaryClient();

  try {
    // 1. If it's a Cloudinary asset
    const effectivePublicId =
      publicId && !publicId.startsWith('nita_local_')
        ? publicId
        : imageUrl && imageUrl.includes('cloudinary.com')
        ? extractCloudinaryPublicId(imageUrl)
        : null;

    if (cld && effectivePublicId) {
      const res = await cld.uploader.destroy(effectivePublicId);
      console.log(`[Cloudinary] Asset destroyed: ${effectivePublicId}, result:`, res);
      return res.result === 'ok' || res.result === 'not found';
    }

    // 2. If it's a local file
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      const filename = path.basename(imageUrl);
      const filePath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
    } else if (publicId && publicId.startsWith('nita_local_')) {
      const files = await fs.promises.readdir(UPLOADS_DIR);
      const matched = files.find((f) => f.startsWith(publicId));
      if (matched) {
        await fs.promises.unlink(path.join(UPLOADS_DIR, matched));
        return true;
      }
    }
  } catch (err) {
    console.warn('[Storage] Error deleting asset:', err);
  }

  return false;
}

function getExtensionFromMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
    case 'image/jpg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/avif':
      return '.avif';
    default:
      return '.jpg';
  }
}
