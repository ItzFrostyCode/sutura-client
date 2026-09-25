import { ShieldCheck } from 'lucide-react';
import { COMPARE_ROWS, type Plan } from './billingTypes';

interface PlanComparisonSectionProps {
  plans: Plan[];
  activePlanSlug: string;
}

export default function PlanComparisonSection({
  plans,
  activePlanSlug,
}: PlanComparisonSectionProps) {
  return (
    <section className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-taupe flex items-center gap-1.5">
        <ShieldCheck size={12} /> Compare Plans
      </p>
      <div className="bg-surface border border-line rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-canvas border-b border-line">
              <th className="text-left px-5 py-3.5 text-ink-muted font-semibold text-[12px] uppercase tracking-wider w-1/4">
                Feature
              </th>
              {['basic', 'pro', 'premium'].map((slug) => (
                <th
                  key={slug}
                  className={`text-center px-5 py-3.5 text-[12px] font-bold uppercase tracking-wider ${
                    activePlanSlug === slug ? 'text-taupe' : 'text-ink-faint'
                  }`}
                >
                  {slug.charAt(0).toUpperCase() + slug.slice(1)}
                  {activePlanSlug === slug && (
                    <span className="ml-1.5 text-[10px] bg-taupe text-white px-1.5 py-0.5 rounded-full normal-case font-semibold">
                      current
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            <tr className="hover:bg-canvas/50 transition-colors">
              <td className="px-5 py-3.5 text-ink-body font-medium">Staff Accounts</td>
              {(['basic', 'pro', 'premium'] as const).map((slug) => {
                const planMaxStaff = plans.find((p) => p.slug === slug)?.max_staff;
                const label =
                  planMaxStaff === -1 || planMaxStaff == null
                    ? 'Unlimited'
                    : `Up to ${planMaxStaff}`;
                return (
                  <td
                    key={slug}
                    className={`px-5 py-3.5 text-center ${
                      activePlanSlug === slug ? 'text-ink font-semibold' : 'text-ink-muted'
                    }`}
                  >
                    {label}
                  </td>
                );
              })}
            </tr>
            {COMPARE_ROWS.map((row, i) => (
              <tr key={i} className="hover:bg-canvas/50 transition-colors">
                <td className="px-5 py-3.5 text-ink-body font-medium">{row.label}</td>
                {(['basic', 'pro', 'premium'] as const).map((slug) => (
                  <td
                    key={slug}
                    className={`px-5 py-3.5 text-center ${
                      activePlanSlug === slug ? 'text-ink font-semibold' : 'text-ink-muted'
                    }`}
                  >
                    {(row as Record<string, string>)[slug] === '—' ? (
                      <span className="text-[#EBE6E0]">—</span>
                    ) : (
                      (row as Record<string, string>)[slug]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
