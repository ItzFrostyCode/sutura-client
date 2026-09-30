import Badge from '@/components/shared/Badge';
import { formatDate } from '../useAdminList';

export interface AdminAccount {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  last_seen_at: string | null;
  suspended_at: string | null;
  roles: { id: number; name: string }[];
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'System Admin',
  store_owner: 'Shop Owner',
  branch_manager: 'Branch Manager',
  staff: 'Staff',
  customer: 'Customer',
};

interface AccountRowProps {
  readonly account: AdminAccount;
  readonly onSuspend: (account: AdminAccount) => void;
  readonly onReactivate: (account: AdminAccount) => void;
}

export default function AccountRow({ account, onSuspend, onReactivate }: AccountRowProps) {
  const isAdmin = account.roles.some((r) => r.name === 'admin');
  const suspended = Boolean(account.suspended_at);

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
      <div className="min-w-0 flex-1 basis-60">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-ink">{account.name}</p>
          {suspended && <Badge variant="danger">Suspended</Badge>}
        </div>
        <p className="truncate text-sm text-ink-muted">{account.email}</p>
      </div>
      <div className="flex w-44 shrink-0 flex-wrap gap-1">
        {account.roles.map((r) => (
          <Badge key={r.id} variant={r.name === 'admin' ? 'accent' : 'neutral'}>{ROLE_LABELS[r.name] ?? r.name}</Badge>
        ))}
      </div>
      <p className="w-36 shrink-0 text-sm text-ink-muted">
        Joined {formatDate(account.created_at)}
        <span className="block">Seen {formatDate(account.last_seen_at)}</span>
      </p>
      <div className="w-28 shrink-0 text-right">
        {!isAdmin && (suspended ? (
          <button type="button" onClick={() => onReactivate(account)} className="min-h-11 px-3 text-sm text-ink hover:bg-sunken">Reactivate</button>
        ) : (
          <button type="button" onClick={() => onSuspend(account)} className="min-h-11 px-3 text-sm text-danger hover:bg-danger/5">Suspend</button>
        ))}
      </div>
    </li>
  );
}
