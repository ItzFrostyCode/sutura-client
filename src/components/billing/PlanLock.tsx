'use client';

import { useState } from 'react';
import { Loader2, Lock, LockOpen } from 'lucide-react';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import { useAuthStore } from '@/store/useAuthStore';

export type PlanLockType = 'branch' | 'staff' | 'service';

const NOUN: Record<PlanLockType, string> = { branch: 'branch shop', staff: 'staff account', service: 'service' };

/** "Locked by plan" pill: over the plan's limit, kept (never deleted) but switched off. */
export function PlanLockedTag({ className = '' }: Readonly<{ className?: string }>) {
  return (
    <span
      title="Over your plan's limit. Nothing was deleted; upgrade, or unlock it in place of another."
      className={`inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 ${className}`}
    >
      <Lock size={10} aria-hidden="true" /> Locked by plan
    </span>
  );
}

/**
 * Owner-only "Unlock" for an item the plan locked. With room under the limit
 * it just unlocks; when the plan is full the owner picks an open item of the
 * same kind to lock in its place (the server enforces the limit either way).
 */
export function PlanUnlockButton({ type, id, name, openItems, onDone, compact = false }: Readonly<{
  type: PlanLockType;
  id: number;
  name: string;
  /** The open (not locked) items of the same kind — the swap choices. */
  openItems: { id: number; name: string }[];
  onDone: () => void;
  compact?: boolean;
}>) {
  const toast = useToast();
  const { store, user } = useAuthStore();
  const isOwner = user?.roles?.some((r) => r.name === 'store_owner');
  const [picking, setPicking] = useState(false);
  const [swapWith, setSwapWith] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isOwner || !store) return null;

  const send = async (swapWithId: number | null) => {
    setBusy(true);
    try {
      const res = await api.post(`/stores/${store.id}/plan-locks/${type}/${id}/unlock`, swapWithId ? { swap_with_id: swapWithId } : {});
      toast.success(res.data.message ?? `${name} is open again.`);
      setPicking(false);
      onDone();
    } catch (err: unknown) {
      const data = (err as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } }).response;
      if (data?.status === 422 && data.data?.errors?.swap_with_id && !swapWithId) {
        setSwapWith(openItems[openItems.length - 1]?.id ?? null);
        setPicking(true);
      } else {
        toast.error(Object.values(data?.data?.errors ?? {})[0]?.[0] ?? data?.data?.message ?? 'Could not unlock it. Try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); void send(null); }}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50 cursor-pointer ${compact ? 'h-8 px-2.5 text-xs' : 'h-9 px-3 text-xs'}`}
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <LockOpen size={13} aria-hidden="true" />} Unlock
      </button>

      <Modal
        isOpen={picking}
        onClose={() => setPicking(false)}
        title={`Unlock ${name}?`}
        maxWidth="max-w-md"
        footer={
          <>
            <button type="button" onClick={() => setPicking(false)} className="h-11 px-5 border border-line-strong bg-white text-sm font-medium text-ink hover:bg-sunken cursor-pointer">Cancel</button>
            <button type="button" disabled={busy || !swapWith} onClick={() => void send(swapWith)} className="h-11 px-5 bg-taupe hover:bg-taupe/90 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50">
              {busy && <Loader2 size={16} className="animate-spin" />} Swap
            </button>
          </>
        }
      >
        <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-ink-body">
            Your plan is full. To open <strong className="text-ink">{name}</strong>, choose an open {NOUN[type]} to lock in its place. Nothing is deleted, and you can swap back any time.
          </p>
          <fieldset className="space-y-2">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-muted">Lock instead</legend>
            {openItems.length === 0 && <p className="text-sm text-ink-muted">No open {NOUN[type]}s to swap with. Upgrade your plan to open more.</p>}
            {openItems.map((o) => (
              <label key={o.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm ${swapWith === o.id ? 'border-ink bg-white' : 'border-line bg-surface hover:border-line-strong'}`}>
                <input type="radio" name={`swap-${type}-${id}`} checked={swapWith === o.id} onChange={() => setSwapWith(o.id)} className="accent-[#2B2522]" />
                <span className="text-ink">{o.name}</span>
              </label>
            ))}
          </fieldset>
        </div>
      </Modal>
    </>
  );
}
