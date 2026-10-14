import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';

interface HistoryRowProps {
  readonly href?: string;
  readonly Icon: LucideIcon;
  readonly title: string;
  readonly subtitle: string;
  /** A status pill on the right, with its colours. */
  readonly status?: { readonly label: string; readonly Icon: LucideIcon; readonly tone: string };
}

/** One line of the history: a plain icon, what it is, who and when, and its status; tappable when it has a page of its own. */
export default function HistoryRow({ href, Icon, title, subtitle, status }: HistoryRowProps) {
  const body = (
    <>
      <Icon size={20} className="w-6 shrink-0 text-taupe" />
      <span className="min-w-0 flex-1">
        <span className="mobile-body-md block truncate text-ink">{title}</span>
        <span className="mobile-caption block truncate text-ink-muted">{subtitle}</span>
      </span>
      {status && (
        <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}>
          <status.Icon size={11} /> {status.label}
        </span>
      )}
      {href && <ChevronRight size={18} className="shrink-0 text-ink-faint" />}
    </>
  );
  const row = 'flex min-h-14 items-center gap-3 px-4 py-2.5';
  return href ? <Link href={href} className={`${row} transition-colors active:bg-sunken`}>{body}</Link> : <div className={row}>{body}</div>;
}
