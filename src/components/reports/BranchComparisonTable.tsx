import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Building2 } from 'lucide-react';

export interface BranchPerformance {
  branch_id: number | null;
  branch_name: string;
  is_main: boolean;
  total_jobs: number;
  completed_jobs: number;
  completion_rate: number;
  total_revenue: number;
  total_outstanding_balance: number;
  rejected_payments_amount: number;
  forfeited_deposit_amount: number;
  total_appointments: number;
  total_walkin_orders: number;
  total_staff: number;
}

interface BranchComparisonTableProps {
  readonly data: BranchPerformance[];
  readonly loading: boolean;
}

interface RevenueTooltipPayload {
  readonly payload: BranchPerformance;
}

const RevenueTooltip = ({ active, payload }: { active?: boolean; payload?: readonly RevenueTooltipPayload[] }) => {
  if (active && payload?.length) {
    const row = payload[0].payload;
    return (
      <div className="bg-surface border border-line rounded-xl px-4 py-3">
        <p className="text-xs font-medium text-ink mb-1">{row.branch_name}</p>
        <p className="text-base font-bold text-taupe">
          ₱{row.total_revenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-ink-faint mt-1">
          {row.completed_jobs} of {row.total_jobs} jobs completed
        </p>
      </div>
    );
  }
  return null;
};

export default function BranchComparisonTable({ data, loading }: BranchComparisonTableProps) {
  if (loading) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-6 text-center text-sm text-ink-faint py-12">
        Loading branch comparison…
      </div>
    );
  }

  if (data.length === 0) {
    return null;
  }

  // Sorted descending so the chart reads top-to-bottom as a ranking.
  const chartData = [...data].sort((a, b) => b.total_revenue - a.total_revenue);

  return (
    <div className="bg-surface border border-line rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Building2 size={18} className="text-taupe" />
        <div>
          <h2 className="text-base font-semibold text-ink">Branch Performance Comparison</h2>
          <p className="text-sm text-ink-faint mt-0.5">How each location is performing, side by side.</p>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
            barSize={22}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#EBE6E0" horizontal={false} />
            <XAxis
              type="number"
              stroke="#A8A19A"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => {
                const formatted = v >= 1000 ? `${v / 1000}k` : v;
                return `₱${formatted}`;
              }}
            />
            <YAxis
              type="category"
              dataKey="branch_name"
              stroke="#A8A19A"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={140}
            />
            <Tooltip content={<RevenueTooltip />} cursor={{ fill: '#F0EAE3', radius: 6 }} />
            <Bar dataKey="total_revenue" fill="#9A8073" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mobile cards — no sideways scroll needed for a 9-column table */}
      <div className="md:hidden -mx-6 -mb-6 divide-y divide-[#F0EAE3] border-t border-line">
        {data.map(row => (
          <div key={row.branch_id ?? 'unassigned'} className="px-6 py-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="font-medium text-ink">
                {row.branch_name}
                {row.is_main && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-taupe/10 text-taupe border border-taupe/20">
                    Main
                  </span>
                )}
              </p>
              <p className="font-semibold text-ink">₱{row.total_revenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-ink-body">
              <span>Outstanding: {row.total_outstanding_balance > 0
                ? <span className="text-amber-600 font-medium">₱{row.total_outstanding_balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                : <span className="text-ink-faint">₱0.00</span>}</span>
              <span>Jobs: {row.completed_jobs} / {row.total_jobs} ({row.completion_rate}%)</span>
              <span>Rejected: {row.rejected_payments_amount > 0
                ? <span className="text-danger font-semibold">₱{row.rejected_payments_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                : <span className="text-ink-faint">₱0.00</span>}</span>
              <span>Appointments: {row.total_appointments}</span>
              <span>Forfeited: {row.forfeited_deposit_amount > 0
                ? <span className="text-danger font-semibold">₱{row.forfeited_deposit_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                : <span className="text-ink-faint">₱0.00</span>}</span>
              <span>Walk-in Orders: {row.total_walkin_orders}</span>
              <span>Staff: {row.total_staff}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto -mx-6 -mb-6">
        <table className="w-full text-left text-sm text-ink-body min-w-[720px]">
          <thead className="bg-canvas/50 text-xs uppercase text-ink-faint border-y border-line">
            <tr>
              <th className="px-6 py-3 font-medium">Branch</th>
              <th className="px-6 py-3 font-medium">Revenue</th>
              <th className="px-6 py-3 font-medium">Outstanding</th>
              <th className="px-6 py-3 font-medium text-danger">Rejected</th>
              <th className="px-6 py-3 font-medium text-danger">Forfeited</th>
              <th className="px-6 py-3 font-medium">Jobs</th>
              <th className="px-6 py-3 font-medium">Completion</th>
              <th className="px-6 py-3 font-medium">Appointments</th>
              <th className="px-6 py-3 font-medium">Walk-in Orders</th>
              <th className="px-6 py-3 font-medium">Staff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EAE3]">
            {data.map(row => (
              <tr key={row.branch_id ?? 'unassigned'} className="hover:bg-sunken/20 transition-colors">
                <td className="px-6 py-3 font-medium text-ink">
                  {row.branch_name}
                  {row.is_main && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-taupe/10 text-taupe border border-taupe/20">
                      Main
                    </span>
                  )}
                </td>
                <td className="px-6 py-3">
                  ₱{row.total_revenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-3">
                  {row.total_outstanding_balance > 0 ? (
                    <span className="text-amber-600 font-medium">
                      ₱{row.total_outstanding_balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span className="text-ink-faint">₱0.00</span>
                  )}
                </td>
                <td className="px-6 py-3">
                  {row.rejected_payments_amount > 0 ? (
                    <span className="text-danger font-semibold">
                      ₱{row.rejected_payments_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span className="text-ink-faint">₱0.00</span>
                  )}
                </td>
                <td className="px-6 py-3">
                  {row.forfeited_deposit_amount > 0 ? (
                    <span className="text-danger font-semibold">
                      ₱{row.forfeited_deposit_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span className="text-ink-faint">₱0.00</span>
                  )}
                </td>
                <td className="px-6 py-3">{row.completed_jobs} / {row.total_jobs}</td>
                <td className="px-6 py-3">{row.completion_rate}%</td>
                <td className="px-6 py-3">{row.total_appointments}</td>
                <td className="px-6 py-3">{row.total_walkin_orders}</td>
                <td className="px-6 py-3">{row.total_staff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
