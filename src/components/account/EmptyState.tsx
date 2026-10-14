import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  readonly Icon: LucideIcon;
  readonly title: string;
  readonly message: string;
  /** A button under the message; leave out when there is nothing to do about it. */
  readonly action?: { readonly href: string; readonly label: string };
}

/** The empty list of an account page: a soft card with a quiet icon, one line of what and one of why, and at most one button. */
export default function EmptyState({ Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="card-soft flex flex-col items-center px-6 py-10 text-center">
      <Icon size={28} className="mb-3 text-ink-faint" />
      <h2 className="mobile-h4 text-ink">{title}</h2>
      <p className="mobile-body-sm mt-1 max-w-[280px] text-ink-muted">{message}</p>
      {action && (
        <Link href={action.href} className="mt-5 flex h-12 items-center rounded-full bg-ink px-6 text-sm font-semibold text-white transition-opacity active:opacity-80">
          {action.label}
        </Link>
      )}
    </div>
  );
}
