/**
 * Error Handler Utilities
 *
 * Provides functions to handle and display errors consistently across the app.
 * Includes toast notifications for API errors, network errors, and timeouts.
 */

import type { ApiError } from './api-client';

export type ErrorType = 'api' | 'network' | 'timeout' | 'validation' | 'unknown';

export interface ErrorDisplay {
  title: string;
  message: string;
  type: ErrorType;
}

/**
 * Parse an error and return a user-friendly error display
 */
export function parseError(error: unknown): ErrorDisplay {
  // ApiError from api-client
  if (error && typeof error === 'object' && 'isNetworkError' in error) {
    const apiError = error as ApiError;

    if (apiError.isTimeout) {
      return {
        title: 'Request Timeout',
        message: 'The request took too long. Please check your internet connection and try again.',
        type: 'timeout',
      };
    }

    if (apiError.isNetworkError) {
      return {
        title: 'Connection Error',
        message: 'Cannot connect to the server. Please check if the backend is running.',
        type: 'network',
      };
    }

    // API error with status code
    if (apiError.statusCode) {
      const statusCode = apiError.statusCode;

      // Client errors (4xx)
      if (statusCode >= 400 && statusCode < 500) {
        if (statusCode === 401) {
          return {
            title: 'Authentication Required',
            message: 'Please log in to continue.',
            type: 'api',
          };
        }
        if (statusCode === 403) {
          return {
            title: 'Access Denied',
            message: 'You do not have permission to perform this action.',
            type: 'api',
          };
        }
        if (statusCode === 404) {
          return {
            title: 'Not Found',
            message: 'The requested resource was not found.',
            type: 'api',
          };
        }
        if (statusCode === 409) {
          return {
            title: 'Conflict',
            message: apiError.message || 'This action conflicts with existing data.',
            type: 'api',
          };
        }
        if (statusCode === 422) {
          return {
            title: 'Validation Error',
            message: apiError.message || 'Please check your input and try again.',
            type: 'validation',
          };
        }
      }

      // Server errors (5xx)
      if (statusCode >= 500) {
        return {
          title: 'Server Error',
          message: 'Something went wrong on the server. Please try again later.',
          type: 'api',
        };
      }

      // Other API errors
      return {
        title: 'Error',
        message: apiError.message || 'An unexpected error occurred.',
        type: 'api',
      };
    }
  }

  // Generic Error
  if (error instanceof Error) {
    return {
      title: 'Error',
      message: error.message || 'An unexpected error occurred.',
      type: 'unknown',
    };
  }

  // Unknown error type
  return {
    title: 'Error',
    message: 'An unexpected error occurred. Please try again.',
    type: 'unknown',
  };
}

/**
 * Get human-readable error message for console/display
 */
export function getErrorMessage(error: unknown): string {
  const parsed = parseError(error);
  return parsed.message;
}
