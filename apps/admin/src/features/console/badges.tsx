/**
 * Status pills (Milestone 1.7) — consistent tones for order/payment/inventory/
 * product statuses across the console.
 */
import type {
  InventoryStatus,
  LeadStage,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
} from '@sajawat/types';
import { titleCase } from '@/lib/format';

function Pill({ tone, label }: { tone: string; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}

const ORDER_TONE: Record<OrderStatus, string> = {
  created: 'bg-blue-50 text-blue-700',
  processing: 'bg-blue-50 text-blue-700',
  packed: 'bg-amber-50 text-amber-700',
  shipped: 'bg-amber-50 text-amber-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
  refunded: 'bg-gray-100 text-ink-soft',
};

const PAYMENT_TONE: Record<PaymentStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-600',
  refunded: 'bg-gray-100 text-ink-soft',
};

const INVENTORY_TONE: Record<InventoryStatus, string> = {
  in_stock: 'bg-green-50 text-green-700',
  low_stock: 'bg-amber-50 text-amber-700',
  out_of_stock: 'bg-red-50 text-red-600',
};

const PRODUCT_TONE: Record<ProductStatus, string> = {
  active: 'bg-green-50 text-green-700',
  draft: 'bg-gray-100 text-ink-soft',
  archived: 'bg-red-50 text-red-600',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Pill tone={ORDER_TONE[status]} label={titleCase(status)} />;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Pill tone={PAYMENT_TONE[status]} label={titleCase(status)} />;
}

export function InventoryStatusBadge({ status }: { status: InventoryStatus }) {
  return <Pill tone={INVENTORY_TONE[status]} label={titleCase(status.replace(/_/g, ' '))} />;
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <Pill tone={PRODUCT_TONE[status]} label={titleCase(status)} />;
}

/** Active/inactive pill shared by categories, collections, and promotions. */
export function ActiveBadge({ status }: { status: 'active' | 'inactive' }) {
  const tone = status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-ink-soft';
  return <Pill tone={tone} label={titleCase(status)} />;
}

const STAGE_TONE: Record<LeadStage, string> = {
  new: 'bg-blue-50 text-blue-700',
  contacted: 'bg-indigo-50 text-indigo-700',
  follow_up: 'bg-amber-50 text-amber-700',
  quotation_sent: 'bg-cyan-50 text-cyan-700',
  negotiation: 'bg-purple/10 text-purple',
  won: 'bg-green-50 text-green-700',
  lost: 'bg-red-50 text-red-600',
};

const STAGE_LABEL: Record<LeadStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  follow_up: 'Follow-up',
  quotation_sent: 'Quotation Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

export function LeadStageBadge({ stage }: { stage: LeadStage }) {
  return <Pill tone={STAGE_TONE[stage]} label={STAGE_LABEL[stage]} />;
}
