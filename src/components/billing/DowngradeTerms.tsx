'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Lock, Minus } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import type { Plan } from './billingTypes';

/** Keep in step with SubscriptionUpgradeRequestController::DOWNGRADE_TERMS_VERSION. */
export const DOWNGRADE_TERMS_VERSION = '2026-11-20-2';

const LOCK_NOUN: Record<string, [string, string]> = {
  branch: ['branch shop', 'branch shops'],
  staff: ['staff account', 'staff accounts'],
  service: ['service', 'services'],
};

const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });

/** A plan's own feature lines (the admin's list), whatever shape the API sent. */
function featureList(plan: Plan): string[] {
  const raw = plan.features;
  if (Array.isArray(raw)) return raw.map((f) => f.trim()).filter(Boolean);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((f: string) => String(f).trim()).filter(Boolean);
    } catch { /* plain text, one per line */ }
    return raw.split('\n').map((f) => f.trim()).filter(Boolean);
  }
  return [];
}

const limit = (n: number | null | undefined) => (n === null || n === undefined ? null : n === -1 ? 'Unlimited' : String(n));

/**
 * Downgrade step 1 (before paying): what changes and when, the terms, and the
 * "I agree" box. A downgrade waits for the current period to end — nothing
 * is lost early — and the shop keeps everything in its plan until then.
 */
export default function DowngradeTerms({ from, to, endsAt, agreed, onAgree }: Readonly<{
  from: Plan;
  to: Plan;
  endsAt: string | null;
  agreed: boolean;
  onAgree: (v: boolean) => void;
}>) {
  const keep = new Set(featureList(to).map((f) => f.toLowerCase()));
  const lost = featureList(from).filter((f) => !keep.has(f.toLowerCase()) && !/^all .* features$/i.test(f));
  const limits = [
    { label: 'Staff accounts', from: limit(from.max_staff), to: limit(to.max_staff) },
    { label: 'Branch shops', from: limit(from.max_branches), to: limit(to.max_branches) },
    { label: 'Services', from: limit(from.max_services), to: limit(to.max_services) },
  ].filter((l) => l.from !== null && l.to !== null && l.from !== l.to);
  const when = endsAt ? day(endsAt) : 'the end of your current period';

  // What the smaller plan would lock today (server: PlanLimits::preview).
  const { store } = useAuthStore();
  const [wouldLock, setWouldLock] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    if (!store?.id) return;
    api.get(`/stores/${store.id}/plan-locks/preview`, { params: { plan_id: to.id } })
      .then((res) => setWouldLock(res.data?.data?.would_lock ?? {}))
      .catch(() => setWouldLock(null));
  }, [store?.id, to.id]);
  const lockLines = Object.entries(wouldLock ?? {}).filter(([, n]) => n > 0)
    .map(([type, n]) => `${n} ${n === 1 ? LOCK_NOUN[type]?.[0] : LOCK_NOUN[type]?.[1]}`);

  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-amber-900">You&apos;re moving from {from.name} to {to.name} on {when}</p>
          <p className="text-amber-900/80">
            You keep {from.name} and everything in it until then. On {when}, your shop switches to {to.name} for the period you pay for now.
          </p>
        </div>
      </div>

      {(lost.length > 0 || limits.length > 0) && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-ink">What changes on {when}</p>
          {lost.length > 0 && (
            <ul className="space-y-1.5 text-sm">
              {lost.map((f) => (
                <li key={f} className="flex items-start gap-2 text-ink-body">
                  <Minus size={15} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
                  <span>You lose <strong className="font-semibold text-ink">{f}</strong></span>
                </li>
              ))}
            </ul>
          )}
          {limits.length > 0 && (
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
              {limits.map((l) => (
                <div key={l.label} className="contents">
                  <dt className="text-ink-muted">{l.label}</dt>
                  <dd className="tabular-nums text-ink">{l.from} → <strong className="font-semibold">{l.to}</strong></dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {lockLines.length > 0 && (
        <div className="flex gap-3 rounded-xl border border-line bg-surface p-4 text-sm">
          <Lock size={18} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold text-ink">Locked on {when}: {lockLines.join(', ')}</p>
            <p className="text-xs leading-relaxed text-ink-muted">
              They&apos;re over {to.name}&apos;s limits. Nothing is deleted: the oldest stay open, the rest are locked (hidden from customers; locked staff can only view).
              You can choose which ones stay open in Branches, Staff and Services, or upgrade to unlock them all.
            </p>
          </div>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-sm font-semibold text-ink">Downgrade terms</p>
        <ol className="max-h-44 list-decimal space-y-2 overflow-y-auto rounded-xl border border-line bg-surface py-3 pl-8 pr-4 text-xs leading-relaxed text-ink-body" tabIndex={0} aria-label="Downgrade terms">
          <li>The switch to {to.name} happens automatically on {when}, once this payment is confirmed.</li>
          <li>Until then your shop stays on {from.name} with all its features. No days are lost, and none are refunded.</li>
          <li>From {when}, {to.name}&apos;s features and limits apply. Anything above its limits (extra branch shops, staff accounts, services) is locked, not deleted: it is hidden from customers and unavailable (locked staff can only view) until you upgrade again or choose which ones stay open. Upgrading unlocks it right away.</li>
          <li>A paid downgrade cannot be cancelled once the payment is confirmed. Plan payments are non-refundable except as stated in SUTURA&apos;s refund policy.</li>
          <li>You can upgrade again at any time. Days left on your plan carry over to the higher plan.</li>
        </ol>
        <p className="mt-1 text-[11px] text-ink-faint">Terms version {DOWNGRADE_TERMS_VERSION}</p>
      </div>

      {/* relative: keeps the visually hidden checkbox inside this label, so focusing it
          doesn't scroll the dialog to wherever the page would otherwise place it. */}
      <label className="relative flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-white p-3.5 hover:border-line-strong">
        <input type="checkbox" checked={agreed} onChange={(e) => onAgree(e.target.checked)} className="peer sr-only" />
        <span aria-hidden="true" className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-taupe ${agreed ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white'}`}>
          {agreed && <Check size={13} strokeWidth={3} />}
        </span>
        <span className="text-sm text-ink">
          I understand that my shop moves to {to.name} on {when}, and I agree to these terms.
        </span>
      </label>
    </div>
  );
}
