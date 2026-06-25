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
