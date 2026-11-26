import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';

export interface ShopPaymentMethod {
  id: number; kind: string; name: string; account_name: string; account_number: string;
  /** null = the whole shop; else the one branch it belongs to. */
  store_branch_id?: number | null;
  qr_path?: string | null; instructions?: string | null;
}

/** Where this shop takes online payments (GCash only, per the thesis), for the order's branch. Shown on the quotation and on Pay for this order. */
export function useShopPaymentMethods(storeSlug: string | undefined, branchId: number | null | undefined) {
  const [methods, setMethods] = useState<ShopPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeSlug) {
      setLoading(false);
      return;
    }
    api.get(`/public/stores/${storeSlug}/payment-methods`, { params: branchId ? { branch_id: branchId } : {} })
      .then((r) => {
        const all: ShopPaymentMethod[] = r.data?.data ?? [];
        // Locked to GCash only per validated thesis requirement
        const gcash = all.filter((m) => m.kind.toLowerCase() === 'gcash' || m.name.toLowerCase().includes('gcash'));
        setMethods(gcash.length > 0 ? gcash : all);
      })
      .catch(() => setMethods([]))
      .finally(() => setLoading(false));
  }, [storeSlug, branchId]);

  return { methods, loading };
}

// The customer pays OUTSIDE SUTURA (GCash, Maya, bank), then sends proof here for the shop to verify.
export function usePayForOrder(orderId: number, storeSlug: string | undefined, branchId: number | null | undefined, onSubmitted: () => void) {
  const toast = useToast();
  const { methods, loading } = useShopPaymentMethods(storeSlug, branchId);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
