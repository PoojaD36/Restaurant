/**
 * useApiError Hook
 *
 * A convenience hook for handling API errors and displaying them to users via toast notifications.
 * Use this in any component that makes API calls.
 *
 * Usage:
 *   const { handleApiError } = useApiError();
 *
 *   try {
 *     await someApiCall();
 *   } catch (error) {
 *     handleApiError(error);
 *   }
 */

import { useToast } from '../components/ui/toast';
import { parseError } from './error-handler';

export function useApiError() {
  const { showToast } = useToast();

  /**
   * Handle an API error and display it to the user
   */
  const handleApiError = (error: unknown, customMessage?: string) => {
    const parsed = parseError(error);

    // Show toast with error details
    showToast(
      'error',
      parsed.title,
      customMessage || parsed.message,
      6000, // Longer duration for errors
    );

    // Log to console for debugging
    console.error('[API Error]', parsed, error);
  };

  /**
   * Handle an API error silently (log to console only, no toast)
   */
  const handleSilentError = (error: unknown) => {
    const parsed = parseError(error);
    console.error('[API Error - Silent]', parsed, error);
  };

  return {
    handleApiError,
    handleSilentError,
  };
}
