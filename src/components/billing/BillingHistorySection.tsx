import { History } from 'lucide-react';
import Badge from '@/components/shared/Badge';
import type { Subscription } from './billingTypes';

interface BillingHistorySectionProps {
  currentSubscription: Subscription | null;
}

const statusVariant: Record<string, 'success' | 'accent' | 'danger' | 'neutral'> = {
  active: 'success',
  trial: 'accent',
  cancelled: 'danger',
  expired: 'neutral',
};

export default function BillingHistorySection({
  currentSubscription,
}: BillingHistorySectionProps) {
  return (
    <section className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-taupe flex items-center gap-1.5">
        <History size={12} /> Subscription History
      </p>
      <div className="bg-surface border border-line rounded-2xl overflow-hidden">
        {currentSubscription ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-canvas border-b border-line">
                <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Started
                </th>
                <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Plan
                </th>
                <th className="text-right px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Rate
                </th>
                <th className="text-center px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr>
                <td className="px-5 py-3.5 text-ink-body">
                  {currentSubscription.starts_at
                    ? new Date(currentSubscription.starts_at).toLocaleDateString('en-PH', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </td>
                <td className="px-5 py-3.5 text-ink font-medium">
                  {currentSubscription.plan?.name ?? '—'}
                </td>
                <td className="px-5 py-3.5 text-right font-semibold text-ink">
                  ₱{(currentSubscription.plan?.price_monthly ?? 0).toLocaleString()}/mo
                </td>
                <td className="px-5 py-3.5 text-center">
                  <Badge variant={statusVariant[currentSubscription.status] ?? 'neutral'}>
                    {currentSubscription.status}
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-ink-faint text-sm">
            No subscription history yet.
          </div>
        )}
        <div className="px-5 py-3.5 border-t border-line bg-canvas">
          <p className="text-[11px] text-ink-faint">
            Payments are simulated — no actual charges are made during this capstone phase.
          </p>
        </div>
      </div>
    </section>
  );
}
