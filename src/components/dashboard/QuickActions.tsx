'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Lock, Package, Scissors, UserCog, type LucideIcon } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { READ_ONLY_HINT, useCurrentShopReadOnly } from '@/hooks/useShopReadOnly';

interface QuickAction {
  key: string;
  label: string;
  hint: string;
  href: string;
  icon: LucideIcon;
  /** Set when a plan limit blocks it: shown disabled with this reason. */
  blockedReason?: string;
}

const LIMIT_REASON = 'Plan limit reached. Upgrade to add more.';

/**
 * Home → "Quick Actions": one tap into each create flow, reusing the
 * existing forms (Add Service and New Order are their own pages; New
 * Appointment and Add Staff open their modal through ?new=1).
 *
 * Only actions the signed-in role can actually do are shown (same gates as
 * their pages): owners and branch managers get all four; plain staff get
 * New Appointment and New Order. Add Staff is disabled at the plan's staff cap (the only
 * create limit the server enforces; services are unlimited).
 */
export default function QuickActions({ storeId }: { readonly storeId: number | undefined }) {
  const { user } = useAuthStore();
  const roles = user?.roles?.map((r) => r.name) ?? [];
  const isOwner = roles.includes('store_owner');
  const isManager = roles.includes('branch_manager')
    || Boolean((user as { staff_profile?: { is_branch_manager?: boolean } } | null)?.staff_profile?.is_branch_manager);
  const canManage = isOwner || isManager;
  // Plain staff: they book appointments (their own branch, set by the server).
  const isShopRole = canManage || roles.includes('staff');

  // Staff seats: store-wide count vs the plan cap (-1 = unlimited).
  const [staffFull, setStaffFull] = useState(false);
  useEffect(() => {
    if (!storeId || !canManage) return;
    let alive = true;
    api.get(`/stores/${storeId}/subscription`)
      .then((res) => {
        const usage = res.data?.staff_usage as { used: number; max: number } | undefined;
        if (alive && usage) setStaffFull(usage.max !== -1 && usage.used >= usage.max);
      })
      .catch(() => { /* unknown → leave enabled; the server still enforces the cap */ });
    return () => { alive = false; };
  }, [storeId, canManage]);

  // Plan ended: every quick action adds something, so all are shown blocked (server: CheckRole).
  const readOnly = useCurrentShopReadOnly();

  // Each action only for the roles its own page allows.
  const actions: QuickAction[] = ([
    { key: 'service', allowed: canManage, label: 'Add Service', hint: 'Offer a new tailoring service', href: '/dashboard/services/new', icon: Package },
    { key: 'appointment', allowed: isShopRole, label: 'New Appointment', hint: 'Book a fitting or consultation', href: '/dashboard/appointments?new=1', icon: Calendar },
    // Staff create orders too (no payment/discount; their own branch, set by the server).
    { key: 'order', allowed: isShopRole, label: 'New Order', hint: 'Start a new tailoring job', href: '/dashboard/jobs/new', icon: Scissors },
    { key: 'staff', allowed: canManage, label: 'Add Staff', hint: 'Invite a team member', href: '/dashboard/staff?new=1', icon: UserCog, blockedReason: staffFull ? LIMIT_REASON : undefined },
  ] as (QuickAction & { allowed: boolean })[]).filter((a) => a.allowed)
    .map((a) => (readOnly ? { ...a, blockedReason: READ_ONLY_HINT } : a));

  if (actions.length === 0) return null;

  // Fewer than four (e.g. plain staff: appointment + order) → no empty cells.
  const cols = actions.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : actions.length === 3 ? 'sm:grid-cols-3' : actions.length === 2 ? 'sm:grid-cols-2' : 'sm:max-w-sm';

  return (
    <section aria-labelledby="quick-actions-heading">
      <h2 id="quick-actions-heading" className="text-eyebrow-accent mb-3">Quick Actions</h2>
      <ul className={`grid grid-cols-1 gap-3 ${cols}`}>
        {actions.map((a) => (
          <li key={a.key} className="flex">
            {a.blockedReason ? (
              <div
                role="link"
                aria-disabled="true"
                aria-label={`${a.label}: ${a.blockedReason}`}
                title={a.blockedReason}
                tabIndex={0}
                className="flex w-full min-h-16 cursor-not-allowed items-center gap-3 rounded-xl border border-line bg-surface p-4 opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-taupe focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                <ActionBody action={a} />
              </div>
            ) : (
              <Link
                href={a.href}
                aria-label={`${a.label}: ${a.hint}`}
                className="group flex w-full min-h-16 items-center gap-3 rounded-xl border border-line bg-surface p-4 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-taupe/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-taupe focus-visible:ring-offset-2 focus-visible:ring-offset-canvas motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <ActionBody action={a} />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ActionBody({ action }: { readonly action: QuickAction }) {
  const Icon = action.blockedReason ? Lock : action.icon;
  return (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sunken text-taupe transition-colors group-hover:bg-taupe group-hover:text-white" aria-hidden="true">
        <Icon size={18} />
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-sm font-bold text-ink">{action.label}</span>
        <span className="block truncate text-xs text-ink-muted">{action.blockedReason ?? action.hint}</span>
      </span>
    </>
  );
}
