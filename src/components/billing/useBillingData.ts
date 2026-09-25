'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { refreshSubscriptionTier } from '@/hooks/useSubscriptionTier';
import api from '@/lib/axios';
import { BRANCH_LIMITS, type Plan, type Subscription } from './billingTypes';

export function useBillingData() {
  const { store, user } = useAuthStore();
  const toast = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingTo, setUpgradingTo] = useState<number | null>(null);
  const [now] = useState(() => Date.now());

  const [usageCounts, setUsageCounts] = useState({ branches: 0, staff: 0, services: 0 });

  const fetchBillingData = useCallback(async () => {
    if (!store) {
      if (user) setTimeout(() => setLoading(false), 0);
      return;
    }
    try {
      const [plansRes, subRes] = await Promise.all([
        api.get('/subscriptions/plans'),
        api.get(`/stores/${store.id}/subscription`),
      ]);
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
        branches: branchRes.status === 'fulfilled' ? (branchRes.value.data.data?.length ?? 0) : 0,
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
      await api.post(`/stores/${store.id}/subscription`, { plan_id: planId, billing_cycle: 'monthly' });
      await fetchBillingData();
      await refreshSubscriptionTier(store.id);
      toast.success('Subscription updated successfully.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update subscription.');
    } finally {
      setUpgradingTo(null);
    }
  };

  const activePlanId = currentSubscription?.plan_id;
  const activePlanSlug = currentSubscription?.plan?.slug ?? '';
  const activePlanMaxStaff = currentSubscription?.plan?.max_staff;
  const activePlanMaxServices = currentSubscription?.plan?.max_services;

  const limits = {
    branches: activePlanSlug in BRANCH_LIMITS ? BRANCH_LIMITS[activePlanSlug] : BRANCH_LIMITS.basic,
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
  };
}
