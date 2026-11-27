'use client';

import React, { useEffect, useState } from 'react';
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

  // Opened from "Pay ₱X" on My Orders (#pay): scroll here once the box has loaded.
  useEffect(() => {
    if (pay.loading || typeof window === 'undefined' || window.location.hash !== '#pay') return;
    document.getElementById('pay')?.scrollIntoView({ block: 'start' });
  }, [pay.loading]);

  if (!active || pay.loading || balance <= 0) return null;
  if (outstanding <= 0) {
    return (
      <div id="pay" className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4 scroll-mt-20">
        <p className="text-xs font-medium text-amber-800">
          Your payment was sent and is waiting for the shop to verify it.
        </p>
      </div>
    );
  }
  if (pay.methods.length === 0) {
    // Never a silent gap: say why there's no pay button.
    return (
      <section id="pay" className="bg-surface border border-line rounded-2xl p-4 sm:p-5 mb-4 scroll-mt-20" aria-label="Pay for this order">
        <h2 className="text-sm font-bold text-ink tabular-nums">₱{outstanding.toLocaleString()} left to pay</h2>
        <p className="text-xs text-ink-muted mt-1 leading-relaxed">
          This shop hasn&apos;t added a GCash or bank account for online payment yet. Pay at the shop, or check back here later.
        </p>
      </section>
    );
  }

  return (
    <section id="pay" className="bg-surface border border-line rounded-2xl p-4 sm:p-5 mb-4 scroll-mt-20" aria-label="Pay for this order">
      <h2 className="text-sm font-bold text-ink">Pay for this order</h2>
      <p className="text-xs text-ink-muted mt-1 tabular-nums">
        ₱{outstanding.toLocaleString()} left to pay. Choose where to pay, then send your proof.
      </p>
      {requiredDeposit > 0 && totalAmount - balance + 0.005 < requiredDeposit && (
        <p className="text-xs text-ink mt-1 tabular-nums">
          The shop needs {depositLabel.toLowerCase()} (₱{requiredDeposit.toLocaleString()}) before it starts making your order.
        </p>
      )}
      <ul className="grid grid-cols-1 min-[600px]:grid-cols-2 gap-2.5 mt-3">
        {pay.methods.map((m) => {
          const Icon = ICON[m.kind] ?? Wallet;
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setChosen(m)}
                className="w-full min-h-16 rounded-xl border border-line-strong bg-surface hover:bg-sunken p-3 flex items-center gap-3 text-left cursor-pointer transition-colors duration-150 active:scale-[0.98]"
              >
                <div className="w-9 h-9 rounded-lg bg-sunken flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-taupe" />
                </div>
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
