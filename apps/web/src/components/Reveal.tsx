'use client';

/**
 * Scroll-reveal wrapper (PR-5). Fades + slides its children up the first time
 * they enter the viewport (IntersectionObserver). Respects
 * `prefers-reduced-motion` (shows immediately, no motion). Lightweight — no
 * animation library.
 */
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';

export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const shown = reduced || seen;

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (el === null) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting === true) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
    };
  }, [reduced]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      } ${className}`}
      style={delay > 0 ? { transitionDelay: `${String(delay)}ms` } : undefined}
    >
      {children}
    </div>
  );
}
