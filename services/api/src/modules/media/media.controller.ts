/**
 * Media controllers (Milestone 1.3-media) — HTTP adapter; logic in the service.
 */
import type { RequestHandler } from 'express';
import { sendSuccess } from '../../http/respond.js';
import { asyncHandler } from '../../http/async-handler.js';
import { BadRequestError } from '../../errors/app-error.js';
import { mediaService } from './media.service.js';

export const adminUpload: RequestHandler = asyncHandler(async (req, res) => {
  const file = req.file;
  if (file === undefined) {
    throw new BadRequestError('No file uploaded (form field "file")');
  }
  sendSuccess(res, await mediaService.upload(file.buffer), 201);
});
