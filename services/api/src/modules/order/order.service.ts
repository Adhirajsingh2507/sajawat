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
import type {
  AppliedDiscount,
  OnlineCheckoutResult,
  OrderAddress,
  Paginated,
  PublicOrder,
} from '@sajawat/types';
import { BadRequestError, NotFoundError, NotImplementedError } from '../../errors/app-error.js';
import type { PaginatedResult } from '../../db/base-repository.js';
import { cartService } from '../cart/cart.service.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { promotionRepository } from '../promotion/promotion.repository.js';
import { paymentRepository } from '../payment/payment.repository.js';
import type { IPayment } from '../payment/payment.types.js';
import { razorpayProvider } from '../../payments/razorpay-provider.js';
import { orderRepository } from './order.repository.js';
import type { IOrder, IOrderItem, IOrderPromotion } from './order.types.js';

type OrderDoc = HydratedDocument<IOrder>;
type PaymentDoc = HydratedDocument<IPayment>;

interface RazorpayWebhookEvent {
  event?: string;
  payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
}

function snapshotItems(
  items: {
    productId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[],
): IOrderItem[] {
  return items.map((i) => ({
    productId: i.productId,
    name: i.name,
    unitPrice: i.unitPrice,
    quantity: i.quantity,
    lineTotal: i.lineTotal,
  }));
}

function promoSnapshot(promo: AppliedDiscount | null): IOrderPromotion | null {
  return promo === null
    ? null
    : {
        promotionId: promo.promotionId,
        label: promo.label,
        code: promo.code ?? null,
        amount: promo.amount,
      };
}
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

  const order = await orderRepository.create({
    orderNumber: await generateOrderNumber(),
    userId,
    status: 'processing',
    paymentStatus: 'pending',
    paymentMethod: 'cod',
    items: snapshotItems(cart.items),
    address: input.address,
    subtotal: cart.subtotal,
    discount: cart.discount,
    shipping: 0,
    tax: 0,
    total: cart.total,
    appliedPromotion: promoSnapshot(cart.appliedPromotion),
    notes: input.notes ?? null,
  });

  await cartService.clear(userId);
  return toPublicOrder(order);
}

export interface VerifyPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}

/** Convert a paid order's reservations to sales, capture payment, clear cart. */
async function fulfillPaidOrder(
  order: OrderDoc,
  payment: PaymentDoc,
  paymentId: string,
  signature: string | null,
): Promise<void> {
  for (const item of order.items) {
    await inventoryService.commitReserved(
      String(item.productId),
      item.quantity,
      String(order.userId),
    );
  }
  await paymentRepository.updateById(String(payment._id), {
    $set: { status: 'captured', transactionId: paymentId, signature },
  });
  await cartService.clear(String(order.userId));
}

async function initiateOnline(userId: string, input: CheckoutInput): Promise<OnlineCheckoutResult> {
  if (!razorpayProvider.isConfigured()) {
    throw new NotImplementedError('Online payments are not configured');
  }
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

  const reserved: { productId: string; quantity: number }[] = [];
  for (const item of cart.items) {
    try {
      await inventoryService.reserve(item.productId, item.quantity);
      reserved.push({ productId: item.productId, quantity: item.quantity });
    } catch (err) {
      for (const r of reserved) await inventoryService.release(r.productId, r.quantity);
      throw err;
    }
  }

  const order = await orderRepository.create({
    orderNumber: await generateOrderNumber(),
    userId,
    status: 'created',
    paymentStatus: 'pending',
    paymentMethod: 'online',
    items: snapshotItems(cart.items),
    address: input.address,
    subtotal: cart.subtotal,
    discount: cart.discount,
    shipping: 0,
    tax: 0,
    total: cart.total,
    appliedPromotion: promoSnapshot(cart.appliedPromotion),
    notes: input.notes ?? null,
  });

  try {
    const providerOrder = await razorpayProvider.createOrder(
      Math.round(cart.total * 100),
      'INR',
      order.orderNumber,
    );
    await paymentRepository.create({
      orderId: String(order._id),
      provider: 'razorpay',
      providerOrderId: providerOrder.providerOrderId,
      status: 'created',
      amount: cart.total,
      currency: 'INR',
    });
    return {
      order: toPublicOrder(order),
      payment: {
        provider: 'razorpay',
        orderId: providerOrder.providerOrderId,
        keyId: razorpayProvider.publicKeyId() ?? '',
        amount: providerOrder.amount,
        currency: providerOrder.currency,
      },
    };
  } catch (err) {
    await orderRepository.markFailedIfPending(String(order._id));
    for (const r of reserved) await inventoryService.release(r.productId, r.quantity);
    throw err;
  }
}

async function verifyOnlinePayment(
  userId: string,
  input: VerifyPaymentInput,
): Promise<PublicOrder> {
  if (!razorpayProvider.isConfigured()) {
    throw new NotImplementedError('Online payments are not configured');
  }
  if (
    !razorpayProvider.verifyPaymentSignature(
      input.razorpayOrderId,
      input.razorpayPaymentId,
      input.signature,
    )
  ) {
    throw new BadRequestError('Payment verification failed');
  }
  const payment = await paymentRepository.findByProviderOrderId(input.razorpayOrderId);
  if (payment === null) {
    throw new NotFoundError('Payment not found');
  }
  const order = await orderRepository.findById(String(payment.orderId));
  if (order === null || String(order.userId) !== userId) {
    throw new NotFoundError('Order not found');
  }
  const transitioned = await orderRepository.markPaidIfPending(String(order._id));
  if (transitioned !== null) {
    await fulfillPaidOrder(transitioned, payment, input.razorpayPaymentId, input.signature);
    return toPublicOrder(transitioned);
  }
  return toPublicOrder(order); // already paid — idempotent
}

/** Process a Razorpay webhook (raw body + signature). Idempotent. */
async function handleRazorpayWebhook(
  rawBody: Buffer,
  signature: string | undefined,
): Promise<void> {
  if (!razorpayProvider.isConfigured()) return;
  if (signature === undefined || !razorpayProvider.verifyWebhookSignature(rawBody, signature)) {
    throw new BadRequestError('Invalid webhook signature');
  }
  const event = JSON.parse(rawBody.toString('utf8')) as RazorpayWebhookEvent;
  const entity = event.payload?.payment?.entity;
  const providerOrderId = entity?.order_id;
  if (providerOrderId === undefined) return;

  const payment = await paymentRepository.findByProviderOrderId(providerOrderId);
  if (payment === null) return;
  const order = await orderRepository.findById(String(payment.orderId));
  if (order === null) return;

  if (event.event === 'payment.captured') {
    const transitioned = await orderRepository.markPaidIfPending(String(order._id));
    if (transitioned !== null) {
      await fulfillPaidOrder(transitioned, payment, entity?.id ?? '', null);
    }
  } else if (event.event === 'payment.failed') {
    const failed = await orderRepository.markFailedIfPending(String(order._id));
    if (failed !== null) {
      for (const item of order.items) {
        await inventoryService.release(String(item.productId), item.quantity);
      }
      await paymentRepository.updateById(String(payment._id), { $set: { status: 'failed' } });
    }
  }
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

export const orderService = {
  placeCodOrder,
  initiateOnline,
  verifyOnlinePayment,
  handleRazorpayWebhook,
  listMine,
  getMine,
  cancelMine,
};
