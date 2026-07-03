/**
 * Slug utilities (Milestone 1.3).
 *
 * `slugify` produces a URL-safe lowercase slug; `ensureUniqueSlug` appends a
 * numeric suffix until an existence check passes, so catalog entities get a
 * stable unique slug without violating the unique index.
 */

/** Convert arbitrary text to a lowercase, hyphenated, URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+)|(-+$)/g, '');
}

/**
 * Return the first slug derived from `base` that is not already taken.
 * `exists` should check across ALL rows (including soft-deleted) since the
 * unique index spans them.
 */
export async function ensureUniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const root = base.length > 0 ? base : 'item';
  let candidate = root;
  let suffix = 1;
  while (await exists(candidate)) {
    suffix += 1;
    candidate = `${root}-${String(suffix)}`;
  }
  return candidate;
}
