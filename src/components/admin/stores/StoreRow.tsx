import Link from 'next/link';
import { EyeOff, ExternalLink, RotateCcw } from 'lucide-react';
import Badge from '@/components/shared/Badge';

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
  subscription: { status: string; plan: { name: string } | null } | null;
}

interface StoreRowProps {
  readonly store: DirectoryStore;
  readonly onHide: (store: DirectoryStore) => void;
  readonly onRestore: (store: DirectoryStore) => void;
}

export default function StoreRow({ store, onHide, onRestore }: StoreRowProps) {
  const adminHidden = Boolean(store.admin_hidden_at);
  const live = store.status === 'approved';

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
      <div className="min-w-0 flex-1 basis-60">
        <div className="flex flex-wrap items-center gap-2">
          {live ? (
            <p className="truncate font-semibold text-ink">{store.name}</p>
          ) : (
            <Link href={`/admin/applications/${store.id}`} className="truncate font-semibold text-ink underline underline-offset-2">{store.name}</Link>
          )}
          {!live && <Badge variant={store.status === 'pending' ? 'warning' : 'danger'} className="capitalize">{store.status}</Badge>}
          {adminHidden && <Badge variant="danger">Hidden by admin</Badge>}
          {!adminHidden && live && store.is_hidden && <Badge>Hidden · unsubscribed</Badge>}
        </div>
        <p className="truncate text-sm text-ink-muted">{store.owner?.name} · {store.owner?.email}</p>
      </div>
      <p className="w-40 shrink-0 text-sm text-ink-body">
        {store.subscription?.plan?.name ?? 'No plan'}
        <span className="block text-ink-muted">{store.branches_count} {store.branches_count === 1 ? 'branch' : 'branches'} · {store.city}</span>
      </p>
      <div className="flex shrink-0 items-center gap-1">
        {live && (
          <a href={`/store/${store.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`Open ${store.name} store profile`} className="btn-icon-mobile text-ink-muted hover:text-ink">
            <ExternalLink size={17} />
          </a>
        )}
        {live && (adminHidden ? (
          <button type="button" onClick={() => onRestore(store)} className="inline-flex min-h-11 items-center gap-1.5 px-3 text-sm text-ink hover:bg-sunken">
            <RotateCcw size={15} /> Restore
          </button>
        ) : (
          <button type="button" onClick={() => onHide(store)} className="inline-flex min-h-11 items-center gap-1.5 px-3 text-sm text-danger hover:bg-danger/5">
            <EyeOff size={15} /> Hide
          </button>
        ))}
      </div>
    </li>
  );
}
