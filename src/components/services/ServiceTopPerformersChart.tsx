import { formatServiceTurnaround } from '@/lib/turnaroundHelper';
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
import { Trophy } from 'lucide-react';
import { Service } from './serviceHelpers';

interface ServiceTopPerformersChartProps {
  readonly services: Service[];
  readonly loading: boolean;
}

interface RevenueTooltipPayload {
  readonly payload: Service;
}

const truncateName = (name: string, max = 22) => (name.length > max ? `${name.slice(0, max - 1)}…` : name);

const RevenueTooltip = ({ active, payload }: { active?: boolean; payload?: readonly RevenueTooltipPayload[] }) => {
  if (active && payload?.length) {
    const service = payload[0].payload;
    return (
      <div className="bg-surface border border-line px-4 py-3 max-w-[220px]">
        <p className="text-xs font-medium text-ink mb-1 leading-snug">{service.name}</p>
        <p className="text-base font-bold text-taupe">
          ₱{Number(service.total_revenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-ink-faint mt-1">
          {service.job_orders_count || 0} order{service.job_orders_count === 1 ? '' : 's'} • {service.saves_count || 0} saved
        </p>
      </div>
    );
  }
  return null;
};

// Mirrors CatalogTopPerformersChart exactly (same layout/ranking logic) —
// same "specific and overall earnings, ranked highest to lowest" request
// applied to Services, not just Catalog Designs.
export default function ServiceTopPerformersChart({ services, loading }: ServiceTopPerformersChartProps) {
  if (loading) {
    return (
      <div className="bg-surface border border-line p-6 text-center text-sm text-ink-faint py-12">
        Loading top performers…
      </div>
    );
  }

  const hasAnyRevenue = services.some(s => (s.total_revenue || 0) > 0);
  const sortFn = (a: Service, b: Service) =>
    hasAnyRevenue
      ? (b.total_revenue || 0) - (a.total_revenue || 0)
      : (b.reviews_count || 0) - (a.reviews_count || 0);

  const chartServices = [...services].sort(sortFn).slice(0, 8).map(s => ({ ...s, chartLabel: truncateName(s.name) }));
  const allRankedServices = [...services].sort(sortFn);

  if (chartServices.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface border border-line p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Trophy size={18} className="text-taupe" />
        <div>
          <h2 className="text-base font-semibold text-ink">Top Performing Services</h2>
          <p className="text-sm text-ink-faint mt-0.5">
            {hasAnyRevenue ? 'Top 8, ranked by revenue generated.' : 'No orders yet — top 8 by reviews in the meantime.'}
          </p>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartServices}
            layout="vertical"
            margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
            barSize={18}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#EBE6E0" horizontal={false} />
            <XAxis
              type="number"
              stroke="#A8A19A"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickFormatter={v => (hasAnyRevenue ? `₱${v >= 1000 ? `${v / 1000}k` : v}` : String(v))}
            />
            <YAxis
              type="category"
              dataKey="chartLabel"
              stroke="#A8A19A"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={150}
            />
            <Tooltip content={<RevenueTooltip />} cursor={{ fill: '#F0EAE3', radius: 6 }} />
            <Bar dataKey={hasAnyRevenue ? 'total_revenue' : 'reviews_count'} fill="#9A8073" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="-mx-6 -mb-6 border-t border-line">
        <p className="px-6 pt-4 pb-2 text-xs font-semibold text-ink-faint uppercase tracking-wider">
          All {allRankedServices.length} Service{allRankedServices.length === 1 ? '' : 's'}
        </p>
        <div className="md:hidden overflow-y-auto max-h-[420px] divide-y divide-[#F0EAE3]">
          {allRankedServices.map(service => (
            <div key={service.id} className="px-6 py-3 hover:bg-sunken/20 transition-colors">
              <p className="font-medium text-ink truncate">{service.name}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-ink-muted">
                <span>{service.estimated_days ? 'Est. ' : ''}{formatServiceTurnaround(service.estimated_days, service.estimated_days_max)}</span>
                <span>{service.saves_count || 0} saved</span>
                <span>{service.job_orders_count || 0} orders</span>
                <span className="font-semibold text-ink">₱{Number(service.total_revenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[420px]">
          <table className="w-full text-left text-sm text-ink-body min-w-[560px]">
            <thead className="bg-canvas text-xs uppercase text-ink-faint border-y border-line sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 font-medium bg-canvas">Service</th>
                <th className="px-6 py-3 font-medium bg-canvas">Est. Days</th>
                <th className="px-6 py-3 font-medium bg-canvas">Saved</th>
                <th className="px-6 py-3 font-medium bg-canvas">Orders</th>
                <th className="px-6 py-3 font-medium bg-canvas">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE3]">
              {allRankedServices.map(service => (
                <tr key={service.id} className="hover:bg-sunken/20 transition-colors">
                  <td className="px-6 py-3 font-medium text-ink max-w-[220px] truncate">{service.name}</td>
                  <td className="px-6 py-3 text-ink-muted">{formatServiceTurnaround(service.estimated_days, service.estimated_days_max)}</td>
                  <td className="px-6 py-3">{service.saves_count || 0}</td>
                  <td className="px-6 py-3">{service.job_orders_count || 0}</td>
                  <td className="px-6 py-3">₱{Number(service.total_revenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
