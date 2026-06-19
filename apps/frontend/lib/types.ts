export type UserRole = 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'MANAGER' | 'CHEF' | 'DELIVERY_AGENT';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt?: string;
  updatedAt?: string;
  profileImage?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone: string;
  role: UserRole;
}

export interface ChangePasswordRequest {
  oldPassword?: string;
  newPassword: string;
  userId?: number;
}

export interface UpdateUserRequest {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface UserListItem {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
