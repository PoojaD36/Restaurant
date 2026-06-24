import {
  CreateOrderRequest,
  CreateOrderResponse,
  GetOrdersResponse,
  GetOrderResponse,
  CancelOrderResponse,
  OrderStatus,
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

/**
 * Get orders for outlet (admin/manager)
 */
export async function getOutletOrders(
  token: string,
  outletId: number | string,
  status?: OrderStatus,
  page = 1,
  limit = 20,
): Promise<any> {
  const statusParam = status ? `&status=${status}` : '';
  const response = await fetch(`${API_URL}/orders/by-outlet/${outletId}?page=${page}&limit=${limit}${statusParam}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get outlet orders');
  }

  return response.json();
}

/**
 * Update order status (admin/manager)
 */
export async function updateOrderStatus(
  token: string,
  orderId: number,
  status: OrderStatus,
): Promise<any> {
  const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update order status');
  }

  return response.json();
}
