// Customer types for the application

export interface Customer {
  id: number;
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
  profileImage?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  addresses?: CustomerAddress[];
}

export interface CustomerAddress {
  id: number;
  customerId: number;
  label: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRegisterRequest {
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
  password: string;
}

export interface CustomerLoginRequest {
  identifier: string;
  password: string;
}

export interface CustomerLoginResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  customer: Customer;
}

export interface UpdateCustomerRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
}

export interface AddAddressRequest {
  label: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest extends Partial<AddAddressRequest> {}
