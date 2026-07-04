/**
 * Product controllers (Milestone 1.3b) — HTTP adapters; logic in the service.
 */
import type { RequestHandler } from 'express';
import { sendSuccess } from '../../http/respond.js';
import { asyncHandler } from '../../http/async-handler.js';
import { UnauthorizedError } from '../../errors/app-error.js';
import { productService } from './product.service.js';
import type {
  CreateProductBody,
  ProductListQuery,
  ProductSearchQuery,
  UpdateProductBody,
} from './product.validation.js';

export const listPublic: RequestHandler = asyncHandler(async (req, res) => {
  const query = (req.validatedData?.query ?? {}) as ProductListQuery;
  sendSuccess(res, await productService.listPublic(query));
});

export const search: RequestHandler = asyncHandler(async (req, res) => {
  const query = req.validatedData?.query as ProductSearchQuery;
  sendSuccess(res, await productService.search(query.q, query));
});

export const featured: RequestHandler = asyncHandler(async (req, res) => {
  const query = (req.validatedData?.query ?? {}) as ProductListQuery;
  sendSuccess(res, await productService.featured(query));
});

export const bestSellers: RequestHandler = asyncHandler(async (req, res) => {
  const query = (req.validatedData?.query ?? {}) as ProductListQuery;
  sendSuccess(res, await productService.bestSellers(query));
});

export const newArrivals: RequestHandler = asyncHandler(async (req, res) => {
  const query = (req.validatedData?.query ?? {}) as ProductListQuery;
  sendSuccess(res, await productService.newArrivals(query));
});

export const getBySlug: RequestHandler = asyncHandler(async (req, res) => {
  const { slug } = req.validatedData?.params as { slug: string };
  sendSuccess(res, await productService.getBySlugPublic(slug));
});

export const adminList: RequestHandler = asyncHandler(async (req, res) => {
  const query = (req.validatedData?.query ?? {}) as ProductListQuery;
  sendSuccess(res, await productService.listAdmin(query));
});

export const adminGetById: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params as { id: string };
  sendSuccess(res, await productService.getByIdAdmin(id));
});

export const adminGetByBarcode: RequestHandler = asyncHandler(async (req, res) => {
  const { code } = req.validatedData?.params as { code: string };
  sendSuccess(res, await productService.getByBarcodeAdmin(code));
});

export const adminCreate: RequestHandler = asyncHandler(async (req, res) => {
  const performedBy = req.user?.id;
  if (performedBy === undefined) {
    throw new UnauthorizedError();
  }
  const body = req.validatedData?.body as CreateProductBody;
  sendSuccess(res, await productService.create(body, performedBy), 201);
});

export const adminUpdate: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params as { id: string };
  const body = req.validatedData?.body as UpdateProductBody;
  sendSuccess(res, await productService.update(id, body));
});

export const adminRemove: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params as { id: string };
  await productService.remove(id);
  sendSuccess(res, { deleted: true });
});
