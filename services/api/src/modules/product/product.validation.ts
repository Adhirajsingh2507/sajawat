/**
 * Product request schemas (Milestone 1.3b). Query booleans are parsed from the
 * literal strings "true"/"false" (z.coerce.boolean treats any non-empty string
 * as true). `sort` is whitelisted in the service.
 */
import { z } from 'zod';

const queryBool = z.union([z.literal('true'), z.literal('false')]).transform((v) => v === 'true');

const imageInput = z.object({
  url: z.string().trim().min(1).max(2048),
  alt: z.string().trim().max(200).optional(),
  position: z.number().int().nonnegative().default(0),
});

const videoInput = z.object({ url: z.string().trim().min(1).max(2048) });

const seoInput = z.object({
  title: z.string().trim().max(200).optional(),
  description: z.string().trim().max(300).optional(),
  keywords: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
});

const productBodyShape = {
  name: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug')
    .optional(),
  shortDescription: z.string().trim().max(500).optional(),
  description: z.string().trim().max(8000).optional(),
  sku: z.string().trim().min(1).max(64),
  price: z.number().nonnegative(),
  salePrice: z.number().nonnegative().optional(),
  categoryId: z.string().min(1),
  collectionIds: z.array(z.string().min(1)).max(50).optional(),
  images: z.array(imageInput).max(9).optional(),
  video: videoInput.optional(),
  seo: seoInput.optional(),
  ogImage: z.string().trim().max(2048).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  // initial inventory seed
  quantity: z.number().int().nonnegative().optional(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
};

export const createProductSchema = z.object({ body: z.object(productBodyShape) });

export const updateProductSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: productBodyShape.name.optional(),
    slug: productBodyShape.slug,
    shortDescription: productBodyShape.shortDescription,
    description: productBodyShape.description,
    sku: productBodyShape.sku.optional(),
    price: productBodyShape.price.optional(),
    salePrice: productBodyShape.salePrice,
    categoryId: productBodyShape.categoryId.optional(),
    collectionIds: productBodyShape.collectionIds,
    images: productBodyShape.images,
    video: productBodyShape.video,
    seo: productBodyShape.seo,
    ogImage: productBodyShape.ogImage,
    status: productBodyShape.status,
    isFeatured: productBodyShape.isFeatured,
    isBestSeller: productBodyShape.isBestSeller,
  }),
});

export const productListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    sort: z.string().max(40).optional(),
    category: z.string().min(1).optional(),
    collection: z.string().min(1).optional(),
    featured: queryBool.optional(),
    bestSeller: queryBool.optional(),
  }),
});

export const productSearchQuerySchema = z.object({
  query: z.object({
    q: z.string().trim().min(1).max(120),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    sort: z.string().max(40).optional(),
  }),
});

export const slugParamSchema = z.object({ params: z.object({ slug: z.string().min(1) }) });
export const idParamSchema = z.object({ params: z.object({ id: z.string().min(1) }) });

export type CreateProductBody = z.infer<typeof createProductSchema>['body'];
export type UpdateProductBody = z.infer<typeof updateProductSchema>['body'];
export type ProductListQuery = z.infer<typeof productListQuerySchema>['query'];
export type ProductSearchQuery = z.infer<typeof productSearchQuerySchema>['query'];
