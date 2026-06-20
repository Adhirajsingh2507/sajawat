'use client';

/**
 * Console dashboard (Milestone 1.7a) — at-a-glance operational counts. Each card
 * fetches a paginated list purely for its `total`, and is rendered only when the
 * role holds the required read permission (the API enforces it regardless).
 */
import Link from 'next/link';
import { PERMISSIONS } from '@sajawat/shared';
import { useAuth } from '@/features/auth/auth-context';
import { useAsync } from '@/lib/use-async';
import { listOrders } from '@/services/orders';
import { listInventory } from '@/services/inventory';
import { useCan } from '@/features/console/Can';
import { PageHeader } from '@/features/console/ui';

export default function DashboardPage() {
  const { user } = useAuth();
  const canOrders = useCan(PERMISSIONS.ORDER_READ);
  const canInventory = useCan(PERMISSIONS.INVENTORY_READ);

  return (
    <div>
      <PageHeader
        title={`Welcome${user !== null ? `, ${user.firstName}` : ''}`}
        description="Operations at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {canOrders && (
          <>
            <StatCard
              label="Total orders"
              href="/orders"
              load={() => listOrders({ limit: 1 }).then((r) => r.total)}
            />
            <StatCard
              label="Awaiting payment"
              href="/orders"
              tone="amber"
              load={() => listOrders({ limit: 1, paymentStatus: 'pending' }).then((r) => r.total)}
            />
            <StatCard
              label="Processing"
              href="/orders"
              load={() => listOrders({ limit: 1, status: 'processing' }).then((r) => r.total)}
            />
          </>
        )}
        {canInventory && (
          <>
            <StatCard
              label="Low stock"
              href="/inventory"
              tone="amber"
              load={() => listInventory({ limit: 1, status: 'low_stock' }).then((r) => r.total)}
            />
            <StatCard
              label="Out of stock"
              href="/inventory"
              tone="red"
              load={() => listInventory({ limit: 1, status: 'out_of_stock' }).then((r) => r.total)}
            />
          </>
        )}
      </div>

      {!canOrders && !canInventory && (
        <p className="mt-4 text-sm text-ink-soft">
          Your role doesn&apos;t have dashboard metrics. Use the navigation to access your tools.
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  href,
  load,
  tone = 'default',
}: {
  label: string;
  href: string;
  load: () => Promise<number>;
  tone?: 'default' | 'amber' | 'red';
}) {
  const { data, loading, error } = useAsync(load, []);
  const valueTone =
    tone === 'amber' ? 'text-amber-700' : tone === 'red' ? 'text-red-600' : 'text-ink';

  return (
    <Link
      href={href}
      className="rounded-2xl border border-line bg-cream p-5 transition-colors hover:border-purple"
    >
      <p className="text-sm text-ink-soft">{label}</p>
      <p className={`mt-2 font-serif text-3xl font-semibold ${valueTone}`}>
        {error !== null ? '—' : loading && data === null ? '…' : (data ?? 0)}
      </p>
    </Link>
  );
}
