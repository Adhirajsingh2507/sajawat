/**
 * Layout primitives (Milestone 1.4a) — Container (max-width gutter) and Section
 * (generous vertical rhythm per the brand's "large spacing / white space" rule).
 */
import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-[1600px] px-5 sm:px-8', className)} {...props} />;
}

export function Section({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn('py-14 sm:py-20', className)} {...props} />;
}
