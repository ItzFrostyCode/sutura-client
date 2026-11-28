import { hoursLine, type OperatingHours } from '@/lib/storeStatus';

interface ShopHoursStatusProps {
  readonly hours: OperatingHours | string | null | undefined;
  /** Smaller text for list rows; normal size in the shop card. */
  readonly size?: 'sm' | 'md';
  readonly className?: string;
}

/**
 * The one way a shop's hours are said, everywhere (Map list, shop card): two lines, so nothing has to be decoded.
 *   Line 1 — the state:  Open (green) · Closed (red) · Hours not set (grey, a new shop that has not added them yet)
 *   Line 2 — the time:   Closes 6:00 PM · Closes soon · 6:00 PM · Opens soon · 9:00 AM · Opens tomorrow 9:00 AM ·
 *                        Ask the shop before you go
 * "Soon" (amber) = within the hour. With no hours we never guess Open or Closed.
 */
export default function ShopHoursStatus({ hours, size = 'sm', className = '' }: ShopHoursStatusProps) {
  const line = hoursLine(hours);
  const text = size === 'sm' ? 'text-xs' : 'mobile-body-sm';

  if (!line) {
    return (
      <div className={`${text} leading-snug ${className}`}>
        <p className="font-semibold text-ink-muted">Hours not set</p>
        <p className="text-ink-muted">Ask the shop before you go</p>
      </div>
    );
  }

  // "Closes 6:00 PM" → "6:00 PM"; "Opens tomorrow 9:00 AM" keeps its words.
  const time = line.text.replace(/^(Closes|Opens) /, '');
  const verb = line.open ? 'Closes' : 'Opens';

  return (
    <div className={`${text} leading-snug ${className}`}>
      <p className={`font-semibold ${line.open ? 'text-emerald-800' : 'text-rose-700'}`}>{line.open ? 'Open' : 'Closed'}</p>
      <p className="text-ink-muted">
        {line.soon ? <><span className="font-semibold text-amber-800">{verb} soon</span> · {time}</> : line.text}
      </p>
    </div>
  );
}
