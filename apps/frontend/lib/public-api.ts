import { apiClient } from './api-client';

export interface PublicOutlet {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number | null;
  longitude?: number | null;
  openingTime?: string;
  closingTime?: string;
  status: string;
  restaurant: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
  };
}

export interface PaginatedPublicOutlets {
  success: boolean;
  message: string;
  data: PublicOutlet[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get all public outlets (no authentication required)
 */
export async function getPublicOutlets(
  page: number = 1,
  limit: number = 20,
  restaurantId?: number,
): Promise<PaginatedPublicOutlets> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (restaurantId) params.append('restaurantId', String(restaurantId));

  return apiClient.get(`/public/outlets/list?${params}`, { skipAuth: true });
}

/**
 * Get public outlet by ID (no authentication required)
 */
export async function getPublicOutletById(id: string): Promise<{
  success: boolean;
  message: string;
  data: PublicOutlet;
}> {
  return apiClient.get(`/public/outlets/${id}`, { skipAuth: true });
}

/**
 * Get public menu by outlet ID (no authentication required)
 * Returns menu with outlet-specific pricing
 */
export async function getPublicMenuByOutlet(outletId: string): Promise<{
  success: boolean;
  message: string;
  data: import('./menu-types').PublicMenu;
}> {
  return apiClient.get(`/public/menus/outlet/${outletId}`, { skipAuth: true });
}
