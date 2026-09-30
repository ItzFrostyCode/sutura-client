'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useBillingData } from '@/components/billing/useBillingData';
import CurrentPlanSection from '@/components/billing/CurrentPlanSection';
import FeatureUsageSection from '@/components/billing/FeatureUsageSection';
import PlanCardsSection from '@/components/billing/PlanCardsSection';
import PlanComparisonSection from '@/components/billing/PlanComparisonSection';
import BillingHistorySection from '@/components/billing/BillingHistorySection';
import UpgradePaymentModal from '@/components/billing/UpgradePaymentModal';
import UpgradeRequestsSection from '@/components/billing/UpgradeRequestsSection';
import { planNeedsPayment, type Plan } from '@/components/billing/billingTypes';

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
    submitUpgradeRequest,
    storeId,
  } = useBillingData();
  const [payingFor, setPayingFor] = useState<Plan | null>(null);

  // Moving up to (or renewing) a paid plan takes a GCash payment + receipt;
  // free plans and step-downs switch right away, as before.
  const choosePlan = (planId: number) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    if (planNeedsPayment(plan, currentSubscription ? currentSubscription.plan.price_monthly : null)) setPayingFor(plan);
    else handleSubscribe(planId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-48 bg-line rounded-md animate-pulse" />
          <div className="h-4 w-96 bg-line rounded-md animate-pulse mt-2" />
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
        <p className="text-ink-muted">Manage your subscription, track usage, and scale your store.</p>
      </div>

      {(isExpired || isExpiringSoon) && (
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
              ? "Your subscription has expired. Renew now to restore your store's full visibility and features."
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
        hasPendingRequest={pendingRequest !== null}
        onSubscribe={choosePlan}
      />

      {pendingRequest && (
        <div className="flex items-start gap-3 p-4 border border-amber-300 bg-amber-50 text-sm text-amber-900">
          <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
          <p>Your payment for the <strong>{pendingRequest.plan?.name}</strong> plan is waiting for the SUTURA team to confirm. Your plan changes as soon as it is approved.</p>
        </div>
      )}

      <UpgradeRequestsSection requests={upgradeRequests} storeId={storeId} />

      <UpgradePaymentModal plan={payingFor} onClose={() => setPayingFor(null)} onSubmit={submitUpgradeRequest} />

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
