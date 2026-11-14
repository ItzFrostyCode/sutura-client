'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import type { ClaimsPayload, NewClaim } from './claimTypes';

/** The claims on one of the customer's orders, and the four things they can do: file, answer an offer, ask support, add photos. */
export function useOrderClaims(orderId: number, storeSlug?: string) {
  const toast = useToast();
  const [data, setData] = useState<ClaimsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => api.get(`/my-orders/${orderId}/claims`)
    .then((res) => { setData(res.data.data); setFailed(false); })
    .catch(() => setFailed(true))
    .finally(() => setLoading(false)), [orderId]);

  useEffect(() => { void load(); }, [load]);

  /** Runs one request, shows the server's own message, and reloads on success. Returns whether it worked. */
  const act = async (request: () => Promise<{ data?: { message?: string } }>, done: string, fallback: string) => {
    try {
      const res = await request();
      toast.success(res.data?.message ?? done);
      await load();
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, fallback));
      return false;
    }
  };

  const file = (claim: NewClaim) => act(() => api.post(`/my-orders/${orderId}/claims`, claim), 'Your report was sent to the shop.', 'Could not send your report. Try again.');
  const respond = (claimId: number, choice: 'repair' | 'refund') => act(() => api.post(`/my-orders/${orderId}/claims/${claimId}/respond`, { choice }), 'Your answer was sent.', 'Could not send your answer. Try again.');
  const escalate = (claimId: number, message: string) => act(() => api.post(`/my-orders/${orderId}/claims/${claimId}/escalate`, { message }), 'Sent to SUTURA support.', 'Could not send this to support. Try again.');

  /** Uploads one photo and returns its address, or null when it failed. */
  const uploadPhoto = async (picked: File): Promise<string | null> => {
    if (!storeSlug) { toast.error('Photos cannot be added to this order.'); return null; }
    const body = new FormData();
    body.append('file', picked);
    try {
      const res = await api.post(`/public/stores/${storeSlug}/upload-reference-image`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data?.data?.url || res.data?.url || null;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not upload the photo. Use a JPG, PNG or WebP under 5 MB.'));
      return null;
    }
  };

  return { data, loading, failed, file, respond, escalate, uploadPhoto };
}
