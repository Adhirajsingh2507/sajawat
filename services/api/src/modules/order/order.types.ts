/**
 * Order types (Milestone 1.6). Items and address are EMBEDDED snapshots taken at
 * purchase time (immutable record, independent of later catalog changes).
 */
import type { Types } from 'mongoose';
import type { OrderAddress, OrderStatus, PaymentMethod, PaymentStatus } from '@sajawat/types';

export interface IOrderItem {
  productId: Types.ObjectId | string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface IOrderPromotion {
  promotionId: string;
  label: string;
  code?: string | null;
  amount: number;
}

export interface IOrder {
  orderNumber: string;
  userId: Types.ObjectId | string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  items: IOrderItem[];
  address: OrderAddress;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  appliedPromotion?: IOrderPromotion | null;
  notes?: string | null;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}
