# API Client & Error Handling Guide

This guide explains how to make API calls and handle errors consistently across the application.

## 📁 Key Files

| File | Purpose |
|------|---------|
| [`lib/api-client.ts`](lib/api-client.ts) | Unified API client with timeout, auth, and error handling |
| [`lib/error-handler.ts`](lib/error-handler.ts) | Error parsing utilities for user-friendly messages |
| [`lib/use-api-error.ts`](lib/use-api-error.ts) | React hook for handling API errors with toast notifications |
| [`components/ui/toast.tsx`](components/ui/toast.tsx) | Toast notification component |

## 🚀 Quick Start

### Making API Calls

**Old way (raw fetch):**
```typescript
// ❌ Don't do this anymore
const response = await fetch(`${API_URL}/public/outlets/list`);
if (!response.ok) {
  throw new Error('Failed to fetch outlets'); // Poor error message!
}
const data = await response.json();
```

**New way (unified client):**
```typescript
// ✅ Do this instead
import { apiClient } from '@/lib/api-client';

const data = await apiClient.get('/public/outlets/list');
// Handles auth, timeout, errors automatically!
```

### Handling Errors in Components

**Method 1: Using the useApiError hook**
```typescript
import { useApiError } from '@/lib/use-api-error';
import { getPublicOutlets } from '@/lib/public-api';

function MyComponent() {
  const { handleApiError } = useApiError();

  const loadData = async () => {
    try {
      const data = await getPublicOutlets();
      // Use data...
    } catch (error) {
      handleApiError(error); // Shows toast notification automatically
    }
  };

  return <div>...</div>;
}
```

**Method 2: Manual toast control**
```typescript
import { useToast } from '@/components/ui/toast';

function MyComponent() {
  const { showToast } = useToast();

  const doSomething = async () => {
    try {
      await apiCall();
      showToast('success', 'Success!', 'Operation completed');
    } catch (error) {
      const parsed = parseError(error);
      showToast('error', parsed.title, parsed.message);
    }
  };
}
```

## 📦 Creating New API Modules

When adding a new API module, follow this pattern:

```typescript
// lib/my-new-api.ts
import { apiClient } from './api-client';

// Define types if needed
export interface MyData {
  id: number;
  name: string;
}

// Use apiClient methods (get, post, put, delete)
export async function getMyData() {
  return apiClient.get('/my-endpoint'); // Auto-includes auth token
}

export async function createMyData(data: any) {
  return apiClient.post('/my-endpoint', data);
}

// For public endpoints (no auth):
export async function getPublicData() {
  return apiClient.get('/public/endpoint', { skipAuth: true });
}
```

## 🎯 ApiClient Methods

| Method | Usage |
|--------|-------|
| `apiClient.get(endpoint, options)` | GET request |
| `apiClient.post(endpoint, body, options)` | POST request |
| `apiClient.put(endpoint, body, options)` | PUT request |
| `apiClient.patch(endpoint, body, options)` | PATCH request |
| `apiClient.delete(endpoint, options)` | DELETE request |

### Options

```typescript
interface ApiClientOptions {
  timeout?: number;    // Request timeout in ms (default: 30000)
  skipAuth?: boolean;  // Skip Authorization header (default: false)
  headers?: HeadersInit; // Additional headers
}
```

## 🔴 Error Types Handled

| Error Type | Toast Title | Example Message |
|------------|-------------|-----------------|
| Network Error | "Connection Error" | "Cannot connect to server. Check if backend is running." |
| Timeout | "Request Timeout" | "Request took too long. Check your connection." |
| 401 Unauthorized | "Authentication Required" | "Please log in to continue." |
| 403 Forbidden | "Access Denied" | "You don't have permission for this action." |
| 404 Not Found | "Not Found" | "The requested resource was not found." |
| 422 Validation | "Validation Error" | "Please check your input and try again." |
| 5xx Server | "Server Error" | "Something went wrong on the server." |

## 🔄 Migration Checklist

When migrating existing API files to use the unified client:

- [ ] Import `apiClient` from `@/lib/api-client`
- [ ] Replace `fetch()` calls with `apiClient.get/post/put/delete()`
- [ ] Remove manual `Authorization` header handling (auto-injected)
- [ ] Remove manual error handling (`if (!response.ok)`)
- [ ] Remove `await response.json()` (handled by client)
- [ ] Use `skipAuth: true` for public endpoints
- [ ] Update components to use `useApiError` hook for error handling

## 📝 Example: Full Component

```typescript
'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useApiError } from '@/lib/use-api-error';

export function UserProfile() {
  const { handleApiError } = useApiError();
  const [loading, setLoading] = useState(false);

  const updateProfile = async (name: string) => {
    setLoading(true);
    try {
      await apiClient.put('/customers/profile', { name });
      // Success - toast could be shown here too
    } catch (error) {
      handleApiError(error); // Shows error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* UI here */}
    </div>
  );
}
```

## 🧪 Testing

The client can be tested with different scenarios:

```typescript
// Test timeout
apiClient.get('/slow-endpoint', { timeout: 1000 });

// Test network error (backend not running)
// The client will throw isNetworkError = true

// Test API error
apiClient.get('/non-existent'); // Returns 404
```

## ❓ FAQ

**Q: Does the client work in SSR?**
A: Yes, the client checks for `window` before accessing localStorage. For SSR-only endpoints, use `skipAuth: true`.

**Q: How do I change the timeout?**
A: Pass `timeout` option: `apiClient.get('/endpoint', { timeout: 60000 })`

**Q: Can I use this for file uploads?**
A: For file uploads, you may need custom headers. Pass `headers: { 'Content-Type': 'multipart/form-data' }` and omit `body` JSON serialization (the client will need adjustment for this case).

**Q: What if the backend returns a non-JSON response?**
A: The client tries to parse errors as JSON first, then falls back to status text. For non-JSON endpoints, handle the response manually.
