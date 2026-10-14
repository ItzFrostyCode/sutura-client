import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface HomeSectionHeaderProps {
  readonly id: string;
  readonly title: string;
  readonly href?: string;
  readonly linkLabel?: string;
}

/** Section title with a quiet link on the right. */
export default function HomeSectionHeader({ id, title, href, linkLabel = 'See All' }: HomeSectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 id={id} className="mobile-h2 sm:tablet-h2 text-ink">{title}</h2>
      {href && (
        <Link href={href} className="flex min-h-[44px] items-center gap-0.5 text-sm text-taupe transition-colors hover:text-taupe-hover">
          {linkLabel}
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}
