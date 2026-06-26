const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CreateRazorpayOrderRequest {
  amount: number;
  orderId?: number;
}

export interface CreateRazorpayOrderResponse {
  success: boolean;
  message: string;
  data: {
    razorpayOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
  };
}

export interface VerifyRazorpayPaymentRequest {
  orderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyRazorpayPaymentResponse {
  success: boolean;
  message: string;
}

/**
 * Create a Razorpay order for payment
 */
export async function createRazorpayOrder(
  token: string,
  amount: number,
  orderId?: number,
): Promise<CreateRazorpayOrderResponse> {
  const response = await fetch(`${API_URL}/payments/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount, orderId }),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment order');
  }

  return response.json();
}

/**
 * Verify Razorpay payment signature
 */
export async function verifyRazorpayPayment(
  token: string,
  data: VerifyRazorpayPaymentRequest,
): Promise<VerifyRazorpayPaymentResponse> {
  const response = await fetch(`${API_URL}/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to verify payment');
  }

  return response.json();
}

/**
 * Get payment status by order ID
 */
export async function getPaymentStatus(
  token: string,
  orderId: number,
): Promise<{
  success: boolean;
  message: string;
  data: {
    id: number;
    amount: number;
    method: string;
    status: string;
    transactionId: string | null;
  } | null;
}> {
  const response = await fetch(`${API_URL}/payments/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get payment status');
  }

  return response.json();
}

export interface CreatePaymentLinkRequest {
  amount: number;
  orderId: number;
  description?: string;
}

export interface CreatePaymentLinkResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    shortUrl: string;
    amount: number;
    currency: string;
    description: string;
    status: string;
  };
}

/**
 * Create a Razorpay Payment Link for COD to UPI conversion
 */
export async function createPaymentLink(
  token: string,
  data: CreatePaymentLinkRequest,
): Promise<CreatePaymentLinkResponse> {
  const response = await fetch(`${API_URL}/payments/create-payment-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment link');
  }

  return response.json();
}

export interface PaymentLinkStatus {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  paymentId: string | null;
}

/**
 * Get payment link status to check if payment is completed
 */
export async function getPaymentLinkStatus(
  token: string,
  paymentLinkId: string,
): Promise<{
  success: boolean;
  message: string;
  data: PaymentLinkStatus;
}> {
  const response = await fetch(`${API_URL}/payments/payment-link/${paymentLinkId}/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get payment link status');
  }

  return response.json();
}
