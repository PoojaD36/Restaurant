import type {
  CreateOutletRequest,
  UpdateOutletRequest,
  OutletListItem,
  Outlet,
  ApiResponse,
  PaginatedResponse,
  OutletUser,
  AddOutletUserRequest,
  AvailableOutletUser,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export async function createOutlet(
  data: CreateOutletRequest,
): Promise<ApiResponse<null>> {
  return request('/outlets/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAllOutlets(
  page: number = 1,
  limit: number = 10,
  restaurantId?: number,
): Promise<PaginatedResponse<OutletListItem>> {
  const url = restaurantId
    ? `/outlets/list?page=${page}&limit=${limit}&restaurantId=${restaurantId}`
    : `/outlets/list?page=${page}&limit=${limit}`;
  return request(url);
}

export async function getOutletById(id: string): Promise<ApiResponse<Outlet>> {
  return request(`/outlets/${id}`);
}

export async function updateOutlet(
  id: string,
  data: UpdateOutletRequest,
): Promise<ApiResponse<null>> {
  return request(`/outlets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteOutlet(id: string): Promise<ApiResponse<null>> {
  return request(`/outlets/${id}`, {
    method: 'DELETE',
  });
}

export async function getOutletsByRestaurant(
  restaurantId: string,
): Promise<ApiResponse<Outlet[]>> {
  return request(`/outlets/restaurant/${restaurantId}`);
}

export async function getOutletUsers(
  outletId: string,
): Promise<ApiResponse<OutletUser[]>> {
  return request(`/outlets/${outletId}/users`);
}

export async function getAvailableOutletUsers(
  outletId: string,
): Promise<ApiResponse<AvailableOutletUser[]>> {
  return request(`/outlets/${outletId}/users/available`);
}

export async function addUserToOutlet(
  outletId: string,
  data: AddOutletUserRequest,
): Promise<ApiResponse<null>> {
  return request(`/outlets/${outletId}/users`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeUserFromOutlet(
  outletId: string,
  userId: string,
): Promise<ApiResponse<null>> {
  return request(`/outlets/${outletId}/users/${userId}`, {
    method: 'DELETE',
  });
}
