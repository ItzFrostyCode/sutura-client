import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';

interface HubRowProps {
  readonly href: string;
  readonly Icon: LucideIcon;
  readonly title: string;
  /** A second, smaller line, such as the current value of a setting. */
  readonly subtitle?: string;
  readonly danger?: boolean;
}

/** One tappable row of a grouped list: a plain icon (no background), the title and optional value, and the › that says it opens something. */
export default function HubRow({ href, Icon, title, subtitle, danger = false }: HubRowProps) {
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors active:bg-sunken">
      <Icon size={22} className={`w-8 shrink-0 ${danger ? 'text-danger' : 'text-taupe'}`} />
      <span className="min-w-0 flex-1">
        <span className={`mobile-body-md block truncate ${danger ? 'text-danger' : 'text-ink'}`}>{title}</span>
        {subtitle && <span className="mobile-caption block truncate text-ink-muted">{subtitle}</span>}
      </span>
      <ChevronRight size={18} className="shrink-0 text-ink-faint" />
    </Link>
  );
}
