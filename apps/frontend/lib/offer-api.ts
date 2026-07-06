// Offer API Functions
import {
  CreateOfferRequest,
  UpdateOfferRequest,
  OfferFilter,
  PaginatedOffersResponse,
  Offer,
  OfferStats,
  OfferOverview,
  OfferUsage,
  ApplyOfferRequest,
  ApplyOfferResponse,
  AvailableOffersResponse,
} from './offer-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Get auth token from localStorage
const getAuthToken = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken') || '';
  }
  return '';
};

// Get customer auth token from localStorage
const getCustomerAuthToken = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('customerAccessToken') || '';
  }
  return '';
};

// Admin Offer Endpoints

/**
 * Create a new offer
 */
export async function createOffer(data: CreateOfferRequest): Promise<any> {
  const response = await fetch(`${API_URL}/admin/offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create offer');
  }

  return response.json();
}

/**
 * Get all offers with filtering
 */
export async function getOffers(filter?: OfferFilter): Promise<PaginatedOffersResponse> {
  const params = new URLSearchParams();

  if (filter) {
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.limit) params.append('limit', filter.limit.toString());
    if (filter.type) params.append('type', filter.type);
    if (filter.status) params.append('status', filter.status);
    if (filter.scope) params.append('scope', filter.scope);
    if (filter.restaurantId) params.append('restaurantId', filter.restaurantId.toString());
    if (filter.search) params.append('search', filter.search);
  }

  const response = await fetch(`${API_URL}/admin/offers?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch offers');
  }

  return response.json();
}

/**
 * Get offer by ID
 */
export async function getOfferById(id: number): Promise<{ success: boolean; message: string; data: Offer }> {
  const response = await fetch(`${API_URL}/admin/offers/${id}`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch offer');
  }

  return response.json();
}

/**
 * Update an offer
 */
export async function updateOffer(id: number, data: UpdateOfferRequest): Promise<any> {
  const response = await fetch(`${API_URL}/admin/offers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update offer');
  }

  return response.json();
}

/**
 * Delete an offer (soft delete)
 */
export async function deleteOffer(id: number): Promise<any> {
  const response = await fetch(`${API_URL}/admin/offers/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete offer');
  }

  return response.json();
}

/**
 * Update offer status
 */
export async function updateOfferStatus(id: number, status: string): Promise<any> {
  const response = await fetch(`${API_URL}/admin/offers/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update offer status');
  }

  return response.json();
}

/**
 * Get offer usage statistics
 */
export async function getOfferStats(id: number): Promise<{ success: boolean; message: string; data: OfferStats }> {
  const response = await fetch(`${API_URL}/admin/offers/${id}/stats`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch offer stats');
  }

  return response.json();
}

/**
 * Get offer statistics overview
 */
export async function getOfferStatsOverview(): Promise<{ success: boolean; message: string; data: OfferOverview }> {
  const response = await fetch(`${API_URL}/admin/offers/stats/overview`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch offer stats overview');
  }

  return response.json();
}

/**
 * Get offers expiring within 7 days
 */
export async function getExpiringOffers(): Promise<{ success: boolean; message: string; data: Offer[] }> {
  const response = await fetch(`${API_URL}/admin/offers/expiring`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch expiring offers');
  }

  return response.json();
}

/**
 * Get most used offers
 */
export async function getMostUsedOffers(limit: number = 10): Promise<{ success: boolean; message: string; data: Offer[] }> {
  const response = await fetch(`${API_URL}/admin/offers/popular?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch popular offers');
  }

  return response.json();
}

/**
 * Validate offer code (for testing)
 */
export async function validateOfferCode(code: string, outletId: number): Promise<any> {
  const response = await fetch(`${API_URL}/admin/offers/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify({ code, outletId }),
  });

  if (!response.ok) {
    throw new Error('Failed to validate offer code');
  }

  return response.json();
}

// Customer Offer Endpoints

/**
 * Get available offers for an outlet
 */
export async function getAvailableOffers(outletId: number): Promise<AvailableOffersResponse> {
  const response = await fetch(`${API_URL}/offers?outletId=${outletId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch available offers');
  }

  return response.json();
}

/**
 * Apply offer code to cart
 */
export async function applyOffer(data: ApplyOfferRequest): Promise<ApplyOfferResponse> {
  const response = await fetch(`${API_URL}/offers/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getCustomerAuthToken()}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to apply offer');
  }

  return response.json();
}

/**
 * Preview discount for an offer (without applying)
 */
export async function previewOfferDiscount(data: ApplyOfferRequest): Promise<ApplyOfferResponse> {
  const response = await fetch(`${API_URL}/offers/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to preview offer');
  }

  return response.json();
}

/**
 * Get customer's offer usage history
 */
export async function getMyOfferUsage(): Promise<{ success: boolean; message: string; data: OfferUsage[] }> {
  const response = await fetch(`${API_URL}/offers/my-usage`, {
    headers: {
      Authorization: `Bearer ${getCustomerAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch offer usage history');
  }

  return response.json();
}

/**
 * Check if customer can use an offer
 */
export async function checkOfferAvailability(id: number): Promise<{ success: boolean; message: string; data: { canUse: boolean } }> {
  const response = await fetch(`${API_URL}/offers/${id}/check`, {
    headers: {
      Authorization: `Bearer ${getCustomerAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to check offer availability');
  }

  return response.json();
}
