/**
 * Reusable animated marquee (PR-2). Scrolls a repeating row of short messages,
 * separated by a gold diamond. Two identical halves + a -50% translate give a
 * seamless loop; it pauses on hover and stops entirely under
 * `prefers-reduced-motion` (handled in globals.css). `dark` sits on purple
 * (top offer bar); `light` sits on cream (mid-page bands, e.g. "SALE IS LIVE").
 */
type Variant = 'dark' | 'light';

const STYLES: Record<Variant, { wrap: string; text: string; diamond: string }> = {
  dark: {
    wrap: 'bg-purple-dark text-white',
    text: 'text-white/90',
    diamond: 'text-gold',
  },
  light: {
    wrap: 'border-y border-gold/25 bg-cream text-ink',
    text: 'text-ink',
    diamond: 'text-gold',
  },
};

function Diamond({ className }: { className: string }) {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 10 10"
      aria-hidden
      className={`mx-5 shrink-0 ${className}`}
    >
      <path d="M5 0 10 5 5 10 0 5Z" fill="currentColor" />
    </svg>
  );
}

export function Marquee({
  items,
  variant = 'dark',
  className = '',
  itemClassName = '',
  ariaLabel = 'Announcements',
}: {
  items: string[];
  variant?: Variant;
  className?: string;
  itemClassName?: string;
  ariaLabel?: string;
}) {
  const s = STYLES[variant];
  // Repeat enough to overflow even a short list, then render the half twice.
  const half = Array.from({ length: Math.max(1, Math.ceil(8 / items.length)) }, () => items).flat();

  return (
    <div
      className={`marquee-pause overflow-hidden ${s.wrap} ${className}`}
      role="marquee"
      aria-label={ariaLabel}
    >
      <div className="animate-marquee flex w-max whitespace-nowrap py-2.5">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
            {half.map((msg, i) => (
              <span key={`${String(copy)}-${String(i)}`} className="flex items-center">
                <Diamond className={s.diamond} />
                <span
                  className={`text-[11px] uppercase tracking-[0.22em] ${s.text} ${itemClassName}`}
                >
                  {msg}
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
