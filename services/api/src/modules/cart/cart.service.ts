/**
 * Cart service (Milestone 1.5b) — server-authoritative cart. Totals are ALWAYS
 * recomputed against live product prices (salePrice if set); `priceAtAdd` is
 * reference-only. The applied discount comes from the promotion resolver
 * (coupon-wins-else-best-automatic). Stock is not reserved here (that's 1.6).
 */
import type { HydratedDocument } from 'mongoose';
import type { PublicCart, PublicCartItem } from '@sajawat/types';
import { BadRequestError, NotFoundError } from '../../errors/app-error.js';
import { productRepository } from '../product/product.repository.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { promotionService } from '../promotion/promotion.service.js';
import { normalizeCode } from '../promotion/promotion.repository.js';
import { cartRepository } from './cart.repository.js';
import type { ICart } from './cart.types.js';

type CartDoc = HydratedDocument<ICart>;

async function loadPriced(cart: CartDoc): Promise<{ items: PublicCartItem[]; subtotal: number }> {
  const ids = cart.items.map((i) => String(i.productId));
  const products = await productRepository.findActiveByIds(ids);
  const inStock = await inventoryService.getInStockMap(ids);
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const items: PublicCartItem[] = [];
  let subtotal = 0;
  for (const item of cart.items) {
    const product = byId.get(String(item.productId));
    if (product === undefined) continue; // inactive/removed product → drop from cart view
    const unitPrice = product.salePrice ?? product.price;
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;
    items.push({
      productId: String(product._id),
      name: product.name,
      slug: product.slug,
      image: product.images[0]?.url,
      unitPrice,
      quantity: item.quantity,
      lineTotal,
      inStock: inStock.get(String(product._id)) ?? false,
    });
  }
  return { items, subtotal };
}

async function buildPublicCart(cart: CartDoc): Promise<PublicCart> {
  const { items, subtotal } = await loadPriced(cart);
  const resolved = await promotionService.resolveCartDiscount(subtotal, cart.couponCode);
  const discount = resolved?.amount ?? 0;
  return {
    items,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    subtotal,
    discount,
    total: subtotal - discount,
    appliedPromotion:
      resolved === null
        ? null
        : {
            promotionId: resolved.promotionId,
            label: resolved.label,
            code: resolved.code ?? undefined,
            amount: resolved.amount,
          },
    couponCode: cart.couponCode ?? null,
  };
}

async function getCart(userId: string): Promise<PublicCart> {
  return buildPublicCart(await cartRepository.getOrCreate(userId));
}

async function addItem(userId: string, productId: string, quantity: number): Promise<PublicCart> {
  const product = await productRepository.findById(productId);
  if (product === null || product.status !== 'active') {
    throw new BadRequestError('Product is not available');
  }
  const cart = await cartRepository.getOrCreate(userId);
  const existing = cart.items.find((i) => String(i.productId) === productId);
  if (existing !== undefined) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ productId, quantity, priceAtAdd: product.salePrice ?? product.price });
  }
  await cart.save();
  return buildPublicCart(cart);
}

async function updateItem(
  userId: string,
  productId: string,
  quantity: number,
): Promise<PublicCart> {
  const cart = await cartRepository.getOrCreate(userId);
  const item = cart.items.find((i) => String(i.productId) === productId);
  if (item === undefined) {
    throw new NotFoundError('Item not in cart');
  }
  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => String(i.productId) !== productId);
  } else {
    item.quantity = quantity;
  }
  await cart.save();
  return buildPublicCart(cart);
}

async function removeItem(userId: string, productId: string): Promise<PublicCart> {
  const cart = await cartRepository.getOrCreate(userId);
  const before = cart.items.length;
  cart.items = cart.items.filter((i) => String(i.productId) !== productId);
  if (cart.items.length !== before) {
    await cart.save();
  }
  return buildPublicCart(cart);
}

async function applyCoupon(userId: string, code: string): Promise<PublicCart> {
  const cart = await cartRepository.getOrCreate(userId);
  const { subtotal } = await loadPriced(cart);
  await promotionService.assertCouponApplies(code, subtotal); // throws if invalid
  cart.couponCode = normalizeCode(code);
  await cart.save();
  return buildPublicCart(cart);
}

async function removeCoupon(userId: string): Promise<PublicCart> {
  const cart = await cartRepository.getOrCreate(userId);
  cart.couponCode = null;
  await cart.save();
  return buildPublicCart(cart);
}

export const cartService = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  applyCoupon,
  removeCoupon,
};
