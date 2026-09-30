'use client';

export type LoginPortal = 'customer' | 'store';

const OPTIONS: { value: LoginPortal; label: string }[] = [
  { value: 'customer', label: 'Customer' },
  { value: 'store', label: 'Shop' },
];

interface LoginPortalSwitchProps {
  readonly value: LoginPortal;
  readonly onChange: (portal: LoginPortal) => void;
}

// The Customer / Shop switch on Sign In (Shop = owners, branch managers, staff). Both tabs hit the same
// /auth/login; the server uses `portal` only to point someone at the tab
// their account actually belongs to. System Admin is deliberately not a
// third tab — it has its own unlinked portal at /admin/login.
export default function LoginPortalSwitch({ value, onChange }: LoginPortalSwitchProps) {
  return (
    <div role="tablist" aria-label="Account type" className="grid grid-cols-2 border border-line-strong mb-6">
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`min-h-12 text-sm font-semibold uppercase tracking-widest transition-colors ${
              active ? 'bg-ink text-white' : 'bg-surface text-ink-muted hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
