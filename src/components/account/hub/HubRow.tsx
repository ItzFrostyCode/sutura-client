import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';

interface HubRowProps {
  /** Where the row leads; or pass `onClick` for a row that acts in place (e.g. switching account). */
  readonly href?: string;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly Icon: LucideIcon;
  readonly title: string;
  /** A second, smaller line, such as the current value of a setting. */
  readonly subtitle?: string;
  readonly danger?: boolean;
}

const ROW = 'flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left transition-colors active:bg-sunken disabled:opacity-60';

/** One tappable row of a grouped list: a plain icon (no background), the title and optional value, and the › that says it opens something.  Long text wraps to two lines (never cut off mid-word on a 320px phone). */
export default function HubRow({ href, onClick, disabled = false, Icon, title, subtitle, danger = false }: HubRowProps) {
  const body = (
    <>
      <Icon size={22} className={`w-8 shrink-0 ${danger ? 'text-danger' : 'text-taupe'}`} />
      <span className="min-w-0 flex-1">
        <span className={`mobile-body-md block line-clamp-2 break-words ${danger ? 'text-danger' : 'text-ink'}`}>{title}</span>
        {subtitle && <span className="mobile-caption mt-0.5 block line-clamp-2 break-words text-ink-muted">{subtitle}</span>}
      </span>
      <ChevronRight size={18} className="shrink-0 text-ink-faint" />
    </>
  );
  if (href) return <Link href={href} className={ROW}>{body}</Link>;
  return <button type="button" onClick={onClick} disabled={disabled} className={ROW}>{body}</button>;
}
