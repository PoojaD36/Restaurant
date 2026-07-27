# Unified API Client & Error Handling - Implementation Summary

## Problem Solved

**"Failed to fetch" errors** were occurring inconsistently across the app because:
- API files used different patterns (raw fetch vs. centralized request helpers)
- No consistent error handling
- Poor error messages ("Failed to fetch outlets")
- No timeout handling
- Network errors not handled gracefully

## Solution: Unified API Client + Error Handling System

### Files Created

| File | Purpose |
|------|---------|
| [`lib/api-client.ts`](apps/frontend/lib/api-client.ts) | Centralized fetch wrapper with timeout, auth auto-injection, and proper error handling |
| [`lib/error-handler.ts`](apps/frontend/lib/error-handler.ts) | Error parsing utilities for user-friendly messages |
| [`lib/use-api-error.ts`](apps/frontend/lib/use-api-error.ts) | React hook for handling API errors with toast notifications |
| [`components/ui/toast.tsx`](apps/frontend/components/ui/toast.tsx) | Toast notification component with success/error/warning/info types |
| [`API_CLIENT_GUIDE.md`](apps/frontend/API_CLIENT_GUIDE.md) | Comprehensive usage guide for developers |

### Files Modified

| File | Changes |
|------|---------|
| [`lib/public-api.ts`](apps/frontend/lib/public-api.ts) | Refactored to use `apiClient` — removed raw fetch calls |
| [`lib/customer-api.ts`](apps/frontend/lib/customer-api.ts) | Refactored to use `apiClient` — removed token parameters (auto-injected) |
| [`app/layout.tsx`](apps/frontend/app/layout.tsx) | Added `ToastProvider` wrapper for app-wide toast notifications |
| [`contexts/customer-auth-context.tsx`](apps/frontend/contexts/customer-auth-context.tsx) | Updated calls to remove token parameters |
| [`app/customer/checkout/page.tsx`](apps/frontend/app/customer/checkout/page.tsx) | Updated API calls |
| [`app/customer/profile/page.tsx`](apps/frontend/app/customer/profile/page.tsx) | Updated API calls |
| [`components/address-form.tsx`](apps/frontend/components/address-form.tsx) | Updated API calls |
| [`components/profile-form-modal.tsx`](apps/frontend/components/profile-form-modal.tsx) | Updated API calls |

## Key Features

### 1. Unified API Client

```typescript
import { apiClient } from '@/lib/api-client';

// GET with auto-auth
const data = await apiClient.get('/public/outlets/list');

// POST with body
const result = await apiClient.post('/customers/login', credentials);

// Public endpoint (no auth)
const data = await apiClient.get('/public/menu/1', { skipAuth: true });

// Custom timeout (default: 30s)
const data = await apiClient.get('/slow-endpoint', { timeout: 60000 });
```

### 2. Automatic Token Management

- Checks `customerAccessToken` first (for customer auth)
- Falls back to `accessToken` (for admin auth)
- No need to manually pass tokens to API functions

### 3. Smart Error Handling

The system automatically handles:
- **Network errors** → "Cannot connect to server. Check if backend is running."
- **Timeouts** → "Request timeout. Check your connection."
- **401 Unauthorized** → "Authentication Required. Please log in."
- **403 Forbidden** → "Access Denied. No permission."
- **404 Not Found** → "Resource not found."
- **422 Validation** → "Validation Error. Check input."
- **5xx Server** → "Server Error. Try again later."

### 4. Toast Notifications

```typescript
import { useToast } from '@/components/ui/toast';

function MyComponent() {
  const { showToast } = useToast();

  // Success
  showToast('success', 'Saved!', 'Changes saved successfully');

  // Error
  showToast('error', 'Error', 'Something went wrong');
}
```

### 5. API Error Hook

```typescript
import { useApiError } from '@/lib/use-api-error';

function MyComponent() {
  const { handleApiError } = useApiError();

  try {
    await apiCall();
  } catch (error) {
    handleApiError(error); // Shows toast + logs to console
  }
}
```

## Migration Pattern

**Before (raw fetch):**
```typescript
const response = await fetch(`${API_URL}/endpoint`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
if (!response.ok) throw new Error('Failed');
```

**After (unified client):**
```typescript
await apiClient.get('/endpoint'); // Auto-includes auth + error handling
```

## TypeScript Verification

✅ All files compile successfully with `npx tsc --noEmit --skipLibCheck`

## Usage for New Modules

When creating new API modules, follow the pattern in [`API_CLIENT_GUIDE.md`](apps/frontend/API_CLIENT_GUIDE.md):

```typescript
// lib/my-new-api.ts
import { apiClient } from './api-client';

export async function getMyData() {
  return apiClient.get('/my-endpoint');
}

export async function createMyData(data: any) {
  return apiClient.post('/my-endpoint', data);
}
```

## Benefits

1. ✅ **Consistent error handling** across all API calls
2. ✅ **User-friendly error messages** instead of cryptic "Failed to fetch"
3. ✅ **Automatic token injection** — no need to pass tokens manually
4. ✅ **Timeout protection** — prevents hanging requests
5. ✅ **Type-safe** — full TypeScript support
6. ✅ **Reusable pattern** — all new modules can follow the same approach
7. ✅ **Toast notifications** — visual feedback for users

## Next Steps

For existing API modules not yet migrated (users-api.ts, restaurants-api.ts, etc.), follow the same pattern:
1. Import `apiClient`
2. Replace `fetch()` with `apiClient.get/post/put/delete()`
3. Remove manual `Authorization` headers
4. Update call sites to remove token parameters
