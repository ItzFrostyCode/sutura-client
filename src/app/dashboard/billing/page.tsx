'use client';

import { useState } from 'react';
import { AlertTriangle, Ban } from 'lucide-react';
import { useBillingData } from '@/components/billing/useBillingData';
import CurrentPlanSection from '@/components/billing/CurrentPlanSection';
import FeatureUsageSection from '@/components/billing/FeatureUsageSection';
import PlanCardsSection from '@/components/billing/PlanCardsSection';
import PlanComparisonSection from '@/components/billing/PlanComparisonSection';
import BillingHistorySection from '@/components/billing/BillingHistorySection';
import UpgradePaymentModal from '@/components/billing/UpgradePaymentModal';
import UpgradeRequestsSection from '@/components/billing/UpgradeRequestsSection';
import OnlinePaymentBanner from '@/components/billing/OnlinePaymentBanner';
import { TrialBanner } from '@/components/billing/TrialNotice';
import GcashCheckoutModal from '@/components/shared/GcashCheckoutModal';
import CancelSubscriptionModal, { CANCEL_TERMS_VERSION } from '@/components/billing/CancelSubscriptionModal';
import { planNeedsPayment, planRunState, type Plan } from '@/components/billing/billingTypes';

export default function BillingPage() {
  const {
    plans,
    currentSubscription,
    loading,
    upgradingTo,
    usageCounts,
    limits,
    activePlanId,
    activePlanSlug,
    daysUntilExpiry,
    isExpired,
    isExpiringSoon,
    handleSubscribe,
    upgradeRequests,
    pendingRequest,
    payOnline,
    checkoutUrl,
    isCheckoutPaid,
    finishCheckout,
    onlineResult,
    checkOnlinePayment,
    dismissOnlineResult,
    cancelScheduledChange,
    cancelSubscription,
    resumeSubscription,
    cancelBusy,
    storeId,
  } = useBillingData();
  const [payingFor, setPayingFor] = useState<Plan | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  // Every paid plan (renewal, upgrade or step down) takes a GCash payment (online,
  // or a receipt upload); a free plan switches directly (at the end of a paid period).
  const choosePlan = (planId: number) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    if (planNeedsPayment(plan)) setPayingFor(plan);
    else handleSubscribe(planId);
  };
  const scheduled = currentSubscription?.scheduled_plan_id ? currentSubscription : null;
  const endDay = currentSubscription?.ends_at
    ? new Date(currentSubscription.ends_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' })
    : '';

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-48 max-w-full bg-line rounded-md animate-pulse" />
          <div className="h-4 w-full max-w-96 bg-line rounded-md animate-pulse mt-2" />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface rounded-3xl p-8 border border-line flex flex-col h-full space-y-6 animate-pulse"
            >
              <div className="space-y-4">
                <div className="h-10 w-10 bg-canvas rounded-xl" />
                <div className="h-6 w-32 bg-line rounded-md" />
                <div className="h-4 w-full bg-canvas rounded-md" />
              </div>
              <div className="h-10 w-full bg-canvas rounded-xl mt-6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink mb-1">Billing &amp; Plans</h1>
        <p className="text-ink-muted">Manage your subscription, track usage, and scale your shop.</p>
      </div>

      {onlineResult && <OnlinePaymentBanner result={onlineResult} onCheckAgain={checkOnlinePayment} onDismiss={dismissOnlineResult} />}

      {/* Free trial: days left, or paused once it ran out unpaid. Replaces the plan banner below. */}
      <TrialBanner sub={currentSubscription} showLink={false} />

      {(isExpired || isExpiringSoon) && !currentSubscription?.trial_ends_at && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl border ${
            isExpired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
          }`}
        >
          <AlertTriangle
            size={18}
            className={isExpired ? 'text-red-600 shrink-0' : 'text-amber-600 shrink-0'}
          />
          <p className={`text-sm font-medium ${isExpired ? 'text-red-700' : 'text-amber-700'}`}>
            {isExpired
              ? 'Your subscription has ended, so your shop is hidden from customers and read-only. Choose a plan below to restore it.'
              : `Your plan renews in ${daysUntilExpiry} day${
                  daysUntilExpiry === 1 ? '' : 's'
                } — pick a plan below to renew and avoid losing access.`}
          </p>
        </div>
      )}

      <CurrentPlanSection
        currentSubscription={currentSubscription}
        activePlanSlug={activePlanSlug}
        daysUntilExpiry={daysUntilExpiry}
        onResume={resumeSubscription}
        busy={cancelBusy}
      />

      <CancelSubscriptionModal
        isOpen={cancelOpen}
        planName={currentSubscription?.plan?.name ?? 'your plan'}
        endsOn={endDay || 'the end of your current period'}
        busy={cancelBusy}
        onClose={() => setCancelOpen(false)}
        onConfirm={async () => { if (await cancelSubscription(CANCEL_TERMS_VERSION)) setCancelOpen(false); }}
      />

      <FeatureUsageSection
        usageCounts={usageCounts}
        limits={limits}
        activePlanSlug={activePlanSlug}
      />

      <PlanCardsSection
        plans={plans}
        activePlanId={activePlanId}
        currentPrice={currentSubscription?.plan?.price_monthly ?? 0}
        upgradingTo={upgradingTo}
        hasPendingRequest={pendingRequest !== null || Boolean(scheduled?.scheduled_payment_id)}
        scheduledPlanId={scheduled?.scheduled_plan_id ?? null}
        onTrial={currentSubscription?.status === 'trial'}
        onSubscribe={choosePlan}
      />

      {/* Under the plans, centered: Cancel (only while a plan runs and isn't cancelled yet), then the agreement. */}
      <div className="-mt-4 flex flex-col items-center gap-3">
        {planRunState(currentSubscription).running && !planRunState(currentSubscription).cancelled && (
          <button
            type="button"
            onClick={() => setCancelOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-white px-5 text-sm font-medium text-ink-body shadow-2xs transition-colors hover:border-danger/50 hover:text-danger cursor-pointer"
          >
            <Ban size={16} aria-hidden="true" /> Cancel subscription
          </button>
        )}
        <p className="text-xs text-ink-muted">
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">Terms &amp; Conditions</a>
          {' / '}
          <a href="/terms#subscription-agreement" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">Subscription Agreement</a>
        </p>
      </div>

      {scheduled && (
        <div className="flex flex-col gap-3 border border-line-strong bg-sunken p-4 text-sm text-ink sm:flex-row sm:items-center">
          <p className="flex-1">
            Your shop stays on <strong>{currentSubscription?.plan?.name}</strong> until {endDay}, then switches to{' '}
            <strong>{scheduled.scheduled_plan?.name ?? 'the plan you picked'}</strong>.
            {scheduled.scheduled_payment_id ? ' That period is already paid for.' : ''}
          </p>
          {!scheduled.scheduled_payment_id && (
            <button type="button" onClick={cancelScheduledChange} className="h-10 shrink-0 border border-line-strong bg-white px-4 text-sm font-medium text-ink hover:bg-canvas cursor-pointer">
              Keep my current plan
            </button>
          )}
        </div>
      )}

      {pendingRequest && (
        <div className="flex items-start gap-3 p-4 border border-amber-300 bg-amber-50 text-sm text-amber-900">
          <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
          <p>Your payment for the <strong>{pendingRequest.plan?.name}</strong> plan is waiting for the SUTURA team to {pendingRequest.channel === 'online' ? 'finish checking it' : 'check it in GCash'}. You&apos;ll get a notification once it&apos;s confirmed.</p>
        </div>
      )}

      <UpgradeRequestsSection requests={upgradeRequests} storeId={storeId} />

      <UpgradePaymentModal plan={payingFor} current={currentSubscription} onClose={() => setPayingFor(null)} onPayOnline={payOnline} />

      <GcashCheckoutModal url={checkoutUrl} isPaid={isCheckoutPaid} onFinish={finishCheckout} />

      <PlanComparisonSection
        plans={plans}
        activePlanSlug={activePlanSlug}
      />

      <BillingHistorySection
        currentSubscription={currentSubscription}
      />
    </div>
  );
}
