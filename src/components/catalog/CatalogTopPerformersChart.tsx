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
import { CatalogItem } from './catalogHelpers';

interface CatalogTopPerformersChartProps {
  readonly items: CatalogItem[];
  readonly loading: boolean;
}

interface RevenueTooltipPayload {
  readonly payload: CatalogItem;
}

const truncateName = (name: string, max = 22) => (name.length > max ? `${name.slice(0, max - 1)}…` : name);

const RevenueTooltip = ({ active, payload }: { active?: boolean; payload?: readonly RevenueTooltipPayload[] }) => {
  if (active && payload?.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white border border-[#EBE6E0] rounded-xl shadow-lg px-4 py-3 max-w-[220px]">
        <p className="text-xs font-medium text-[#2D2A26] mb-1 leading-snug">{item.name}</p>
        <p className="text-base font-bold text-taupe">
          ₱{Number(item.total_revenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-[#A8A19A] mt-1">
          {item.order_count || 0} order{item.order_count === 1 ? '' : 's'} • {item.views_count} views
        </p>
      </div>
    );
  }
  return null;
};

export default function CatalogTopPerformersChart({ items, loading }: CatalogTopPerformersChartProps) {
  if (loading) {
    return (
      <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm text-center text-sm text-[#A8A19A] py-12">
        Loading top performers…
      </div>
    );
  }

  const hasAnyRevenue = items.some(i => (i.total_revenue || 0) > 0);
  const sortFn = (a: CatalogItem, b: CatalogItem) =>
    hasAnyRevenue ? (b.total_revenue || 0) - (a.total_revenue || 0) : (b.views_count || 0) - (a.views_count || 0);

  // The chart only ever shows the top 8 — a bar per item stops being readable
  // well before you get anywhere near a full catalog. The table below it,
  // however, lists every item so nothing is hidden from view.
  const chartItems = [...items].sort(sortFn).slice(0, 8).map(i => ({ ...i, chartLabel: truncateName(i.name) }));
  const allRankedItems = [...items].sort(sortFn);

  if (chartItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-2">
        <Trophy size={18} className="text-[#9A8073]" />
        <div>
          <h2 className="text-base font-semibold text-[#2D2A26]">Top Performing Items</h2>
          <p className="text-sm text-[#A8A19A] mt-0.5">
            {hasAnyRevenue ? 'Top 8, ranked by revenue generated.' : 'No orders yet — top 8 by views in the meantime.'}
          </p>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartItems}
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
            <Bar dataKey={hasAnyRevenue ? 'total_revenue' : 'views_count'} fill="#9A8073" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="-mx-6 -mb-6 border-t border-[#EBE6E0]">
        <p className="px-6 pt-4 pb-2 text-xs font-semibold text-[#A8A19A] uppercase tracking-wider">
          All {allRankedItems.length} Item{allRankedItems.length === 1 ? '' : 's'}
        </p>
        {/* Mobile cards — no sideways scroll needed for a 5-column table */}
        <div className="md:hidden overflow-y-auto max-h-[420px] divide-y divide-[#F0EAE3]">
          {allRankedItems.map(item => (
            <div key={item.id} className="px-6 py-3 hover:bg-[#F0EAE3]/20 transition-colors">
              <p className="font-medium text-[#2D2A26] truncate">{item.name}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-[#827A73]">
                <span>Est. {item.estimated_days ?? 7}d</span>
                <span>{item.views_count} views</span>
                <span>{item.order_count || 0} orders</span>
                <span className="font-semibold text-[#2D2A26]">₱{Number(item.total_revenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[420px]">
          <table className="w-full text-left text-sm text-[#524A44] min-w-[560px]">
            <thead className="bg-[#FAF6F3] text-xs uppercase text-[#A8A19A] border-y border-[#EBE6E0] sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 font-medium bg-[#FAF6F3]">Item</th>
                <th className="px-6 py-3 font-medium bg-[#FAF6F3]">Est. Days</th>
                <th className="px-6 py-3 font-medium bg-[#FAF6F3]">Views</th>
                <th className="px-6 py-3 font-medium bg-[#FAF6F3]">Orders</th>
                <th className="px-6 py-3 font-medium bg-[#FAF6F3]">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE3]">
              {allRankedItems.map(item => (
                <tr key={item.id} className="hover:bg-[#F0EAE3]/20 transition-colors">
                  <td className="px-6 py-3 font-medium text-[#2D2A26] max-w-[220px] truncate">{item.name}</td>
                  <td className="px-6 py-3 text-[#827A73]">{item.estimated_days ?? 7}</td>
                  <td className="px-6 py-3">{item.views_count}</td>
                  <td className="px-6 py-3">{item.order_count || 0}</td>
                  <td className="px-6 py-3">₱{Number(item.total_revenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
