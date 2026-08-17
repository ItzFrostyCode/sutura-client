'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranch } from '@/context/BranchContext';
import Link from 'next/link';

import { AnalyticsData, JobItem, StaffPresence } from '@/components/dashboard/dashboardHelpers';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ActionQueue from '@/components/dashboard/ActionQueue';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import StaffOnline from '@/components/dashboard/StaffOnline';
import NewsView from '@/components/dashboard/NewsView';
import WelcomeView from '@/components/dashboard/WelcomeView';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import {
  Calendar, Scissors, Users, CreditCard,
  ShoppingBag, Package, UserCog, Building2,
} from 'lucide-react';

export default function DashboardPage() {
  const { shop, user } = useAuthStore();
  const { selectedBranchId } = useBranch();
  const roleName = user?.roles?.[0]?.name;
  const isShopOwner = roleName === 'shop_owner';
  // Matches the backend's role:shop_owner,branch_manager gate on GET /analytics
  const canViewAnalytics = isShopOwner || roleName === 'branch_manager';
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('this_month');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'news' | 'welcome'>('dashboard');

  // Visibility toggle
  const [shopVisible, setShopVisible] = useState<boolean | null>(null);
  const [visibilityLoading, setVisibilityLoading] = useState(false);

  // Completed-but-unpaid jobs, from a dedicated uncapped backend query
  const [unpaidJobs, setUnpaidJobs] = useState<JobItem[]>([]);

  // Online staff
  const [onlineStaff, setOnlineStaff] = useState<StaffPresence[]>([]);

  const fetchOnlineStaff = useCallback(() => {
    // Staff list/management is owner-only (matches GET /shops/{shop}/staff) —
    // staff/branch managers share this dashboard and shouldn't 403 on it.
    if (!shop?.id || !isShopOwner) return;
    api.get(`/shops/${shop.id}/staff`)
      .then(res => {
        const raw: StaffPresence[] = (res.data.data || []);
        const FIVE_MIN = 5 * 60 * 1000;
        const now = Date.now();
        const online = raw
          // StaffController::index has no server-side branch_id filter (unlike
          // jobs/appointments/analytics), so this widget filters client-side —
          // otherwise selecting a branch left "Online Staff" silently showing
          // every branch's staff.
          .filter(s => selectedBranchId === null || s.shop_branch_id === selectedBranchId)
          .filter(s => {
            if (!s.user?.last_seen_at) return false;
            return now - new Date(s.user.last_seen_at).getTime() < FIVE_MIN;
          })
          .map(s => ({ ...s, _onlineSince: new Date(s.user.last_seen_at!).getTime() }))
          .sort((a, b) => a._onlineSince - b._onlineSince);
        setOnlineStaff(online);
      })
      .catch(() => {});
  }, [shop, isShopOwner, selectedBranchId]);

  useEffect(() => {
    if (shop?.id) {
      setTimeout(() => setLoading(true), 0);
      // Home respects the header's branch selector — matches
      // AnalyticsController::index's branch_id support. Omitted entirely when
      // "All Branches" is selected, since the backend's $request->filled()
      // check treats an empty value the same as absent.
      const params: Record<string, string | number> = {};
      if (selectedBranchId !== null) {
        params.branch_id = selectedBranchId;
      }

      if (canViewAnalytics) {
        api.get(`/shops/${shop.id}/analytics`, { params })
          .then(res => {
            setData(res.data.data);
            // From a dedicated, uncapped backend query — was previously
            // re-derived from a per_page=200 jobs fetch, which silently
            // dropped older completed-unpaid jobs from the count.
            setUnpaidJobs(res.data.data?.completed_unpaid_jobs || []);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      } else {
        setTimeout(() => setLoading(false), 0);
      }
      // Shop visibility toggle is owner-only (matches PUT /shops/{shop}).
      // Reads/writes `is_hidden` (inverted).
      if (isShopOwner) {
        api.get(`/shops/${shop.id}`)
          .then(res => setShopVisible(!res.data.data?.is_hidden))
          .catch(() => {});
      }
      fetchOnlineStaff();
    } else if (user?.id) {
      setTimeout(() => setLoading(false), 0);
    } else {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
  }, [shop?.id, user?.id, fetchOnlineStaff, canViewAnalytics, isShopOwner, selectedBranchId]);

  useEffect(() => {
    if (!shop?.id) return;
    const interval = setInterval(fetchOnlineStaff, 30_000);
    return () => clearInterval(interval);
  }, [shop?.id, fetchOnlineStaff]);

  // The backend reads start_date/end_date, not a 'period' string — converting
  // client-side (same pattern as the Reports page) so the period buttons
  // actually re-scope the query instead of silently refetching this month.
  const getDateRangeForChartPeriod = (period: string): { start_date?: string; end_date?: string } => {
    const now = new Date();
    if (period === 'this_month') {
      return {
        start_date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        end_date: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
      };
    }
    if (period === 'last_3_months') {
      return {
        start_date: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0],
        end_date: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
      };
    }
    if (period === 'this_year') {
      return {
        start_date: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
        end_date: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0],
      };
    }
    // 'all_time' — omit date params entirely so the query is unbounded.
    return {};
  };

  const handleChartPeriod = (period: string) => {
    setChartPeriod(period);
    if (!shop?.id || !canViewAnalytics) return;
    const { start_date, end_date } = getDateRangeForChartPeriod(period);
    const params: Record<string, string | number> = {};
    if (start_date && end_date) {
      params.start_date = start_date;
      params.end_date = end_date;
    }
    if (selectedBranchId !== null) {
      params.branch_id = selectedBranchId;
    }
    api.get(`/shops/${shop.id}/analytics`, { params })
      .then(res => setData(res.data.data))
      .catch(() => {});
  };

  const toggleVisibility = async () => {
    if (!shop) return;
    setVisibilityLoading(true);
    const next = !shopVisible;
    setShopVisible(next);
    try {
      await api.put(`/shops/${shop.id}`, { is_hidden: !next });
    } catch {
      setShopVisible(!next);
    } finally {
      setVisibilityLoading(false);
    }
  };

  // All from dedicated, unbounded backend queries — never re-derived from a
  // capped list fetch (a long-lead-time order can be created well outside a
  // recency window while still being due today).
  const dueToday = data?.due_today_jobs ?? [];
  const dueThisWeek = data?.due_this_week_jobs ?? [];
  const todayAppointments = data?.today_appointments ?? [];
  const pendingDpJobs = data?.pending_dp_jobs_list ?? [];

  if (loading) {
    return <DashboardSkeleton />;
  }

  const peso = (v: unknown) =>
    `₱${Number(v ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  // ── Metric chips: compact inline counters replacing the old full-row DashboardMetrics ──
  const metricChips = [
    { label: 'Orders', value: data?.total_jobs || 0, icon: Scissors },
    { label: 'Collections', value: data?.total_collections || 0, icon: ShoppingBag },
    { label: 'Customers', value: data?.total_customers || 0, icon: Users },
    { label: 'Appointments', value: data?.total_appointments || 0, icon: Calendar },
    { label: 'Services', value: data?.total_services || 0, icon: Package },
    { label: 'Staff', value: data?.total_staff || 0, icon: UserCog },
    { label: 'Branches', value: data?.total_branches || 0, icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header with tabs ──────────────────────────────────────────────── */}
      <DashboardHeader
        userName={user?.name || ''}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shopVisible={shopVisible}
        toggleVisibility={toggleVisibility}
        visibilityLoading={visibilityLoading}
      />

      {activeTab === 'news' && <NewsView />}
      {activeTab === 'welcome' && <WelcomeView />}

      {activeTab === 'dashboard' && (
        <>
      {/* ── Section 2: Financial Snapshot + Metric Chips ─────────────────── */}
      <section>
        <h2 className="text-eyebrow-accent mb-3">Financial Snapshot</h2>

        {/* Four equal stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Outstanding Balance — hero card */}
          <div className="bg-taupe rounded-xl p-5 text-white flex flex-col justify-between min-h-[120px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
              Outstanding Balance
            </p>
            <p className="text-figure text-2xl sm:text-3xl font-bold mt-3 break-words">
              {peso(data?.total_outstanding_balance)}
            </p>
          </div>

          {/* Secondary stats */}
          {[
            { label: "Today's Revenue", value: peso(data?.today_revenue), icon: CreditCard },
            { label: 'Active Orders', value: (data?.total_jobs ?? 0) - (data?.completed_jobs ?? 0), icon: Scissors },
            { label: "Today's Appointments", value: todayAppointments.length, icon: Calendar },
          ].map(stat => (
            <div key={stat.label} className="bg-surface border border-line rounded-xl p-5 flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">{stat.label}</p>
                <stat.icon size={15} className="text-ink-faint shrink-0" />
              </div>
              <p className="text-figure text-2xl font-semibold text-ink mt-3 break-words">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Inline metric chips */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto hide-scrollbar pb-1">
          {metricChips.map(chip => {
            const Icon = chip.icon;
            return (
              <div
                key={chip.label}
                className="flex items-center gap-1.5 bg-surface border border-line rounded-full px-3 py-1.5 shrink-0"
              >
                <Icon size={12} className="text-taupe" />
                <span className="text-[11px] font-medium text-ink-muted">{chip.label}</span>
                <span className="text-[11px] font-bold text-ink tabular-nums">{chip.value}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section 3: Action Queue (includes deadlines) ─────────────────── */}
      <ActionQueue
        data={data}
        unpaidJobs={unpaidJobs}
        pendingDpJobs={pendingDpJobs}
        dueToday={dueToday}
        dueThisWeek={dueThisWeek}
      />

      {/* ── Section 4: Today's Agenda + Staff Online ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Appointments — 3 of 5 cols */}
        <section className="lg:col-span-3 bg-surface border border-line rounded-xl overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line">
            <div className="min-w-0">
              <h2 className="text-eyebrow-accent">Schedule</h2>
              <p className="text-display text-lg font-semibold text-ink mt-1">Today&apos;s agenda</p>
            </div>
            <Link href="/dashboard/appointments" className="text-xs font-semibold text-taupe hover:underline shrink-0">
              View calendar →
            </Link>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="px-5 py-10 flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-full bg-canvas border border-line flex items-center justify-center mb-3">
                <Calendar size={18} className="text-ink-faint" />
              </div>
              <p className="text-sm text-ink-muted">No appointments scheduled for today.</p>
              <Link href="/dashboard/appointments" className="mt-3 text-xs font-semibold text-taupe hover:underline">
                Book an appointment
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {todayAppointments.map(apt => {
                const time = new Date(apt.scheduled_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
                const tone =
                  apt.status === 'completed' ? 'bg-sage/10 text-sage border-sage/20'
                  : apt.status === 'confirmed' ? 'bg-taupe/10 text-taupe border-taupe/20'
                  : 'bg-sunken text-ink-muted border-line';
                return (
                  <Link
                    key={apt.id}
                    href="/dashboard/appointments"
                    className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-canvas transition-colors min-h-[44px]"
                  >
                    <span className="text-figure text-sm font-bold text-ink tabular-nums shrink-0 w-[68px]">{time}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-ink truncate">{apt.customer?.name ?? 'Walk-in'}</span>
                      <span className="block text-xs text-ink-muted truncate">
                        {apt.appointment_type?.replace(/_/g, ' ')}{apt.service ? ` · ${apt.service.name}` : ''}
                      </span>
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 capitalize ${tone}`}>
                      {apt.status}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Staff Online — 2 of 5 cols */}
        <div className="lg:col-span-2">
          <StaffOnline onlineStaff={onlineStaff} />
        </div>
      </div>

      {/* ── Section 5: Performance Charts (self-contained) ───────────────── */}
      <DashboardCharts
        data={data}
        activePeriod={chartPeriod}
        onPeriodChange={handleChartPeriod}
      />
        </>
      )}
    </div>
  );
}
