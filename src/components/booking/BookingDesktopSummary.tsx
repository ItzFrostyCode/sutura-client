import { Scissors, Sparkles, MapPin, Calendar, Clock, Shirt } from 'lucide-react';
import { getServicePriceLabel } from '@/lib/servicePricing';
import { Branch, Service, PackageInfo } from './types';

interface BookingDesktopSummaryProps {
  readonly refName: string | null;
  readonly refPrice: string | null;
  readonly packageInfo: PackageInfo | null;
  readonly selectedService: Service | null;
  readonly appointmentType: string;
  readonly selectedBranch: Branch | null;
  readonly date: string;
  readonly time: string;
  readonly formatDatePreview: (d: string) => string;
  readonly formatTimePreview: (t: string) => string;
  readonly materialSource: 'own' | 'shop' | '';
}

// Persistent right-column summary for the desktop (lg:+) booking layout —
// mirrors the same fields BookingReferenceSummary/BookingScheduleSummary
// show in the mobile Review step, kept visible throughout Steps 1-2 on wide
// screens instead of only appearing at the end.
export default function BookingDesktopSummary({
  refName,
  refPrice,
  packageInfo,
  selectedService,
  appointmentType,
  selectedBranch,
  date,
  time,
  formatDatePreview,
  formatTimePreview,
  materialSource,
}: BookingDesktopSummaryProps) {
  return (
    <div className="hidden lg:block lg:w-[300px] lg:shrink-0">
      <div className="sticky top-6 bg-surface border border-line rounded-none p-4 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">Appointment Summary</p>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint flex items-center gap-1.5">
            <Shirt size={13} className="text-taupe" /> Purpose
          </span>
          <p className="text-sm font-medium text-ink capitalize">{appointmentType}</p>
        </div>

        {refName && (
          <div className="space-y-1 pt-3 border-t border-line">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint flex items-center gap-1.5">
              <Sparkles size={13} className="text-taupe" /> Design
            </span>
            <p className="text-sm font-medium text-ink">{refName}</p>
            {refPrice && <p className="text-sm font-semibold text-taupe">₱{Number(refPrice).toLocaleString()}</p>}
          </div>
        )}

        {!refName && packageInfo && (
          <div className="space-y-1 pt-3 border-t border-line">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Package</span>
            <p className="text-sm font-medium text-ink">{packageInfo.name}</p>
          </div>
        )}

        {!refName && !packageInfo && selectedService && (
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
      </div>
    </div>
  );
}
