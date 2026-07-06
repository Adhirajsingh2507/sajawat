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
  const [instagramUrl, setInstagramUrl] = useState(initial.instagramUrl ?? '');
  const [facebookUrl, setFacebookUrl] = useState(initial.facebookUrl ?? '');
  const [youtubeUrl, setYoutubeUrl] = useState(initial.youtubeUrl ?? '');
  const [addressText, setAddressText] = useState(initial.addressText ?? '');
  const [businessHours, setBusinessHours] = useState(initial.businessHours ?? '');
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
      instagramUrl: instagramUrl.trim(),
      facebookUrl: facebookUrl.trim(),
      youtubeUrl: youtubeUrl.trim(),
      addressText: addressText.trim(),
      businessHours: businessHours.trim(),
    })
      .then((next) => {
        setBusinessName(next.businessName ?? '');
        setSupportEmail(next.supportEmail ?? '');
        setWhatsapp(next.adminWhatsappNumber ?? '');
        setInstagramUrl(next.instagramUrl ?? '');
        setFacebookUrl(next.facebookUrl ?? '');
        setYoutubeUrl(next.youtubeUrl ?? '');
        setAddressText(next.addressText ?? '');
        setBusinessHours(next.businessHours ?? '');
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
            Receives instant WhatsApp alerts for new B2B enquiries. Also shown as the WhatsApp
            contact on the storefront Contact page. E.164 format; blank to disable.
          </p>
        </div>

        <div className="border-t border-line pt-4">
          <h2 className="font-serif text-base font-semibold text-ink">Storefront contact page</h2>
          <p className="mb-3 text-xs text-ink-faint">
            Public business info shown on the storefront Contact page.
          </p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="addressText">Address</Label>
              <Input
                id="addressText"
                value={addressText}
                onChange={(e) => {
                  setAddressText(e.target.value);
                }}
                placeholder="Shop 12, Jewellers Lane, Jaipur, Rajasthan 302001"
              />
            </div>
            <div>
              <Label htmlFor="businessHours">Business hours</Label>
              <Input
                id="businessHours"
                value={businessHours}
                onChange={(e) => {
                  setBusinessHours(e.target.value);
                }}
                placeholder="Mon–Sat, 10am–8pm"
              />
            </div>
            <div>
              <Label htmlFor="instagramUrl">Instagram URL</Label>
              <Input
                id="instagramUrl"
                type="url"
                value={instagramUrl}
                onChange={(e) => {
                  setInstagramUrl(e.target.value);
                }}
                placeholder="https://instagram.com/sajawat"
              />
            </div>
            <div>
              <Label htmlFor="facebookUrl">Facebook URL</Label>
              <Input
                id="facebookUrl"
                type="url"
                value={facebookUrl}
                onChange={(e) => {
                  setFacebookUrl(e.target.value);
                }}
                placeholder="https://facebook.com/sajawat"
              />
            </div>
            <div>
              <Label htmlFor="youtubeUrl">YouTube URL</Label>
              <Input
                id="youtubeUrl"
                type="url"
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value);
                }}
                placeholder="https://youtube.com/@sajawat"
              />
            </div>
          </div>
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
