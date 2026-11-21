import type { ExportTable, Cell } from '@/lib/brandedExport';
import { AnalyticsData, STATUS_LABELS, GARMENT_CATEGORY_LABELS } from './reportHelpers';

export const PERIOD_LABELS: Record<string, string> = {
  all_time: 'All time',
  this_month: 'This month',
  last_month: 'Last month',
  ytd: 'Year to date',
};

/** A custom date range travels as one period value: "custom:2026-09-01:2026-10-31". */
export function customPeriod(from: string, to: string): string {
  return `custom:${from}:${to}`;
}

/** The from/to of a custom period, or null for the presets. */
export function parseCustomPeriod(p: string): { from: string; to: string } | null {
  const m = /^custom:(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2})$/.exec(p);
  return m ? { from: m[1], to: m[2] } : null;
}

const shortDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** "This month", or "Sep 1, 2026 – Oct 31, 2026" for a custom range. */
export function periodLabel(p: string): string {
  const custom = parseCustomPeriod(p);
  return custom ? `${shortDate(custom.from)} – ${shortDate(custom.to)}` : PERIOD_LABELS[p] ?? p;
}

/** Same ranges the Reports page sends to /analytics. */
export function reportDateRange(p: string): { startDate: string; endDate: string } {
  const custom = parseCustomPeriod(p);
  if (custom) return { startDate: custom.from, endDate: custom.to };
  const now = new Date();
  const iso = (d: Date) => d.toISOString().split('T')[0];
  if (p === 'this_month') return { startDate: iso(new Date(now.getFullYear(), now.getMonth(), 1)), endDate: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
  if (p === 'last_month') return { startDate: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)), endDate: iso(new Date(now.getFullYear(), now.getMonth(), 0)) };
  if (p === 'ytd') return { startDate: iso(new Date(now.getFullYear(), 0, 1)), endDate: iso(new Date(now.getFullYear(), 11, 31)) };
  return { startDate: '', endDate: '' };
}

/** Headline figures (label, value, is-money). Same set as the CSV export. */
export function reportSummary(d: AnalyticsData): [string, Cell, boolean][] {
  return [
    ['Total revenue', d.total_revenue, true],
    ["Today's revenue", d.today_revenue ?? 0, true],
    ['Outstanding balance', d.total_outstanding_balance, true],
    ['Awaiting approval', d.pending_approval_balance ?? 0, true],
    ['Avg. order value', d.avg_order_value ?? 0, true],
    ['Completed jobs', d.completed_jobs, false],
    ['Total jobs', d.total_jobs, false],
    ['Completion rate (%)', d.completion_rate ?? 0, false],
    ['Avg. turnaround (days)', d.avg_turnaround_days ?? '—', false],
    ['Overdue orders', d.overdue_jobs ?? 0, false],
    ['Rejected payments', d.rejected_payments_amount ?? 0, true],
    ['Forfeited deposits', d.forfeited_deposit_amount ?? 0, true],
    ['Upcoming appointments', d.upcoming_appointments, false],
    ['Booking conversion (%)', d.booking_conversion_rate ?? 0, false],
    ['Customer rating', d.avg_rating != null ? `${d.avg_rating} (${d.total_reviews ?? 0} reviews)` : 'No reviews yet', false],
    ['Total staff', d.total_staff, false],
  ];
}

/** The report's tables: summary, revenue by month, jobs by status, orders by garment. */
export function reportTables(d: AnalyticsData): ExportTable[] {
  const summary = reportSummary(d);
  // The Value column mixes money and counts, so money is written out as "₱1,234.00" here.
  const asPeso = (v: Cell) => `₱${Number(v ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const tables: ExportTable[] = [{
    heading: 'Summary',
    columns: ['Metric', 'Value'],
    rows: summary.map(([k, v, money]) => [k, money ? asPeso(v) : v]),
  }];
  if (d.revenue_data?.length) {
    tables.push({
      heading: 'Revenue by month',
      columns: ['Month', 'Revenue (PHP)'],
      rows: d.revenue_data.map((r) => [r.month, r.revenue]),
      money: [1],
      total: ['TOTAL', d.revenue_data.reduce((s, r) => s + (Number(r.revenue) || 0), 0)],
    });
  }
  if (d.jobs_by_status?.length) {
    tables.push({
      heading: 'Jobs by status',
      columns: ['Status', 'Jobs'],
      rows: d.jobs_by_status.map((r) => [STATUS_LABELS[r.status] || r.status, r.count]),
      total: ['TOTAL', d.jobs_by_status.reduce((s, r) => s + (Number(r.count) || 0), 0)],
    });
  }
  if (d.garment_breakdown?.length) {
    tables.push({
      heading: 'Orders by garment category',
      columns: ['Garment category', 'Orders', 'Revenue (PHP)'],
      rows: d.garment_breakdown.map((r) => [GARMENT_CATEGORY_LABELS[r.garment_category] || r.garment_category, r.count, r.revenue]),
      money: [2],
    });
  }
  return tables;
}
