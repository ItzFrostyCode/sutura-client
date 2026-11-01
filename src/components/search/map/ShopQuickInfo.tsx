import type { ReactNode } from 'react';
import { Clock, MapPin, Phone } from 'lucide-react';
import { hoursLine, type OperatingHours } from '@/lib/storeStatus';

function Row({ icon, children }: { readonly icon: ReactNode; readonly children: ReactNode }) {
  return (
    <li className="flex min-h-11 items-center gap-3 border-t border-line py-2 text-sm text-ink">
      <span className="shrink-0 text-taupe-dark">{icon}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  );
}

/** The necessary facts about the branch, in Google's order: where, when, and how to call. Only rows that have data show. */
export default function ShopQuickInfo({ address, hours, phone }: { readonly address: string | null; readonly hours: OperatingHours | null | undefined; readonly phone: string | null | undefined }) {
  const line = hoursLine(hours);
  if (!address && !line && !phone) return null;
  return (
    <ul className="shrink-0 px-4 pb-1">
      {address && <Row icon={<MapPin size={18} />}>{address}</Row>}
      {line && (
        <Row icon={<Clock size={18} />}>
          <span className={line.open ? 'font-medium text-sage' : 'font-medium text-danger'}>{line.open ? 'Open' : 'Closed'}</span>
          <span className="text-ink-muted"> · {line.text}</span>
        </Row>
      )}
      {phone && (
        <Row icon={<Phone size={18} />}>
          <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="font-medium underline-offset-2 hover:underline">{phone}</a>
        </Row>
      )}
    </ul>
  );
}
