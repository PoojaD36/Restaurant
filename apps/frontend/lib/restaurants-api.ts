import type {
  CreateRestaurantRequest,
  UpdateRestaurantRequest,
  AddRestaurantUserRequest,
  RestaurantListItem,
  RestaurantDetail,
  RestaurantUser,
  ApiResponse,
  PaginatedResponse,
  Restaurant,
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

export async function createRestaurant(
  data: CreateRestaurantRequest,
): Promise<ApiResponse<null>> {
  return request('/restaurants/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAllRestaurants(
  page: number = 1,
  limit: number = 10,
): Promise<PaginatedResponse<RestaurantListItem>> {
  return request(`/restaurants/list?page=${page}&limit=${limit}`);
}

export async function getRestaurantById(
  id: string,
): Promise<ApiResponse<RestaurantDetail>> {
  return request(`/restaurants/${id}`);
}

export async function updateRestaurant(
  id: string,
  data: UpdateRestaurantRequest,
): Promise<ApiResponse<null>> {
  return request(`/restaurants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRestaurant(
  id: string,
): Promise<ApiResponse<null>> {
  return request(`/restaurants/${id}`, {
    method: 'DELETE',
  });
}

export async function addUserToRestaurant(
  restaurantId: string,
  data: AddRestaurantUserRequest,
): Promise<ApiResponse<null>> {
  return request(`/restaurants/${restaurantId}/users`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeUserFromRestaurant(
  restaurantId: string,
  userId: string,
): Promise<ApiResponse<null>> {
  return request(`/restaurants/${restaurantId}/users/${userId}`, {
    method: 'DELETE',
  });
}

export async function getRestaurantUsers(
  restaurantId: string,
): Promise<ApiResponse<RestaurantUser[]>> {
  return request(`/restaurants/${restaurantId}/users`);
}

export async function getMyRestaurants(): Promise<ApiResponse<Restaurant[]>> {
  return request('/restaurants/my-restaurants');
}

export async function uploadRestaurantLogo(file: File): Promise<ApiResponse<{ url: string }>> {
  const token = localStorage.getItem('accessToken');
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/restaurants/upload-logo`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Upload failed');
  }

  return response.json();
}
