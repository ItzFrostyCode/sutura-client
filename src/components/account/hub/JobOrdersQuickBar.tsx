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
    <section aria-labelledby="hub-orders-title" className="card-soft p-4">
      <div className="flex items-center justify-between">
        <h2 id="hub-orders-title" className="mobile-h4 text-ink">Job Orders</h2>
        <Link href="/account/orders" className="-mr-2 flex min-h-11 items-center gap-0.5 px-2 text-sm text-taupe transition-opacity active:opacity-70">
          View all <ChevronRight size={16} />
        </Link>
      </div>

      {/* Three tiles like iOS widgets: the icon and the number on top, what it counts underneath. */}
      <div className="grid grid-cols-3 gap-2">
        {orderShortcuts.map(({ href, label, Icon, count }) => (
          <Link key={href} href={href} className="flex min-h-[84px] flex-col justify-between rounded-2xl bg-sunken p-3 transition-opacity active:opacity-70">
            <span className="flex items-center justify-between">
              <Icon size={20} className="text-taupe" />
              <span className="text-xl font-semibold leading-none text-ink">{count}</span>
            </span>
            <span className="mobile-caption leading-tight text-ink-muted">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
