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

export default function NotificationRow({ notif, onOpen, compact = false }: {
  readonly notif: AppNotification;
  readonly onOpen: (n: AppNotification) => void;
  /** The bell's drop-down: smaller picture and text, 2 lines (the full page keeps the larger rows). */
  readonly compact?: boolean;
}) {
  const unread = !notif.read_at;
  const d = notif.data ?? {};
  const kind = kindOf(d.type);
  const picture = d.store?.logo_path ?? d.actor?.profile_picture ?? null;
  const sentence = withoutTrackingCode(d.message ?? d.title ?? 'Update');

  return (
    <button type="button" onClick={() => onOpen(notif)} className={`flex w-full items-center rounded-xl px-2 text-left transition-colors hover:bg-sunken active:bg-sunken ${compact ? 'gap-2.5 py-1.5' : 'gap-3 py-2'}`}>
      <span className="relative shrink-0">
        <StoreLogoAvatar
          src={picture}
          name={d.store?.name ?? d.actor?.name ?? 'Store'}
          className={`${compact ? 'h-10 w-10' : 'h-14 w-14'} rounded-full border border-line-strong shadow-none`}
          textClassName={`${compact ? 'text-base' : 'text-xl'} font-serif font-bold text-taupe-dark`}
        />
        <span className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-full border-2 border-surface ${compact ? 'h-5 w-5' : 'h-7 w-7'} ${kind.tone}`}>
          <kind.Icon size={compact ? 10 : 14} />
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span className={`${compact ? 'line-clamp-2 min-h-[2lh] text-[13px] leading-snug' : 'mobile-body-sm line-clamp-3 min-h-[3lh]'} ${unread ? 'font-medium text-ink' : 'text-ink-body'}`}>
          {d.store?.name && <span className="font-semibold text-ink">{d.store.name} </span>}
          {sentence}
        </span>
        <span className={`${compact ? 'text-[11px]' : 'mobile-caption'} mt-0.5 block ${unread ? 'font-semibold text-taupe' : 'text-ink-faint'}`}>{ageOf(notif.created_at)}</span>
      </span>

      <span aria-label={unread ? 'Unread' : undefined} className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} shrink-0 rounded-full ${unread ? 'bg-taupe' : 'bg-transparent'}`} />
    </button>
  );
}
