/**
 * Unified API Client
 *
 * A centralized fetch wrapper with:
 * - Consistent error handling (reads error messages from API responses)
 * - Request timeout (30s default)
 * - Automatic token injection (when available)
 * - User-friendly error messages
 * - Type-safe responses
 *
 * Usage:
 *   import { apiClient } from '@/lib/api-client';
 *   const data = await apiClient.get('/public/outlets/list');
 *   const data = await apiClient.post('/customers/login', body);
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiClientOptions extends Omit<RequestInit, 'method'> {
  timeout?: number;
  skipAuth?: boolean;
}

interface ApiError extends Error {
  statusCode?: number;
  isNetworkError?: boolean;
  isTimeout?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(baseUrl: string, defaultTimeout: number = DEFAULT_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = defaultTimeout;
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    // Support both customer tokens and admin tokens
    return (
      localStorage.getItem('customerAccessToken') ||
      localStorage.getItem('accessToken')
    );
  }

  private async request<T>(
    endpoint: string,
    method: HttpMethod = 'GET',
    options: ApiClientOptions = {},
  ): Promise<T> {
    const { timeout = this.defaultTimeout, skipAuth = false, ...fetchOptions } = options;

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(typeof fetchOptions.headers === 'object' && fetchOptions.headers
        ? fetchOptions.headers as Record<string, string>
        : {}),
    };

    // Add auth token if available and not skipped
    const token = skipAuth ? null : this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Build URL
    const url = `${this.baseUrl}${endpoint}`;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = 'Request failed';
        let statusCode = response.status;

        try {
          // Try to read error message from API response
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        const error: ApiError = new Error(errorMessage);
        error.statusCode = statusCode;
        error.isNetworkError = !statusCode;
        throw error;
      }

      return response.json();
    } catch (error) {
      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError: ApiError = new Error('Request timeout. Please check your connection.');
        timeoutError.isTimeout = true;
        throw timeoutError;
      }

      // Handle network errors (backend not running, CORS, etc.)
      if (error instanceof Error && (error as ApiError).isNetworkError) {
        const networkError: ApiError = new Error(
          'Cannot connect to server. Please check if the backend is running.'
        );
        networkError.isNetworkError = true;
        throw networkError;
      }

      throw error;
    }
  }

  async get<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, 'GET', options);
  }

  async post<T>(endpoint: string, body?: any, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, 'POST', {
      ...options,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, 'PUT', {
      ...options,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: any, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, 'PATCH', {
      ...options,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, 'DELETE', options);
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_URL);

// Export type for use in components
export type { ApiError };
