'use client';

import React, { useState } from 'react';
import { Landmark, Smartphone, Wallet } from 'lucide-react';
import PayMethodDialog from './PayMethodDialog';
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

const ICON: Record<string, React.ElementType> = { gcash: Smartphone, maya: Smartphone, bank_transfer: Landmark, other: Wallet };

// "Pay for this order": the shop's payment methods as cards; tap one to see where to pay and send proof.
export default function PayForOrder({ orderId, storeSlug, branchId, totalAmount, balance, pending, requiredDeposit = 0, depositLabel = 'Deposit', active, onSubmitted }: Readonly<PayForOrderProps>) {
  const pay = usePayForOrder(orderId, storeSlug, branchId, onSubmitted);
  const [chosen, setChosen] = useState<ShopPaymentMethod | null>(null);
  const outstanding = Math.max(0, Math.round((balance - pending) * 100) / 100);

  if (!active || pay.loading || balance <= 0) return null;
  if (outstanding <= 0) {
    return <p className="mobile-caption text-ink-muted font-normal mt-4">Your payment was sent and is waiting for the shop to verify it.</p>;
  }
  if (pay.methods.length === 0) return null;

  return (
    <section className="bg-surface border border-line p-4 mt-4" aria-label="Pay for this order">
      <h2 className="mobile-h4 font-semibold text-ink">Pay for this order</h2>
      <p className="mobile-body-sm text-ink-muted font-normal mt-1">₱{outstanding.toLocaleString()} left to pay. Choose where to pay, then send your proof.</p>
      {requiredDeposit > 0 && totalAmount - balance + 0.005 < requiredDeposit && (
        <p className="mobile-body-sm text-ink font-normal mt-1">The shop needs {depositLabel.toLowerCase()} (₱{requiredDeposit.toLocaleString()}) before it starts making your order.</p>
      )}
      <ul className="grid grid-cols-1 min-[600px]:grid-cols-2 gap-3 mt-3">
        {pay.methods.map((m) => {
          const Icon = ICON[m.kind] ?? Wallet;
          return (
            <li key={m.id}>
              <button type="button" onClick={() => setChosen(m)} className="w-full min-h-16 border border-line-strong bg-white hover:bg-sunken p-3 flex items-center gap-3 text-left cursor-pointer">
                <Icon size={20} className="text-taupe shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink truncate">{m.name}</span>
                  <span className="block text-xs text-ink-muted truncate">{m.account_name} · {m.account_number}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
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
