'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { refreshSubscriptionTier } from '@/hooks/useSubscriptionTier';
import api from '@/lib/axios';
import type { CheckoutOutcome } from '@/components/shared/GcashCheckoutModal';
import { BRANCH_LIMITS, type OnlinePaymentResult, type Plan, type Subscription, type UpgradeRequest } from './billingTypes';

export function useBillingData() {
  const { store, user } = useAuthStore();
  const toast = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingTo, setUpgradingTo] = useState<number | null>(null);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  const [now] = useState(() => Date.now());
  const [onlineResult, setOnlineResult] = useState<OnlinePaymentResult | null>(null);
  // The GCash checkout open in a modal on this page.
  const [checkout, setCheckout] = useState<{ paymentId: number; url: string } | null>(null);

  const [usageCounts, setUsageCounts] = useState({ branches: 0, staff: 0, services: 0 });

  const fetchBillingData = useCallback(async () => {
    if (!store) {
      if (user) setTimeout(() => setLoading(false), 0);
      return;
    }
    try {
      const [plansRes, subRes, reqRes] = await Promise.all([
        api.get('/subscriptions/plans'),
        api.get(`/stores/${store.id}/subscription`),
        api.get(`/stores/${store.id}/subscription/upgrade-requests`).catch(() => ({ data: { data: [] } })),
      ]);
      setUpgradeRequests(reqRes.data.data ?? []);
      const order = ['basic', 'pro', 'premium'];
      const sorted = [...(plansRes.data.data ?? [])]
        .map((p: Plan) => ({ ...p, price_monthly: Number(p.price_monthly) }))
        .sort((a: Plan, b: Plan) => order.indexOf(a.slug) - order.indexOf(b.slug));
      setPlans(sorted);
      const sub = subRes.data.data;
      setCurrentSubscription(
        sub ? { ...sub, plan: { ...sub.plan, price_monthly: Number(sub.plan.price_monthly) } } : sub
      );
    } catch (err) {
      console.error('Failed to fetch billing data', err);
    } finally {
      setLoading(false);
    }
  }, [store, user]);

  useEffect(() => {
    if (!store?.id) return;
    Promise.allSettled([
      api.get(`/stores/${store.id}/branches`),
      api.get(`/stores/${store.id}/staff`),
      api.get(`/stores/${store.id}/services`),
    ]).then(([branchRes, staffRes, servicesRes]) => {
      setUsageCounts({
        // Branch Shops only: the Main Shop never counts toward the plan.
        branches: branchRes.status === 'fulfilled'
          ? ((branchRes.value.data.data ?? []) as { is_main?: boolean }[]).filter((b) => !b.is_main).length
          : 0,
        staff: staffRes.status === 'fulfilled' ? (staffRes.value.data.data?.length ?? 0) : 0,
        services: servicesRes.status === 'fulfilled' ? (servicesRes.value.data.data?.length ?? 0) : 0,
      });
    });
  }, [store?.id]);

  useEffect(() => {
    const t = setTimeout(fetchBillingData, 0);
    return () => clearTimeout(t);
  }, [fetchBillingData]);

  const handleSubscribe = async (planId: number) => {
    if (!store) return;
    setUpgradingTo(planId);
    try {
      const res = await api.post(`/stores/${store.id}/subscription`, { plan_id: planId, billing_cycle: 'monthly' });
      await fetchBillingData();
      await refreshSubscriptionTier(store.id);
      // A switch from a paid plan waits for the period to end; the server says when.
      toast.success(res.data?.message || 'Subscription updated successfully.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update subscription.');
    } finally {
      setUpgradingTo(null);
    }
  };

  // Pay with GCash: the server opens a checkout, shown in a modal on this page. If GCash
  // ever takes over the whole tab, it sends the owner back to
  // /dashboard/billing?payment=ID&gcash=success|failed (handled below).
  const payOnline = async (planId: number, billingCycle: 'monthly' | 'yearly', acceptTerms = false) => {
    if (!store) return false;
    try {
      const res = await api.post(`/stores/${store.id}/subscription/pay-online`, { plan_id: planId, billing_cycle: billingCycle, accept_terms: acceptTerms || undefined });
      setOnlineResult(null);
      setCheckout({ paymentId: res.data.data.payment_id, url: res.data.data.checkout_url });
      return true;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const data = error.response?.data;
      toast.error(Object.values(data?.errors ?? {})[0]?.[0] || data?.message || 'Could not open GCash. Please try again.');
      return false;
    }
  };

  // Back from GCash: ask the server (which asks GCash) how it went. Works even when
  // GCash's own notice can't reach the server (local testing).
  const checkOnlinePayment = useCallback(async (paymentId: number) => {
    if (!store) return;
    setOnlineResult({ state: 'checking' });
    try {
      const res = await api.post(`/stores/${store.id}/subscription/upgrade-requests/${paymentId}/check`);
      const d = res.data.data as { paid: boolean; status: string; plan: string | null; billing_period_end: string | null };
      if (d.paid) {
        setOnlineResult({ state: 'paid', plan: d.plan, until: d.billing_period_end, started: d.status === 'approved' });
        await fetchBillingData();
        await refreshSubscriptionTier(store.id);
      } else {
        setOnlineResult({ state: 'processing', paymentId });
      }
    } catch {
      setOnlineResult({ state: 'processing', paymentId });
    }
  }, [store, fetchBillingData]);

  // Polled by the checkout modal: true once GCash has confirmed this payment.
  const isCheckoutPaid = useCallback(async () => {
    if (!store || !checkout) return false;
    const res = await api.post(`/stores/${store.id}/subscription/upgrade-requests/${checkout.paymentId}/check`);
    return Boolean(res.data.data.paid);
  }, [store, checkout]);

  // The modal closed: show how it went in the banner (a closed modal may still be paid).
  const finishCheckout = useCallback((outcome: CheckoutOutcome) => {
    const paymentId = checkout?.paymentId;
    setCheckout(null);
    if (!paymentId) return;
    if (outcome === 'failed') setOnlineResult({ state: 'failed' });
    else checkOnlinePayment(paymentId);
  }, [checkout, checkOnlinePayment]);

  useEffect(() => {
    if (!store?.id) return;
    // Loaded inside the checkout modal (GCash's return trip): the page that holds the modal handles it.
    if (window.self !== window.top) return;
    const params = new URLSearchParams(window.location.search);
    const paymentId = Number(params.get('payment'));
    const outcome = params.get('gcash');
    if (!paymentId || !outcome) return;
    const t = setTimeout(() => {
      // Clean the address bar so a refresh doesn't re-run this. Done here, not above: dev mode
      // runs this effect twice and cancels the first timer, so the second run must still see it.
      window.history.replaceState(null, '', window.location.pathname);
      if (outcome === 'failed') setOnlineResult({ state: 'failed' });
      else checkOnlinePayment(paymentId);
    }, 0);
    return () => clearTimeout(t);
  }, [store?.id, checkOnlinePayment]);

  // A free downgrade waiting for the period to end can be called off (a paid one can't).
  const cancelScheduledChange = async () => {
    if (!store) return;
    try {
      const res = await api.delete(`/stores/${store.id}/subscription/scheduled-change`);
      toast.success(res.data.message);
      await fetchBillingData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Could not cancel the plan change.');
    }
  };

  // Cancel the running plan (it runs to its end date), or undo that.
  const [cancelBusy, setCancelBusy] = useState(false);
  const changeCancellation = async (cancel: boolean, termsVersion?: string): Promise<boolean> => {
    if (!store) return false;
    setCancelBusy(true);
    try {
      const url = `/stores/${store.id}/subscription/cancel`;
      const res = cancel
        ? await api.post(url, { agree_terms: true, terms_version: termsVersion })
        : await api.delete(url);
      toast.success(res.data.message);
      await fetchBillingData();
      return true;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || (cancel ? 'Could not cancel the subscription.' : 'Could not undo the cancellation.'));
      return false;
    } finally {
      setCancelBusy(false);
    }
  };

  const pendingRequest = upgradeRequests.find((r) => r.status === 'pending') ?? null;

  const activePlanId = currentSubscription?.plan_id;
  const activePlanSlug = currentSubscription?.plan?.slug ?? '';
  const activePlanMaxStaff = currentSubscription?.plan?.max_staff;
  const activePlanMaxServices = currentSubscription?.plan?.max_services;
  // Live plan limit (admin Plans page), Branch Shops beyond the Main Shop;
  // a plan saved before it existed falls back to the server's own rule.
  const activePlanMaxBranches = currentSubscription?.plan?.max_branches
    ?? (activePlanSlug in BRANCH_LIMITS ? BRANCH_LIMITS[activePlanSlug] : BRANCH_LIMITS.basic);

  const limits = {
    branches: activePlanMaxBranches === -1 ? null : activePlanMaxBranches,
    staff: activePlanMaxStaff === -1 ? null : activePlanMaxStaff ?? null,
    services: activePlanMaxServices === -1 ? null : activePlanMaxServices ?? null,
  };

  const daysUntilExpiry = currentSubscription?.ends_at
    ? Math.ceil((new Date(currentSubscription.ends_at).getTime() - now) / (1000 * 60 * 60 * 24))
    : null;
  const isExpired = currentSubscription?.status === 'expired' || (daysUntilExpiry !== null && daysUntilExpiry < 0);
  const isExpiringSoon = !isExpired && daysUntilExpiry !== null && daysUntilExpiry <= 7 && currentSubscription?.status !== 'cancelled';

  return {
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
    checkoutUrl: checkout?.url ?? null,
    isCheckoutPaid,
    finishCheckout,
    onlineResult,
    checkOnlinePayment,
    dismissOnlineResult: () => setOnlineResult(null),
    cancelScheduledChange,
    cancelSubscription: (termsVersion: string) => changeCancellation(true, termsVersion),
    resumeSubscription: () => changeCancellation(false),
    cancelBusy,
    storeId: store?.id,
  };
}
