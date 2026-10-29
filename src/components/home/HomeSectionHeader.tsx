import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface HomeSectionHeaderProps {
  readonly id: string;
  readonly title: string;
  readonly href?: string;
  readonly linkLabel?: string;
  /** Sits before the link (e.g. a Filters button). */
  readonly action?: React.ReactNode;
}

/** Section title with a quiet link on the right. */
export default function HomeSectionHeader({ id, title, href, linkLabel = 'See All', action }: HomeSectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 id={id} className="mobile-h2 sm:tablet-h2 text-ink">{title}</h2>
      <div className="flex items-center gap-4">
        {action}
        {href && (
          <Link
            href={href}
            className="text-xs sm:text-sm font-semibold text-taupe hover:text-ink transition-colors flex items-center gap-1 group"
          >
            <span>{linkLabel}</span>
            <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
