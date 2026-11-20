import {
  CreditCard, CheckCircle, Crown, Zap, Calendar, TrendingUp, Clock, AlertTriangle, RotateCcw,
} from 'lucide-react';
import type { Subscription } from './billingTypes';

interface CurrentPlanSectionProps {
  currentSubscription: Subscription | null;
  activePlanSlug: string;
  daysUntilExpiry: number | null;
  onCancel?: () => void;
  onResubscribe?: () => void;
}

export default function CurrentPlanSection({
  currentSubscription,
  activePlanSlug,
  daysUntilExpiry,
  onCancel,
  onResubscribe,
}: CurrentPlanSectionProps) {
  const getPlanIcon = () => {
    if (activePlanSlug === 'premium') return Crown;
    if (activePlanSlug === 'pro') return Zap;
    return CreditCard;
  };
  const PlanIcon = getPlanIcon();

  return (
    <section className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-taupe flex items-center gap-1.5">
        <CreditCard size={12} /> Current Plan
      </p>

      <div className="bg-taupe rounded-2xl overflow-hidden text-white">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-6">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-white/15">
            <PlanIcon size={22} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-white/70 mb-0.5">Active Subscription</p>
            <h3 className="font-heading text-2xl font-bold">
              {currentSubscription?.plan?.name ?? 'No Active Plan'}
            </h3>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            {currentSubscription?.plan?.price_monthly != null && (
              <p className="font-heading text-3xl font-bold">
                ₱{currentSubscription.plan.price_monthly.toLocaleString()}
                <span className="text-sm font-normal text-white/70">/mo</span>
              </p>
            )}
            {currentSubscription?.status && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15">
                <CheckCircle size={12} />
                {currentSubscription.status.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Billing details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/15 border-t border-white/15">
          <div className="p-5 flex items-start gap-3">
            <Calendar size={16} className="text-white/70 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-white/60 uppercase tracking-wider font-semibold mb-0.5">Renewal Date</p>
              <p className="text-sm font-semibold">
                {currentSubscription?.ends_at
                  ? new Date(currentSubscription.ends_at).toLocaleDateString('en-PH', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
          </div>
          <div className="p-5 flex items-start gap-3">
            <TrendingUp size={16} className="text-white/70 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-white/60 uppercase tracking-wider font-semibold mb-0.5">Billing Cycle</p>
              <p className="text-sm font-semibold capitalize">
                {currentSubscription?.billing_cycle ?? 'Monthly'}
              </p>
            </div>
          </div>
          <div className="p-5 flex items-start gap-3">
            <Clock size={16} className="text-white/70 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-white/60 uppercase tracking-wider font-semibold mb-0.5">Days Remaining</p>
              <p
                className={`text-sm font-semibold ${
                  daysUntilExpiry !== null && daysUntilExpiry <= 7
                    ? 'text-amber-200'
                    : 'text-white'
                }`}
              >
                {daysUntilExpiry !== null
                  ? daysUntilExpiry <= 0
                    ? 'Expired'
                    : `${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Pending Banner */}
      {currentSubscription?.cancelled_at && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-amber-300 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-700 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Cancellation Scheduled</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Auto-renewal is cancelled. You retain full access to your {currentSubscription.plan?.name} features until{' '}
                <span className="font-semibold">
                  {currentSubscription.ends_at
                    ? new Date(currentSubscription.ends_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'the end of your period'}
                </span>
                .
              </p>
            </div>
          </div>
          {onResubscribe && (
            <button
              type="button"
              onClick={onResubscribe}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-amber-800 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-900 active:opacity-75 shrink-0"
            >
              <RotateCcw size={14} />
              <span>Resubscribe / Restore</span>
            </button>
          )}
        </div>
      )}

      {/* Cancel Subscription link */}
      {!currentSubscription?.cancelled_at && activePlanSlug !== 'basic' && currentSubscription?.status === 'active' && onCancel && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-medium text-ink-muted hover:text-danger underline underline-offset-4 transition-colors"
          >
            Cancel subscription
          </button>
        </div>
      )}
    </section>
  );
}
