'use client';

/**
 * Quick-view context — lets any ProductCard open a lightweight product modal
 * without navigating. Holds the full PublicProduct (cards already have it), so
 * no extra fetch is needed.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { PublicProduct } from '@sajawat/types';

interface QuickViewValue {
  product: PublicProduct | null;
  open: (product: PublicProduct) => void;
  close: () => void;
}

const QuickViewContext = createContext<QuickViewValue | null>(null);

export function QuickViewProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<PublicProduct | null>(null);

  const open = useCallback((p: PublicProduct) => {
    setProduct(p);
  }, []);
  const close = useCallback(() => {
    setProduct(null);
  }, []);

  const value = useMemo<QuickViewValue>(() => ({ product, open, close }), [product, open, close]);

  return <QuickViewContext.Provider value={value}>{children}</QuickViewContext.Provider>;
}

export function useQuickView(): QuickViewValue {
  const ctx = useContext(QuickViewContext);
  if (ctx === null) throw new Error('useQuickView must be used within <QuickViewProvider>');
  return ctx;
}
