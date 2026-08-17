'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { refreshSubscriptionTier } from '@/hooks/useSubscriptionTier';
import api from '@/lib/axios';
import {
  CreditCard, CheckCircle, Zap, ShieldCheck, Loader2,
  Check, Crown, Rocket, AlertTriangle,
  Building2, Users, Scissors, Calendar, Clock, History,
  ChevronRight, TrendingUp,
} from 'lucide-react';
import Badge from '@/components/shared/Badge';

interface Plan {
  id: number;
  name: string;
  slug: string;
  price_monthly: number;
  description: string;
  features: string;
  max_staff: number;
  max_services: number;
}

interface Subscription {
  plan_id: number;
  plan: Plan;
  status: string;
  starts_at: string;
  ends_at: string;
  billing_cycle?: string;
}

// ── Per-plan metadata ─────────────────────────────────────────────────────────
// Flat, one accent color (taupe) — no shadow/glow, no second accent hue. The
// recommended plan (Premium) is distinguished by a solid taupe border +
// outline ribbon, not a glow effect, so it stays "clean, simple, modern"
// instead of reaching for a color the rest of the app doesn't use.
const PLAN_META: Record<string, {
  icon: React.ElementType;
  badge?: string;
  cardClass: string;
  btnClass: string;
  iconBg: string;
}> = {
  basic: {
    icon: Rocket,
    badge: undefined,
    cardClass: 'border-line hover:border-line-strong',
    btnClass: 'bg-sunken hover:bg-line text-ink-body',
    iconBg: 'bg-sunken text-taupe',
  },
  pro: {
    icon: Zap,
    badge: undefined,
    cardClass: 'border-line hover:border-line-strong',
    btnClass: 'bg-sunken hover:bg-line text-ink-body',
    iconBg: 'bg-sunken text-taupe',
  },
  premium: {
    icon: Crown,
    badge: 'Most Popular',
    cardClass: 'border-taupe ring-1 ring-taupe/30',
    btnClass: 'bg-taupe hover:bg-taupe-hover text-white',
    iconBg: 'bg-sunken text-taupe',
  },
};

function getPlanMeta(slug: string) {
  return PLAN_META[slug] ?? PLAN_META.basic;
}

// ── Branch limits per plan ──────────────────────────────────────────────────
// Not a per-plan numeric column on the backend — ShopBranchController::store()
// enforces a flat "only Premium unlocks a 2nd+ branch" rule, so Basic and Pro
// are both capped at 1. Staff limits, unlike this, ARE per-plan numeric data
// (SubscriptionPlan.max_staff) and are read from the fetched `plans` array
// below instead of being duplicated here — a hardcoded copy is exactly how
// this page drifted out of sync with the real enforced limits before.
const BRANCH_LIMITS: Record<string, number | null> = {
  basic: 1,
  pro: 1,
  premium: null,
};

// ── Plan comparison table rows ────────────────────────────────────────────────
// Gallery Photos has no enforced cap anywhere in the backend — every plan is
// effectively unlimited, so it's listed as such rather than inventing a
// differentiator that was never actually built.
const COMPARE_ROWS = [
  { label: 'Branches',              basic: '1',          pro: '1',           premium: 'Unlimited' },
  { label: 'Gallery Photos',        basic: 'Unlimited',  pro: 'Unlimited',   premium: 'Unlimited' },
  { label: 'Service Packages',      basic: 'Up to 3',    pro: 'Unlimited',   premium: 'Unlimited' },
  { label: 'Analytics & Reports',   basic: 'Basic',      pro: 'Advanced',    premium: 'Full Suite' },
  { label: 'SMS Notifications',     basic: '—',          pro: 'Included',    premium: 'Included' },
  { label: 'Featured Visibility',   basic: '—',          pro: '—',           premium: 'Included' },
  { label: 'Priority Support',      basic: '—',          pro: '—',           premium: 'Included' },
];

// ── Usage bar helper ─────────────────────────────────────────────────────────
function UsageBar({ label, used, max, icon: Icon }: {
  label: string; used: number; max: number | null; icon: React.ElementType;
}) {
  const pct = max === null ? 0 : Math.min((used / max) * 100, 100);
  const isAtLimit = max !== null && used >= max;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-ink-body">
          <Icon size={14} className="text-taupe" />
          <span className="font-medium">{label}</span>
        </div>
        {max === null ? (
          <span className="text-xs font-semibold text-sage">{used} used · Unlimited</span>
        ) : (
          <span className={`text-xs font-semibold ${isAtLimit ? 'text-danger' : 'text-ink-muted'}`}>
            {used} / {max}
          </span>
        )}
      </div>
      {/* A full-width bar for "unlimited" used to render as solid amber —
          visually indistinguishable from "at capacity, warning," the exact
          opposite of what unlimited means. Unlimited gets no progress bar
          at all now, just the label above. */}
      {max !== null && (
        <div className="h-2 bg-sunken rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAtLimit ? 'bg-danger' : pct > 75 ? 'bg-amber-400' : 'bg-taupe'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {isAtLimit && max !== null && (
        <p className="text-[11px] text-danger">Limit reached — upgrade to add more.</p>
      )}
    </div>
  );
}

