import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import { ageOf, kindOf, type AppNotification } from './inboxTypes';

/**
 * One notification, Facebook style and compact: the shop's picture with a solid badge for the kind, then the shop in bold and
 * what happened (always 3 lines tall, so every row is the same height) and, on the 4th line, how long ago, in colour while unread, plus a dot. The full
 * details (date, order number, amount) are on the notification itself; one tap opens it and marks it read.
 */
/** The list leaves out the tracking-code sentence ("…or with the tracking code SAKU72LV8K.", "Track code: …"); the code is on the order. */
function withoutTrackingCode(text: string): string {
  const kept = text.split(/(?<=[.!?])\s+/).filter((sentence) => !/track(ing)?\s+code/i.test(sentence)).join(' ').trim();
  return kept || text;
}

export default function NotificationRow({ notif, onOpen }: { readonly notif: AppNotification; readonly onOpen: (n: AppNotification) => void }) {
  const unread = !notif.read_at;
  const d = notif.data ?? {};
  const kind = kindOf(d.type);
  const picture = d.store?.logo_path ?? d.actor?.profile_picture ?? null;
  const sentence = withoutTrackingCode(d.message ?? d.title ?? 'Update');

  return (
    <button type="button" onClick={() => onOpen(notif)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-sunken active:bg-sunken">
      <span className="relative shrink-0">
        <StoreLogoAvatar
          src={picture}
          name={d.store?.name ?? d.actor?.name ?? 'Store'}
          className="w-14 h-14 rounded-full border border-line-strong shadow-none"
          textClassName="text-xl font-serif font-bold text-taupe-dark"
        />
        <span className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface ${kind.tone}`}>
          <kind.Icon size={14} />
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span className={`mobile-body-sm line-clamp-3 min-h-[3lh] ${unread ? 'font-medium text-ink' : 'text-ink-body'}`}>
          {d.store?.name && <span className="font-semibold text-ink">{d.store.name} </span>}
          {sentence}
        </span>
        <span className={`mobile-caption mt-0.5 block ${unread ? 'font-semibold text-taupe' : 'text-ink-faint'}`}>{ageOf(notif.created_at)}</span>
      </span>

      <span aria-label={unread ? 'Unread' : undefined} className={`h-3 w-3 shrink-0 rounded-full ${unread ? 'bg-taupe' : 'bg-transparent'}`} />
    </button>
  );
}
