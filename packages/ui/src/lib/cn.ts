/**
 * Tiny class-name joiner (Milestone 1.4a) — joins truthy class fragments with a
 * space. Dependency-free; sufficient for our component variants.
 */
export type ClassValue = string | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter((v): v is string => typeof v === 'string' && v.length > 0).join(' ');
}
