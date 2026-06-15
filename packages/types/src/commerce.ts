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
