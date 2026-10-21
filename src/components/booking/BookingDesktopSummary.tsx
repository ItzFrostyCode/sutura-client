import { Scissors, Sparkles, MapPin, Calendar, Clock, Shirt, CheckCircle2 } from 'lucide-react';
import { getServicePriceLabel } from '@/lib/servicePricing';
import { RequestedServiceItem } from '@/store/useRequestedItemsStore';
import { Branch, Service } from './types';

interface BookingDesktopSummaryProps {
  readonly requestedItems?: RequestedServiceItem[];
  readonly refName: string | null;
  readonly refPrice: string | null;
  readonly selectedService: Service | null;
  readonly appointmentType: string;
  readonly selectedBranch: Branch | null;
  readonly date: string;
  readonly time: string;
  readonly formatDatePreview: (d: string) => string;
  readonly formatTimePreview: (t: string) => string;
  readonly materialSource: 'own' | 'shop' | '';
  readonly quantity?: string | null;
}

// Persistent right-column summary for the desktop (lg:+) booking layout —
// mirrors the same fields BookingReferenceSummary/BookingScheduleSummary
// show in the mobile Review step, kept visible throughout Steps 1-2 on wide
// screens instead of only appearing at the end.
export default function BookingDesktopSummary({
  requestedItems,
  refName,
  refPrice,
  selectedService,
  appointmentType,
  selectedBranch,
  date,
  time,
  formatDatePreview,
  formatTimePreview,
  materialSource,
  quantity,
}: BookingDesktopSummaryProps) {
  const items = requestedItems;
  const hasRequestedItems = items && items.length > 0;

  return (
    <div className="hidden lg:block lg:w-[300px] lg:shrink-0">
      <div className="sticky top-6 bg-surface border border-line rounded-xl shadow-xs p-4 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">Appointment Summary</p>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint flex items-center gap-1.5">
            <Shirt size={13} className="text-taupe" /> Purpose
          </span>
          <p className="text-sm font-medium text-ink">
            {appointmentType === 'alteration'
              ? 'Alteration / Repair'
              : appointmentType === 'measurement'
              ? 'Measurement'
              : appointmentType === 'consultation'
              ? 'Consultation / Order Discussion'
              : appointmentType.charAt(0).toUpperCase() + appointmentType.slice(1)}
          </p>
        </div>

        {hasRequestedItems && (
          <div className="space-y-2 pt-3 border-t border-line">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint flex items-center gap-1.5">
              {items.length === 1 && items[0].catalogItemId ? (
                <>
                  <Sparkles size={13} className="text-taupe" /> Design Reference
                </>
              ) : items.length === 1 ? (
                <>
                  <Scissors size={13} className="text-taupe" /> Service Consultation
                </>
              ) : (
                <>
                  <Scissors size={13} className="text-taupe" /> Requested Consultations ({items.length})
                </>
              )}
            </span>
            {items.length === 1 ? (
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-medium text-ink">
                  <span className="truncate pr-1">{items[0].name}</span>
                  <span className="text-taupe shrink-0 font-semibold">{items[0].quantity} pcs</span>
                </div>
                {items[0].catalogItemId && items[0].serviceName && (
                  <p className="text-[11px] text-ink-muted truncate">
                    Parent: {items[0].serviceName}
                  </p>
                )}
                {items[0].basePrice != null && Number(items[0].basePrice) > 0 && (
                  <p className="text-xs font-semibold text-taupe pt-0.5">
                    From ₱{Number(items[0].basePrice).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((it) => (
                  <div key={it.id} className="text-xs border-b border-line/40 pb-1.5 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between font-medium text-ink">
                      <span className="truncate pr-1">{it.name}</span>
                      <span className="text-taupe shrink-0 font-semibold">{it.quantity} pcs</span>
                    </div>
                    {it.catalogItemId && it.serviceName && (
                      <p className="text-[11px] text-ink-muted truncate">
                        Parent: {it.serviceName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-ink-faint italic pt-1">
              * Final specifications &amp; price confirmed in-store
            </p>
          </div>
        )}

        {!hasRequestedItems && refName && (
          <div className="space-y-1 pt-3 border-t border-line">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint flex items-center gap-1.5">
              <Sparkles size={13} className="text-taupe" /> Design
            </span>
            <p className="text-sm font-medium text-ink">{refName}</p>
            {refPrice && <p className="text-sm font-semibold text-taupe">From ₱{Number(refPrice).toLocaleString()}</p>}
          </div>
        )}

        {!hasRequestedItems && !refName && selectedService && (
          <div className="space-y-1 pt-3 border-t border-line">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint flex items-center gap-1.5">
              <Scissors size={13} className="text-taupe" /> Service
            </span>
            <p className="text-sm font-medium text-ink">{selectedService.name}</p>
            <p className="text-sm font-semibold text-taupe">{getServicePriceLabel(selectedService.base_price)}</p>
          </div>
        )}

        {selectedBranch && (
          <div className="space-y-1 pt-3 border-t border-line">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint flex items-center gap-1.5">
              <MapPin size={13} className="text-taupe" /> Branch
            </span>
            <p className="text-sm font-medium text-ink">{selectedBranch.name}</p>
            {selectedBranch.distanceKm !== null && selectedBranch.distanceKm !== undefined && (
              <p className="text-xs text-ink-faint">
                {selectedBranch.distanceKm < 1
                  ? `${Math.round(selectedBranch.distanceKm * 1000)}m away`
                  : `${selectedBranch.distanceKm.toFixed(1)} km away`}
              </p>
            )}
          </div>
        )}

        {date && (
          <div className="space-y-1 pt-3 border-t border-line">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint flex items-center gap-1.5">
              <Calendar size={13} className="text-taupe" /> Date &amp; Time
            </span>
            <p className="text-sm font-medium text-ink flex items-center gap-1.5">
              {formatDatePreview(date)}
              {time && (
                <>
                  <Clock size={12} className="text-ink-faint" /> {formatTimePreview(time)}
                </>
              )}
            </p>
          </div>
        )}

        {materialSource && (
          <div className="space-y-1 pt-3 border-t border-line">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Material</span>
            <p className="text-sm font-medium text-ink">
              {materialSource === 'own' ? "I'll bring my own fabric/sample" : "I'll use the shop's material"}
            </p>
          </div>
        )}

        {materialSource === 'own' && (
          <div className="p-3 bg-sunken border border-line rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-taupe block">What to Bring</span>
            <p className="text-xs font-medium text-ink flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" /> Your fabric/sample
            </p>
          </div>
        )}

        {quantity && (
          <div className="space-y-1 pt-3 border-t border-line">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Quantity</span>
            <p className="text-sm font-medium text-ink">{quantity} items/people</p>
          </div>
        )}
      </div>
    </div>
  );
}
