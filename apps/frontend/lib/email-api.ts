import type { ApiResponse } from './types';

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

/**
 * Send a test email to verify SMTP configuration
 * Requires SUPER_ADMIN role
 */
export async function sendTestEmail(): Promise<ApiResponse<null>> {
  return request('/email/test', {
    method: 'POST',
  });
}

/**
 * Get daily report scheduler information
 * Requires SUPER_ADMIN role
 */
export async function getDailyReportInfo(): Promise<
  ApiResponse<{
    scheduler: string;
    schedule: string;
    timezone: string;
  }>
> {
  return request('/email/test-daily-report', {
    method: 'POST',
  });
}

export default {
  sendTestEmail,
  getDailyReportInfo,
};
