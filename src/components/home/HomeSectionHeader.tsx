import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface HomeSectionHeaderProps {
  readonly id: string;
  readonly title: string;
  readonly href?: string;
  readonly linkLabel?: string;
  /** Sits before the link (e.g. a List / Map toggle). */
  readonly action?: React.ReactNode;
}

/**
 * The one section-title style on the landing page: H2 (22–24px semi-bold) with a quiet link on the right. Link labels
 * name the page they open, the same words as that page's title: "All shops" (/shops), "All categories" (/categories).
 * Say "shop", not "tailor" — a tailor is the person; what is listed is the shop.
 */
export default function HomeSectionHeader({ id, title, href, linkLabel = 'See all', action }: HomeSectionHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <h2 id={id} className="mobile-h2 sm:tablet-h2 text-ink">{title}</h2>
      <div className="flex items-center gap-4">
        {action}
        {href && (
          <Link href={href} className="group flex min-h-11 items-center gap-1 text-sm font-semibold text-taupe-dark transition-colors hover:text-ink">
            <span>{linkLabel}</span>
            <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}
