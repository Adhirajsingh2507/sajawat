'use client';

import { useSyncExternalStore } from 'react';

/**
 * Tracks the viewer's `prefers-reduced-motion: reduce` setting (WCAG 2.2.2 —
 * Pause, Stop, Hide). Auto-advancing motion (carousels, rotating banners) must
 * pause when this returns true. Implemented with `useSyncExternalStore` so it
 * subscribes to the media query directly (no setState-in-effect) and is
 * SSR-safe: the server snapshot is `false` (assume motion is fine).
 */
const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(callback: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', callback);
  return () => {
    mq.removeEventListener('change', callback);
  };
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
