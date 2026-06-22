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

// Restaurant Types
export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  outletsCount?: number;
  usersCount?: number;
}

export interface RestaurantListItem {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  outletsCount: number;
  usersCount: number;
}

export interface CreateRestaurantRequest {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  adminId: number;
}

export interface UpdateRestaurantRequest {
  name?: string;
  slug?: string;
  logo?: string;
  description?: string;
}

export interface AddRestaurantUserRequest {
  userId: number;
}

export interface RestaurantUser {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  addedAt: string;
}

export interface RestaurantDetail extends Restaurant {
  outlets: Array<{
    id: string;
    name: string;
    city: string;
    status: 'ACTIVE' | 'INACTIVE' | 'CLOSED';
  }>;
  users: Array<{
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
    phone: string;
    role: UserRole;
  }>;
}

// Outlet Types
export interface Outlet {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: string;
  longitude?: string;
  openingTime?: string;
  closingTime?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  restaurant: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface OutletListItem {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  openingTime?: string;
  closingTime?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  restaurant: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface CreateOutletRequest {
  restaurantId: number;
  name: string;
  phone?: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: string;
  longitude?: string;
  openingTime?: string;
  closingTime?: string;
}

export interface UpdateOutletRequest {
  name?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: string;
  longitude?: string;
  openingTime?: string;
  closingTime?: string;
}

export interface OutletUser {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  addedAt: string;
}

export interface AddOutletUserRequest {
  userId: number;
}

export interface AvailableOutletUser {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}
