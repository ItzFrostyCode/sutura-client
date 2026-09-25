import Link from 'next/link';
import Image from 'next/image';
import { Store, CalendarDays, Wallet, Eye } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { type MyOrder, getPhaseMeta } from './ordersTypes';

export default function OrderCard({ order }: Readonly<{ order: MyOrder }>) {
  const meta = getPhaseMeta(order.status);
  const StatusIcon = meta.Icon;
  const itemName = order.catalog_item_name ?? order.service_name ?? order.garment_category ?? 'Garment';

  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="flex gap-3 bg-surface border border-line p-3.5 hover:border-line-strong transition-colors"
    >
      <div className="w-[52px] h-[52px] rounded-full bg-sunken overflow-hidden relative shrink-0 border border-line">
        {order.store?.logo_path ? (
          <Image
            src={getMediaUrl(order.store.logo_path)}
            alt=""
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store size={20} className="text-ink-faint" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="mobile-caption font-semibold text-ink-muted truncate">
            {order.store?.name ?? 'Store'}
          </span>
          {order.is_rush && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-danger/10 text-danger border border-danger/20 shrink-0">
              Rush
            </span>
          )}
        </div>

        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="mobile-h4 font-semibold text-ink truncate flex-1 leading-snug">
            {itemName}
          </h3>
          <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${meta.tone}`}>
            <StatusIcon size={12} /> {meta.label}
          </span>
        </div>

        <div className="flex items-center gap-3 mobile-caption text-ink-muted font-normal mb-3">
          <span className="truncate">{order.order_number}</span>
          {order.due_date && (
            <span className="flex items-center gap-1 shrink-0">
              <CalendarDays size={12} className="text-ink-faint" />
              Due {new Date(order.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-line">
          <div className="flex items-center gap-1.5 min-w-0 mobile-caption text-ink-muted font-normal whitespace-nowrap overflow-hidden">
            <Wallet size={12} className="shrink-0 text-ink-faint" />
            <span className="truncate">
              ₱{order.balance.toLocaleString()} balance of ₱{order.total_amount.toLocaleString()}
            </span>
          </div>
          <div className="w-7 h-7 rounded-full bg-sunken flex items-center justify-center shrink-0 text-ink-muted">
            <Eye size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}
