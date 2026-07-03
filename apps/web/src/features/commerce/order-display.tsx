/**
 * Order display helpers (Milestone 1.4c) — human labels + tone for order and
 * payment statuses, shared by the orders list and detail views.
 */
import type { OrderStatus, PaymentStatus } from '@sajawat/types';

const ORDER_TONE: Record<OrderStatus, string> = {
  created: 'bg-blue-50 text-blue-700',
  processing: 'bg-blue-50 text-blue-700',
  packed: 'bg-amber-50 text-amber-700',
  shipped: 'bg-amber-50 text-amber-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
  refunded: 'bg-gray-100 text-ink-soft',
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: 'Payment pending',
  paid: 'Paid',
  failed: 'Payment failed',
  refunded: 'Refunded',
};

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_TONE[status]}`}
    >
      {titleCase(status)}
    </span>
  );
}

export function paymentLabel(status: PaymentStatus): string {
  return PAYMENT_LABEL[status];
}

export function formatOrderDate(date: Date | string | undefined): string {
  if (date === undefined) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
