import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import type { MyOrder } from './ordersTypes';

interface ShopCardShellProps {
  /** One of the group's orders — the card always belongs to one shop. */
  readonly order: MyOrder;
  /** Under the shop name. Defaults to the order number. */
  readonly caption?: ReactNode;
  /** Set to make the whole card a link to that order's page. */
  readonly href?: string;
  readonly children: ReactNode;
}

/** The one shop card the order list uses for both solo and grouped orders: logo, shop name, then the caller's content. */
export default function ShopCardShell({ order, caption, href, children }: ShopCardShellProps) {
  const header = (
    <div className="flex items-center gap-3">
      <StoreLogoAvatar
        src={order.store?.logo_path}
        name={order.store?.name ?? 'Store'}
        className="h-[44px] w-[44px] rounded-full border border-line-strong shadow-none"
        textClassName="text-base font-serif font-bold text-taupe-dark"
      />
      <div className="min-w-0 flex-1">
        <p className="mobile-h4 truncate text-ink">{order.store?.name ?? 'Store'}</p>
        <p className="mobile-caption mt-1 text-ink-faint">{caption ?? `#${order.order_number}`}</p>
      </div>
      {href && <ChevronRight size={18} className="shrink-0 text-ink-faint" />}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="card-soft block p-4 transition-opacity active:opacity-80">
        {header}
        <div className="mt-3">{children}</div>
      </Link>
    );
  }

  return (
    <div className="card-soft p-4">
      {header}
      <div className="mt-3">{children}</div>
    </div>
  );
}
