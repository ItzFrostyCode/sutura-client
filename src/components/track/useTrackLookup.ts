'use client';

import { useCallback, useState } from 'react';
import axios from 'axios';
import api from '@/lib/axios';

/** What the public tracker answers: only the stage and the day it last changed (JobOrderTrackingController::show). */
export interface PublicTrack {
  stage: string;
  updated_on: string | null;
}

export interface TrackFound {
  code: string;
  order: PublicTrack;
}

/** Codes are the shop's prefix + 6 random letters/digits; the server ignores dashes and spaces. */
const CODE_SHAPE = /^[A-Z0-9]{6,20}$/;

export const normalizeTrackingCode = (raw: string) => raw.trim().toUpperCase();

/**
 * One set of rules for every tracking box (the Discover "Track your order" card and the /track page):
 *   empty            → "Enter your tracking code first."
 *   wrong shape      → "That doesn't look like a tracking code…" (no request sent)
 *   server 404       → "No order found for that code…" (unknown, or not yet accepted for production)
 *   server 429       → "Too many tries…"
 *   anything else    → "Could not check the code right now…"
 *   found            → resolves with the order; the caller decides what to show next.
 */
export function useTrackLookup(initialCode = '') {
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const check = useCallback(async (raw?: string): Promise<TrackFound | null> => {
    const value = normalizeTrackingCode(raw ?? code);
    if (!value) {
      setError('Enter your tracking code first.');
      return null;
    }
    if (!CODE_SHAPE.test(value.replace(/[-\s]/g, ''))) {
      setError('That doesn’t look like a tracking code. Check the code from your shop and enter it again.');
      return null;
    }

    setChecking(true);
    setError('');
    try {
      const res = await api.get(`/track/${encodeURIComponent(value)}`);
      return { code: value, order: res.data.data as PublicTrack };
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 404) setError('No order found for that code. Check the code from your shop and enter the correct one. A code works once the shop has accepted your order.');
      else if (status === 429) setError('Too many tries. Wait a minute, then try again.');
      else setError('Could not check the code right now. Check your connection and try again.');
      return null;
    } finally {
      setChecking(false);
    }
  }, [code]);

  const onCodeChange = useCallback((value: string) => {
    setCode(value.toUpperCase());
    if (error) setError('');
  }, [error]);

  return { code, setCode, onCodeChange, error, checking, check };
}
