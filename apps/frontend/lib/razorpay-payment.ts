declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  customer: {
    name: string;
    email: string;
    contact: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
  };
  theme: {
    color: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/**
 * Open Razorpay checkout modal
 * @param options Razorpay checkout configuration
 */
export function openRazorpayCheckout(options: RazorpayCheckoutOptions): void {
  if (typeof window === 'undefined') {
    console.error('Razorpay checkout can only be opened in browser');
    return;
  }

  if (!window.Razorpay) {
    console.error('Razorpay SDK not loaded');
    return;
  }

  const rzp = new window.Razorpay(options);
  rzp.open();
}

/**
 * Load Razorpay SDK script
 */
export function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Cannot load Razorpay in server-side context'));
      return;
    }

    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
}
