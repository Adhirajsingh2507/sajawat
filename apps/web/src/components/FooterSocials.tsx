'use client';

/**
 * Footer social icons — Instagram / Facebook / WhatsApp, wired to the
 * admin-configured public settings (blank links are hidden). Brand rule: inline
 * SVG, never emoji.
 */
import { useAsync } from '@/lib/use-async';
import { getContactInfo } from '@/services/contact';

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function waLink(number: string): string {
  return `https://wa.me/${number.replace(/[^0-9]/g, '')}`;
}

export function FooterSocials() {
  const { data } = useAsync(() => getContactInfo(), []);
  const whatsapp = data?.whatsappNumber?.trim();

  const socials: { href: string; label: string; path: React.ReactNode }[] = [];
  if (data?.instagramUrl)
    socials.push({
      href: data.instagramUrl,
      label: 'Instagram',
      path: (
        <>
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
        </>
      ),
    });
  if (data?.facebookUrl)
    socials.push({
      href: data.facebookUrl,
      label: 'Facebook',
      path: (
        <path d="M14 9h3V6h-3a3 3 0 0 0-3 3v2H8v3h3v7h3v-7h2.5l.5-3H14V9.5a.5.5 0 0 1 .5-.5Z" />
      ),
    });
  if (whatsapp !== undefined && whatsapp.length > 0)
    socials.push({
      href: waLink(whatsapp),
      label: 'WhatsApp',
      path: (
        <>
          <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.2-5.3A8.5 8.5 0 1 1 21 11.5Z" />
          <path d="M8.5 9c.3 2 1.7 3.7 3.6 4.7l1-1.2 2 .8v1.8c-2.9.4-6.6-2.2-7.4-5.2L9.5 8Z" />
        </>
      ),
    });

  if (socials.length === 0) return null;

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Connect</h2>
      <div className="mt-3 flex gap-3">
        {socials.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noreferrer"
            aria-label={s.label}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-gold hover:text-gold"
          >
            <svg {...iconProps}>{s.path}</svg>
          </a>
        ))}
      </div>
    </div>
  );
}
