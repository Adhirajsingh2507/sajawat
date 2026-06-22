'use client';

/**
 * Checkout (Milestone 1.4c) — shipping address + payment method against the
 * server-authoritative cart. COD is the live path; the Razorpay online path is
 * wired but dormant (backend 501s until keys are configured), so we degrade to a
 * clear message and keep COD selectable. Totals come from the cart DTO.
 */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Container, Input, Label } from '@sajawat/ui';
import type { OrderAddress, PaymentMethod, PublicCart } from '@sajawat/types';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/features/auth/auth-context';
import { commerceErrorMessage, useCart } from '@/features/commerce/commerce-context';
import { checkoutCod, checkoutOnline, verifyPayment } from '@/services/commerce';
import { openRazorpayCheckout } from '@/features/commerce/razorpay';
import { formatPrice } from '@/lib/format';

const EMPTY_CART: PublicCart = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  discount: 0,
  total: 0,
  appliedPromotion: null,
};

const EMPTY_ADDRESS: OrderAddress = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, loading, setCart } = useCart();

  const [address, setAddress] = useState<OrderAddress>(() => ({
    ...EMPTY_ADDRESS,
    fullName: user !== null ? `${user.firstName} ${user.lastName}`.trim() : '',
  }));
  const [notes, setNotes] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cod');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prefill = useMemo(
    () => ({
      name: address.fullName,
      email: user?.email,
      contact: address.phone,
    }),
    [address.fullName, address.phone, user?.email],
  );

  function field(key: keyof OrderAddress) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setAddress((prev) => ({ ...prev, [key]: e.target.value }));
    };
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (cart === null || cart.items.length === 0) return;
    setSubmitting(true);
    setError(null);
    const payload = { address, notes: notes.trim() === '' ? undefined : notes.trim() };
    try {
      if (method === 'cod') {
        const order = await checkoutCod(payload);
        setCart(EMPTY_CART);
        router.replace(`/account/orders/${order.id}?placed=1`);
        return;
      }
      // Online (Razorpay) — wired but dormant.
      const { order, payment } = await checkoutOnline(payload);
      const verifyInput = await openRazorpayCheckout(payment, prefill);
      const verified = await verifyPayment(verifyInput);
      setCart(EMPTY_CART);
      router.replace(`/account/orders/${verified.id}?placed=1`);
      void order;
    } catch (err) {
      // Online path is not enabled yet → guide the shopper to COD.
      if (method === 'online' && err instanceof ApiError && err.status === 501) {
        setError('Online payment isn’t available yet. Please choose Cash on Delivery.');
        setMethod('cod');
      } else {
        setError(commerceErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && cart === null) {
    return (
      <Container className="py-20">
        <p className="text-center text-sm text-ink-soft">Loading…</p>
      </Container>
    );
  }

  if (cart === null || cart.items.length === 0) {
    return (
      <Container className="py-20 text-center">
        <h1 className="font-serif text-3xl font-semibold text-ink">Your cart is empty</h1>
        <Link
          href="/products"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-purple px-6 text-sm font-medium text-white hover:bg-purple-dark"
        >
          Shop all jewellery
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <h1 className="font-serif text-3xl font-semibold text-ink">Checkout</h1>
      <form onSubmit={placeOrder} className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <section>
            <h2 className="font-serif text-lg font-semibold text-ink">Shipping address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Full name"
                value={address.fullName}
                onChange={field('fullName')}
                required
              />
              <Field label="Phone" value={address.phone} onChange={field('phone')} required />
              <div className="sm:col-span-2">
                <Field
                  label="Address line 1"
                  value={address.line1}
                  onChange={field('line1')}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Address line 2 (optional)"
                  value={address.line2 ?? ''}
                  onChange={field('line2')}
                />
              </div>
              <Field label="City" value={address.city} onChange={field('city')} required />
              <Field label="State" value={address.state} onChange={field('state')} required />
              <Field
                label="Postal code"
                value={address.postalCode}
                onChange={field('postalCode')}
                required
              />
              <Field label="Country" value={address.country} onChange={field('country')} required />
            </div>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-ink">Order notes (optional)</h2>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
              }}
              rows={3}
              maxLength={1000}
              placeholder="Delivery instructions, gift message…"
              className="mt-3 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm focus:border-purple focus:outline-none"
            />
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-ink">Payment method</h2>
            <div className="mt-4 space-y-3">
              <PaymentOption
                label="Cash on Delivery"
                description="Pay in cash when your order arrives."
                checked={method === 'cod'}
                onSelect={() => {
                  setMethod('cod');
                }}
              />
              <PaymentOption
                label="Pay online (UPI / Card)"
                description="Secure payment via Razorpay. Coming soon."
                checked={method === 'online'}
                onSelect={() => {
                  setMethod('online');
                }}
              />
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-line bg-white p-6">
          <h2 className="font-serif text-lg font-semibold text-ink">Your order</h2>
          <ul className="mt-4 space-y-3">
            {cart.items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 text-ink-soft">
                  {item.name}
                  <span className="text-ink-faint"> × {item.quantity}</span>
                </span>
                <span className="shrink-0 text-ink">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-ink-soft">
              <dt>Subtotal</dt>
              <dd>{formatPrice(cart.subtotal)}</dd>
            </div>
            {cart.discount > 0 && (
              <div className="flex justify-between text-purple">
                <dt>{cart.appliedPromotion?.label ?? 'Discount'}</dt>
                <dd>−{formatPrice(cart.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-ink">
              <dt>Total</dt>
              <dd>{formatPrice(cart.total)}</dd>
            </div>
          </dl>

          {error !== null && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={submitting} className="mt-5 w-full">
            {submitting ? 'Placing order…' : 'Place order'}
          </Button>
          <p className="mt-3 text-center text-xs text-ink-faint">
            By placing your order you agree to our terms.
          </p>
        </aside>
      </form>
    </Container>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  // Associate the label with the input (accessibility + testability).
  const id = `chk-${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={onChange} required={required} className="mt-1.5" />
    </div>
  );
}

function PaymentOption({
  label,
  description,
  checked,
  onSelect,
}: {
  label: string;
  description: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
        checked ? 'border-purple bg-purple/5' : 'border-line hover:border-purple/50'
      }`}
    >
      <input
        type="radio"
        name="payment-method"
        checked={checked}
        onChange={onSelect}
        className="mt-1 accent-purple"
      />
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-xs text-ink-soft">{description}</span>
      </span>
    </label>
  );
}
