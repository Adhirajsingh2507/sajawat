/**
 * Media routes (Milestone 1.3-media). Admin-only, API-proxied upload:
 *   POST /api/v1/admin/media   (multipart/form-data, field "file")
 *
 * multer buffers the single file in memory (no temp disk) up to a hard 64 MB
 * ceiling; the service enforces the per-kind cap + magic-byte validation.
 * multer's own errors (e.g. file too large) are normalized to a 400 envelope.
 */
import express from 'express';
import type { Request, RequestHandler, Response, NextFunction, Router } from 'express';
import multer from 'multer';
import { PERMISSIONS } from '@sajawat/shared';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { BadRequestError } from '../../errors/app-error.js';
import { adminUpload } from './media.controller.js';

const HARD_MAX_BYTES = 64 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: HARD_MAX_BYTES, files: 1 },
});

/** Wrap multer so its errors become a normalized 400 instead of a raw throw. */
const uploadSingle: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      next(new BadRequestError(err.code === 'LIMIT_FILE_SIZE' ? 'File too large' : err.message));
      return;
    }
    if (err !== undefined && err !== null) {
      next(err instanceof Error ? err : new BadRequestError('Upload failed'));
      return;
    }
    next();
  });
};

export const mediaAdminRouter: Router = express.Router();

mediaAdminRouter.post(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.PRODUCT_WRITE),
  uploadSingle,
  adminUpload,
);
