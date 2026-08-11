import React from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from 'recharts';
import {
  AnalyticsData,
  STATUS_COLORS,
  STATUS_LABELS,
  GARMENT_CATEGORY_LABELS,
  CustomTooltip,
} from './reportHelpers';

interface ReportChartsProps {
  readonly data: AnalyticsData | null;
  readonly revenueChartData: { readonly month: string; readonly revenue: number }[];
  readonly jobsStatusData: { readonly status: string; readonly count: number }[];
  readonly completionRate: number;
  readonly completionPieData: { readonly name: string; readonly value: number; readonly fill: string }[];
  readonly outstandingRate: number;
  readonly balancePieData: { readonly name: string; readonly value: number; readonly fill: string }[];
}

interface StatusTooltipPayload {
  readonly value: number;
  readonly payload: {
    readonly status: string;
  };
}

interface StatusTooltipProps {
  readonly active?: boolean;
  readonly payload?: readonly StatusTooltipPayload[];
}

const StatusTooltip = ({ active, payload }: StatusTooltipProps) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-[#EBE6E0] rounded-xl shadow-lg px-3 py-2">
        <p className="text-xs font-medium text-[#2D2A26]">
          {STATUS_LABELS[payload[0]?.payload?.status] ?? payload[0]?.payload?.status}
        </p>
        <p className="text-sm font-bold text-taupe">{payload[0]?.value} orders</p>
      </div>
    );
  }
  return null;
};

interface GarmentTooltipPayload {
  readonly value: number;
  readonly payload: {
    readonly garment_category: string;
    readonly revenue: number;
  };
}

interface GarmentTooltipProps {
  readonly active?: boolean;
  readonly payload?: readonly GarmentTooltipPayload[];
}

