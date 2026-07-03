/**
 * Button (Milestone 1.4a) — brand-driven. Primary = Royal Purple with a Luxury
 * Gold focus ring; secondary = purple outline (per brand guidelines). Renders an
 * <a>-styled button when `asChild` is not used; for links use the `buttonClass`
 * export with next/link.
 */
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide ' +
  'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-gold focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-purple text-white hover:bg-purple-dark',
  secondary: 'border border-purple text-purple hover:bg-purple hover:text-white',
  ghost: 'text-purple hover:bg-purple/5',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-sm',
  lg: 'h-13 px-8 text-base',
};

export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}
