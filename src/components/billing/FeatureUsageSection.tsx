'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Building2, Users, Scissors, ChevronRight, Lock } from 'lucide-react';
import UsageBar from '@/components/billing/UsageBar';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

interface FeatureUsageSectionProps {
  usageCounts: { branches: number; staff: number; services: number };
  limits: { branches: number | null; staff: number | null; services: number | null };
  activePlanSlug: string;
}

type LockCounts = Record<'branch' | 'staff' | 'service', { locked: number }>;

const LOCKED_LINKS: { type: keyof LockCounts; one: string; many: string; href: string }[] = [
  { type: 'branch', one: 'branch shop', many: 'branch shops', href: '/dashboard/branches' },
  { type: 'staff', one: 'staff account', many: 'staff accounts', href: '/dashboard/staff' },
  { type: 'service', one: 'service', many: 'services', href: '/dashboard/services' },
];

export default function FeatureUsageSection({
  usageCounts,
  limits,
  activePlanSlug,
}: FeatureUsageSectionProps) {
  // Items the plan locked (over its limits; never deleted) — server: PlanLimits.
  const { store } = useAuthStore();
  const [locks, setLocks] = useState<LockCounts | null>(null);
  useEffect(() => {
    if (!store?.id) return;
    api.get(`/stores/${store.id}/plan-locks`).then((res) => setLocks(res.data?.data?.types ?? null)).catch(() => setLocks(null));
  }, [store?.id]);
  const locked = LOCKED_LINKS.filter((l) => (locks?.[l.type]?.locked ?? 0) > 0);

  return (
    <section className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-taupe flex items-center gap-1.5">
        <TrendingUp size={12} /> Feature Usage
      </p>
      <div className="bg-surface border border-line rounded-2xl p-6 space-y-5">
        <UsageBar label="Branch Shops" used={usageCounts.branches} max={limits.branches} icon={Building2} />
        <UsageBar label="Staff Accounts" used={usageCounts.staff} max={limits.staff} icon={Users} />
        <UsageBar label="Services" used={usageCounts.services} max={limits.services} icon={Scissors} />
        {locked.length > 0 && (
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <Lock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-semibold">Locked by your plan (nothing deleted)</p>
              <p className="text-xs">
                {locked.map((l, i) => {
                  const n = locks?.[l.type]?.locked ?? 0;
                  return (
                    <span key={l.type}>
                      {i > 0 && ' · '}
                      <Link href={l.href} className="font-semibold underline-offset-2 hover:underline">{n} {n === 1 ? l.one : l.many}</Link>
                    </span>
                  );
                })}
                . Upgrade to unlock them, or choose which stay open on each page.
              </p>
            </div>
          </div>
        )}
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
