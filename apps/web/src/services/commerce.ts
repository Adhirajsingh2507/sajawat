/**
 * Commerce service (Milestone 1.4c) — typed reads/writes for cart, wishlist,
 * checkout, and orders. The UI never calls `apiFetch` directly (coding-standards:
 * service layer). Every mutation returns the server's authoritative DTO; the
 * client renders it and never recomputes totals.
 */
import { apiFetch } from '@/lib/api';
import type {
  CheckoutRequest,
  OnlineCheckoutResult,
  Paginated,
  PublicCart,
  PublicOrder,
  PublicWishlist,
  VerifyPaymentRequest,
} from '@sajawat/types';

/** Address + optional notes — the checkout payload (shared by COD and online). */
export type CheckoutInput = CheckoutRequest;

/* ----------------------------------- Cart ---------------------------------- */

export function getCart(): Promise<PublicCart> {
  return apiFetch<PublicCart>('/cart');
}

export function addCartItem(productId: string, quantity = 1): Promise<PublicCart> {
  return apiFetch<PublicCart>('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });
}

export function updateCartItem(productId: string, quantity: number): Promise<PublicCart> {
  return apiFetch<PublicCart>(`/cart/items/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
}

export function removeCartItem(productId: string): Promise<PublicCart> {
  return apiFetch<PublicCart>(`/cart/items/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  });
}

export function applyCoupon(code: string): Promise<PublicCart> {
  return apiFetch<PublicCart>('/cart/apply-coupon', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export function removeCoupon(): Promise<PublicCart> {
  return apiFetch<PublicCart>('/cart/coupon', { method: 'DELETE' });
}

/* --------------------------------- Wishlist -------------------------------- */

export function getWishlist(): Promise<PublicWishlist> {
  return apiFetch<PublicWishlist>('/wishlist');
}

export function addWishlistItem(productId: string): Promise<PublicWishlist> {
  return apiFetch<PublicWishlist>(`/wishlist/${encodeURIComponent(productId)}`, {
    method: 'POST',
  });
}

export function removeWishlistItem(productId: string): Promise<PublicWishlist> {
  return apiFetch<PublicWishlist>(`/wishlist/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  });
}

/* --------------------------------- Checkout -------------------------------- */

export function checkoutCod(input: CheckoutInput): Promise<PublicOrder> {
  return apiFetch<PublicOrder>('/checkout/cod', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Initiate a Razorpay online order. The backend throws NotImplementedError (501)
 * until Razorpay keys are configured (D18); callers degrade gracefully to COD.
 */
export function checkoutOnline(input: CheckoutInput): Promise<OnlineCheckoutResult> {
  return apiFetch<OnlineCheckoutResult>('/checkout', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function verifyPayment(input: VerifyPaymentRequest): Promise<PublicOrder> {
  return apiFetch<PublicOrder>('/checkout/verify-payment', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/* ---------------------------------- Orders --------------------------------- */

export function getOrders(
  query: { page?: number; limit?: number } = {},
): Promise<Paginated<PublicOrder>> {
  const sp = new URLSearchParams();
  if (query.page !== undefined) sp.set('page', String(query.page));
  if (query.limit !== undefined) sp.set('limit', String(query.limit));
  const suffix = sp.toString().length > 0 ? `?${sp.toString()}` : '';
  return apiFetch<Paginated<PublicOrder>>(`/orders${suffix}`);
}

export function getOrder(id: string): Promise<PublicOrder> {
  return apiFetch<PublicOrder>(`/orders/${encodeURIComponent(id)}`);
}

export function cancelOrder(id: string): Promise<PublicOrder> {
  return apiFetch<PublicOrder>(`/orders/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
  });
}
