import { apiClient } from './api-client';
import type {
  CustomerRegisterRequest,
  CustomerLoginResponse,
  CustomerLoginRequest,
  UpdateCustomerRequest,
  AddAddressRequest,
  UpdateAddressRequest,
  Customer,
  CustomerAddress,
} from './customer-types';

/**
 * Register new customer
 */
export async function registerCustomer(
  data: CustomerRegisterRequest,
): Promise<CustomerLoginResponse> {
  return apiClient.post('/customers/register', data, { skipAuth: true });
}

/**
 * Login customer
 */
export async function loginCustomer(
  data: CustomerLoginRequest,
): Promise<CustomerLoginResponse> {
  return apiClient.post('/customers/login', data, { skipAuth: true });
}

/**
 * Get current customer profile
 */
export async function getCustomerProfile(): Promise<{
  success: boolean;
  message: string;
  customer: Customer;
}> {
  return apiClient.get('/customers/profile');
}

/**
 * Update customer profile
 */
export async function updateCustomerProfile(
  data: UpdateCustomerRequest,
): Promise<{
  success: boolean;
  message: string;
  customer: Customer;
}> {
  return apiClient.put('/customers/profile', data);
}

/**
 * Add address to customer
 */
export async function addCustomerAddress(
  data: AddAddressRequest,
): Promise<{
  success: boolean;
  message: string;
  address: CustomerAddress;
}> {
  return apiClient.post('/customers/addresses', data);
}

/**
 * Update customer address
 */
export async function updateCustomerAddress(
  addressId: number,
  data: UpdateAddressRequest,
): Promise<{
  success: boolean;
  message: string;
  address: CustomerAddress;
}> {
  return apiClient.put(`/customers/addresses/${addressId}`, data);
}

/**
 * Delete customer address
 */
export async function deleteCustomerAddress(addressId: number): Promise<{
  success: boolean;
  message: string;
}> {
  return apiClient.delete(`/customers/addresses/${addressId}`);
}

/**
 * Set default address
 */
export async function setDefaultCustomerAddress(addressId: number): Promise<{
  success: boolean;
  message: string;
}> {
  return apiClient.post(`/customers/addresses/${addressId}/default`);
}

/**
 * Logout customer
 */
export async function logoutCustomer(): Promise<{
  success: boolean;
  message: string;
}> {
  return apiClient.post('/customers/logout');
}
