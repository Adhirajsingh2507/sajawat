'use client';

/**
 * Wholesale enquiry (Milestone 1.8b) — the B2B lead funnel. Gated (D17), so the
 * submitter is a signed-in storefront user. On success the server has saved the
 * lead and alerted the team; we show a confirmation. This is NOT a checkout —
 * staff follow up manually.
 */
import { useState } from 'react';
import { Button, Container, Heading, Input, Label } from '@sajawat/ui';
import type { EnquiryRequest } from '@sajawat/types';
import { ApiError } from '@/lib/api';
import { submitEnquiry } from '@/services/enquiry';

const EMPTY = {
  name: '',
  company: '',
  phone: '',
  email: '',
  city: '',
  gst: '',
  quantity: '',
  productInterest: '',
  message: '',
};

export default function WholesalePage() {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function field(key: keyof typeof EMPTY) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload: EnquiryRequest = {
      name: form.name.trim(),
      company: form.company.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      city: form.city.trim(),
    };
    if (form.gst.trim() !== '') payload.gst = form.gst.trim();
    if (form.quantity.trim() !== '') payload.quantity = Number(form.quantity);
    if (form.productInterest.trim() !== '') payload.productInterest = form.productInterest.trim();
    if (form.message.trim() !== '') payload.message = form.message.trim();

    void submitEnquiry(payload)
      .then(() => {
        setDone(true);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Could not send your enquiry.');
        setSubmitting(false);
      });
  }

  if (done) {
    return (
      <Container className="py-20 text-center">
        <Heading level={1} className="text-3xl">
          Thank you — we&apos;ve received your enquiry
        </Heading>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-soft">
          Our wholesale team will reach out shortly to discuss bulk pricing and availability.
        </p>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-2xl">
        <Heading level={1} className="text-3xl">
          Wholesale enquiry
        </Heading>
        <p className="mt-2 text-sm text-ink-soft">
          Buying in bulk? Share a few details and our team will get back to you with trade pricing.
        </p>

        <form onSubmit={onSubmit} className="mt-8 grid gap-4 sm:grid-cols-2" noValidate>
          <div>
            <Label htmlFor="name">Your name</Label>
            <Input id="name" value={form.name} onChange={field('name')} required />
          </div>
          <div>
            <Label htmlFor="company">Company</Label>
            <Input id="company" value={form.company} onChange={field('company')} required />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" value={form.phone} onChange={field('phone')} required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={field('email')} required />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" value={form.city} onChange={field('city')} required />
          </div>
          <div>
            <Label htmlFor="gst">GST number (optional)</Label>
            <Input id="gst" value={form.gst} onChange={field('gst')} />
          </div>
          <div>
            <Label htmlFor="quantity">Approx. quantity (optional)</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={form.quantity}
              onChange={field('quantity')}
            />
          </div>
          <div>
            <Label htmlFor="productInterest">Product interest (optional)</Label>
            <Input
              id="productInterest"
              value={form.productInterest}
              onChange={field('productInterest')}
              placeholder="e.g. bridal sets, festive necklaces"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="message">Message (optional)</Label>
            <textarea
              id="message"
              value={form.message}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, message: e.target.value }));
              }}
              rows={4}
              maxLength={2000}
              className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20"
            />
          </div>

          {error !== null && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}

          <div className="sm:col-span-2">
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send enquiry'}
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}
