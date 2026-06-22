const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  const url = restaurantId
    ? `${API_URL}/public/outlets/list?page=${page}&limit=${limit}&restaurantId=${restaurantId}`
    : `${API_URL}/public/outlets/list?page=${page}&limit=${limit}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch outlets');
  }

  return response.json();
}

/**
 * Get public outlet by ID (no authentication required)
 */
export async function getPublicOutletById(id: string): Promise<{
  success: boolean;
  message: string;
  data: PublicOutlet;
}> {
  const response = await fetch(`${API_URL}/public/outlets/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch outlet');
  }

  return response.json();
}
