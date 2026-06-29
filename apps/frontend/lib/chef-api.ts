import { GetChefOrdersResponse } from './order-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get orders for chef
 * Returns CONFIRMED orders (pending claim) and PREPARING orders (assigned to this chef)
 */
export async function getChefOrders(outletId?: number): Promise<GetChefOrdersResponse> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const url = new URL(`${API_URL}/orders/chef/my-orders`);
  if (outletId) {
    url.searchParams.append('outletId', outletId.toString());
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch chef orders');
  }

  return response.json();
}

/**
 * Claim an order (chef only)
 * Assigns the order to the chef and updates status to PREPARING
 */
export async function claimOrder(orderId: number): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/orders/${orderId}/claim`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}), // Empty DTO
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to claim order');
  }
}

/**
 * Mark order as ready (chef only)
 * Updates status to READY and sets completedAt timestamp
 */
export async function markOrderReady(orderId: number): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/orders/${orderId}/mark-ready`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}), // Empty DTO
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to mark order as ready');
  }
}
