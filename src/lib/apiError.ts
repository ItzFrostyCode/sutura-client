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

/**
 * Logs a failed API call only when it's unexpected. A deliberate refusal from
 * the server (any 4xx: validation, the deposit gate, a read-only shop) is
 * already shown to the user in a toast; console.error-ing it also pops the
 * Next.js dev error overlay over that toast, which reads like a crash.
 */
export function logUnexpectedError(label: string, err: unknown): void {
  const status = axios.isAxiosError(err) ? err.response?.status : undefined;
  if (status !== undefined && status >= 400 && status < 500) return;
  console.error(label, err);
}
