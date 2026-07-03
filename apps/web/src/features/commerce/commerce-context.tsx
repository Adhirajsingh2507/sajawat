'use client';

/**
 * Commerce context (Milestone 1.4c) — shared cart + wishlist state for the
 * storefront. Server-authoritative: every mutation calls the API and replaces
 * local state with the returned DTO (no optimistic UI, no client-side totals).
 * Bootstraps once the auth session is `authenticated`; clears on sign-out.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { PublicCart, PublicWishlist } from '@sajawat/types';
import { useAuth } from '@/features/auth/auth-context';
import * as commerce from '@/services/commerce';
import { ApiError } from '@/lib/api';

interface CartContextValue {
  cart: PublicCart | null;
  loading: boolean;
  /** A cart mutation is in flight (disable buttons / show spinners). */
  mutating: boolean;
  itemCount: number;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  /** Replace cart state directly (e.g. emptied after a successful checkout). */
  setCart: (cart: PublicCart) => void;
  /** Slide-in cart drawer visibility (UI-only). */
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

interface WishlistContextValue {
  wishlist: PublicWishlist | null;
  loading: boolean;
  mutating: boolean;
  count: number;
  has: (productId: string) => boolean;
  add: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  toggle: (productId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);
const WishlistContext = createContext<WishlistContextValue | null>(null);

export function CommerceProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  const [cart, setCartState] = useState<PublicCart | null>(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartMutating, setCartMutating] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);

  const [wishlist, setWishlistState] = useState<PublicWishlist | null>(null);
  const [wishLoading, setWishLoading] = useState(true);
  const [wishMutating, setWishMutating] = useState(false);

  // Bootstrap (and tear down) commerce state alongside the auth session. State is
  // set only after awaited network calls; the sign-out teardown is a legitimate
  // external-system sync (the session ended), hence the scoped lint exception.
  useEffect(() => {
    if (status !== 'authenticated') {
      if (status === 'unauthenticated') {
        /* eslint-disable react-hooks/set-state-in-effect */
        setCartState(null);
        setWishlistState(null);
        setCartLoading(false);
        setWishLoading(false);
        /* eslint-enable react-hooks/set-state-in-effect */
      }
      return;
    }
    let active = true;
    void commerce
      .getCart()
      .then((c) => {
        if (active) setCartState(c);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setCartLoading(false);
      });
    void commerce
      .getWishlist()
      .then((w) => {
        if (active) setWishlistState(w);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setWishLoading(false);
      });
    return () => {
      active = false;
    };
  }, [status]);

  /* -------------------------------- Cart api ------------------------------- */

  const runCart = useCallback(async (op: () => Promise<PublicCart>) => {
    setCartMutating(true);
    try {
      setCartState(await op());
    } finally {
      setCartMutating(false);
    }
  }, []);

  const addItem = useCallback(
    (productId: string, quantity = 1) => runCart(() => commerce.addCartItem(productId, quantity)),
    [runCart],
  );
  const updateItem = useCallback(
    (productId: string, quantity: number) =>
      runCart(() => commerce.updateCartItem(productId, quantity)),
    [runCart],
  );
  const removeItem = useCallback(
    (productId: string) => runCart(() => commerce.removeCartItem(productId)),
    [runCart],
  );
  const applyCoupon = useCallback(
    (code: string) => runCart(() => commerce.applyCoupon(code)),
    [runCart],
  );
  const removeCoupon = useCallback(() => runCart(() => commerce.removeCoupon()), [runCart]);
  const setCart = useCallback((next: PublicCart) => {
    setCartState(next);
  }, []);
  const openCart = useCallback(() => {
    setCartOpen(true);
  }, []);
  const closeCart = useCallback(() => {
    setCartOpen(false);
  }, []);

  const cartValue = useMemo<CartContextValue>(
    () => ({
      cart,
      loading: cartLoading,
      mutating: cartMutating,
      itemCount: cart?.itemCount ?? 0,
      addItem,
      updateItem,
      removeItem,
      applyCoupon,
      removeCoupon,
      setCart,
      isCartOpen,
      openCart,
      closeCart,
    }),
    [
      cart,
      cartLoading,
      cartMutating,
      addItem,
      updateItem,
      removeItem,
      applyCoupon,
      removeCoupon,
      setCart,
      isCartOpen,
      openCart,
      closeCart,
    ],
  );

  /* ------------------------------ Wishlist api ----------------------------- */

  const runWish = useCallback(async (op: () => Promise<PublicWishlist>) => {
    setWishMutating(true);
    try {
      setWishlistState(await op());
    } finally {
      setWishMutating(false);
    }
  }, []);

  const wishIds = useMemo(() => new Set((wishlist?.items ?? []).map((p) => p.id)), [wishlist]);
  const has = useCallback((productId: string) => wishIds.has(productId), [wishIds]);
  const add = useCallback(
    (productId: string) => runWish(() => commerce.addWishlistItem(productId)),
    [runWish],
  );
  const remove = useCallback(
    (productId: string) => runWish(() => commerce.removeWishlistItem(productId)),
    [runWish],
  );
  const toggle = useCallback(
    (productId: string) =>
      wishIds.has(productId)
        ? runWish(() => commerce.removeWishlistItem(productId))
        : runWish(() => commerce.addWishlistItem(productId)),
    [runWish, wishIds],
  );

  const wishlistValue = useMemo<WishlistContextValue>(
    () => ({
      wishlist,
      loading: wishLoading,
      mutating: wishMutating,
      count: wishlist?.items.length ?? 0,
      has,
      add,
      remove,
      toggle,
    }),
    [wishlist, wishLoading, wishMutating, has, add, remove, toggle],
  );

  return (
    <CartContext.Provider value={cartValue}>
      <WishlistContext.Provider value={wishlistValue}>{children}</WishlistContext.Provider>
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (ctx === null) throw new Error('useCart must be used within <CommerceProvider>');
  return ctx;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (ctx === null) throw new Error('useWishlist must be used within <CommerceProvider>');
  return ctx;
}

/** Narrow an unknown error to a user-facing message (shared by commerce UIs). */
export function commerceErrorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Something went wrong';
}
