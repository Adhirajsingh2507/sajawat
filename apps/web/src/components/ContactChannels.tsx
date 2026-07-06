/**
 * Contact channels (Contact page) — presentational. Renders admin-configured
 * business info (WhatsApp / email / hours / address) + social links from
 * `PublicSettings`, with graceful fallbacks. Inline SVG icons (brand rule:
 * SVG, never emoji); gold accents on cream, per the brand system.
 */
import type { PublicSettings } from '@sajawat/types';

/** Strip non-digits for a wa.me deep link. */
function waLink(number: string): string {
  return `https://wa.me/${number.replace(/[^0-9]/g, '')}`;
}

function ChannelRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple/10 text-purple">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs uppercase tracking-wider text-ink-faint">{label}</span>
        <span className="block text-sm text-ink">{children}</span>
      </span>
    </li>
  );
}

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

export function ContactChannels({ info }: { info: PublicSettings }) {
  const whatsapp = info.whatsappNumber?.trim();
  const email = info.supportEmail?.trim();
  const socials: { href: string; label: string; path: React.ReactNode }[] = [];
  if (info.instagramUrl)
    socials.push({
      href: info.instagramUrl,
      label: 'Instagram',
      path: (
        <>
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
        </>
      ),
    });
  if (info.facebookUrl)
    socials.push({
      href: info.facebookUrl,
      label: 'Facebook',
      path: (
        <path d="M14 9h3V6h-3a3 3 0 0 0-3 3v2H8v3h3v7h3v-7h2.5l.5-3H14V9.5a.5.5 0 0 1 .5-.5Z" />
      ),
    });
  if (info.youtubeUrl)
    socials.push({
      href: info.youtubeUrl,
      label: 'YouTube',
      path: (
        <>
          <rect x="2" y="6" width="20" height="12" rx="3" />
          <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
        </>
      ),
    });

  return (
    <div className="rounded-2xl border border-line bg-cream p-6 sm:p-8">
      <h2 className="font-serif text-xl text-ink">Reach us directly</h2>
      <p className="mt-1 text-sm text-ink-soft">We reply within one business day.</p>

      <ul className="mt-6 space-y-5">
        {whatsapp !== undefined && whatsapp.length > 0 && (
          <ChannelRow
            label="WhatsApp"
            icon={
              <svg {...iconProps}>
                <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.2-5.3A8.5 8.5 0 1 1 21 11.5Z" />
                <path d="M8.5 9c.3 2 1.7 3.7 3.6 4.7l1-1.2 2 .8v1.8c-2.9.4-6.6-2.2-7.4-5.2L9.5 8Z" />
              </svg>
            }
          >
            <a
              href={waLink(whatsapp)}
              className="hover:text-purple"
              target="_blank"
              rel="noreferrer"
            >
              {whatsapp}
            </a>
          </ChannelRow>
        )}
        {email !== undefined && email.length > 0 && (
          <ChannelRow
            label="Email"
            icon={
              <svg {...iconProps}>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m4 7 8 6 8-6" />
              </svg>
            }
          >
            <a href={`mailto:${email}`} className="hover:text-purple">
              {email}
            </a>
          </ChannelRow>
        )}
        {info.addressText !== undefined && info.addressText.length > 0 && (
          <ChannelRow
            label="Visit us"
            icon={
              <svg {...iconProps}>
                <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10Z" />
                <circle cx="12" cy="11" r="2" />
              </svg>
            }
          >
            {info.addressText}
          </ChannelRow>
        )}
        {info.businessHours !== undefined && info.businessHours.length > 0 && (
          <ChannelRow
            label="Hours"
            icon={
              <svg {...iconProps}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            }
          >
            {info.businessHours}
          </ChannelRow>
        )}
      </ul>

      {socials.length > 0 && (
        <div className="mt-7 border-t border-line pt-5">
          <span className="text-xs uppercase tracking-wider text-ink-faint">Follow us</span>
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
      )}
    </div>
  );
}
