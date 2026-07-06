'use client';

/**
 * CRM pipeline board (Milestone 1.8b) — B2B wholesale leads grouped into stage
 * columns. Reads are server-authoritative; stage changes happen on the lead
 * detail page (CRM_WRITE). Fetches a generous page and groups client-side.
 */
import Link from 'next/link';
import type { AdminLead, LeadStage } from '@sajawat/types';
import { useAsync } from '@/lib/use-async';
import { listLeads } from '@/services/crm';
import { formatDate } from '@/lib/format';
import { PageHeader, EmptyState } from '@/features/console/ui';
import { LEAD_STAGES, STAGE_LABELS } from '@/features/crm/stages';

export default function CrmBoardPage() {
  const { data, loading, error } = useAsync(() => listLeads({ limit: 100 }), []);

  const byStage = new Map<LeadStage, AdminLead[]>();
  for (const stage of LEAD_STAGES) byStage.set(stage, []);
  for (const lead of data?.items ?? []) byStage.get(lead.stage)?.push(lead);

  return (
    <div>
      <PageHeader
        title="CRM leads"
        description="Wholesale enquiries — drag-free pipeline; open a lead to advance it."
      />

      {error !== null && <p className="text-sm text-red-600">{error}</p>}
      {loading && data === null && <p className="text-sm text-ink-soft">Loading leads…</p>}

      {data !== null && data.items.length === 0 && <EmptyState message="No leads yet." />}

      {data !== null && data.items.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STAGES.map((stage) => {
            const leads = byStage.get(stage) ?? [];
            return (
              <section key={stage} className="w-64 shrink-0">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-ink">{STAGE_LABELS[stage]}</h2>
                  <span className="text-xs text-ink-faint">{leads.length}</span>
                </div>
                <div className="space-y-3">
                  {leads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/crm/${lead.id}`}
                      className="block rounded-xl border border-line bg-cream p-4 transition-colors hover:border-purple"
                    >
                      <p className="text-sm font-medium text-ink">{lead.company ?? lead.name}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {lead.company !== undefined ? lead.name : 'Contact message'}
                        {lead.city !== undefined ? ` · ${lead.city}` : ''}
                      </p>
                      {lead.quantity != null && (
                        <p className="mt-1 text-xs text-ink-faint">Qty ~ {lead.quantity}</p>
                      )}
                      <p className="mt-2 text-[11px] text-ink-faint">
                        {formatDate(lead.createdAt)}
                      </p>
                    </Link>
                  ))}
                  {leads.length === 0 && (
                    <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-ink-faint">
                      None
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
