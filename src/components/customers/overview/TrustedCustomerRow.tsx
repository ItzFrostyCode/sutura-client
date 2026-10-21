import React, { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';

interface Props {
  readonly customerId: number;
  readonly trusted: boolean;
  /** Only the owner and a branch manager can change it. */
  readonly canChange: boolean;
  readonly onChanged: () => void;
}

/** "Trusted customer": new orders for them start with no deposit; the full balance is still paid before the garments are handed over. */
export default function TrustedCustomerRow({ customerId, trusted, canChange, onChanged }: Props) {
  const store = useAuthStore((s) => s.store);
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (!store || busy) return;
    setBusy(true);
    try {
      await api.put(`/stores/${store.id}/customers/${customerId}/trusted`, { trusted: !trusted });
      toast.success(trusted ? 'No longer marked as trusted.' : 'Marked as a trusted customer.');
      onChanged();
    } catch {
      toast.error('Could not change this. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
      <div className="flex min-w-0 items-start gap-3">
        <ShieldCheck size={18} className={`mt-0.5 shrink-0 ${trusted ? 'text-sage' : 'text-ink-faint'}`} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Trusted customer</p>
          <p className="text-xs text-ink-muted">New orders start with no deposit. The full balance is still paid before the garments are handed over.</p>
        </div>
      </div>
      {canChange ? (
        <button
          type="button"
          role="switch"
          aria-checked={trusted}
          aria-label="Trusted customer"
          disabled={busy}
          onClick={toggle}
          className={`relative flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-60 ${trusted ? 'bg-sage' : 'bg-black/15'}`}
        >
          {busy ? <Loader2 size={14} className="mx-auto animate-spin text-white" /> : <span className={`absolute left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${trusted ? 'translate-x-6' : ''}`} />}
        </button>
      ) : (
        <span className="text-xs font-semibold text-ink-muted">{trusted ? 'Yes' : 'No'}</span>
      )}
    </div>
  );
}
