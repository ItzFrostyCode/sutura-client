import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import Link from 'next/link';
import { Package, TrendingUp } from 'lucide-react';
import { AnalyticsData } from './dashboardHelpers';

interface DashboardChartsProps {
  readonly data: AnalyticsData | null;
  readonly onPeriodChange?: (period: string) => void;
  readonly activePeriod?: string;
}

const PERIODS = [
  { id: 'this_month', label: 'This Month' },
  { id: 'last_3_months', label: '3 Months' },
  { id: 'this_year', label: 'This Year' },
  { id: 'all_time', label: 'All Time' },
];

// Status colours matching the production pipeline
const STATUS_COLORS: Record<string, string> = {
  pending:                  '#F59E0B',
  confirmed:                '#3B82F6',
  design:                   '#8B5CF6',
  pattern_making:           '#EC4899',
  mass_cutting_printing:    '#F97316',
  cutting:                  '#06B6D4',
  sewing:                   '#10B981',
  ready_for_fitting:        '#84CC16',
  final_adjustments:        '#F43F5E',
  qc_ironing:               '#A78BFA',
  completed:                '#22C55E',
  cancelled:                '#EF4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending:                  'Pending',
  confirmed:                'Confirmed',
  design:                   'Design',
  pattern_making:           'Pattern Making',
  mass_cutting_printing:    'Mass Cutting',
  cutting:                  'Cutting',
  sewing:                   'Sewing',
  ready_for_fitting:        'Fitting',
  final_adjustments:        'Adjustments',
  qc_ironing:               'QC/Ironing',
  completed:                'Completed',
  cancelled:                'Cancelled',
};

