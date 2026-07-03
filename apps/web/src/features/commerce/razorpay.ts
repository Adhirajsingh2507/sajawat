/**
 * Razorpay checkout loader (Milestone 1.4c) — the "wired" half of the
 * wired-but-dormant online path. The backend only returns a RazorpayCheckout
 * once keys are configured (until then it 501s and the UI falls back to COD),
 * so this script + modal code stays dormant in practice but is ready to light up.
 */
import type { RazorpayCheckout, VerifyPaymentRequest } from '@sajawat/types';

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string | undefined; email?: string | undefined; contact?: string | undefined };
  theme?: { color?: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

type RazorpayCtor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

function loadScript(): Promise<RazorpayCtor> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Razorpay is only available in the browser'));
      return;
    }
    if (window.Razorpay !== undefined) {
      resolve(window.Razorpay);
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (window.Razorpay !== undefined) resolve(window.Razorpay);
      else reject(new Error('Razorpay failed to initialise'));
    };
    script.onerror = () => {
      reject(new Error('Could not load the payment gateway'));
    };
    document.body.appendChild(script);
  });
}

/**
 * Open the Razorpay modal for a server-created order. Resolves with the fields
 * the backend needs to verify the payment, or rejects if the user dismisses it.
 */
export async function openRazorpayCheckout(
  checkout: RazorpayCheckout,
  prefill: { name?: string | undefined; email?: string | undefined; contact?: string | undefined },
): Promise<VerifyPaymentRequest> {
  const Razorpay = await loadScript();
  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: checkout.keyId,
      amount: checkout.amount,
      currency: checkout.currency,
      order_id: checkout.orderId,
      name: 'Sajawat Jewellery',
      description: 'Order payment',
      prefill,
      theme: { color: '#5b21b6' },
      handler: (response) => {
        resolve({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment was cancelled'));
        },
      },
    });
    rzp.open();
  });
}
