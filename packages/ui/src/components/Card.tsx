/**
 * Card + Badge (Milestone 1.4a) — clean, low-shadow surfaces (the brand avoids
 * heavy shadows). Badge is used for "Best Seller" / "New Arrival".
 */
import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('overflow-hidden rounded-xl border border-line bg-white', className)}
      {...props}
    />
  );
}

export type BadgeTone = 'gold' | 'purple' | 'neutral';

const tones: Record<BadgeTone, string> = {
  gold: 'bg-gold-soft text-gold-dark',
  purple: 'bg-purple text-white',
  neutral: 'bg-mist text-ink-soft',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'gold', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
