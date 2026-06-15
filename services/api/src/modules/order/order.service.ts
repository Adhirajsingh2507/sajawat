/**
 * Order service (Milestone 1.6a) — COD checkout + customer order history/cancel.
 *
 * Checkout recomputes the cart server-side (cartService), enforces promotion
 * usage limits, atomically commits inventory (with rollback on partial failure),
 * snapshots items/address/promotion onto an immutable order, and clears the cart.
 * Razorpay online checkout + verify + webhook arrive in 1.6b.
 */
import { randomUUID } from 'node:crypto';
import type { HydratedDocument } from 'mongoose';
import type { AppliedDiscount, OrderAddress, Paginated, PublicOrder } from '@sajawat/types';
import { BadRequestError, NotFoundError } from '../../errors/app-error.js';
import type { PaginatedResult } from '../../db/base-repository.js';
import { cartService } from '../cart/cart.service.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { promotionRepository } from '../promotion/promotion.repository.js';
import { orderRepository } from './order.repository.js';
import type { IOrder, IOrderItem } from './order.types.js';

type OrderDoc = HydratedDocument<IOrder>;
const CANCELLABLE = new Set<IOrder['status']>(['created', 'processing']);

function toPublicOrder(doc: OrderDoc): PublicOrder {
  const promo: AppliedDiscount | null =
    doc.appliedPromotion == null
      ? null
      : {
          promotionId: doc.appliedPromotion.promotionId,
          label: doc.appliedPromotion.label,
          code: doc.appliedPromotion.code ?? undefined,
          amount: doc.appliedPromotion.amount,
        };
  return {
    id: String(doc._id),
    orderNumber: doc.orderNumber,
    status: doc.status,
    paymentStatus: doc.paymentStatus,
    paymentMethod: doc.paymentMethod,
    items: doc.items.map((i) => ({
      productId: String(i.productId),
      name: i.name,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
    address: {
      fullName: doc.address.fullName,
      phone: doc.address.phone,
      line1: doc.address.line1,
      line2: doc.address.line2,
      city: doc.address.city,
      state: doc.address.state,
      postalCode: doc.address.postalCode,
      country: doc.address.country,
    },
    subtotal: doc.subtotal,
    discount: doc.discount,
    shipping: doc.shipping,
    tax: doc.tax,
    total: doc.total,
    appliedPromotion: promo,
    notes: doc.notes ?? undefined,
    createdAt: doc.createdAt,
  };
}

async function generateOrderNumber(): Promise<string> {
  for (let i = 0; i < 5; i += 1) {
    const candidate = `SAJ-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
    if (!(await orderRepository.existsByOrderNumber(candidate))) {
      return candidate;
    }
  }
  throw new Error('Could not generate a unique order number');
}

async function enforcePromotionLimits(promotionId: string, userId: string): Promise<void> {
  const promo = await promotionRepository.findById(promotionId);
  if (promo === null) return; // promotion removed since add — honor the snapshot, skip limits
  if (promo.usageLimit != null) {
    if ((await orderRepository.countByPromotion(promotionId)) >= promo.usageLimit) {
      throw new BadRequestError('This promotion has reached its usage limit');
    }
  }
  if (promo.perCustomerLimit != null) {
    if ((await orderRepository.countByPromotion(promotionId, userId)) >= promo.perCustomerLimit) {
      throw new BadRequestError('You have already used this promotion');
    }
  }
}

export interface CheckoutInput {
  address: OrderAddress;
  notes?: string | undefined;
}

async function placeCodOrder(userId: string, input: CheckoutInput): Promise<PublicOrder> {
  const cart = await cartService.getCart(userId);
  if (cart.items.length === 0) {
    throw new BadRequestError('Your cart is empty');
  }
  for (const item of cart.items) {
    if (!item.inStock) {
      throw new BadRequestError(`${item.name} is out of stock`);
    }
  }
  if (cart.appliedPromotion !== null) {
    await enforcePromotionLimits(cart.appliedPromotion.promotionId, userId);
  }

  // Commit inventory atomically; roll back already-committed lines on failure.
  const committed: { productId: string; quantity: number }[] = [];
  try {
    for (const item of cart.items) {
      await inventoryService.commit(item.productId, item.quantity, userId);
      committed.push({ productId: item.productId, quantity: item.quantity });
    }
  } catch (err) {
    for (const c of committed) {
      await inventoryService.restock(c.productId, c.quantity, userId, 'Checkout rollback');
    }
    throw err;
  }

  const items: IOrderItem[] = cart.items.map((i) => ({
    productId: i.productId,
    name: i.name,
    unitPrice: i.unitPrice,
    quantity: i.quantity,
    lineTotal: i.lineTotal,
  }));

  const order = await orderRepository.create({
    orderNumber: await generateOrderNumber(),
    userId,
    status: 'processing',
    paymentStatus: 'pending',
    paymentMethod: 'cod',
    items,
    address: input.address,
    subtotal: cart.subtotal,
    discount: cart.discount,
    shipping: 0,
    tax: 0,
    total: cart.total,
    appliedPromotion:
      cart.appliedPromotion === null
        ? null
        : {
            promotionId: cart.appliedPromotion.promotionId,
            label: cart.appliedPromotion.label,
            code: cart.appliedPromotion.code ?? null,
            amount: cart.appliedPromotion.amount,
          },
    notes: input.notes ?? null,
  });

  await cartService.clear(userId);
  return toPublicOrder(order);
}

async function listMine(
  userId: string,
  query: { page?: number | undefined; limit?: number | undefined },
): Promise<Paginated<PublicOrder>> {
  const res: PaginatedResult<OrderDoc> = await orderRepository.paginate(
    { userId },
    { page: query.page, limit: query.limit, sort: { createdAt: -1 } },
  );
  return {
    items: res.items.map(toPublicOrder),
    total: res.total,
    page: res.page,
    limit: res.limit,
    pages: res.pages,
  };
}

async function getMine(userId: string, id: string): Promise<PublicOrder> {
  const order = await orderRepository.findForUser(id, userId);
  if (order === null) {
    throw new NotFoundError('Order not found');
  }
  return toPublicOrder(order);
}

async function cancelMine(userId: string, id: string): Promise<PublicOrder> {
  const order = await orderRepository.findForUser(id, userId);
  if (order === null) {
    throw new NotFoundError('Order not found');
  }
  if (!CANCELLABLE.has(order.status)) {
    throw new BadRequestError('This order can no longer be cancelled');
  }
  if (order.paymentStatus === 'paid') {
    throw new BadRequestError('Paid orders must be cancelled by support (refund required)');
  }
  for (const item of order.items) {
    await inventoryService.restock(
      String(item.productId),
      item.quantity,
      userId,
      `Order ${order.orderNumber} cancelled`,
    );
  }
  order.status = 'cancelled';
  await order.save();
  return toPublicOrder(order);
}

export const orderService = { placeCodOrder, listMine, getMine, cancelMine };
