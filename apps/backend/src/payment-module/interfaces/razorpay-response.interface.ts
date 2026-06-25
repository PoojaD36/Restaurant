export interface RazorpayOrderResponse {
  id: string; // Razorpay order ID
  entity: string;
  amount: number; // Amount in paise
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string | null;
  status: string;
  attempts: number;
  notes?: {
    [key: string]: string | number;
  };
  created_at: number;
}

export interface RazorpayPaymentResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
}
