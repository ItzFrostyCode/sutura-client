'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';

export type AvailabilityState = 'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'error';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Philippine mobile: 11 digits starting with 09 (e.g. 09663946888). */
export const PH_MOBILE_PATTERN = /^09\d{9}$/;

const DEBOUNCE_MS = 500;

/**
 * "Is this already registered?" for one field of the Open-a-shop form.
 * Checks 500 ms after typing stops, or right away when the field loses
 * focus. Empty or badly formatted values are never sent; answers for an
 * older value are ignored once the user has typed something new.
 */
export function useAvailabilityCheck(
  field: 'email' | 'contact_number',
  value: string,
  isValid: (v: string) => boolean,
  /** Which check to ask: the shop application (default) or customer sign-up (/auth/check-email). */
  endpoint = '/store-applications/check-availability',
) {
  const [state, setState] = useState<AvailabilityState>('idle');
  // The server's word when not available ("taken", "shop_login", …), for the message.
  const [reason, setReason] = useState<string>('');
  const latest = useRef(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Last answer from the server, so blur right after the debounce doesn't ask twice.
  const answered = useRef<{ value: string; result: 'available' | 'taken'; reason: string } | null>(null);

  const run = useCallback(async (v: string) => {
    if (timer.current) clearTimeout(timer.current);
    const trimmed = v.trim();
    if (!trimmed) { setState('idle'); return; }
    if (!isValid(trimmed)) { setState('invalid'); return; }
    if (answered.current?.value === trimmed) { setReason(answered.current.reason); setState(answered.current.result); return; }
    setState('checking');
    try {
      const res = await api.get(endpoint, { params: { [field]: trimmed } });
      if (latest.current.trim() !== trimmed) return; // user kept typing; a newer check will answer
      const raw = String(res.data?.data?.[field] ?? 'available');
      const result = raw === 'available' ? 'available' : 'taken';
      answered.current = { value: trimmed, result, reason: raw };
      setReason(raw);
      setState(result);
    } catch {
      if (latest.current.trim() === trimmed) setState('error');
    }
  }, [field, isValid, endpoint]);

  useEffect(() => {
    latest.current = value;
    if (timer.current) clearTimeout(timer.current);
    const trimmed = value.trim();
    if (!trimmed) { setState('idle'); return; }
    // While typing, don't flag the format yet; just wait for the pause.
    setState((s) => (s === 'invalid' || s === 'taken' || s === 'available' || s === 'error' ? 'idle' : s));
    timer.current = setTimeout(() => void run(value), DEBOUNCE_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [value, run]);

  /** Call from the input's onBlur: check now instead of waiting. */
  const checkNow = useCallback(() => void run(latest.current), [run]);

  return { state, reason, checkNow };
}
