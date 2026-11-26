'use client';

import Link from 'next/link';
import { MapPin, Navigation, Phone, Clock } from 'lucide-react';
import type { DropOffInfo } from './GarmentCheckCard';

interface OrderDestinationCardProps {
  readonly dropOff?: DropOffInfo | null;
  readonly shopName?: string | null;
  readonly storeSlug?: string | null;
}

/**
 * Shop Destination & Directions Card for the Order Details page.
 * Displays branch location, complete address, landmark, operating hours,
 * and an in-app SUTURA Search Map navigation link (?directions=1) so customers
 * can open the live route navigation directly inside the application.
 */
export default function OrderDestinationCard({ dropOff, shopName, storeSlug }: OrderDestinationCardProps) {
  if (!dropOff) return null;

  const branchName = dropOff.name || shopName || 'Shop Branch';
  const hasCoordinates = typeof dropOff.latitude === 'number' && typeof dropOff.longitude === 'number';

  // In-app search map directions URL (e.g. /search?sort_by=price_asc&view=list&store=slug&directions=1)
  const isInternal = Boolean(storeSlug);
  const directionsUrl = storeSlug
    ? `/search?sort_by=price_asc&view=list&store=${encodeURIComponent(storeSlug)}&directions=1`
    : hasCoordinates
      ? `https://www.google.com/maps/dir/?api=1&destination=${dropOff.latitude},${dropOff.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${branchName} ${dropOff.address ?? ''} ${dropOff.landmark ?? ''}`.trim()
        )}`;

  return (
    <section aria-labelledby="shop-destination-title" className="card-soft p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sunken text-taupe">
            <MapPin size={20} />
          </div>
          <div>
            <span className="mobile-overline text-ink-muted">Shop Destination</span>
            <h3 id="shop-destination-title" className="mobile-h4 text-ink">
              {branchName}
            </h3>
            {dropOff.address && (
              <p className="mobile-body-sm mt-0.5 text-ink-body">
                {dropOff.address}
              </p>
            )}
            {dropOff.landmark && (
              <p className="mobile-caption mt-0.5 text-ink-muted">
                Landmark: <span className="text-ink">{dropOff.landmark}</span>
              </p>
            )}
          </div>
        </div>
        {isInternal ? (
          <Link
            href={directionsUrl}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-75"
          >
            <Navigation size={14} />
            <span>Directions</span>
          </Link>
        ) : (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-75"
          >
            <Navigation size={14} />
            <span>Directions</span>
          </a>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 border-t border-line pt-3 sm:grid-cols-2">
        {dropOff.operating_hours && (
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <Clock size={14} className="text-ink-faint shrink-0" />
            <span className="truncate">Hours: {dropOff.operating_hours}</span>
          </div>
        )}
        {dropOff.contact_number && (
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <Phone size={14} className="text-ink-faint shrink-0" />
            <a href={`tel:${dropOff.contact_number}`} className="truncate text-ink hover:underline">
              {dropOff.contact_number}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
