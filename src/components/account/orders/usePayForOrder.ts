import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';

export interface ShopPaymentMethod {
  id: number; kind: string; name: string; account_name: string; account_number: string;
  qr_path?: string | null; instructions?: string | null;
}

// The customer pays OUTSIDE SUTURA (GCash, Maya, bank), then sends proof here for the shop to verify.
export function usePayForOrder(orderId: number, storeSlug: string | undefined, branchId: number | null | undefined, onSubmitted: () => void) {
  const toast = useToast();
  const [methods, setMethods] = useState<ShopPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!storeSlug) return;
    api.get(`/public/stores/${storeSlug}/payment-methods`, { params: branchId ? { branch_id: branchId } : {} })
      .then((r) => setMethods(r.data?.data ?? []))
      .catch(() => setMethods([]))
      .finally(() => setLoading(false));
  }, [storeSlug, branchId]);

  const uploadProof = async (file: File): Promise<string | null> => {
    if (!storeSlug) return null;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post(`/public/stores/${storeSlug}/upload-receipt`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data?.data?.url ?? null;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not upload the screenshot.'));
      return null;
    } finally {
      setUploading(false);
    }
  };

  const submit = async (p: { methodId: number; amount: number; reference: string; receiptPath: string }): Promise<boolean> => {
    setSubmitting(true);
    try {
      await api.post(`/my-orders/${orderId}/payments`, { payment_method_id: p.methodId, amount: p.amount, reference: p.reference || null, receipt_path: p.receiptPath });
      toast.success('Payment sent — the shop will verify it and update your balance.');
      onSubmitted();
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not send your payment.'));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { methods, loading, uploading, submitting, uploadProof, submit };
}
