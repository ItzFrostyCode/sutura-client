import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import type { ReadinessData, RefundSuggestion } from './readinessTypes';

export type RefundType = 'full' | 'minus_materials' | 'partial' | 'none';

/** Work started -> partial; materials marked ready -> minus materials; otherwise nothing was spent -> full. */
export function preselectRefundType(data: ReadinessData): RefundType {
  if (data.quotation?.production_started_at) return 'partial';
  return data.materials?.ready ? 'minus_materials' : 'full';
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The refund choice (type, what the shop can't recover, reason) and the one request that records it. */
export function useRefundForm(storeId: number, jobId: number, data: ReadinessData, onRecorded: () => void) {
  const toast = useToast();
  const base = `/stores/${storeId}/jobs/${jobId}`;
  const [suggestion, setSuggestion] = useState<RefundSuggestion | null>(null);
  const [type, setType] = useState<RefundType>(() => preselectRefundType(data));
  const [cost, setCost] = useState('');
  const [costNote, setCostNote] = useState('');
  const [reason, setReason] = useState('');
  const [handedBack, setHandedBack] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`${base}/refund-suggestion`).then((res) => setSuggestion(res.data.data)).catch(() => setSuggestion(null));
  }, [base]);

  const paid = suggestion?.paid_amount ?? 0;
  const costs = type === 'minus_materials' || type === 'partial' ? Math.min(paid, Math.max(0, round2(Number(cost) || 0))) : 0;
  const refund = type === 'none' ? 0 : round2(Math.max(0, paid - costs));

  const record = async (focusField: (id: string) => void) => {
    if ((type === 'minus_materials' || type === 'partial') && costs <= 0) {
      setError('Enter what the shop cannot recover, or choose Full refund.'); focusField('refund-cost'); return;
    }
    if (type === 'none' && !reason.trim()) { setError('Say why no refund is given.'); focusField('refund-reason'); return; }
    setError('');
    setSaving(true);
    try {
      await api.post(`${base}/refunds`, {
        approved_amount: refund, non_refundable: costs, non_refundable_note: costNote.trim() || null,
        adjustment_reason: type === 'none' ? reason.trim() : null, notes: type === 'none' ? 'No refund given.' : null,
        mark_refunded: type !== 'none' && handedBack,
      });
      toast.success(type === 'none' ? 'Recorded: no refund.' : 'Refund recorded.');
      onRecorded();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not record the refund.'));
    } finally {
      setSaving(false);
    }
  };

  return { suggestion, paid, type, setType, cost, setCost, costNote, setCostNote, reason, setReason, handedBack, setHandedBack, costs, refund, error, saving, record };
}
