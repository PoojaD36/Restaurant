import type { CreateUserRequest, ChangePasswordRequest, UserListItem, ApiResponse, PaginatedResponse, User, UpdateUserRequest } from './types';

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

export async function createUser(data: CreateUserRequest): Promise<ApiResponse<null>> {
  return request('/users/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAllUsers(page: number = 1, limit: number = 10): Promise<PaginatedResponse<UserListItem>> {
  return request(`/users/list?page=${page}&limit=${limit}`);
}

export async function changePassword(data: ChangePasswordRequest): Promise<ApiResponse<null>> {
  return request('/users/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getUserProfile(): Promise<ApiResponse<User>> {
  return request('/users/profile');
}

export async function updateUser(userId: string, data: UpdateUserRequest): Promise<ApiResponse<User>> {
  return request(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(userId: string): Promise<ApiResponse<null>> {
  return request(`/users/${userId}`, {
    method: 'DELETE',
  });
}
