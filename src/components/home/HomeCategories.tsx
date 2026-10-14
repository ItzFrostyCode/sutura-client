import Link from 'next/link';
import { Baby, Scissors, User, UserRound } from 'lucide-react';
import HomeSectionHeader from './HomeSectionHeader';

// Shortcuts into the existing taxonomy (department = men | women | children). Services is a separate
// kind of thing, so it goes to the Services tab rather than to a department.
const SHORTCUTS = [
  { label: 'Men', href: '/search?tab=catalog&department=men', Icon: User },
  { label: 'Women', href: '/search?tab=catalog&department=women', Icon: UserRound },
  { label: 'Kids', href: '/search?tab=catalog&department=children', Icon: Baby },
  { label: 'Services', href: '/search?tab=services', Icon: Scissors },
];

export default function HomeCategories() {
  return (
    <section aria-labelledby="home-categories-title">
      <HomeSectionHeader id="home-categories-title" title="Categories" href="/categories" />
      <div className="grid grid-cols-4 gap-3 sm:gap-4">
        {SHORTCUTS.map(({ label, href, Icon }) => (
          <Link key={label} href={href} className="card-soft flex min-h-[104px] flex-col items-center justify-center gap-3 transition-transform active:scale-[0.97]">
            <Icon size={26} className="text-taupe" />
            <span className="text-sm font-medium text-ink">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
