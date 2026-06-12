/**
 * Collection controllers (Milestone 1.3a) — HTTP adapters; logic in the service.
 */
import type { RequestHandler } from 'express';
import { sendSuccess } from '../../http/respond.js';
import { asyncHandler } from '../../http/async-handler.js';
import { collectionService } from './collection.service.js';
import type {
  CreateCollectionBody,
  ListQuery,
  UpdateCollectionBody,
} from './collection.validation.js';

export const listPublic: RequestHandler = asyncHandler(async (req, res) => {
  const query = (req.validatedData?.query ?? {}) as ListQuery;
  sendSuccess(res, await collectionService.listPublic(query));
});

export const getBySlug: RequestHandler = asyncHandler(async (req, res) => {
  const { slug } = req.validatedData?.params as { slug: string };
  sendSuccess(res, await collectionService.getBySlugPublic(slug));
});

export const adminList: RequestHandler = asyncHandler(async (req, res) => {
  const query = (req.validatedData?.query ?? {}) as ListQuery;
  sendSuccess(res, await collectionService.listAdmin(query));
});

export const adminGetById: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params as { id: string };
  sendSuccess(res, await collectionService.getByIdAdmin(id));
});

export const adminCreate: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.validatedData?.body as CreateCollectionBody;
  sendSuccess(res, await collectionService.create(body), 201);
});

export const adminUpdate: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params as { id: string };
  const body = req.validatedData?.body as UpdateCollectionBody;
  sendSuccess(res, await collectionService.update(id, body));
});

export const adminRemove: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params as { id: string };
  await collectionService.remove(id);
  sendSuccess(res, { deleted: true });
});
