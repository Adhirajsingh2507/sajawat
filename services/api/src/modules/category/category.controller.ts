/**
 * Category controllers (Milestone 1.3a) — HTTP adapters; logic lives in the
 * service. Public reads + admin CRUD.
 */
import type { RequestHandler } from 'express';
import { sendSuccess } from '../../http/respond.js';
import { asyncHandler } from '../../http/async-handler.js';
import { categoryService } from './category.service.js';
import type { CreateCategoryBody, ListQuery, UpdateCategoryBody } from './category.validation.js';

export const listPublic: RequestHandler = asyncHandler(async (req, res) => {
  const query = (req.validatedData?.query ?? {}) as ListQuery;
  sendSuccess(res, await categoryService.listPublic(query));
});

export const getBySlug: RequestHandler = asyncHandler(async (req, res) => {
  const { slug } = req.validatedData?.params as { slug: string };
  sendSuccess(res, await categoryService.getBySlugPublic(slug));
});

export const adminList: RequestHandler = asyncHandler(async (req, res) => {
  const query = (req.validatedData?.query ?? {}) as ListQuery;
  sendSuccess(res, await categoryService.listAdmin(query));
});

export const adminGetById: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params as { id: string };
  sendSuccess(res, await categoryService.getByIdAdmin(id));
});

export const adminCreate: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.validatedData?.body as CreateCategoryBody;
  sendSuccess(res, await categoryService.create(body), 201);
});

export const adminUpdate: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params as { id: string };
  const body = req.validatedData?.body as UpdateCategoryBody;
  sendSuccess(res, await categoryService.update(id, body));
});

export const adminRemove: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params as { id: string };
  await categoryService.remove(id);
  sendSuccess(res, { deleted: true });
});
