'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Customer, CustomerRegisterRequest, CustomerLoginRequest } from '../lib/customer-types';
import {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  logoutCustomer as apiLogoutCustomer,
} from '../lib/customer-api';

interface CustomerAuthContextType {
  customer: Customer | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  register: (data: CustomerRegisterRequest) => Promise<void>;
  login: (data: CustomerLoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  getCustomerToken: () => string | null;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

const CUSTOMER_TOKEN_KEY = 'customerAccessToken';
const CUSTOMER_REFRESH_TOKEN_KEY = 'customerRefreshToken';

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if customer is already logged in
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    if (token) {
      loadCustomerProfile(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadCustomerProfile = async (token: string) => {
    try {
      const response = await getCustomerProfile(token);
      if (response.success && response.customer) {
        setCustomer(response.customer);
      }
    } catch (err) {
      // Invalid token, clear storage
      localStorage.removeItem(CUSTOMER_TOKEN_KEY);
      localStorage.removeItem(CUSTOMER_REFRESH_TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: CustomerRegisterRequest) => {
    try {
      setError(null);
      const response = await registerCustomer(data);

      if (response.success && response.customer) {
        setCustomer(response.customer);
        localStorage.setItem(CUSTOMER_TOKEN_KEY, response.accessToken);
        localStorage.setItem(CUSTOMER_REFRESH_TOKEN_KEY, response.refreshToken);
        // Dispatch event for cart sync
        window.dispatchEvent(new Event('customerLogin'));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    }
  };

  const login = async (data: CustomerLoginRequest) => {
    try {
      setError(null);
      const response = await loginCustomer(data);

      if (response.success && response.customer) {
        setCustomer(response.customer);
        localStorage.setItem(CUSTOMER_TOKEN_KEY, response.accessToken);
        localStorage.setItem(CUSTOMER_REFRESH_TOKEN_KEY, response.refreshToken);
        // Dispatch event for cart sync
        window.dispatchEvent(new Event('customerLogin'));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
      if (token) {
        await apiLogoutCustomer(token);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setCustomer(null);
      localStorage.removeItem(CUSTOMER_TOKEN_KEY);
      localStorage.removeItem(CUSTOMER_REFRESH_TOKEN_KEY);
      // Dispatch event for cart clear
      window.dispatchEvent(new Event('customerLogout'));
    }
  };

  const refreshProfile = async () => {
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    if (token) {
      await loadCustomerProfile(token);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const getCustomerToken = () => {
    return localStorage.getItem(CUSTOMER_TOKEN_KEY);
  };

  const value: CustomerAuthContextType = {
    customer,
    isLoading,
    isAuthenticated: !!customer,
    error,
    register,
    login,
    logout,
    refreshProfile,
    clearError,
    getCustomerToken,
  };

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}

export function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function getCustomerRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CUSTOMER_REFRESH_TOKEN_KEY);
}
