import { TrendingUp, Building2, Users, Scissors, ChevronRight } from 'lucide-react';
import UsageBar from '@/components/billing/UsageBar';

interface FeatureUsageSectionProps {
  usageCounts: { branches: number; staff: number; services: number };
  limits: { branches: number | null; staff: number | null; services: number | null };
  activePlanSlug: string;
}

export default function FeatureUsageSection({
  usageCounts,
  limits,
  activePlanSlug,
}: FeatureUsageSectionProps) {
  return (
    <section className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-taupe flex items-center gap-1.5">
        <TrendingUp size={12} /> Feature Usage
      </p>
      <div className="bg-surface border border-line rounded-2xl p-6 space-y-5">
        <UsageBar label="Branches" used={usageCounts.branches} max={limits.branches} icon={Building2} />
        <UsageBar label="Staff Accounts" used={usageCounts.staff} max={limits.staff} icon={Users} />
        <UsageBar label="Services" used={usageCounts.services} max={limits.services} icon={Scissors} />
        {activePlanSlug !== 'premium' && (
          <div className="pt-2 border-t border-line flex items-center justify-between">
            <p className="text-xs text-ink-muted">Need more? Upgrade your plan to unlock higher limits.</p>
            <button
              type="button"
              onClick={() => document.getElementById('plan-btn-premium')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-1 text-xs font-semibold text-taupe hover:text-ink transition-colors cursor-pointer"
            >
              Upgrade <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
