import sharp from 'sharp';
import crypto from 'crypto';
import { supabaseAdmin, BUCKET_NAME } from '../config/supabase';

/**
 * Generates public access URL for a given bucket file path.
 */
export function generatePublicUrl(filePath: string): string {
  const { data } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Extracts relative storage path from a full Supabase public URL or path string.
 */
export function extractStoragePath(imageUrl: string): string | null {
  if (!imageUrl) return null;
  const marker = `/object/public/${BUCKET_NAME}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx !== -1) {
    return imageUrl.substring(idx + marker.length);
  }
  // If already relative
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return null;
}

/**
 * Optimizes raw image buffer:
 * - Resizes to max width 1200px (preserving aspect ratio)
 * - Converts to WebP at 82% quality
 * - Strips EXIF metadata & auto-rotates
 */
export async function processAndOptimizeImage(fileBuffer: Buffer): Promise<Buffer> {
  return await sharp(fileBuffer)
    .rotate() // Auto-rotate according to EXIF before stripping metadata
    .resize({
      width: 1200,
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ quality: 82, force: true })
    .toBuffer();
}

/**
 * Uploads an image buffer to Supabase Storage after optimization.
 * Returns the public URL of the uploaded image.
 */
export async function uploadImage(
  fileBuffer: Buffer,
  folderName: string = 'menu-items'
): Promise<string> {
  const optimizedBuffer = await processAndOptimizeImage(fileBuffer);
  const fileUuid = crypto.randomUUID();
  const sanitizedFolder = folderName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const filePath = `${sanitizedFolder}/${fileUuid}.webp`;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, optimizedBuffer, {
      contentType: 'image/webp',
      cacheControl: '360000',
      upsert: true,
    });

  if (error) {
    console.error('[STORAGE SERVICE] Supabase upload failed:', error);
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return generatePublicUrl(data.path);
}

/**
 * Deletes an image from Supabase Storage by public URL or path.
 * Logs errors gracefully without throwing to preserve database transactions.
 */
export async function deleteImage(imageUrl: string): Promise<boolean> {
  try {
    const path = extractStoragePath(imageUrl);
    if (!path) {
      console.warn('[STORAGE SERVICE] Could not extract storage path from:', imageUrl);
      return false;
    }

    const { error } = await supabaseAdmin.storage.from(BUCKET_NAME).remove([path]);
    if (error) {
      console.error(`[STORAGE SERVICE] Failed to delete image at ${path}:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[STORAGE SERVICE] Error during image deletion:', err);
    return false;
  }
}

/**
 * Replaces an existing image: uploads new image first, then cleans up old image.
 */
export async function replaceImage(
  oldImageUrl: string | null | undefined,
  newFileBuffer: Buffer,
  folderName: string = 'menu-items'
): Promise<string> {
  const newPublicUrl = await uploadImage(newFileBuffer, folderName);
  if (oldImageUrl) {
    deleteImage(oldImageUrl).catch((err) =>
      console.error('[STORAGE SERVICE] Async old image deletion failed:', err)
    );
  }
  return newPublicUrl;
}
