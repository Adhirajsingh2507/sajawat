/**
 * Wishlist service (Milestone 1.5b) — private per-user wishlist of products.
 */
import type { PublicWishlist } from '@sajawat/types';
import { BadRequestError } from '../../errors/app-error.js';
import { productRepository } from '../product/product.repository.js';
import { productService } from '../product/product.service.js';
import { wishlistRepository } from './wishlist.repository.js';

async function getWishlist(userId: string): Promise<PublicWishlist> {
  const wishlist = await wishlistRepository.getOrCreate(userId);
  const ids = wishlist.productIds.map((p) => String(p));
  return { items: await productService.getPublicProductsByIds(ids) };
}

async function add(userId: string, productId: string): Promise<PublicWishlist> {
  const product = await productRepository.findById(productId);
  if (product === null || product.status !== 'active') {
    throw new BadRequestError('Product is not available');
  }
  const wishlist = await wishlistRepository.getOrCreate(userId);
  if (!wishlist.productIds.some((p) => String(p) === productId)) {
    wishlist.productIds.push(productId);
    await wishlist.save();
  }
  return getWishlist(userId);
}

async function remove(userId: string, productId: string): Promise<PublicWishlist> {
  const wishlist = await wishlistRepository.getOrCreate(userId);
  wishlist.productIds = wishlist.productIds.filter((p) => String(p) !== productId);
  await wishlist.save();
  return getWishlist(userId);
}

export const wishlistService = { getWishlist, add, remove };
