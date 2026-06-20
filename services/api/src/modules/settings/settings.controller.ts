/**
 * Settings controllers (Milestone 1.8) — admin-only HTTP adapters.
 */
import type { RequestHandler } from 'express';
import { sendSuccess } from '../../http/respond.js';
import { asyncHandler } from '../../http/async-handler.js';
import { settingsService } from './settings.service.js';
import type { UpdateSettingsBody } from './settings.validation.js';

export const getSettings: RequestHandler = asyncHandler(async (_req, res) => {
  sendSuccess(res, await settingsService.getSettings());
});

export const updateSettings: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.validatedData?.body as UpdateSettingsBody;
  sendSuccess(res, await settingsService.updateSettings(body));
});
