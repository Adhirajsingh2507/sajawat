'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';

/**
 * Thin promo bar above the header — rotates a few short messages. Purely
 * presentational; messages are static for now (settings-driven later). The
 * rotation pauses under `prefers-reduced-motion` (WCAG 2.2.2), showing the
 * first message statically.
 */
const MESSAGES = [
  'Free shipping on orders over ₹1,499',
  'The Bridal Edit is here — shop wedding-season sets',
  'New arrivals just dropped ✦ explore the collection',
];

export function AnnouncementBar() {
  const [i, setI] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      setI((v) => (v + 1) % MESSAGES.length);
    }, 4000);
    return () => {
      clearInterval(id);
    };
  }, [reducedMotion]);

  return (
    <div className="bg-purple-dark text-white">
      <div className="mx-auto flex h-9 max-w-[1600px] items-center justify-center px-5 text-center">
        <p key={i} className="animate-fade-in text-xs tracking-wide text-white/90">
          {MESSAGES[i]}
        </p>
      </div>
    </div>
  );
}
