/**
 * Product service (Milestone 1.3b) — catalog business logic. Validates category/
 * collection references, derives unique slug, enforces unique SKU and
 * salePrice < price, auto-creates the 1:1 inventory row, and maps to public/
 * admin DTOs. Public reads are `active`-only and carry `inStock` (joined from
 * inventory in one batched query).
 */
import mongoose from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import type { Paginated, ProductImage, PublicProduct } from '@sajawat/types';
import { BadRequestError, ConflictError, NotFoundError } from '../../errors/app-error.js';
import type { DocFilter, PaginatedResult } from '../../db/base-repository.js';
import { ensureUniqueSlug, slugify } from '../../utils/slug.js';
import { categoryRepository } from '../category/category.repository.js';
import { collectionRepository } from '../collection/collection.repository.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { productRepository } from './product.repository.js';
import type { AdminProduct, IProduct } from './product.types.js';
import type {
  CreateProductBody,
  ProductListQuery,
  UpdateProductBody,
} from './product.validation.js';

type ProductDoc = HydratedDocument<IProduct>;

const SORT_FIELDS = new Set(['price', 'createdAt', 'name']);

function parseSort(sort?: string): Record<string, 1 | -1> {
  if (sort === undefined || sort.length === 0) return { createdAt: -1 };
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  if (!SORT_FIELDS.has(field)) return { createdAt: -1 };
  return { [field]: desc ? -1 : 1 };
}

function mapImages(images: ProductImage[]): ProductImage[] {
  return images.map((img) => ({ url: img.url, alt: img.alt, position: img.position }));
}

function toPublicProduct(doc: ProductDoc, inStock: boolean): PublicProduct {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    shortDescription: doc.shortDescription,
    description: doc.description,
    sku: doc.sku,
    price: doc.price,
    salePrice: doc.salePrice,
    categoryId: String(doc.categoryId),
    collectionIds: doc.collectionIds.map((c) => String(c)),
    images: mapImages(doc.images),
    video: doc.video ? { url: doc.video.url } : undefined,
    seo: { title: doc.seo.title, description: doc.seo.description, keywords: doc.seo.keywords },
    ogImage: doc.ogImage,
    isFeatured: doc.isFeatured,
    isBestSeller: doc.isBestSeller,
    inStock,
  };
}

