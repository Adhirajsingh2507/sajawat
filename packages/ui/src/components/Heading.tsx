/**
 * Heading (Milestone 1.4a) — serif display type (Playfair) for an elegant,
 * premium voice. `eyebrow` renders the small gold kicker used above section
 * titles in the luxury layout.
 */
import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export type HeadingLevel = 1 | 2 | 3;

const sizes: Record<HeadingLevel, string> = {
  1: 'text-4xl sm:text-5xl lg:text-6xl',
  2: 'text-3xl sm:text-4xl',
  3: 'text-xl sm:text-2xl',
};

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
}

export function Heading({ level = 2, className, children, ...props }: HeadingProps) {
  const Tag = `h${String(level)}` as 'h1' | 'h2' | 'h3';
  return (
    <Tag
      className={cn(
        'font-serif font-semibold leading-tight tracking-tight text-ink',
        sizes[level],
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function Eyebrow({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'mb-3 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark',
        className,
      )}
      {...props}
    />
  );
}
