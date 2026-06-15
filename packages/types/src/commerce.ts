/**
 * Commerce DTOs (Milestone 1.5) — cart + wishlist wire shapes. Totals are always
 * computed server-side; the client renders these, never recomputes them.
 */
import type { PublicProduct } from './catalog.js';

export interface AppliedDiscount {
  promotionId: string;
  label: string;
  code?: string | undefined;
  amount: number;
}

export interface PublicCartItem {
  productId: string;
  name: string;
  slug: string;
  image?: string | undefined;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  inStock: boolean;
}

export interface PublicCart {
  items: PublicCartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  total: number;
  appliedPromotion: AppliedDiscount | null;
  couponCode?: string | null;
}

export interface PublicWishlist {
  items: PublicProduct[];
}

export type OrderStatus =
  | 'created'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cod' | 'online';

export interface OrderAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | undefined;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PublicOrderItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface RazorpayCheckout {
  provider: 'razorpay';
  orderId: string;
  keyId: string;
  amount: number;
  currency: string;
}

export interface OnlineCheckoutResult {
  order: PublicOrder;
  payment: RazorpayCheckout;
}

export interface PublicOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  items: PublicOrderItem[];
  address: OrderAddress;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  appliedPromotion: AppliedDiscount | null;
  notes?: string | undefined;
  createdAt?: Date | undefined;
}
