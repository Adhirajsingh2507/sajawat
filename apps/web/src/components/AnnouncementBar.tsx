'use client';

import { useEffect, useState } from 'react';

/**
 * Thin promo bar above the header — rotates a few short messages. Purely
 * presentational; messages are static for now (settings-driven later).
 */
const MESSAGES = [
  'Free shipping on orders over ₹1,499',
  'The Bridal Edit is here — shop wedding-season sets',
  'New arrivals just dropped ✦ explore the collection',
];

export function AnnouncementBar() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setI((v) => (v + 1) % MESSAGES.length);
    }, 4000);
    return () => {
      clearInterval(id);
    };
  }, []);

  return (
    <div className="bg-purple-dark text-white">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-center px-5 text-center">
        <p key={i} className="animate-fade-in text-xs tracking-wide text-white/90">
          {MESSAGES[i]}
        </p>
      </div>
    </div>
  );
}
