'use client';

import { useState } from 'react';
import ClaimForm from '@/components/claims/ClaimForm';
import ClaimSummary from '@/components/claims/ClaimSummary';
import { useOrderClaims } from '@/components/claims/useOrderClaims';
import { claimDay, type NewClaim } from '@/components/claims/claimTypes';

/**
 * "Report a problem" on a completed order: within the shop's window the customer can ask for a free repair or a refund.
 * Lists every report on the order and what to do next. The form opens inline, not as a pop-up.
 */
export default function OrderClaimsSection({ orderId, storeSlug }: Readonly<{ orderId: number; storeSlug?: string }>) {
  const { data, file, respond, escalate, uploadPhoto } = useOrderClaims(orderId, storeSlug);
  const [formOpen, setFormOpen] = useState(false);

  if (!data || (!data.can_file && data.claims.length === 0)) return null;

  const submit = async (claim: NewClaim) => {
    const ok = await file(claim);
    if (ok) setFormOpen(false);
    return ok;
  };

  return (
    <section aria-labelledby="order-claims-title" className="card-soft p-4">
      <h2 id="order-claims-title" className="mobile-h4 mb-1 text-ink">Report a problem</h2>

      {data.can_file && !formOpen && (
        <div className="space-y-3">
          <p className="mobile-body-sm text-ink-muted">Something wrong with your order? You have until {claimDay(data.window_ends_at)} to ask for a free repair or a refund.</p>
          <button type="button" onClick={() => setFormOpen(true)} className="flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-ink px-6 text-base font-semibold text-white active:opacity-80">Report a problem</button>
        </div>
      )}
      {!data.can_file && data.reason && <p className="mobile-body-sm text-ink-muted">{data.reason}</p>}
      {formOpen && <div className="mt-3"><ClaimForm deadline={claimDay(data.window_ends_at)} uploadPhoto={uploadPhoto} onSubmit={submit} onCancel={() => setFormOpen(false)} /></div>}

      {data.claims.length > 0 && (
        <ul className="mt-4 divide-y divide-line border-t border-line">
          {data.claims.map((c) => (
            <li key={c.id} className="py-4 last:pb-0">
              <ClaimSummary claim={c} onRespond={(choice) => respond(c.id, choice)} onEscalate={(message) => escalate(c.id, message)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
