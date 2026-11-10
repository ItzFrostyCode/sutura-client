import type { ReactNode } from 'react';
import { Clock, MapPin, Phone } from 'lucide-react';
import type { OperatingHours } from '@/lib/storeStatus';
import ShopHoursStatus from '@/components/shared/ShopHoursStatus';

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

  return (
    <ul className="shrink-0 px-4 pb-1">
      {address && <Row icon={<MapPin size={18} />}>{address}</Row>}
      {/* Always shown, in the same two lines as the list (ShopHoursStatus) — "Hours not set" for a new shop. */}
      <Row icon={<Clock size={18} />}>
        <ShopHoursStatus hours={hours} size="md" />
      </Row>
      {phone && (
        <Row icon={<Phone size={18} />}>
          <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="-my-2 flex min-h-11 items-center font-medium underline-offset-2 hover:underline">{phone}</a>
        </Row>
      )}
    </ul>
  );
}
