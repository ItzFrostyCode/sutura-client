import Link from 'next/link';
import { CalendarDays, EyeOff, ExternalLink, RotateCcw } from 'lucide-react';
import Badge from '@/components/shared/Badge';
import PlanPill, { PILL } from '@/components/admin/ui/PlanPill';

export interface DirectoryStore {
  id: number;
  name: string;
  slug: string;
  city: string;
  status: string;
  is_hidden: boolean;
  admin_hidden_at: string | null;
  admin_hidden_reason?: string | null;
  branches_count: number;
  owner: { name: string; email: string } | null;
  subscription: {
    status: string;
    starts_at?: string | null;
    ends_at?: string | null;
    trial_ends_at?: string | null;
    plan: { name: string } | null;
  } | null;
}

interface StoreRowProps {
  readonly store: DirectoryStore;
  readonly onHide: (store: DirectoryStore) => void;
  readonly onRestore: (store: DirectoryStore) => void;
  /** Opens the shop details pop-up. */
  readonly onOpen: (store: DirectoryStore) => void;
}


const STATUS_TONE = {
  active: { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  trial: { label: 'Trial', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  expired: { label: 'Expired', cls: 'bg-sunken text-ink-muted border-line' },
} as const;

const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** The subscription's period and where it stands (active / trial / expired); null with no dates at all. */
function subscriptionPeriod(sub: DirectoryStore['subscription']) {
  if (!sub) return null;
  const end = sub.ends_at ?? sub.trial_ends_at ?? null;
  if (!sub.starts_at && !end) return null;
  const lapsed = ['expired', 'cancelled'].includes(sub.status) || (end !== null && new Date(end).getTime() < Date.now());
  const range = [sub.starts_at ? fmt(sub.starts_at) : null, end ? fmt(end) : null].filter(Boolean).join(' – ');
  const state: keyof typeof STATUS_TONE = lapsed ? 'expired' : sub.status === 'trial' ? 'trial' : 'active';
  return { range, state };
}

export default function StoreRow({ store, onHide, onRestore, onOpen }: StoreRowProps) {
  const adminHidden = Boolean(store.admin_hidden_at);
  const live = store.status === 'approved';
  const planName = store.subscription?.plan?.name ?? null;
  const period = subscriptionPeriod(store.subscription);

  return (
    // The whole card opens the details pop-up; its own links and buttons keep doing their own thing.
    <li
      onClick={(e) => { if (!(e.target as HTMLElement).closest('a, button')) onOpen(store); }}
      className="flex cursor-pointer flex-wrap items-center gap-x-6 gap-y-3 admin-card px-5 py-4 transition-[box-shadow,border-color] hover:border-[#C9BDB0] hover:shadow-md"
    >
      {/* Shop + owner */}
      <div className="min-w-0 flex-1 basis-64">
        <div className="flex flex-wrap items-center gap-2">
          {live ? (
            <button type="button" onClick={() => onOpen(store)} className="truncate text-left font-semibold text-ink hover:underline underline-offset-2 focus-visible:underline">
              {store.name}
            </button>
          ) : (
            <Link href={`/admin/applications/${store.id}`} className="truncate font-semibold text-ink underline underline-offset-2">{store.name}</Link>
          )}
          {!live && <Badge variant={store.status === 'pending' ? 'warning' : 'danger'} className="capitalize">{store.status}</Badge>}
          {adminHidden && <Badge variant="danger">Hidden by admin</Badge>}
          {!adminHidden && live && store.is_hidden && <Badge>Hidden · unsubscribed</Badge>}
        </div>
        <p className="truncate text-sm text-ink-muted">{store.owner?.name} · {store.owner?.email}</p>
      </div>

      {/* Plan, status, period, branches */}
      <div className="w-full space-y-1.5 text-sm sm:w-auto sm:min-w-64">
        <div className="flex flex-wrap items-center gap-1.5">
          <PlanPill plan={planName} />
          {period && <span className={`${PILL} ${STATUS_TONE[period.state].cls}`}>{STATUS_TONE[period.state].label}</span>}
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 tabular-nums ${
            period && period.state !== 'expired' ? 'bg-sunken font-semibold text-ink' : 'bg-sunken/60 text-ink-muted'
          }`}
        >
          <CalendarDays size={14} aria-hidden="true" className="shrink-0 text-ink-muted" />
          {period ? period.range : 'No active subscription'}
        </span>
        <span className="block text-ink-muted">{store.branches_count} {store.branches_count === 1 ? 'branch' : 'branches'} · {store.city}</span>
      </div>

      {/* Actions */}
      {live && (
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={`/store/${store.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${store.name} store profile`}
            title="Open shop page"
            className="flex h-10 w-10 items-center justify-center admin-field text-ink-body shadow-2xs hover:bg-sunken hover:text-ink"
          >
            <ExternalLink size={16} />
          </a>
          {adminHidden ? (
            <button type="button" onClick={() => onRestore(store)} className="inline-flex h-10 items-center gap-1.5 admin-field px-3.5 text-sm font-medium text-ink shadow-2xs hover:bg-sunken">
              <RotateCcw size={15} /> Restore
            </button>
          ) : (
            <button type="button" onClick={() => onHide(store)} className="inline-flex h-10 items-center gap-1.5 admin-field px-3.5 text-sm font-medium text-ink-body shadow-2xs hover:border-danger/40! hover:bg-danger/5 hover:text-danger">
              <EyeOff size={15} /> Hide
            </button>
          )}
        </div>
      )}
    </li>
  );
}
