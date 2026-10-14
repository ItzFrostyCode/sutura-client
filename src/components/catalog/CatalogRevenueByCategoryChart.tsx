import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { CatalogItem } from './catalogHelpers';
import { GARMENT_CATEGORIES, categoryOfGarment, type GarmentCategory } from '@/lib/garmentTaxonomy';

// The same validated 4-colour set as before (CVD/contrast checked), for the four garment categories that earn the
// most; the rest share one neutral "Other categories" slice so the pie never needs more colours than it can tell apart.
const SLICE_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'];
const REST_COLOR = '#9a938c';

interface CatalogRevenueByCategoryChartProps {
  readonly items: CatalogItem[];
}

function PieLabel({ cx = 0, cy = 0, midAngle = 0, outerRadius = 0, percent = 0 }: {
  cx?: number; cy?: number; midAngle?: number; outerRadius?: number; percent?: number;
}) {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const x = cx + (outerRadius + 18) * Math.cos(-midAngle * RADIAN);
  const y = cy + (outerRadius + 18) * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#827A73" fontSize={11} textAnchor="middle" dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function CatalogRevenueByCategoryChart({ items }: CatalogRevenueByCategoryChartProps) {
  const data = useMemo(() => {
    const byCategory = new Map<GarmentCategory, number>();
    for (const item of items) {
      const cat: GarmentCategory = item.garment_type ? (categoryOfGarment(item.garment_type) ?? 'other') : 'other';
      byCategory.set(cat, (byCategory.get(cat) || 0) + Number(item.total_revenue || 0));
    }
    const ranked = Array.from(byCategory.entries()).filter(([, revenue]) => revenue > 0).sort((a, b) => b[1] - a[1]);
    const top = ranked.slice(0, SLICE_COLORS.length).map(([cat, revenue], i) => ({
      name: GARMENT_CATEGORIES[cat].label,
      value: revenue,
      color: SLICE_COLORS[i],
    }));
    const rest = ranked.slice(SLICE_COLORS.length).reduce((sum, [, revenue]) => sum + revenue, 0);
    return rest > 0 ? [...top, { name: 'Other categories', value: rest, color: REST_COLOR }] : top;
  }, [items]);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-surface border border-line p-5">
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon size={16} className="text-taupe" />
        <h3 className="text-sm font-semibold text-ink">Revenue by Category</h3>
      </div>

      {data.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-xs text-ink-faint">No revenue yet.</div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={76}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={PieLabel}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`₱${Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#EBE6E0', borderRadius: '0.5rem', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xl font-bold text-ink">₱{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}</p>
              <p className="text-[10px] text-ink-faint font-medium">Total</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 w-full">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-ink-body">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="truncate">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
