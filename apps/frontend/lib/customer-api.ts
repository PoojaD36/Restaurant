import { CustomerRegisterRequest, CustomerLoginResponse, CustomerLoginRequest, UpdateCustomerRequest, AddAddressRequest, UpdateAddressRequest, Customer, CustomerAddress } from './customer-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Register new customer
 */
export async function registerCustomer(data: CustomerRegisterRequest): Promise<CustomerLoginResponse> {
  const response = await fetch(`${API_URL}/customers/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
}

/**
 * Login customer
 */
export async function loginCustomer(data: CustomerLoginRequest): Promise<CustomerLoginResponse> {
  const response = await fetch(`${API_URL}/customers/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}

/**
 * Get current customer profile
 */
export async function getCustomerProfile(token: string): Promise<{
  success: boolean;
  message: string;
  customer: Customer;
}> {
  const response = await fetch(`${API_URL}/customers/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get profile');
  }

  return response.json();
}

/**
 * Update customer profile
 */
export async function updateCustomerProfile(
  token: string,
  data: UpdateCustomerRequest,
): Promise<{
  success: boolean;
  message: string;
  customer: Customer;
}> {
  const response = await fetch(`${API_URL}/customers/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update profile');
  }

  return response.json();
}

/**
 * Add address to customer
 */
export async function addCustomerAddress(
  token: string,
  data: AddAddressRequest,
): Promise<{
  success: boolean;
  message: string;
  address: CustomerAddress;
}> {
  const response = await fetch(`${API_URL}/customers/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add address');
  }

  return response.json();
}

/**
 * Update customer address
 */
export async function updateCustomerAddress(
  token: string,
  addressId: number,
  data: UpdateAddressRequest,
): Promise<{
  success: boolean;
  message: string;
  address: CustomerAddress;
}> {
  const response = await fetch(`${API_URL}/customers/addresses/${addressId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update address');
  }

  return response.json();
}

/**
 * Delete customer address
 */
export async function deleteCustomerAddress(
  token: string,
  addressId: number,
): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await fetch(`${API_URL}/customers/addresses/${addressId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete address');
  }

  return response.json();
}

/**
 * Set default address
 */
export async function setDefaultCustomerAddress(
  token: string,
  addressId: number,
): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await fetch(`${API_URL}/customers/addresses/${addressId}/default`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to set default address');
  }

  return response.json();
}

/**
 * Logout customer
 */
export async function logoutCustomer(token: string): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await fetch(`${API_URL}/customers/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to logout');
  }

  return response.json();
}
