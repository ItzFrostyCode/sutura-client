import axios from 'axios';

/**
 * Extracts the backend's specific validation message from a failed API call
 * (e.g. "Only JPG, PNG, or WEBP images are supported..." from a 422) instead
 * of Laravel's generic top-level "The given data was invalid." — so a HEIC
 * upload, an oversized file, and a network error each surface their own real
 * reason instead of one hardcoded guess.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { errors?: Record<string, string[]>; message?: string } | undefined;
    const firstFieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined;
    if (firstFieldError) return firstFieldError;

    if (data?.message && data.message !== 'The given data was invalid.') {
      return data.message;
    }
  }
  return fallback;
}
