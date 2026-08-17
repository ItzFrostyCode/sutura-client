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
import { UserCog } from 'lucide-react';

export interface StaffPerformance {
  staff_id: number;
  name: string | null;
  role: string;
  total_jobs: number;
  completed_jobs: number;
  completion_rate: number;
  total_revenue: number;
  avg_adjustments?: number;
}

interface StaffProductivityTableProps {
  readonly data: StaffPerformance[];
  readonly loading: boolean;
}

interface RevenueTooltipPayload {
  readonly payload: StaffPerformance;
}

const roleLabel = (role: string) => role.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

const RevenueTooltip = ({ active, payload }: { active?: boolean; payload?: readonly RevenueTooltipPayload[] }) => {
  if (active && payload?.length) {
    const row = payload[0].payload;
    return (
      <div className="bg-surface border border-line rounded-xl px-4 py-3">
        <p className="text-xs font-medium text-ink mb-1">{row.name || 'Unnamed Staff'}</p>
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

export default function StaffProductivityTable({ data, loading }: StaffProductivityTableProps) {
  if (loading) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-6 text-center text-sm text-ink-faint py-12">
        Loading staff productivity…
      </div>
    );
  }

  if (data.length === 0) {
    return null;
  }

  // Sorted descending so the chart reads top-to-bottom as a ranking.
  const chartData = [...data].sort((a, b) => b.completed_jobs - a.completed_jobs);

  return (
    <div className="bg-surface border border-line rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-2">
        <UserCog size={18} className="text-taupe" />
        <div>
          <h2 className="text-base font-semibold text-ink">Individual Staff Productivity</h2>
          <p className="text-sm text-ink-faint mt-0.5">Jobs completed and revenue attributed to each staff member.</p>
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
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#A8A19A"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={140}
            />
            <Tooltip content={<RevenueTooltip />} cursor={{ fill: '#F0EAE3', radius: 6 }} />
            <Bar dataKey="completed_jobs" fill="#9A8073" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mobile cards — no sideways scroll needed */}
      <div className="md:hidden -mx-6 -mb-6 divide-y divide-[#F0EAE3] border-t border-line">
        {data.map(row => (
          <div key={row.staff_id} className="px-6 py-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">{row.name || 'Unnamed Staff'}</p>
                <p className="text-xs text-ink-muted">{roleLabel(row.role)}</p>
              </div>
              <p className="font-semibold text-ink">₱{row.total_revenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            </div>
            <p className="text-xs text-ink-muted mt-1.5">
              {row.completed_jobs} / {row.total_jobs} jobs · {row.completion_rate}% completion
              {!!row.avg_adjustments && row.avg_adjustments > 0 && (
                <span className={row.avg_adjustments > 1 ? 'text-danger font-medium' : ''}> · {row.avg_adjustments} avg. adjustment rounds</span>
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto -mx-6 -mb-6">
        <table className="w-full text-left text-sm text-ink-body min-w-[640px]">
          <thead className="bg-canvas/50 text-xs uppercase text-ink-faint border-y border-line">
            <tr>
              <th className="px-6 py-3 font-medium">Staff Member</th>
              <th className="px-6 py-3 font-medium">Role</th>
              <th className="px-6 py-3 font-medium">Revenue</th>
              <th className="px-6 py-3 font-medium">Jobs</th>
              <th className="px-6 py-3 font-medium">Completion</th>
              <th className="px-6 py-3 font-medium">Avg. Adjustments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EAE3]">
            {data.map(row => (
              <tr key={row.staff_id} className="hover:bg-sunken/20 transition-colors">
                <td className="px-6 py-3 font-medium text-ink">{row.name || 'Unnamed Staff'}</td>
                <td className="px-6 py-3 text-ink-muted">{roleLabel(row.role)}</td>
                <td className="px-6 py-3">
                  ₱{row.total_revenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-3">{row.completed_jobs} / {row.total_jobs}</td>
                <td className="px-6 py-3">{row.completion_rate}%</td>
                <td className={`px-6 py-3 ${row.avg_adjustments && row.avg_adjustments > 1 ? 'text-danger font-semibold' : ''}`}>
                  {row.avg_adjustments ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