const GarmentTooltip = ({ active, payload }: GarmentTooltipProps) => {
  if (active && payload?.length) {
    const p = payload[0]?.payload;
    return (
      <div className="bg-white border border-[#EBE6E0] rounded-xl shadow-lg px-3 py-2">
        <p className="text-xs font-medium text-[#2D2A26]">
          {GARMENT_CATEGORY_LABELS[p?.garment_category] ?? p?.garment_category}
        </p>
        <p className="text-sm font-bold text-taupe">{payload[0]?.value} orders</p>
        <p className="text-xs text-[#827A73]">₱{Number(p?.revenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
      </div>
    );
  }
  return null;
};

interface CustomBarShapeProps {
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
  readonly payload?: {
    readonly status: string;
  };
}

const CustomBarShape = (props: CustomBarShapeProps) => {
  const { x, y, width, height, payload } = props;
  if (payload === undefined) return null;
  const color = STATUS_COLORS[payload.status] ?? '#9A8073';
  return <rect x={x} y={y} width={width} height={height} fill={color} rx={6} ry={6} />;
};

export default function ReportCharts({
  data,
  revenueChartData,
  jobsStatusData,
  completionRate,
  completionPieData,
  outstandingRate,
  balancePieData,
}: ReportChartsProps) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      {/* Revenue Bar Chart */}
      <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-[#2D2A26]">Monthly Revenue</h2>
            <p className="text-sm text-[#A8A19A] mt-0.5">Revenue collected per month across all orders</p>
          </div>
          <span className="text-2xl font-bold text-[#2D2A26]">
            ₱
            {Number(data?.total_revenue || 0).toLocaleString('en-PH', {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={revenueChartData}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              barSize={28}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#EBE6E0" vertical={false} />
              <XAxis dataKey="month" stroke="#A8A19A" fontSize={12} tickLine={false} axisLine={false} dy={8} />
              <YAxis
                stroke="#A8A19A"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => {
                  const formatted = v >= 1000 ? `${v / 1000}k` : v;
                  return `₱${formatted}`;
                }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F0EAE3', radius: 6 }} />
              <Bar dataKey="revenue" fill="#9A8073" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row: Order Status Pie + Outstanding Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#2D2A26] mb-1">Order Status Breakdown</h2>
          <p className="text-sm text-[#A8A19A] mb-6">Distribution of orders across all production stages</p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={jobsStatusData}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 40, bottom: 0 }}
                barSize={16}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE6E0" horizontal={false} />
                <XAxis type="number" stroke="#A8A19A" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="status"
                  stroke="#A8A19A"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => STATUS_LABELS[v] ?? v}
                />
                <Tooltip content={<StatusTooltip />} />
                <Bar dataKey="count" shape={<CustomBarShape />} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Completion Rate + Balance Gauges */}
        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#2D2A26] mb-1">Performance Gauges</h2>
          <p className="text-sm text-[#A8A19A] mb-4">Completion and collection rates at a glance</p>

          <div className="grid grid-cols-2 gap-4">
            {/* Completion Rate Pie */}
            <div className="flex flex-col items-center">
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={completionPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={58}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      strokeWidth={0}
                    />
                    <text
                      x="50%"
                      y="47%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-[#2D2A26] text-xl font-bold"
                      style={{ fontSize: 18, fontWeight: 700, fill: '#2D2A26' }}
                    >
                      {completionRate}%
                    </text>
                    <text
                      x="50%"
                      y="62%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ fontSize: 10, fill: '#A8A19A' }}
                    >
                      done
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs font-medium text-[#524A44] text-center">Completion Rate</p>
              <p className="text-xs text-[#A8A19A] text-center">
                {data?.completed_jobs || 0} of {data?.total_jobs || 0} orders
              </p>
            </div>

            {/* Balance Collection Pie */}
            <div className="flex flex-col items-center">
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={balancePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={58}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      strokeWidth={0}
                    />
                    <text
                      x="50%"
                      y="47%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ fontSize: 18, fontWeight: 700, fill: '#2D2A26' }}
                    >
                      {outstandingRate}%
                    </text>
                    <text
                      x="50%"
                      y="62%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ fontSize: 10, fill: '#A8A19A' }}
                    >
                      unpaid
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs font-medium text-[#524A44] text-center">Outstanding Balance</p>
              <p className="text-xs text-[#A8A19A] text-center">
                ₱{Number(data?.total_outstanding_balance || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Revenue Trend mini area */}
          <div className="mt-4 pt-4 border-t border-[#EBE6E0]">
            <p className="text-xs text-[#A8A19A] mb-2 font-medium">Revenue Trend</p>
            <div className="h-20 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9A8073" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#9A8073" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#A8A19A" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#9A8073"
                    strokeWidth={2}
                    fill="url(#trendGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#9A8073', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Orders by Garment Category — what the shop is actually being asked
          to make; previously the only breakdowns here were revenue/status/
          branch/staff, nothing tied to the garment itself. Bars are
          clickable — same deep-link pattern as the Overdue Orders KPI card,
          straight to the filtered Jobs board instead of leaving the owner
          with just a count they'd have to go hunt down themselves. */}
      {!!data?.garment_breakdown?.length && (
        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#2D2A26] mb-1">Orders by Garment Category</h2>
          <p className="text-sm text-[#A8A19A] mb-6">What kinds of garments customers are actually ordering — click a bar to see those jobs</p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.garment_breakdown}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 40, bottom: 0 }}
                barSize={16}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE6E0" horizontal={false} />
                <XAxis type="number" stroke="#A8A19A" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="garment_category"
                  stroke="#A8A19A"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => GARMENT_CATEGORY_LABELS[v] ?? v}
                  width={110}
                />
                <Tooltip content={<GarmentTooltip />} />
                <Bar
                  dataKey="count"
                  fill="#9A8073"
                  radius={[0, 6, 6, 0]}
                  cursor="pointer"
                  onClick={(entry: { payload?: { garment_category?: string } }) => {
                    const category = entry?.payload?.garment_category;
                    if (category) {
                      router.push(`/dashboard/jobs?garment_category=${category}`);
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
