import Link from 'next/link';
import { ChevronRight, Hammer, PackageCheck, Flag } from 'lucide-react';

interface JobOrdersQuickBarProps {
  inProduction: number;
  readyForPickup: number;
  completed: number;
}

export default function JobOrdersQuickBar({
  inProduction,
  readyForPickup,
  completed,
}: Readonly<JobOrdersQuickBarProps>) {
  const orderShortcuts = [
    { href: '/account/orders?tab=production', label: 'In Production', Icon: Hammer, count: inProduction },
    { href: '/account/orders?tab=pickup', label: 'Ready for Pickup', Icon: PackageCheck, count: readyForPickup },
    { href: '/account/orders?tab=completed', label: 'Completed', Icon: Flag, count: completed },
  ];

  return (
    <div className="bg-surface border border-line p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="mobile-h3 font-semibold text-ink">Job Orders</h2>
        <Link
          href="/account/orders"
          className="btn-text-mobile text-xs font-semibold text-taupe hover:text-taupe-hover gap-1 -mr-2"
        >
          View All <ChevronRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {orderShortcuts.map(({ href, label, Icon, count }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-1.5 min-h-[56px] py-1 hover:bg-canvas transition-colors"
          >
            <span className="relative">
              <Icon size={24} className="text-ink-muted" />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-taupe text-white text-[10px] font-bold rounded-full">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </span>
            <span className="mobile-caption text-center leading-tight text-ink-muted font-normal">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
