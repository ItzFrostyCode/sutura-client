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

  // Revenue trend: compare first half vs second half of data
  const midpoint = Math.floor(chartData.length / 2);
  const firstHalf = chartData.slice(0, midpoint).reduce((s, d) => s + (d.revenue || 0), 0);
  const secondHalf = chartData.slice(midpoint).reduce((s, d) => s + (d.revenue || 0), 0);
  const trend = firstHalf === 0 ? null : ((secondHalf - firstHalf) / firstHalf) * 100;

  return (
    <div className="space-y-6 text-[#2D2A26]">
      {/* ── Revenue chart ──────────────────────────────────────────── */}
      <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
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
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs by status donut */}
        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-semibold text-[#A8A19A] uppercase tracking-wider mb-4">
            Jobs by Status
          </p>
          {pieData.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="relative h-44 w-full">
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
        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm flex flex-col">
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
