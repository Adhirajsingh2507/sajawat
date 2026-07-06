'use client';

/**
 * Contact page (Tier A UI/UX). Purpose: a trustworthy, low-friction support
 * channel — send a message (persisted as a b2c/contact CRM lead) or reach us
 * directly (WhatsApp/email/socials, admin-configured via public settings).
 * Login-gated (D17) like the rest of the storefront.
 */
import { Container, Heading } from '@sajawat/ui';
import type { PublicSettings } from '@sajawat/types';
import { useAsync } from '@/lib/use-async';
import { getContactInfo } from '@/services/contact';
import { ContactForm } from '@/components/ContactForm';
import { ContactChannels } from '@/components/ContactChannels';

export default function ContactPage() {
  const { data } = useAsync(() => getContactInfo(), []);
  const info: PublicSettings = data ?? {};

  return (
    <Container className="py-12 sm:py-16">
      <div className="animate-fade-in mx-auto max-w-2xl text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">We&apos;re here for you</p>
        <Heading level={1} className="mt-2 text-3xl sm:text-4xl">
          Get in touch
        </Heading>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-soft">
          Whether it&apos;s a question about a piece, help with an order, or a bespoke request — our
          team would love to hear from you.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-[1.15fr_1fr]">
        <ContactForm />
        <ContactChannels info={info} />
      </div>
    </Container>
  );
}
