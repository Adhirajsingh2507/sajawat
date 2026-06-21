'use client';

/**
 * Lead detail (Milestone 1.8b) — contact info + staff actions: advance stage,
 * assign, and append notes (CRM_WRITE). Each write re-renders from the returned
 * AdminLead. The API enforces permissions and the update shape.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { AdminLead, LeadStage } from '@sajawat/types';
import { PERMISSIONS } from '@sajawat/shared';
import { useAsync } from '@/lib/use-async';
import { getLead, updateLead } from '@/services/crm';
import { ApiError } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { useCan } from '@/features/console/Can';
import { Card, PageHeader } from '@/features/console/ui';
import { LeadStageBadge } from '@/features/console/badges';
import { LEAD_STAGES, STAGE_LABELS } from '@/features/crm/stages';

function errMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Something went wrong';
}

export default function LeadDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const canWrite = useCan(PERMISSIONS.CRM_WRITE);

  const { data, loading, error } = useAsync(() => getLead(id), [id]);
  const [override, setOverride] = useState<AdminLead | null>(null);
  const lead = override ?? data;

  if (lead === null) {
    return (
      <p className="text-sm text-ink-soft">
        {loading ? 'Loading lead…' : (error ?? 'Lead not found.')}
      </p>
    );
  }

  return (
    <div>
      <nav className="mb-2 text-xs text-ink-faint">
        <Link href="/crm" className="hover:text-purple">
          CRM leads
        </Link>{' '}
        / {lead.company}
      </nav>
      <PageHeader
        title={lead.company}
        description={`Enquiry from ${lead.name} · ${formatDateTime(lead.createdAt)}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card>
            <h2 className="font-serif text-lg font-semibold text-ink">Contact</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Field label="Name" value={lead.name} />
              <Field label="Phone" value={lead.phone} />
              <Field label="Email" value={lead.email} />
              <Field label="City" value={lead.city} />
              {lead.gst !== undefined && <Field label="GST" value={lead.gst} />}
              {lead.quantity != null && <Field label="Quantity" value={String(lead.quantity)} />}
              {lead.productInterest !== undefined && (
                <Field label="Interest" value={lead.productInterest} wide />
              )}
            </dl>
            {lead.message !== undefined && lead.message.length > 0 && (
              <p className="mt-4 rounded-lg bg-mist/50 p-3 text-sm text-ink-soft">{lead.message}</p>
            )}
          </Card>

          <Card>
            <h2 className="font-serif text-lg font-semibold text-ink">Notes</h2>
            <ul className="mt-3 space-y-3">
              {lead.notes.length === 0 && <li className="text-sm text-ink-faint">No notes yet.</li>}
              {lead.notes.map((note, i) => (
                <li key={i} className="rounded-lg border border-line p-3 text-sm">
                  <p className="text-ink">{note.body}</p>
                  <p className="mt-1 text-xs text-ink-faint">{formatDateTime(note.createdAt)}</p>
                </li>
              ))}
            </ul>
            {canWrite && <AddNote leadId={lead.id} onDone={setOverride} />}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-ink">Stage</h2>
              <LeadStageBadge stage={lead.stage} />
            </div>
            {canWrite ? (
              <StageUpdater leadId={lead.id} current={lead.stage} onDone={setOverride} />
            ) : (
              <p className="mt-3 text-xs text-ink-faint">You can&apos;t change this lead.</p>
            )}
          </Card>

          {canWrite && (
            <Card>
              <h2 className="font-serif text-lg font-semibold text-ink">Assignment</h2>
              <AssignUpdater
                leadId={lead.id}
                current={lead.assignedTo ?? ''}
                onDone={setOverride}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide === true ? 'col-span-2' : ''}>
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

function StageUpdater({
  leadId,
  current,
  onDone,
}: {
  leadId: string;
  current: LeadStage;
  onDone: (lead: AdminLead) => void;
}) {
  const [value, setValue] = useState<LeadStage>(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function apply() {
    if (value === current) return;
    setBusy(true);
    setError(null);
    void updateLead(leadId, { stage: value })
      .then(onDone)
      .catch((err: unknown) => {
        setError(errMessage(err));
        setValue(current);
      })
      .finally(() => {
        setBusy(false);
      });
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <select
          aria-label="Lead stage"
          value={value}
          onChange={(e) => {
            setValue(e.target.value as LeadStage);
          }}
          disabled={busy}
          className="h-10 flex-1 rounded-lg border border-line bg-cream px-3 text-sm focus:border-purple focus:outline-none"
        >
          {LEAD_STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={apply}
          disabled={busy || value === current}
          className="h-10 shrink-0 rounded-lg bg-purple px-4 text-sm font-medium text-white hover:bg-purple-dark disabled:opacity-40"
        >
          {busy ? 'Saving…' : 'Update'}
        </button>
      </div>
      {error !== null && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function AssignUpdater({
  leadId,
  current,
  onDone,
}: {
  leadId: string;
  current: string;
  onDone: (lead: AdminLead) => void;
}) {
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function apply() {
    setBusy(true);
    setError(null);
    void updateLead(leadId, { assignedTo: value.trim() === '' ? null : value.trim() })
      .then(onDone)
      .catch((err: unknown) => {
        setError(errMessage(err));
      })
      .finally(() => {
        setBusy(false);
      });
  }

  return (
    <div className="mt-3">
      <p className="mb-2 text-xs text-ink-faint">Assign by staff user id (blank to unassign).</p>
      <div className="flex gap-2">
        <input
          aria-label="Assigned staff id"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          disabled={busy}
          placeholder="user id"
          className="h-10 flex-1 rounded-lg border border-line bg-cream px-3 text-sm focus:border-purple focus:outline-none"
        />
        <button
          type="button"
          onClick={apply}
          disabled={busy}
          className="h-10 shrink-0 rounded-lg border border-purple px-4 text-sm font-medium text-purple hover:bg-purple hover:text-white disabled:opacity-40"
        >
          Save
        </button>
      </div>
      {error !== null && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function AddNote({ leadId, onDone }: { leadId: string; onDone: (lead: AdminLead) => void }) {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const note = body.trim();
    if (note === '') return;
    setBusy(true);
    setError(null);
    void updateLead(leadId, { note })
      .then((updated) => {
        setBody('');
        onDone(updated);
      })
      .catch((err: unknown) => {
        setError(errMessage(err));
      })
      .finally(() => {
        setBusy(false);
      });
  }

  return (
    <form onSubmit={submit} className="mt-4">
      <textarea
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
        }}
        rows={2}
        maxLength={2000}
        placeholder="Add a note…"
        className="w-full rounded-lg border border-line bg-cream px-3 py-2 text-sm focus:border-purple focus:outline-none"
      />
      {error !== null && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy || body.trim() === ''}
        className="mt-2 h-9 rounded-lg bg-purple px-4 text-sm font-medium text-white hover:bg-purple-dark disabled:opacity-40"
      >
        {busy ? 'Adding…' : 'Add note'}
      </button>
    </form>
  );
}
