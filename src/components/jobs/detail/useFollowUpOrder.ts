import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import { newFollowUpOrderHref } from '../board/newOrderHref';
import type { Job } from '../jobTypes';

export type FollowUpWhy = '' | 'shop' | 'customer';

/** The follow-up form's answers and its two ways out: a free fix (made here, lands in Confirmed) or the pre-filled new-order form (goes through Request). */
export function useFollowUpOrder(storeId: number, job: Job) {
  const router = useRouter();
  const toast = useToast();
  const [why, setWhy] = useState<FollowUpWhy>('');
  const [description, setDescription] = useState('');
  const [pieces, setPieces] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const createFreeFix = async (focusField: (id: string) => void) => {
    if (!description.trim()) { setError('Tell us what needs fixing.'); focusField('follow-up-description'); return; }
    const count = pieces.trim() === '' ? null : Number(pieces);
    if (count !== null && (!Number.isInteger(count) || count < 1)) { setError('Pieces must be a whole number, 1 or more.'); focusField('follow-up-pieces'); return; }
    setError('');
    setBusy(true);
    try {
      const res = await api.post(`/stores/${storeId}/jobs/${job.id}/free-fix`, { description: description.trim(), pieces: count ?? undefined });
      toast.success('Free fix order created.');
      router.push(`/dashboard/jobs/${res.data?.data?.id ?? ''}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create the free fix order.'));
      setBusy(false);
    }
  };

  const createOrder = () => router.push(newFollowUpOrderHref(job));

  return { why, setWhy, description, setDescription, pieces, setPieces, error, busy, createFreeFix, createOrder };
}