// Custom tooltip for the area chart
function RevenueTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#EBE6E0] rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="text-[#827A73] mb-1">{label}</p>
      <p className="font-bold text-[#2D2A26]">
        ₱{(payload[0].value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

// Custom label for pie slices (only shows % if > 5%)
function PieLabel({ cx = 0, cy = 0, midAngle = 0, outerRadius = 0, percent = 0 }: {
  cx?: number; cy?: number; midAngle?: number;
  outerRadius?: number; percent?: number;
}) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const x = cx + (outerRadius + 18) * Math.cos(-midAngle * RADIAN);
  const y = cy + (outerRadius + 18) * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#827A73" fontSize={11} textAnchor="middle" dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function DashboardCharts({
  data,
  onPeriodChange,
  activePeriod = 'this_month',
}: DashboardChartsProps) {
  const [localPeriod, setLocalPeriod] = useState(activePeriod);

  const handlePeriod = (id: string) => {
    setLocalPeriod(id);
    onPeriodChange?.(id);
  };

  // Revenue area chart data
  const chartData = data?.revenue_data && data.revenue_data.length > 0
    ? data.revenue_data
    : [
        { month: 'Week 1', revenue: 0 },
        { month: 'Week 2', revenue: 0 },
        { month: 'Week 3', revenue: 0 },
        { month: 'Week 4', revenue: 0 },
      ];

  // The chart line itself had the same problem as the trend badge — it
  // plotted future, not-yet-started buckets (e.g. Aug 16/24 when today is
  // Aug 8) as a flat ₱0, which drew as the business collapsing to zero and
  // staying there for the rest of the visible range, instead of just "that
  // week hasn't happened yet." Unlike the trend calculation, the chart
  // should still show today's own in-progress bucket (a real, if partial,
  // data point) — only buckets that haven't started at all get dropped.
  const today0 = new Date().toISOString().slice(0, 10);
  const visibleChartData = chartData.filter(d => !('date' in d) || !d.date || d.date <= today0);

  // Jobs-by-status donut data (exclude zero-count statuses)
  const pieData = (data?.jobs_by_status ?? [])
    .filter(s => s.count > 0)
    .map(s => ({
      name: STATUS_LABELS[s.status] ?? s.status,
      value: s.count,
      color: STATUS_COLORS[s.status] ?? '#D1C7BD',
    }));

  const totalJobsInPie = pieData.reduce((acc, s) => acc + s.value, 0);

  const recentJobs = data?.recent_jobs || [];

  // Revenue trend: compare first half vs second half of data.
  // Only over buckets that have *fully* completed — viewing "This Month"
  // partway through, the later buckets (e.g. Aug 16/24 when today is Aug 8)
  // haven't happened yet, and the bucket containing today itself is still
  // mid-accumulation (Aug 8's own week isn't over). Either kind read as a
  // "-100% drop" against a real, completed earlier bucket, which is just
  // time not having passed yet, not a real decline. A bucket only counts as
  // complete once the *next* bucket has started — the last bucket in the
  // list never does until the period itself ends. Buckets with no 'date'
  // (older cached responses) are treated as complete, matching old behavior.
  const today = new Date().toISOString().slice(0, 10);
  const elapsedChartData = chartData.filter((d, i) => {
    const next = chartData[i + 1];
    return !('date' in d) || !d.date || (next?.date != null && next.date <= today);
  });
  const midpoint = Math.floor(elapsedChartData.length / 2);
  const firstHalf = elapsedChartData.slice(0, midpoint).reduce((s, d) => s + (d.revenue || 0), 0);
  const secondHalf = elapsedChartData.slice(midpoint).reduce((s, d) => s + (d.revenue || 0), 0);
  // Need at least one elapsed bucket on each side of the split for the
  // comparison to mean anything.
  const trend = midpoint === 0 || firstHalf === 0 ? null : ((secondHalf - firstHalf) / firstHalf) * 100;

  // This whole component renders inside a single white card the parent page
  // already draws (bg-white, border, shadow, rounded corners — see
  // dashboard/page.tsx's "Business Performance" wrapper). Each section below
  // used to ALSO be its own bg-white/border/shadow card, nested one level
  // deeper — a card inside a card, three times over, each with its own
  // duplicate border and shadow stacking on top of the outer one. That's
  // what read as "may background," cluttered, and inconsistent with every
  // other dashboard card, which is a single flat surface. Sections are now
  // divided with plain border lines instead, the same way the header above
  // is already separated from this content.
  return (
    <div className="text-[#2D2A26]">
      {/* ── Revenue chart ──────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-6 border-b border-[#EBE6E0]">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold text-[#A8A19A] uppercase tracking-wider mb-0.5">
              Revenue
            </p>
            <p className="text-3xl font-bold text-[#2D2A26] tracking-tight">
              ₱{data?.total_revenue
                ? data.total_revenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })
                : '0.00'}
            </p>
            {trend !== null && (
              <p className={`text-xs mt-1 flex items-center gap-1 font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-[#B26959]'}`}>
                <TrendingUp size={12} className={trend < 0 ? 'rotate-180' : ''} />
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% vs previous period
              </p>
            )}
          </div>

          {/* Period pills */}
          <div className="flex gap-1 bg-[#F0EAE3] p-1 rounded-xl self-start">
            {PERIODS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  localPeriod === p.id
                    ? 'bg-white text-[#2D2A26] shadow-sm'
                    : 'text-[#827A73] hover:text-[#524A44]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={visibleChartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9A8073" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#9A8073" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBE6E0" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#A8A19A"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis
                stroke="#A8A19A"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v >= 1000 ? `₱${v / 1000}k` : `₱${v}`}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#9A8073"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRev)"
                activeDot={{ r: 5, fill: '#9A8073', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom row: Donut + Recent Orders ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Jobs by status donut */}
        <div className="p-6 border-b lg:border-b-0 lg:border-r border-[#EBE6E0]">
          <p className="text-xs font-semibold text-[#A8A19A] uppercase tracking-wider mb-4">
            Jobs by Status
          </p>
          {pieData.length > 0 ? (
            <div className="flex flex-col items-center">
              {/* The % labels sit outerRadius+18px from center (see PieLabel)
                  — 76+18=94px in every direction, needing a 188px-tall box at
                  minimum. This was h-44 (176px), 12px too short, so the
                  topmost slice's label rendered outside the container and
                  got clipped by the SVG boundary right under the card title. */}
              <div className="relative h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                      label={PieLabel}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [
                        `${typeof val === 'number' ? val : 0} jobs`,
                        String(name),
                      ]}
                      contentStyle={{
                        backgroundColor: '#fff',
                        borderColor: '#EBE6E0',
                        borderRadius: '0.75rem',
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Centre label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-2xl font-bold text-[#2D2A26]">{totalJobsInPie}</p>
                  <p className="text-[11px] text-[#A8A19A] font-medium">Total Jobs</p>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 w-full max-w-xs">
                {pieData.slice(0, 8).map(s => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs text-[#524A44]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="truncate">{s.name}</span>
                    <span className="ml-auto font-semibold text-[#2D2A26]">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-44 text-center">
              <div className="w-10 h-10 bg-[#FAF6F3] rounded-full flex items-center justify-center mb-2">
                <Package size={18} className="text-[#C5BDBA]" />
              </div>
              <p className="text-sm text-[#A8A19A]">No active jobs yet.</p>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-[#A8A19A] uppercase tracking-wider">
              Recent Orders
            </p>
            <Link href="/dashboard/jobs" className="text-xs font-semibold text-[#9A8073] hover:text-[#2D2A26] transition-colors">
              View All
            </Link>
          </div>

          <div className="flex-1 space-y-0">
            {recentJobs.length > 0 ? (
              recentJobs.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 border-b border-[#EBE6E0] last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#2D2A26] truncate">
                      {order.customer?.name || 'Walk-in Customer'}
                    </p>
                    <p className="text-xs text-[#A8A19A]">{order.order_number || `#${order.id}`}</p>
                  </div>
                  <span className="text-sm font-bold text-[#2D2A26] shrink-0 ml-3">
                    ₱{(Number(order.total_amount) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-10 h-10 bg-[#FAF6F3] rounded-full flex items-center justify-center mb-2">
                  <Package size={18} className="text-[#C5BDBA]" />
                </div>
                <p className="text-sm text-[#A8A19A]">No recent orders yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
