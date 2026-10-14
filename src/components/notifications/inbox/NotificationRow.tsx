import Image from 'next/image';
import { CalendarDays, Hash, Store, Wallet } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { ageOf, fullDateTime, kindOf, type AppNotification } from './inboxTypes';

/**
 * One notification, Facebook style: the shop's picture with a small badge for the kind, "<shop>: <what happened>" with the shop in
 * bold, the shop's sentence, one line with the fact that matters (the appointment's date, the order number, the amount), the age in
 * colour while unread, and a dot. One tap opens it and marks it read.
 */
export default function NotificationRow({ notif, onOpen }: { readonly notif: AppNotification; readonly onOpen: (n: AppNotification) => void }) {
  const unread = !notif.read_at;
  const d = notif.data ?? {};
  const kind = kindOf(d.type);
  const picture = d.store?.logo_path ?? d.actor?.profile_picture ?? null;
  const scheduled = typeof d.scheduled_at === 'string' ? d.scheduled_at : null;
  const orderNumber = typeof d.order_number === 'string' ? d.order_number : null;
  const amount = typeof d.amount === 'number' || typeof d.amount === 'string' ? Number(d.amount) : null;
  const fact = scheduled
    ? { Icon: CalendarDays, text: fullDateTime(scheduled) }
    : orderNumber
      ? { Icon: Hash, text: orderNumber }
      : amount !== null && !Number.isNaN(amount)
        ? { Icon: Wallet, text: `₱${amount.toLocaleString()}` }
        : null;

  return (
    <button type="button" onClick={() => onOpen(notif)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-sunken active:bg-sunken">
      <span className="relative shrink-0">
        <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-sunken text-ink-faint">
          {picture ? <Image src={getMediaUrl(picture)} alt="" fill className="object-cover" /> : <Store size={22} />}
        </span>
        <span className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface ${kind.tone}`}>
          <kind.Icon size={14} />
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span className={`mobile-body-md block ${unread ? 'text-ink' : 'text-ink-body'}`}>
          {d.store?.name && <span className="font-semibold">{d.store.name}: </span>}
          <span className={unread ? 'font-medium' : ''}>{d.title ?? 'Update'}</span>
        </span>
        {d.message && <span className="mobile-body-sm mt-0.5 line-clamp-2 block text-ink-muted">{d.message}</span>}
        {fact && (
          <span className="mobile-caption mt-1 flex items-center gap-1.5 text-ink-body">
            <fact.Icon size={12} className="shrink-0 text-ink-faint" /> {fact.text}
          </span>
        )}
        <span className={`mobile-caption mt-1 block ${unread ? 'font-semibold text-taupe' : 'text-ink-faint'}`}>{ageOf(notif.created_at)}</span>
      </span>

      <span aria-label={unread ? 'Unread' : undefined} className={`h-3 w-3 shrink-0 rounded-full ${unread ? 'bg-taupe' : 'bg-transparent'}`} />
    </button>
  );
}
