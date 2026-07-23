import { Request, Response } from 'express';
import multer from 'multer';
import { uploadImage } from '../services/storage.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('INVALID_FILE_TYPE'));
    }
    cb(null, true);
  },
}).single('image');

/**
 * Handle multipart admin image upload endpoint:
 * POST /api/admin/upload-image (also available as POST /api/owner/upload-image)
 */
export function handleAdminUploadImage(req: Request, res: Response) {
  upload(req, res, async (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'File size exceeds maximum allowed limit of 5MB.',
          });
        }
        return res.status(400).json({
          success: false,
          error: `Upload error: ${err.message}`,
        });
      }
      if (err.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          error: 'Unsupported file format. Only JPEG, PNG, and WebP images are allowed.',
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message || 'Image upload failed.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided in request.',
      });
    }

    try {
      const folder = (req.body?.folder as string) || 'menu-items';
      const imageUrl = await uploadImage(req.file.buffer, folder);

      return res.status(200).json({
        success: true,
        imageUrl,
      });
    } catch (error: any) {
      console.error('[UPLOAD CONTROLLER] Upload failed:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to process and store image.',
      });
    }
  });
}
