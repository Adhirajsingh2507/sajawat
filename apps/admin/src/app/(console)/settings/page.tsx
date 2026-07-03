'use client';

/**
 * Business settings (Milestone 1.8b) — SETTINGS_MANAGE (super admin). Edits the
 * settings singleton, notably the admin WhatsApp number that receives instant
 * B2B lead alerts. Server-authoritative: the form re-seeds from the saved DTO.
 */
import { useState } from 'react';
import { Button, Input, Label } from '@sajawat/ui';
import type { AdminSettings } from '@sajawat/types';
import { useAsync } from '@/lib/use-async';
import { getSettings, updateSettings } from '@/services/settings';
import { ApiError } from '@/lib/api';
import { PageHeader, Card } from '@/features/console/ui';

export default function SettingsPage() {
  const { data, loading, error } = useAsync(() => getSettings(), []);

  if (data === null) {
    return (
      <div>
        <PageHeader title="Settings" />
        <p className="text-sm text-ink-soft">{loading ? 'Loading…' : (error ?? 'Unavailable.')}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" description="Business configuration." />
      <SettingsForm initial={data} />
    </div>
  );
}

function SettingsForm({ initial }: { initial: AdminSettings }) {
  const [businessName, setBusinessName] = useState(initial.businessName ?? '');
  const [supportEmail, setSupportEmail] = useState(initial.supportEmail ?? '');
  const [whatsapp, setWhatsapp] = useState(initial.adminWhatsappNumber ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    void updateSettings({
      businessName: businessName.trim(),
      supportEmail: supportEmail.trim(),
      adminWhatsappNumber: whatsapp.trim(),
    })
      .then((next) => {
        setBusinessName(next.businessName ?? '');
        setSupportEmail(next.supportEmail ?? '');
        setWhatsapp(next.adminWhatsappNumber ?? '');
        setSaved(true);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Could not save settings.');
      })
      .finally(() => {
        setBusy(false);
      });
  }

  return (
    <Card className="max-w-xl">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="businessName">Business name</Label>
          <Input
            id="businessName"
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value);
            }}
          />
        </div>
        <div>
          <Label htmlFor="supportEmail">Support email</Label>
          <Input
            id="supportEmail"
            type="email"
            value={supportEmail}
            onChange={(e) => {
              setSupportEmail(e.target.value);
            }}
          />
        </div>
        <div>
          <Label htmlFor="whatsapp">Admin WhatsApp number</Label>
          <Input
            id="whatsapp"
            value={whatsapp}
            onChange={(e) => {
              setWhatsapp(e.target.value);
            }}
            placeholder="+919876543210"
          />
          <p className="mt-1 text-xs text-ink-faint">
            Receives instant WhatsApp alerts for new B2B enquiries. E.164 format; blank to disable.
          </p>
        </div>
        {error !== null && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-700">Settings saved.</p>}
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save settings'}
        </Button>
      </form>
    </Card>
  );
}
