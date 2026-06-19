import type { CreateUserRequest, ChangePasswordRequest, UserListItem } from './types';

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

export async function createUser(data: CreateUserRequest): Promise<any> {
  return request('/users/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAllUsers(): Promise<UserListItem[]> {
  return request('/users/list');
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  const response = await fetch(`${API_URL}/users/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
}

export async function getUserProfile(): Promise<any> {
  return request('/users/profile');
}
