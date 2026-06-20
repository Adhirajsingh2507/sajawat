'use client';

/**
 * Minimal data-fetching hook (Milestone 1.7) — runs `fn` on mount and whenever
 * `deps` change, exposing { data, loading, error }. State is set only inside the
 * resolved/rejected promise callbacks (not synchronously in the effect body).
 * Stale data is kept during a refetch (no flicker). A `reload` token can be
 * threaded through `deps` to force a refetch after a mutation.
 */
import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsync<T>(fn: () => Promise<T>, deps: readonly unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    fn()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (active) {
          setState({
            data: null,
            loading: false,
            error: err instanceof ApiError ? err.message : 'Something went wrong',
          });
        }
      });
    return () => {
      active = false;
    };
    // fn is recreated each render; deps drive refetching intentionally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
