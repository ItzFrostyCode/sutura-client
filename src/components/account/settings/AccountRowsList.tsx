import { ChevronRight } from 'lucide-react';
import { type EditableField } from './useAccountDetail';

interface AccountRowsListProps {
  user: {
    name: string;
    phone?: string | null;
  };
  onOpenSheet: (field: EditableField) => void;
}

function Row({ label, value, onClick }: { readonly label: string; readonly value?: string; readonly onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-14 w-full items-center gap-3 px-4 text-left transition-colors active:bg-sunken">
      <span className="mobile-body-md flex-1 text-ink">{label}</span>
      {value && <span className="mobile-body-sm max-w-[55%] truncate text-ink-muted">{value}</span>}
      <ChevronRight size={18} className="shrink-0 text-ink-faint" />
    </button>
  );
}

/** What can be changed: name, phone number and password. The email is the login and is not editable here. */
export default function AccountRowsList({ user, onOpenSheet }: Readonly<AccountRowsListProps>) {
  return (
    <section>
      <h2 className="mobile-overline mb-2 ml-4 text-ink-faint">Account</h2>
      <div className="card-soft overflow-hidden">
        <Row label="Name" value={user.name} onClick={() => onOpenSheet('name')} />
        <Row label="Phone" value={user.phone || 'Not set'} onClick={() => onOpenSheet('phone')} />
        <Row label="Change Password" onClick={() => onOpenSheet('password')} />
      </div>
    </section>
  );
}
