'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import SubscriptionGate from '@/components/SubscriptionGate';
import { AnalyticsData, STATUS_LABELS, GARMENT_CATEGORY_LABELS } from '@/components/reports/reportHelpers';
import ReportKpiCards from '@/components/reports/ReportKpiCards';
import ReportCharts from '@/components/reports/ReportCharts';
import ReportFilters from '@/components/reports/ReportFilters';
import BranchComparisonTable, { BranchPerformance } from '@/components/reports/BranchComparisonTable';
import StaffProductivityTable, { StaffPerformance } from '@/components/reports/StaffProductivityTable';
import OutstandingBalancesList from '@/components/reports/OutstandingBalancesList';
import UnclaimedPickupsList from '@/components/reports/UnclaimedPickupsList';
import JobsOnHoldList from '@/components/reports/JobsOnHoldList';
import { useBranch } from '@/context/BranchContext';

export default function ReportsPage() {
  const { shop, user } = useAuthStore();
  const { selectedBranchId, branches } = useBranch();
  const isShopOwner = user?.roles?.[0]?.name === 'shop_owner';
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all_time');
  const [branchComparison, setBranchComparison] = useState<BranchPerformance[]>([]);
  const [branchComparisonLoading, setBranchComparisonLoading] = useState(false);
  const [staffProductivity, setStaffProductivity] = useState<StaffPerformance[]>([]);
  const [staffProductivityLoading, setStaffProductivityLoading] = useState(false);

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['SUTURA Sales and Analytics Report'],
      ['Period', period.toUpperCase().replace('_', ' ')],
      ['Generated At', new Date().toLocaleString()],
      [],
      ['Metric', 'Value'],
      ['Total Revenue', data.total_revenue],
      ["Today's Revenue", data.today_revenue ?? 0],
      ['Outstanding Balance', data.total_outstanding_balance],
      ['Completed Jobs', data.completed_jobs],
      ['Total Jobs', data.total_jobs],
      ['Completion Rate (%)', data.completion_rate ?? 0],
      ['Avg. Order Value', data.avg_order_value ?? 0],
      ['Avg. Turnaround Time (days)', data.avg_turnaround_days ?? '—'],
      ['Overdue Orders', data.overdue_jobs ?? 0],
      ['Rejected Payments', data.rejected_payments_amount ?? 0],
      ['Forfeited Deposits', data.forfeited_deposit_amount ?? 0],
      ['Upcoming Appointments', data.upcoming_appointments],
      ['Booking Conversion Rate (%)', data.booking_conversion_rate ?? 0],
      ['Customer Rating (All-Time)', data.avg_rating != null ? `${data.avg_rating} (${data.total_reviews ?? 0} reviews)` : 'No reviews yet'],
      ['Total Staff', data.total_staff],
      [],
      ['Monthly Revenue Breakdown'],
      ['Month', 'Revenue (PHP)'],
    ];

    if (data.revenue_data) {
      data.revenue_data.forEach(row => {
        rows.push([row.month, row.revenue]);
      });
    }

    if (data.jobs_by_status) {
      rows.push([], ['Jobs by Status Breakdown'], ['Status', 'Count']);
      data.jobs_by_status.forEach(row => {
        rows.push([STATUS_LABELS[row.status] || row.status, row.count]);
      });
    }

    if (data.garment_breakdown) {
      rows.push([], ['Orders by Garment Category'], ['Garment Category', 'Count', 'Revenue (PHP)']);
      data.garment_breakdown.forEach(row => {
        rows.push([GARMENT_CATEGORY_LABELS[row.garment_category] || row.garment_category, row.count, row.revenue]);
      });
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map(e => e.map(val => `"${String(val).replaceAll('"', '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sutura_reports_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrint = () => {
    globalThis.print();
  };

  const getDateRangeForPeriod = (p: string): { startDate: string; endDate: string } => {
    const now = new Date();
    if (p === 'this_month') {
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
      };
    }
    if (p === 'last_month') {
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0],
      };
    }
    if (p === 'ytd') {
      return {
        startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0],
      };
    }
    return { startDate: '', endDate: '' };
  };

  useEffect(() => {
    // Matches the backend's role:shop_owner,branch_manager gate on GET /analytics
    // — plain staff can't hit this endpoint, so skip the fetch rather than 403.
    if (!shop?.id || !(isShopOwner || user?.roles?.[0]?.name === 'branch_manager')) {
      if (user?.id) {
        setTimeout(() => setLoading(false), 0);
      }
      return;
    }

    async function fetchAnalytics() {
      setLoading(true);
      const { startDate, endDate } = getDateRangeForPeriod(period);

      let url = `/shops/${shop?.id}/analytics`;
      const queryParams: string[] = [];
      if (startDate && endDate) queryParams.push(`start_date=${startDate}`, `end_date=${endDate}`);
      if (selectedBranchId !== null) queryParams.push(`branch_id=${selectedBranchId}`);

      if (queryParams.length > 0) url += `?${queryParams.join('&')}`;

      try {
        const res = await api.get(url);
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.id, period, user?.id, selectedBranchId, isShopOwner]);

  // Branch performance comparison — owner-only strategic view, only worth
  // fetching once there's actually more than one branch to compare.
  useEffect(() => {
    if (!shop?.id || !isShopOwner || branches.length < 2) return;

    async function fetchBranchComparison() {
      setBranchComparisonLoading(true);
      const { startDate, endDate } = getDateRangeForPeriod(period);

      let url = `/shops/${shop?.id}/analytics/branches`;
      if (startDate && endDate) url += `?start_date=${startDate}&end_date=${endDate}`;

      try {
        const res = await api.get(url);
        setBranchComparison(res.data.data);
      } catch (err) {
        console.error('Failed to fetch branch comparison', err);
      } finally {
        setBranchComparisonLoading(false);
      }
    }

    fetchBranchComparison();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.id, period, isShopOwner, branches.length]);

  // Individual staff productivity — owner-only strategic view.
  useEffect(() => {
    if (!shop?.id || !isShopOwner) return;

    async function fetchStaffProductivity() {
      setStaffProductivityLoading(true);
      const { startDate, endDate } = getDateRangeForPeriod(period);

      let url = `/shops/${shop?.id}/analytics/staff`;
      if (startDate && endDate) url += `?start_date=${startDate}&end_date=${endDate}`;

      try {
        const res = await api.get(url);
        setStaffProductivity(res.data.data);
      } catch (err) {
        console.error('Failed to fetch staff productivity', err);
      } finally {
        setStaffProductivityLoading(false);
      }
    }

    fetchStaffProductivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.id, period, isShopOwner]);

  // ─── Derived chart data ──────────────────────────────────────────────────

  const revenueChartData =
    data?.revenue_data && data.revenue_data.length > 0
      ? data.revenue_data
      : [
          { month: 'Jan', revenue: 0 },
          { month: 'Feb', revenue: 0 },
          { month: 'Mar', revenue: 0 },
          { month: 'Apr', revenue: 0 },
          { month: 'May', revenue: 0 },
          { month: 'Jun', revenue: 0 },
        ];

  const jobsStatusData =
    data?.jobs_by_status && data.jobs_by_status.length > 0
      ? data.jobs_by_status
      : [
          { status: 'pending', count: 0 },
          { status: 'cutting', count: 0 },
          { status: 'sewing', count: 0 },
          { status: 'completed', count: 0 },
        ];

  const completionRate = data?.total_jobs ? Math.round(((data.completed_jobs || 0) / data.total_jobs) * 100) : 0;

  const pendingRate = 100 - completionRate;

  const completionPieData = [
    { name: 'Completed', value: completionRate, fill: '#7A8B76' },
    { name: 'Pending', value: pendingRate, fill: '#EBE6E0' },
  ];

  const outstandingRate = data?.total_revenue
    ? Math.round(
        ((data.total_outstanding_balance || 0) / (data.total_revenue + (data.total_outstanding_balance || 0))) *
          100
      )
    : 0;

  const balancePieData = [
    { name: 'Collected', value: 100 - outstandingRate, fill: '#9A8073' },
    { name: 'Outstanding', value: outstandingRate, fill: '#EBE6E0' },
  ];

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-8 pb-12">
        {/* Skeleton Filters */}
        <div className="flex gap-4 animate-pulse">
          <div className="h-10 bg-[#EBE6E0] rounded-xl w-48"></div>
          <div className="h-10 bg-[#EBE6E0] rounded-xl w-32 ml-auto"></div>
        </div>
        {/* Skeleton KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`kpi-skel-${i}`} className="h-32 bg-white rounded-2xl border border-[#EBE6E0] p-5 flex flex-col justify-between shadow-sm animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-[#FAF6F3] rounded w-24"></div>
                <div className="h-8 w-8 bg-[#FAF6F3] rounded-full"></div>
              </div>
              <div>
                <div className="h-8 bg-[#EBE6E0] rounded w-32 mb-2"></div>
                <div className="h-3 bg-[#FAF6F3] rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white rounded-2xl border border-[#EBE6E0] shadow-sm p-6 flex flex-col animate-pulse">
            <div className="h-5 bg-[#EBE6E0] rounded w-48 mb-6"></div>
            <div className="flex-1 flex items-end gap-2">
              {[40, 70, 45, 90, 60, 80].map((h, i) => (
                <div key={i} className="flex-1 bg-[#FAF6F3] rounded-t-sm" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>
          <div className="h-80 bg-white rounded-2xl border border-[#EBE6E0] shadow-sm p-6 flex flex-col animate-pulse">
            <div className="h-5 bg-[#EBE6E0] rounded w-48 mb-6"></div>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-40 h-40 rounded-full border-[12px] border-[#FAF6F3]"></div>
            </div>
          </div>
        </div>
        {/* Skeleton Table */}
        <div className="h-64 bg-white rounded-2xl border border-[#EBE6E0] shadow-sm p-6 flex flex-col animate-pulse">
          <div className="h-5 bg-[#EBE6E0] rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-[#FAF6F3] rounded w-1/3"></div>
                <div className="h-4 bg-[#FAF6F3] rounded w-1/4"></div>
                <div className="h-4 bg-[#FAF6F3] rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 print-container">
      {/* Print CSS Stylesheet */}
      <style>{`
        @media print {
          /* Hide sidebar/navigation, headers, filters, buttons */
          aside, nav, header, button, select, .no-print, .filter-bar {
            display: none !important;
          }
          main, .print-container {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .bg-white {
            border: 1px solid #EBE6E0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <ReportFilters
        period={period}
        setPeriod={setPeriod}
        onExportCSV={handleExportCSV}
        onPrint={handlePrint}
      />

      <SubscriptionGate feature="reports">
        <div className="space-y-6">
          <ReportKpiCards data={data} completionRate={completionRate} period={period} />

          <ReportCharts
            data={data}
            revenueChartData={revenueChartData}
            jobsStatusData={jobsStatusData}
            completionRate={completionRate}
            completionPieData={completionPieData}
            outstandingRate={outstandingRate}
            balancePieData={balancePieData}
          />

          {isShopOwner && branches.length > 1 && (
            <BranchComparisonTable data={branchComparison} loading={branchComparisonLoading} />
          )}

          {isShopOwner && (
            <StaffProductivityTable data={staffProductivity} loading={staffProductivityLoading} />
          )}

          {data?.outstanding_balances && (
            <OutstandingBalancesList rows={data.outstanding_balances} />
          )}

          {data?.unclaimed_pickups && (
            <UnclaimedPickupsList rows={data.unclaimed_pickups} />
          )}

          {data?.jobs_on_hold && (
            <JobsOnHoldList rows={data.jobs_on_hold} />
          )}
        </div>
      </SubscriptionGate>
    </div>
  );
}
