/**
 * Input + Label (Milestone 1.4a) — accessible form field with a luxury-neutral
 * style and gold focus ring.
 */
import type { InputHTMLAttributes, LabelHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('mb-1.5 block text-sm font-medium text-ink-soft', className)} {...props} />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-ink',
        'placeholder:text-ink-faint focus:border-purple focus:outline-none focus:ring-2',
        'focus:ring-purple/20 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
