'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

import QuickJobModal from '@/components/jobs/QuickJobModal';
import { AnalyticsData, JobItem, StaffPresence } from '@/components/dashboard/dashboardHelpers';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardAlerts from '@/components/dashboard/DashboardAlerts';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import StaffOnline from '@/components/dashboard/StaffOnline';
import RecentReviews from '@/components/dashboard/RecentReviews';
import NewsView from '@/components/dashboard/NewsView';
import WelcomeView from '@/components/dashboard/WelcomeView';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import {
  Calendar, Scissors, Users, AlertTriangle, CreditCard,
  PackageCheck, Zap, Clock, CheckCircle2, TrendingUp,
} from 'lucide-react';
import { useBranch } from '@/context/BranchContext';

export default function DashboardPage() {
  const { shop, user } = useAuthStore();
  const { selectedBranchId } = useBranch();
  const roleName = user?.roles?.[0]?.name;
  const isShopOwner = roleName === 'shop_owner';
  // Matches the backend's role:shop_owner,branch_manager gate on GET /analytics
  const canViewAnalytics = isShopOwner || roleName === 'branch_manager';
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'news' | 'welcome'>('dashboard');

  // Visibility toggle
  const [shopVisible, setShopVisible] = useState<boolean | null>(null);
  const [visibilityLoading, setVisibilityLoading] = useState(false);

  // Balance alert
  const [unpaidJobs, setUnpaidJobs] = useState<JobItem[]>([]);
  const [balanceExpanded, setBalanceExpanded] = useState(false);

  // Daily/Weekly jobs
  const [allJobs, setAllJobs] = useState<JobItem[]>([]);

  // Online staff
  const [onlineStaff, setOnlineStaff] = useState<StaffPresence[]>([]);

  const fetchOnlineStaff = useCallback(() => {
    // Staff list/management is owner-only (matches GET /shops/{shop}/staff) —
    // staff/branch managers share this dashboard now and shouldn't 403 on it.
    if (!shop?.id || !isShopOwner) return;
    api.get(`/shops/${shop.id}/staff`)
      .then(res => {
        const raw: StaffPresence[] = (res.data.data || []);
        const FIVE_MIN = 5 * 60 * 1000;
        const now = Date.now();
        const online = raw
          .filter(s => {
            if (!s.user?.last_seen_at) return false;
            return now - new Date(s.user.last_seen_at).getTime() < FIVE_MIN;
          })
          .map(s => ({ ...s, _onlineSince: new Date(s.user.last_seen_at!).getTime() }))
          .sort((a, b) => a._onlineSince - b._onlineSince);
        setOnlineStaff(online);
      })
      .catch(() => {});
  }, [shop, isShopOwner]);

  useEffect(() => {
    if (shop?.id) {
      setTimeout(() => setLoading(true), 0);
      const params: Record<string, string | number> = {};
      if (selectedBranchId !== null) {
        params.branch_id = selectedBranchId;
      }

      if (canViewAnalytics) {
        api.get(`/shops/${shop.id}/analytics`, { params })
          .then(res => { setData(res.data.data); setLoading(false); })
          .catch(() => setLoading(false));
      } else {
        // Deferred (not called synchronously) so it resolves after the
        // setLoading(true) scheduled above, instead of being clobbered by it.
        setTimeout(() => setLoading(false), 0);
      }
      // Shop visibility toggle is owner-only (matches PUT /shops/{shop}).
      // Reads/writes `is_hidden` (inverted) — the field this dashboard used
      // to call `is_visible` was never actually wired up on the backend, so
      // this toggle silently did nothing; consolidated onto the real field.
      if (isShopOwner) {
        api.get(`/shops/${shop.id}`)
          .then(res => setShopVisible(!res.data.data?.is_hidden))
          .catch(() => {});
      }
      api.get(`/shops/${shop.id}/jobs`, { params: { per_page: 200, ...params } })
        .then(res => {
          const rawData = res.data.data;
          const jobs: JobItem[] = Array.isArray(rawData) ? rawData : (rawData?.data || []);
          setAllJobs(jobs);
          const unpaid = jobs.filter(
            j => j.status === 'completed' && j.payment_status !== 'paid' && Number.parseFloat(String(j.balance || '0')) > 0
          );
          setUnpaidJobs(unpaid);
        })
        .catch(() => {});
      fetchOnlineStaff();
    } else if (user?.id) {
      setTimeout(() => setLoading(false), 0);
    } else {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
  }, [shop?.id, user?.id, selectedBranchId, fetchOnlineStaff, canViewAnalytics, isShopOwner]);

  useEffect(() => {
    if (!shop?.id) return;
    const interval = setInterval(fetchOnlineStaff, 30_000);
    return () => clearInterval(interval);
  }, [shop?.id, fetchOnlineStaff]);

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

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
  const activeStatuses = new Set([
    'pending', 'confirmed', 'design', 'pattern_making', 'mass_cutting_printing',
    'cutting', 'sewing', 'ready_for_fitting', 'final_adjustments', 'qc_ironing',
  ]);

  const dueToday = allJobs.filter(j => {
    if (!j.due_date || !activeStatuses.has(j.status)) return false;
    const d = new Date(j.due_date); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const dueThisWeek = allJobs.filter(j => {
    if (!j.due_date || !activeStatuses.has(j.status)) return false;
    const d = new Date(j.due_date); d.setHours(0, 0, 0, 0);
    return d > today && d <= weekEnd;
  });

  // Today's appointments now come from analytics data
  const todayAppointments = data?.today_appointments ?? [];

  // Active jobs with no downpayment collected.
  // The server tracks this via payment_status='unpaid' (balance === total_amount, nothing paid).
  const activeStatuses2 = activeStatuses;
  const pendingDpJobs = allJobs.filter(j =>
    activeStatuses2.has(j.status) &&
    j.payment_status === 'unpaid' &&
    Number.parseFloat(String(j.total_amount ?? '0')) > 0
  );

  // Needs Attention cards
  const needsAttentionCards = [
    {
      id: 'overdue',
      count: data?.overdue_jobs ?? 0,
      label: 'Overdue Orders',
      sub: 'Past due date, not completed',
      icon: AlertTriangle,
      href: '/dashboard/jobs',
      color: 'bg-red-50 border-red-200 text-red-700',
      iconColor: 'bg-red-100 text-red-600',
    },
    {
      id: 'deposits',
      count: data?.pending_deposit_jobs ?? 0,
      label: 'Pending Deposits',
      sub: 'No payment received yet',
      icon: CreditCard,
      href: '/dashboard/payments?tab=job_balances',
      color: 'bg-amber-50 border-amber-200 text-amber-800',
      iconColor: 'bg-amber-100 text-amber-600',
    },
    {
      id: 'pickup',
      count: data?.ready_for_pickup_jobs ?? 0,
      label: 'Ready for Pickup',
      sub: 'Waiting for customer collection',
      icon: PackageCheck,
      href: '/dashboard/jobs',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      iconColor: 'bg-emerald-100 text-emerald-600',
    },
    {
      id: 'rush',
      count: data?.rush_jobs_active ?? 0,
      label: 'Active Rush Orders',
      sub: 'Expedited priority production',
      icon: Zap,
      href: '/dashboard/jobs',
      color: 'bg-violet-50 border-violet-200 text-violet-800',
      iconColor: 'bg-violet-100 text-violet-600',
    },
  ].filter(c => c.count > 0);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12 text-[#2D2A26]">
      {/* Header */}
      <DashboardHeader userName={user?.name || ''} activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'news' && <NewsView />}
      {activeTab === 'welcome' && <WelcomeView />}

      {activeTab === 'dashboard' && (
      <>
      {/* ── Needs Attention Section ──────────────────────────────────────────── */}
      {needsAttentionCards.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#B26959] mb-3 flex items-center gap-1.5">
            <AlertTriangle size={12} />
            Needs Attention
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {needsAttentionCards.map(card => (
              <Link
                key={card.id}
                href={card.href}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all hover:shadow-sm ${card.color}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${card.iconColor}`}>
                  <card.icon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold leading-none mb-0.5">{card.count}</p>
                  <p className="text-xs font-semibold truncate">{card.label}</p>
                  <p className="text-[10px] opacity-70 truncate">{card.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Financial Snapshot Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Today\'s Revenue',
            value: `₱${(data?.today_revenue ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
            icon: TrendingUp,
            color: 'text-[#7A8B76]',
            bg: 'bg-[#7A8B76]/10',
          },
          {
            label: 'Outstanding Balance',
            value: `₱${(data?.total_outstanding_balance ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
            icon: CreditCard,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'Active Orders',
            value: (data?.total_jobs ?? 0) - (data?.completed_jobs ?? 0),
            icon: Scissors,
            color: 'text-[#9A8073]',
            bg: 'bg-[#9A8073]/10',
          },
          {
            label: 'Today\'s Appointments',
            value: todayAppointments.length,
            icon: Calendar,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
          },
        ].map((m) => (
          <div key={m.label} className="p-5 rounded-2xl bg-white shadow-sm border border-[#EBE6E0] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#827A73] uppercase tracking-wider">{m.label}</p>
              <div className={`w-8 h-8 rounded-xl ${m.bg} flex items-center justify-center`}>
                <m.icon size={16} className={m.color} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-[#2D2A26] tracking-tight">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Alerts (Shop Visibility + Balance Collection + Due Today/Week) */}
      <DashboardAlerts
        shopVisible={shopVisible}
        toggleVisibility={toggleVisibility}
        visibilityLoading={visibilityLoading}
        unpaidJobs={unpaidJobs}
        pendingDpJobs={pendingDpJobs}
        balanceExpanded={balanceExpanded}
        setBalanceExpanded={setBalanceExpanded}
        dueToday={dueToday}
        dueThisWeek={dueThisWeek}
      />

      {/* Extended Metrics Row */}
      <DashboardMetrics data={data} />

      {/* Main grid: left 2/3 + right 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN — Today's Agenda + Quick Actions */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Today's Agenda */}
          <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#EBE6E0]">
              <div>
                <h3 className="font-semibold text-[#2D2A26]">Today&apos;s Agenda</h3>
                <p className="text-xs text-[#A8A19A] mt-0.5">Client bookings and fittings scheduled for today</p>
              </div>
              <Link href="/dashboard/appointments" className="text-xs font-semibold text-[#9A8073] hover:underline shrink-0">
                View Calendar →
              </Link>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="py-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center mb-3">
                  <Calendar size={20} className="text-[#C5BDBA]" />
                </div>
                <p className="text-sm text-[#A8A19A]">No appointments scheduled for today.</p>
                <Link href="/dashboard/appointments" className="mt-3 text-xs font-semibold text-[#9A8073] hover:underline">
                  + Book an appointment
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#EBE6E0]">
                {todayAppointments.map((apt) => {
                  const time = new Date(apt.scheduled_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <Link
                      key={apt.id}
                      href={`/dashboard/appointments`}
                      className="flex items-center gap-4 py-3 first:pt-0 last:pb-0 hover:bg-[#FAF6F3] -mx-1 px-1 rounded-lg transition-colors"
                    >
                      <div className="text-[13px] font-bold text-[#B26959] bg-[#B26959]/5 border border-[#B26959]/10 px-3 py-1.5 rounded-lg shrink-0 w-[72px] text-center">
                        {time}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#2D2A26] truncate">{apt.customer?.name ?? 'Walk-in'}</p>
                        <p className="text-xs text-[#827A73]">
                          {apt.appointment_type?.toUpperCase()} {apt.service ? `• ${apt.service.name}` : ''}
                        </p>
                      </div>
                      {(() => {
                        let statusClass = 'bg-amber-50 border-amber-200 text-amber-700';
                        if (apt.status === 'confirmed') statusClass = 'bg-blue-50 border-blue-200 text-blue-700';
                        if (apt.status === 'completed') statusClass = 'bg-emerald-50 border-emerald-200 text-emerald-700';
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${statusClass}`}>
                            {apt.status}
                          </span>
                        );
                      })()}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Due Today / This Week */}
          {(dueToday.length > 0 || dueThisWeek.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-[#EBE6E0] rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[#B26959]" />
                    <p className="text-sm font-semibold text-[#2D2A26]">Due Today</p>
                  </div>
                  <span className="bg-[#B26959]/10 text-[#B26959] border border-[#B26959]/20 text-xs font-bold px-2 py-0.5 rounded-full">
                    {dueToday.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {dueToday.length === 0
                    ? <p className="text-xs text-[#A8A19A] italic">Nothing due today.</p>
                    : dueToday.map(j => (
                      <Link key={j.id} href={`/dashboard/jobs/${j.id}`} className="flex items-center justify-between py-1.5 border-b border-[#EBE6E0] last:border-0 hover:text-[#9A8073] transition-colors">
                        <p className="text-sm font-medium text-[#2D2A26] truncate">{j.customer?.name || 'Walk-in'}</p>
                        <span className="text-xs text-[#A8A19A] shrink-0 ml-2">{j.order_number || `#${j.id}`}</span>
                      </Link>
                    ))
                  }
                </div>
              </div>
              <div className="bg-white border border-[#EBE6E0] rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#9A8073]" />
                    <p className="text-sm font-semibold text-[#2D2A26]">Due This Week</p>
                  </div>
                  <span className="bg-[#9A8073]/10 text-[#9A8073] border border-[#9A8073]/20 text-xs font-bold px-2 py-0.5 rounded-full">
                    {dueThisWeek.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {dueThisWeek.length === 0
                    ? <p className="text-xs text-[#A8A19A] italic">No upcoming deadlines</p>
                    : dueThisWeek.slice(0, 5).map(j => (
                      <Link key={j.id} href={`/dashboard/jobs/${j.id}`} className="flex items-center justify-between py-1.5 border-b border-[#EBE6E0] last:border-0 hover:text-[#9A8073] transition-colors">
                        <p className="text-sm font-medium text-[#2D2A26] truncate">{j.customer?.name || 'Walk-in'}</p>
                        <span className="text-xs text-[#A8A19A] shrink-0 ml-2">
                          {new Date(j.due_date!).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                        </span>
                      </Link>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-[#2D2A26] mb-1">Quick Actions</h3>
            <p className="text-xs text-[#A8A19A] mb-5">Core daily operations at your fingertips</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Quick Entry — opens modal */}
              <button
                type="button"
                onClick={() => setQuickModalOpen(true)}
                className="flex flex-col gap-2 bg-[#FAF6F3] border border-[#EBE6E0] hover:border-[#9A8073] hover:shadow-sm p-4 rounded-xl transition-all group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-[#EBE6E0] flex items-center justify-center group-hover:border-[#9A8073]/30 transition-colors">
                  <Scissors size={15} className="text-[#9A8073]" />
                </div>
                <span className="text-sm font-semibold text-[#2D2A26]">New Custom Job</span>
                <span className="text-[11px] text-[#827A73] leading-relaxed">Log fabric cut, tailoring setup &amp; measurements</span>
              </button>

              {[
                {
                  href: '/dashboard/appointments',
                  icon: Calendar,
                  title: 'Book Appointment',
                  desc: 'Schedule measurements, fittings & consultations',
                },
                {
                  href: '/dashboard/customers',
                  icon: Users,
                  title: 'View Customer Sizes',
                  desc: 'Check sizing cards and historical order logs',
                },
              ].map(action => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col gap-2 bg-[#FAF6F3] border border-[#EBE6E0] hover:border-[#9A8073] hover:shadow-sm p-4 rounded-xl transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#EBE6E0] flex items-center justify-center group-hover:border-[#9A8073]/30 transition-colors">
                    <action.icon size={15} className="text-[#9A8073]" />
                  </div>
                  <span className="text-sm font-semibold text-[#2D2A26]">{action.title}</span>
                  <span className="text-[11px] text-[#827A73] leading-relaxed">{action.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Staff Online + Recent Reviews */}
        <div className="flex flex-col gap-6">
          <StaffOnline onlineStaff={onlineStaff} />
          <RecentReviews />
        </div>
      </div>

      {/* Business Performance Chart — full width below */}
      <div className="bg-white border border-[#EBE6E0] rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#EBE6E0]">
          <div>
            <h3 className="font-semibold text-[#2D2A26]">Business Performance</h3>
            <p className="text-xs text-[#A8A19A] mt-0.5">Order history and monthly revenue tracking</p>
          </div>
          <Link href="/dashboard/reports" className="text-xs font-semibold text-[#9A8073] hover:underline shrink-0">
            View Full Reports →
          </Link>
        </div>
        <div className="p-6">
          <DashboardCharts data={data} />
        </div>
      </div>
      </>
      )}

      <QuickJobModal
        isOpen={quickModalOpen}
        onClose={() => setQuickModalOpen(false)}
        onCreated={() => {}}
      />
    </div>
  );
}
