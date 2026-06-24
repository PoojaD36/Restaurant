import {
  CreateOrderRequest,
  CreateOrderResponse,
  GetOrdersResponse,
  GetOrderResponse,
  CancelOrderResponse,
} from './order-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Create order from cart
 */
export async function createOrder(
  token: string,
  data: CreateOrderRequest,
): Promise<CreateOrderResponse> {
  const response = await fetch(`${API_URL}/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create order');
  }

  return response.json();
}

/**
 * Get customer's orders with pagination
 */
export async function getMyOrders(
  token: string,
  page = 1,
  limit = 10,
): Promise<GetOrdersResponse> {
  const response = await fetch(`${API_URL}/orders/my-orders?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get orders');
  }

  return response.json();
}

/**
 * Get order by ID
 */
export async function getOrderById(
  token: string,
  orderId: number,
): Promise<GetOrderResponse> {
  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get order');
  }

  return response.json();
}

/**
 * Cancel order
 */
export async function cancelOrder(
  token: string,
  orderId: number,
): Promise<CancelOrderResponse> {
  const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to cancel order');
  }

  return response.json();
}
