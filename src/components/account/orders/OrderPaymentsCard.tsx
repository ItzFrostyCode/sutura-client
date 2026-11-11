import { CheckCircle2, Clock, XCircle } from 'lucide-react';

/** One payment on the order, as the customer sees it (no staff names, no internal notes). */
export interface OrderPayment {
  id: number;
  amount: number;
  method: string | null;
  reference: string | null;
  /** 'walk_in' = paid in person and recorded by the shop; 'online' = proof the customer sent. */
  source?: string | null;
  paid_at: string;
  status: 'pending_verification' | 'verified' | 'rejected';
  decided_at: string | null;
  rejected_reason: string | null;
}

const STATUS = {
  pending_verification: { label: 'Waiting for the shop', Icon: Clock, tone: 'bg-amber-50 text-amber-800' },
  verified: { label: 'Paid', Icon: CheckCircle2, tone: 'bg-sage/10 text-sage' },
  rejected: { label: 'Rejected', Icon: XCircle, tone: 'bg-danger/10 text-danger' },
} as const;

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const day = (iso: string) => new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const methodLabel = (m: string | null) => (m ? m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).replace('Gcash', 'GCash') : 'Payment');

/**
 * "Your Payments": every payment on this order and what the shop decided — waiting, approved, or rejected with the
 * shop's reason. The customer-side view of the shop's Collect Payments (verify / reject).
 */
export default function OrderPaymentsCard({ payments, canPayAgain }: { readonly payments: OrderPayment[]; readonly canPayAgain: boolean }) {
  return (
    <section aria-labelledby="order-payments-title" className="card-soft p-4">
      <h2 id="order-payments-title" className="mobile-h4 mb-3 text-ink">Your Payments</h2>
      <ul className="divide-y divide-line">
        {payments.map((p) => {
          const s = STATUS[p.status] ?? STATUS.pending_verification;
          return (
            <li key={p.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-ink">{peso(p.amount)} <span className="text-sm font-normal text-ink-muted">· {methodLabel(p.method)}</span></p>
                  <p className="mobile-caption mt-0.5 text-ink-muted">
                    {p.source === 'walk_in' ? 'Paid at the shop' : 'Sent'} {day(p.paid_at)}{p.reference ? <> · Ref <span className="font-mono">{p.reference}</span></> : null}
                  </p>
                </div>
                <span className={`mobile-caption inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${s.tone}`}>
                  <s.Icon size={13} aria-hidden /> {s.label}
                </span>
              </div>
              {p.status === 'rejected' && (
                <div className="mt-2 rounded-xl bg-danger/5 px-3 py-2">
                  <p className="mobile-body-sm text-ink"><span className="font-semibold">Shop&apos;s reason:</span> {p.rejected_reason || 'No reason given.'}</p>
                  {canPayAgain && <p className="mobile-caption mt-1 text-ink-muted">This amount was not counted. Send a new proof with Pay for this order.</p>}
                </div>
              )}
              {p.status === 'verified' && <p className="mobile-caption mt-1 text-ink-muted">{p.source === 'walk_in' ? 'Recorded by the shop' : `Approved ${p.decided_at ? day(p.decided_at) : ''}`} — counted in your balance.</p>}
              {p.status === 'pending_verification' && <p className="mobile-caption mt-1 text-ink-muted">Not in your balance yet; it is counted once the shop approves it.</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