function toAdminProduct(doc: ProductDoc): AdminProduct {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    shortDescription: doc.shortDescription,
    description: doc.description,
    sku: doc.sku,
    price: doc.price,
    salePrice: doc.salePrice,
    categoryId: String(doc.categoryId),
    collectionIds: doc.collectionIds.map((c) => String(c)),
    images: mapImages(doc.images),
    video: doc.video ? { url: doc.video.url } : undefined,
    seo: { title: doc.seo.title, description: doc.seo.description, keywords: doc.seo.keywords },
    ogImage: doc.ogImage,
    status: doc.status,
    isFeatured: doc.isFeatured,
    isBestSeller: doc.isBestSeller,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function emptyPage<T>(query: ProductListQuery): Paginated<T> {
  return { items: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 20, pages: 0 };
}

async function paginatePublic(
  filter: DocFilter,
  query: ProductListQuery,
  sortOverride?: string,
): Promise<Paginated<PublicProduct>> {
  const res: PaginatedResult<ProductDoc> = await productRepository.paginate(filter, {
    page: query.page,
    limit: query.limit,
    sort: parseSort(sortOverride ?? query.sort),
  });
  const ids = res.items.map((d) => String(d._id));
  const inStock = await inventoryService.getInStockMap(ids);
  return {
    items: res.items.map((d) => toPublicProduct(d, inStock.get(String(d._id)) ?? false)),
    total: res.total,
    page: res.page,
    limit: res.limit,
    pages: res.pages,
  };
}

async function listPublic(query: ProductListQuery): Promise<Paginated<PublicProduct>> {
  const filter: DocFilter = { status: 'active' };
  if (query.category !== undefined) {
    const cat = await categoryRepository.findBySlug(query.category);
    if (cat === null) return emptyPage(query);
    filter.categoryId = String(cat._id);
  }
  if (query.collection !== undefined) {
    const col = await collectionRepository.findBySlug(query.collection);
    if (col === null) return emptyPage(query);
    filter.collectionIds = String(col._id);
  }
  if (query.featured !== undefined) filter.isFeatured = query.featured;
  if (query.bestSeller !== undefined) filter.isBestSeller = query.bestSeller;
  return paginatePublic(filter, query);
}

async function search(q: string, query: ProductListQuery): Promise<Paginated<PublicProduct>> {
  // trusted: deliberate $text operator (global sanitizeFilter blocks $text otherwise).
  return paginatePublic({ status: 'active', $text: mongoose.trusted({ $search: q }) }, query);
}

async function featured(query: ProductListQuery): Promise<Paginated<PublicProduct>> {
  return paginatePublic({ status: 'active', isFeatured: true }, query);
}

async function bestSellers(query: ProductListQuery): Promise<Paginated<PublicProduct>> {
  return paginatePublic({ status: 'active', isBestSeller: true }, query);
}

async function newArrivals(query: ProductListQuery): Promise<Paginated<PublicProduct>> {
  return paginatePublic({ status: 'active' }, query, '-createdAt');
}

async function getBySlugPublic(slug: string): Promise<PublicProduct> {
  const doc = await productRepository.findOne({ slug, status: 'active' });
  if (doc === null) {
    throw new NotFoundError('Product not found');
  }
  const inStock = await inventoryService.getInStockMap([String(doc._id)]);
  return toPublicProduct(doc, inStock.get(String(doc._id)) ?? false);
}

async function assertCategory(categoryId: string): Promise<void> {
  if ((await categoryRepository.findById(categoryId)) === null) {
    throw new BadRequestError('Invalid categoryId');
  }
}

async function assertCollections(collectionIds: string[]): Promise<void> {
  if (collectionIds.length === 0) return;
  const unique = [...new Set(collectionIds)];
  // trusted: deliberate $in operator (global sanitizeFilter would otherwise reject it).
  const count = await collectionRepository.count({ _id: mongoose.trusted({ $in: unique }) });
  if (count !== unique.length) {
    throw new BadRequestError('One or more collectionIds are invalid');
  }
}

async function create(input: CreateProductBody, performedBy: string): Promise<AdminProduct> {
  await assertCategory(input.categoryId);
  const collectionIds = input.collectionIds ?? [];
  await assertCollections(collectionIds);
  if (input.salePrice !== undefined && input.salePrice >= input.price) {
    throw new BadRequestError('salePrice must be less than price');
  }
  const slug = await ensureUniqueSlug(slugify(input.slug ?? input.name), (s) =>
    productRepository.existsBySlug(s),
  );
  if (await productRepository.existsBySku(input.sku)) {
    throw new ConflictError('SKU already in use');
  }

  const doc = await productRepository.create({
    name: input.name,
    slug,
    shortDescription: input.shortDescription,
    description: input.description,
    sku: input.sku,
    price: input.price,
    salePrice: input.salePrice,
    categoryId: input.categoryId,
    collectionIds,
    images: input.images ?? [],
    video: input.video,
    seo: {
      title: input.seo?.title,
      description: input.seo?.description,
      keywords: input.seo?.keywords ?? [],
    },
    ogImage: input.ogImage,
    status: input.status ?? 'draft',
    isFeatured: input.isFeatured ?? false,
    isBestSeller: input.isBestSeller ?? false,
  });

  await inventoryService.createForProduct(String(doc._id), performedBy, {
    quantity: input.quantity,
    lowStockThreshold: input.lowStockThreshold,
  });
  return toAdminProduct(doc);
}

async function update(id: string, input: UpdateProductBody): Promise<AdminProduct> {
  const existing = await productRepository.findById(id);
  if (existing === null) {
    throw new NotFoundError('Product not found');
  }
  if (input.categoryId !== undefined) await assertCategory(input.categoryId);
  if (input.collectionIds !== undefined) await assertCollections(input.collectionIds);

  const effectivePrice = input.price ?? existing.price;
  const effectiveSale = input.salePrice ?? existing.salePrice;
  if (effectiveSale !== undefined && effectiveSale >= effectivePrice) {
    throw new BadRequestError('salePrice must be less than price');
  }

  const patch: Partial<IProduct> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.shortDescription !== undefined) patch.shortDescription = input.shortDescription;
  if (input.description !== undefined) patch.description = input.description;
  if (input.price !== undefined) patch.price = input.price;
  if (input.salePrice !== undefined) patch.salePrice = input.salePrice;
  if (input.categoryId !== undefined) patch.categoryId = input.categoryId;
  if (input.collectionIds !== undefined) patch.collectionIds = input.collectionIds;
  if (input.images !== undefined) patch.images = input.images;
  if (input.video !== undefined) patch.video = input.video;
  if (input.ogImage !== undefined) patch.ogImage = input.ogImage;
  if (input.status !== undefined) patch.status = input.status;
  if (input.isFeatured !== undefined) patch.isFeatured = input.isFeatured;
  if (input.isBestSeller !== undefined) patch.isBestSeller = input.isBestSeller;
  if (input.seo !== undefined) {
    patch.seo = {
      title: input.seo.title,
      description: input.seo.description,
      keywords: input.seo.keywords ?? existing.seo.keywords,
    };
  }
  if (input.sku !== undefined && input.sku !== existing.sku) {
    if (await productRepository.existsBySku(input.sku)) {
      throw new ConflictError('SKU already in use');
    }
    patch.sku = input.sku;
  }
  if (input.slug !== undefined) {
    const slug = slugify(input.slug);
    const conflict = await productRepository.findBySlug(slug, { includeDeleted: true });
    if (conflict !== null && String(conflict._id) !== id) {
      throw new ConflictError('Slug already in use');
    }
    patch.slug = slug;
  }

  const updated = await productRepository.updateById(id, { $set: patch });
  if (updated === null) {
    throw new NotFoundError('Product not found');
  }
  return toAdminProduct(updated);
}

async function listAdmin(query: ProductListQuery): Promise<Paginated<AdminProduct>> {
  const res: PaginatedResult<ProductDoc> = await productRepository.paginate(
    {},
    { page: query.page, limit: query.limit, sort: parseSort(query.sort) },
  );
  return {
    items: res.items.map(toAdminProduct),
    total: res.total,
    page: res.page,
    limit: res.limit,
    pages: res.pages,
  };
}

async function getByIdAdmin(id: string): Promise<AdminProduct> {
  const doc = await productRepository.findById(id);
  if (doc === null) {
    throw new NotFoundError('Product not found');
  }
  return toAdminProduct(doc);
}

async function remove(id: string): Promise<void> {
  const deleted = await productRepository.softDeleteById(id);
  if (deleted === null) {
    throw new NotFoundError('Product not found');
  }
}

export const productService = {
  listPublic,
  search,
  featured,
  bestSellers,
  newArrivals,
  getBySlugPublic,
  create,
  update,
  listAdmin,
  getByIdAdmin,
  remove,
};
