'use client';

import React, { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import PayMethodDialog from './PayMethodDialog';
import ShopPayChannels from './ShopPayChannels';
import { usePayForOrder, type ShopPaymentMethod } from './usePayForOrder';

interface PayForOrderProps {
  readonly orderId: number;
  readonly storeSlug?: string;
  readonly branchId?: number | null;
  readonly totalAmount: number;
  readonly balance: number;
  readonly pending: number;
  readonly requiredDeposit?: number;
  readonly depositLabel?: string;
  readonly active: boolean;
  readonly onSubmitted: () => void;
}

// "Pay for this order": the shop's account (same card as the About tab), then one clear button to send the proof.
export default function PayForOrder({ orderId, storeSlug, branchId, totalAmount, balance, pending, requiredDeposit = 0, depositLabel = 'Deposit', active, onSubmitted }: Readonly<PayForOrderProps>) {
  const pay = usePayForOrder(orderId, storeSlug, branchId, onSubmitted);
  const [chosen, setChosen] = useState<ShopPaymentMethod | null>(null);
  const outstanding = Math.max(0, Math.round((balance - pending) * 100) / 100);

  // Opened from "Pay ₱X" on My Orders (#pay): scroll here once the box has loaded.
  useEffect(() => {
    if (pay.loading || typeof window === 'undefined' || window.location.hash !== '#pay') return;
    document.getElementById('pay')?.scrollIntoView({ block: 'start' });
  }, [pay.loading]);

  if (!active || pay.loading || balance <= 0) return null;
  if (outstanding <= 0) {
    return <p id="pay" className="mobile-caption px-1 text-ink-muted mb-4 scroll-mt-20">Your payment was sent and is waiting for the shop to verify it.</p>;
  }
  // Never an empty side column: a shop without online payment methods still tells the customer how to pay.
  if (pay.methods.length === 0) {
    return (
      <section id="pay" className="card-soft p-4 mb-4 scroll-mt-20" aria-label="Pay for this order">
        <h2 className="mobile-h4 text-ink">Pay for this order</h2>
        <p className="mobile-body-sm mt-1 text-ink-muted">₱{outstanding.toLocaleString()} left to pay. This shop takes payment in person — pay at the shop on your next visit.</p>
      </section>
    );
  }

  return (
    <section id="pay" className="card-soft p-4 mb-4 scroll-mt-20" aria-label="Pay for this order">
      <h2 className="mobile-h4 text-ink">Pay for this order</h2>
      <p className="mobile-body-sm mt-1 text-ink-muted">₱{outstanding.toLocaleString()} left to pay. Pay the shop in your app, then send your proof here.</p>
      {requiredDeposit > 0 && totalAmount - balance + 0.005 < requiredDeposit && (
        <p className="mobile-body-sm mt-1 text-ink">The shop needs {depositLabel.toLowerCase()} (₱{requiredDeposit.toLocaleString()}) before it starts making your order.</p>
      )}
      <div className="mt-4">
        <ShopPayChannels
          methods={pay.methods}
          action={(m) => (
            <button type="button" onClick={() => setChosen(m)} className="flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink px-4 text-base font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80">
              <Upload size={18} /> I&apos;ve paid — send proof
            </button>
          )}
        />
      </div>
      <PayMethodDialog
        method={chosen}
        outstanding={outstanding}
        depositDue={Math.max(0, Math.round((requiredDeposit - (totalAmount - balance) - pending) * 100) / 100)}
        depositLabel={depositLabel}
        uploading={pay.uploading}
        submitting={pay.submitting}
        onClose={() => setChosen(null)}
        onUpload={pay.uploadProof}
        onSubmit={(p) => (chosen ? pay.submit({ methodId: chosen.id, ...p }) : Promise.resolve(false))}
      />
    </section>
  );
}
