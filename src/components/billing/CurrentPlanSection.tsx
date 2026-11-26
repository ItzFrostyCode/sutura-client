import {
  CreditCard, CheckCircle, Crown, Zap, Calendar, TrendingUp, Clock, XCircle,
} from 'lucide-react';
import { planRunState, type Subscription } from './billingTypes';

interface CurrentPlanSectionProps {
  currentSubscription: Subscription | null;
  activePlanSlug: string;
  daysUntilExpiry: number | null;
  /** Undoes a cancellation while the plan still runs. */
  onResume: () => void;
  busy: boolean;
}

export default function CurrentPlanSection({
  currentSubscription,
  activePlanSlug,
  daysUntilExpiry,
  onResume,
  busy,
}: CurrentPlanSectionProps) {
  const { cancelled } = planRunState(currentSubscription);
  // A free trial of any plan: say so on the card, the price is ₱0 until it ends.
  const onTrial = currentSubscription?.status === 'trial';
  const endsOn = currentSubscription?.ends_at
    ? new Date(currentSubscription.ends_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' })
    : '';
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
            <p className="text-xs text-white/70 mb-0.5">{onTrial ? 'Free trial' : 'Active Subscription'}</p>
            <h3 className="font-heading text-2xl font-bold">
              {currentSubscription?.plan?.name ?? 'No Active Plan'}
            </h3>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            {onTrial ? (
              <p className="font-heading text-3xl font-bold">
                Free
                {currentSubscription?.plan?.price_monthly != null && (
                  <span className="block text-right text-xs font-normal text-white/70">then ₱{currentSubscription.plan.price_monthly.toLocaleString()}/mo</span>
                )}
              </p>
            ) : currentSubscription?.plan?.price_monthly != null && (
              <p className="font-heading text-3xl font-bold">
                ₱{currentSubscription.plan.price_monthly.toLocaleString()}
                <span className="text-sm font-normal text-white/70">/mo</span>
              </p>
            )}
            {currentSubscription?.status && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15">
                {cancelled ? <XCircle size={12} /> : <CheckCircle size={12} />}
                {cancelled ? 'CANCELLED' : onTrial ? 'FREE TRIAL' : currentSubscription.status.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Billing details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/15 border-t border-white/15">
          <div className="p-5 flex items-start gap-3">
            <Calendar size={16} className="text-white/70 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-white/60 uppercase tracking-wider font-semibold mb-0.5">{cancelled ? 'Access Until' : onTrial ? 'Trial Ends' : 'Renewal Date'}</p>
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

      {cancelled ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center">
          <p className="flex-1">
            You cancelled this plan. You keep full access until <strong>{endsOn}</strong>; after that your shop becomes
            read-only until you choose a plan again.
          </p>
          <button type="button" onClick={onResume} disabled={busy}
            className="h-10 shrink-0 rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-ink hover:bg-canvas disabled:opacity-50 cursor-pointer">
            {busy ? 'Saving…' : 'Keep my subscription'}
          </button>
        </div>
      ) : null}
    </section>
  );
}