export default function BillingPage() {
  const { shop, user } = useAuthStore();
  const toast = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingTo, setUpgradingTo] = useState<number | null>(null);
  // Captured once at mount rather than called inline during render (below,
  // for daysUntilExpiry) — a raw Date.now() read during render is flagged as
  // an impure/non-idempotent render by the React Compiler lint rule.
  const [now] = useState(() => Date.now());

  // Feature usage counts — all three are real, live counts from their own
  // endpoints. "Gallery Photos" used to sit here as a permanently-hardcoded
  // 0 with no backing plan limit at all (SubscriptionPlan has no
  // max_gallery column, never did) — swapped for Services, which has a
  // real max_services limit that wasn't surfaced anywhere on this page.
  const [usageCounts, setUsageCounts] = useState({ branches: 0, staff: 0, services: 0 });

  const fetchBillingData = useCallback(async () => {
    if (!shop) {
      if (user) setTimeout(() => setLoading(false), 0);
      return;
    }
    try {
      const [plansRes, subRes] = await Promise.all([
        api.get('/subscriptions/plans'),
        api.get(`/shops/${shop.id}/subscription`),
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
  }, [shop, user]);

  // Fetch usage counts for feature usage section
  useEffect(() => {
    if (!shop?.id) return;
    Promise.allSettled([
      api.get(`/shops/${shop.id}/branches`),
      api.get(`/shops/${shop.id}/staff`),
      api.get(`/shops/${shop.id}/services`),
    ]).then(([branchRes, staffRes, servicesRes]) => {
      setUsageCounts({
        branches: branchRes.status === 'fulfilled'   ? (branchRes.value.data.data?.length   ?? 0) : 0,
        staff:    staffRes.status === 'fulfilled'    ? (staffRes.value.data.data?.length    ?? 0) : 0,
        services: servicesRes.status === 'fulfilled' ? (servicesRes.value.data.data?.length ?? 0) : 0,
      });
    });
  }, [shop?.id]);

  useEffect(() => {
    const t = setTimeout(fetchBillingData, 0);
    return () => clearTimeout(t);
  }, [fetchBillingData]);

  const handleSubscribe = async (planId: number) => {
    if (!shop) return;
    setUpgradingTo(planId);
    try {
      await api.post(`/shops/${shop.id}/subscription`, { plan_id: planId, billing_cycle: 'monthly' });
      await fetchBillingData();
      await refreshSubscriptionTier(shop.id);
      toast.success('Subscription updated successfully.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update subscription.');
    } finally {
      setUpgradingTo(null);
    }
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
            <div key={i} className="bg-surface rounded-3xl p-8 border border-line flex flex-col h-full space-y-6 animate-pulse">
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

  const activePlanId = currentSubscription?.plan_id;
  const activePlanSlug = currentSubscription?.plan?.slug ?? '';
  const activePlanMaxStaff = currentSubscription?.plan?.max_staff;
  const activePlanMaxServices = currentSubscription?.plan?.max_services;
  const limits = {
    // `?? BRANCH_LIMITS.basic` looks like a safe "plan not found" fallback,
    // but BRANCH_LIMITS.premium is *itself* `null` (the documented
    // "unlimited" sentinel) — `??` treats that null exactly like a missing
    // key, so a real Premium shop silently fell back to Basic's cap of 1.
    // Confirmed live: Premium plan, 3 real branches, page showed "3/1 —
    // Limit reached, upgrade to add more" while the same page's own
    // comparison table said Premium = Unlimited branches. `in` distinguishes
    // "key genuinely absent" from "key present with value null".
    branches: activePlanSlug in BRANCH_LIMITS ? BRANCH_LIMITS[activePlanSlug] : BRANCH_LIMITS.basic,
    // -1 is this table's documented "unlimited" sentinel (see
    // SubscriptionPlanSeeder) — not a real cap to render as a number.
    staff: activePlanMaxStaff === -1 ? null : activePlanMaxStaff ?? null,
    services: activePlanMaxServices === -1 ? null : activePlanMaxServices ?? null,
  };

  const getButtonContent = (plan: Plan) => {
    if (upgradingTo === plan.id) return <Loader2 className="w-5 h-5 animate-spin" />;
    if (activePlanId === plan.id) return <><Check size={15} /> Current Plan</>;
    const currentPrice = currentSubscription?.plan?.price_monthly ?? 0;
    if (plan.price_monthly > currentPrice) return 'Upgrade';
    if (plan.price_monthly < currentPrice) return 'Downgrade';
    return 'Select Plan';
  };

  const statusVariant: Record<string, 'success' | 'accent' | 'danger' | 'neutral'> = {
    active: 'success',
    trial: 'accent',
    cancelled: 'danger',
    expired: 'neutral',
  };

  const getPlanIconData = () => {
    if (activePlanSlug === 'premium') return { bgClass: 'bg-sunken text-taupe', Icon: Crown };
    if (activePlanSlug === 'pro')     return { bgClass: 'bg-sunken text-taupe', Icon: Zap };
    return { bgClass: 'bg-sunken text-taupe', Icon: CreditCard };
  };
  const { bgClass: iconBgClass, Icon: PlanIcon } = getPlanIconData();

  const daysUntilExpiry = currentSubscription?.ends_at
    ? Math.ceil((new Date(currentSubscription.ends_at).getTime() - now) / (1000 * 60 * 60 * 24))
    : null;
  const isExpired     = currentSubscription?.status === 'expired' || (daysUntilExpiry !== null && daysUntilExpiry < 0);
  const isExpiringSoon = !isExpired && daysUntilExpiry !== null && daysUntilExpiry <= 7 && currentSubscription?.status !== 'cancelled';

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink mb-1">Billing &amp; Plans</h1>
        <p className="text-ink-muted">Manage your subscription, track usage, and scale your shop.</p>
      </div>

      {/* Expiry alert */}
      {(isExpired || isExpiringSoon) && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <AlertTriangle size={18} className={isExpired ? 'text-red-600 shrink-0' : 'text-amber-600 shrink-0'} />
          <p className={`text-sm font-medium ${isExpired ? 'text-red-700' : 'text-amber-700'}`}>
            {isExpired
              ? 'Your subscription has expired. Renew now to restore your shop\'s full visibility and features.'
              : `Your plan renews in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'} — pick a plan below to renew and avoid losing access.`}
          </p>
        </div>
      )}

      {/* ── SECTION A: Current Plan ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-taupe flex items-center gap-1.5">
          <CreditCard size={12} /> Current Plan
        </p>

        {/* Hero identity block — the plan name/price is the one fact this
            whole page exists to answer, so it gets the taupe-filled
            treatment instead of sitting flush with a data table. */}
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
                    ? new Date(currentSubscription.ends_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
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
                <p className={`text-sm font-semibold ${
                  daysUntilExpiry !== null && daysUntilExpiry <= 7
                    ? 'text-amber-200'
                    : 'text-white'
                }`}>
                  {daysUntilExpiry !== null
                    ? daysUntilExpiry <= 0 ? 'Expired' : `${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION B: Feature Usage ────────────────────────────────────────── */}
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-taupe flex items-center gap-1.5">
          <TrendingUp size={12} /> Feature Usage
        </p>
        <div className="bg-surface border border-line rounded-2xl p-6 space-y-5">
          <UsageBar label="Branches"       used={usageCounts.branches} max={limits.branches} icon={Building2} />
          <UsageBar label="Staff Accounts" used={usageCounts.staff}    max={limits.staff}    icon={Users} />
          <UsageBar label="Services"       used={usageCounts.services} max={limits.services} icon={Scissors} />
          {activePlanSlug !== 'premium' && (
            <div className="pt-2 border-t border-line flex items-center justify-between">
              <p className="text-xs text-ink-muted">Need more? Upgrade your plan to unlock higher limits.</p>
              <button
                type="button"
                onClick={() => document.getElementById('plan-btn-premium')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-1 text-xs font-semibold text-taupe hover:text-ink transition-colors"
              >
                Upgrade <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── SECTION C: Choose Your Plan ─────────────────────────────────────── */}
      <section className="space-y-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-taupe flex items-center gap-1.5">
          <Crown size={12} /> Choose Your Plan
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => {
            const meta = getPlanMeta(plan.slug);
            const Icon = meta.icon;
            const isActive = activePlanId === plan.id;
            let features: string[] = [];
            try { features = JSON.parse(plan.features || '[]'); } catch { features = []; }

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl p-6 flex flex-col border transition-all duration-200 ${
                  isActive ? 'border-taupe ring-1 ring-taupe' : meta.cardClass
                }`}
              >
                {meta.badge && !isActive && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 bg-white border border-taupe text-taupe">
                    <Crown size={11} /> {meta.badge}
                  </div>
                )}
                {isActive && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-taupe text-white flex items-center gap-1">
                    <Check size={11} /> Active
                  </div>
                )}

                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.iconBg}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ink">{plan.name}</h3>
                    <p className="text-xs text-ink-faint">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-ink">
                      ₱{plan.price_monthly.toLocaleString()}
                    </span>
                    <span className="text-sm text-ink-faint">/mo</span>
                  </div>
                  <p className="text-xs text-ink-faint mt-0.5">
                    ₱{(plan.price_monthly * 10).toLocaleString()}/yr (save 2 months)
                  </p>
                </div>

                <div className="space-y-2.5 mb-6 flex-1">
                  {features.map(f => (
                    <div key={f} className="flex items-start gap-2.5">
                      <ShieldCheck size={15} className="shrink-0 mt-0.5 text-taupe" />
                      <span className="text-[13px] text-ink-body">{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  id={`plan-btn-${plan.slug}`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isActive || upgradingTo !== null}
                  className={`w-full py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
                    isActive
                      ? 'bg-sunken text-ink-faint cursor-not-allowed'
                      : meta.btnClass
                  }`}
                >
                  {getButtonContent(plan)}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SECTION D: Plan Comparison Table ────────────────────────────────── */}
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-taupe flex items-center gap-1.5">
          <ShieldCheck size={12} /> Compare Plans
        </p>
        <div className="bg-surface border border-line rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-canvas border-b border-line">
                <th className="text-left px-5 py-3.5 text-ink-muted font-semibold text-[12px] uppercase tracking-wider w-1/4">Feature</th>
                {['basic', 'pro', 'premium'].map(slug => (
                  <th key={slug} className={`text-center px-5 py-3.5 text-[12px] font-bold uppercase tracking-wider ${
                    activePlanSlug === slug ? 'text-taupe' : 'text-ink-faint'
                  }`}>
                    {slug.charAt(0).toUpperCase() + slug.slice(1)}
                    {activePlanSlug === slug && (
                      <span className="ml-1.5 text-[10px] bg-taupe text-white px-1.5 py-0.5 rounded-full normal-case font-semibold">
                        current
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {/* Sourced live from each plan's real max_staff instead of a
                  hardcoded row — this is exactly the number the backend
                  actually enforces when adding staff, so it can't drift out
                  of sync with what StaffController::store() allows. */}
              <tr className="hover:bg-canvas/50 transition-colors">
                <td className="px-5 py-3.5 text-ink-body font-medium">Staff Accounts</td>
                {(['basic', 'pro', 'premium'] as const).map(slug => {
                  const planMaxStaff = plans.find(p => p.slug === slug)?.max_staff;
                  const label = planMaxStaff === -1 || planMaxStaff == null ? 'Unlimited' : `Up to ${planMaxStaff}`;
                  return (
                    <td key={slug} className={`px-5 py-3.5 text-center ${
                      activePlanSlug === slug ? 'text-ink font-semibold' : 'text-ink-muted'
                    }`}>
                      {label}
                    </td>
                  );
                })}
              </tr>
              {COMPARE_ROWS.map((row, i) => (
                <tr key={i} className="hover:bg-canvas/50 transition-colors">
                  <td className="px-5 py-3.5 text-ink-body font-medium">{row.label}</td>
                  {(['basic', 'pro', 'premium'] as const).map(slug => (
                    <td key={slug} className={`px-5 py-3.5 text-center ${
                      activePlanSlug === slug ? 'text-ink font-semibold' : 'text-ink-muted'
                    }`}>
                      {(row as Record<string, string>)[slug] === '—' ? (
                        <span className="text-[#EBE6E0]">—</span>
                      ) : (
                        (row as Record<string, string>)[slug]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── SECTION E: Billing History ───────────────────────────────────────── */}
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-taupe flex items-center gap-1.5">
          <History size={12} /> Subscription History
        </p>
        <div className="bg-surface border border-line rounded-2xl overflow-hidden">
          {/* No per-transaction payment ledger exists on the backend yet —
              this used to show 3 fabricated past charges that had nothing to
              do with the actual shop. Showing the one real record that does
              exist (the current subscription itself) instead of inventing
              history that was never real. */}
          {currentSubscription ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-canvas border-b border-line">
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">Started</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">Plan</th>
                  <th className="text-right px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">Rate</th>
                  <th className="text-center px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                <tr>
                  <td className="px-5 py-3.5 text-ink-body">
                    {currentSubscription.starts_at
                      ? new Date(currentSubscription.starts_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-ink font-medium">{currentSubscription.plan?.name ?? '—'}</td>
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
            <div className="text-center py-12 text-ink-faint text-sm">No subscription history yet.</div>
          )}
          <div className="px-5 py-3.5 border-t border-line bg-canvas">
            <p className="text-[11px] text-ink-faint">
              Payments are simulated — no actual charges are made during this capstone phase.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
