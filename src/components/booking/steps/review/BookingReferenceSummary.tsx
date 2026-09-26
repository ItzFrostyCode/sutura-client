import Image from 'next/image';
import { Sparkles, Scissors, Package, MessageSquare, Edit2 } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { getServicePriceLabel } from '@/lib/servicePricing';
import { Service, PackageInfo } from '../../types';

interface BookingReferenceSummaryProps {
  refName: string | null;
  refImage: string | null;
  refPrice: string | null;
  refSize: string | null;
  refColor: string | null;
  selectedService: Service | null;
  packageInfo: PackageInfo | null;
  appointmentType: string;
  onEditSchedule: () => void;
}

export default function BookingReferenceSummary({
  refName,
  refImage,
  refPrice,
  refSize,
  refColor,
  selectedService,
  packageInfo,
  appointmentType,
  onEditSchedule,
}: Readonly<BookingReferenceSummaryProps>) {
  if (refName) {
    return (
      <div className="p-4 bg-surface border border-line rounded-2xl space-y-3">
        <span className="mobile-overline text-taupe flex items-center gap-1.5">
          <Sparkles size={14} className="text-taupe" /> Design Reference
        </span>
        <div className="flex items-center gap-3">
          {refImage && (
            <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-line shrink-0 bg-sunken">
              <Image src={getMediaUrl(refImage)} alt={refName} fill className="object-cover object-top" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="mobile-h4 font-medium text-ink truncate leading-tight">{refName}</h3>
              {refPrice && (
                <span className="mobile-body-sm font-semibold text-taupe shrink-0">
                  ₱{Number(refPrice).toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 mobile-caption text-ink-muted font-normal">
              <span className="bg-sunken border border-line rounded px-1.5 py-0.5 text-[10px] font-medium text-ink">
                {refSize ? `Size ${refSize}` : 'No size'}
              </span>
              {refColor && <span>{refColor}</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedService) {
    return (
      <div className="p-4 bg-surface border border-line rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="mobile-overline text-taupe flex items-center gap-1.5">
            <Scissors size={14} className="text-taupe" /> Selected Service
          </span>
          <button
            type="button"
            onClick={onEditSchedule}
            className="mobile-caption font-semibold text-taupe hover:underline flex items-center gap-1 cursor-pointer py-1"
          >
            <Edit2 size={12} /> Change
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="mobile-h4 font-medium text-ink">{selectedService.name}</h3>
          <span className="mobile-body-sm font-semibold text-taupe shrink-0 text-right">
            {getServicePriceLabel(selectedService.base_price)}
          </span>
        </div>
        {selectedService.description && (
          <p className="mobile-body-sm text-ink-muted line-clamp-2 font-normal">{selectedService.description}</p>
        )}
      </div>
    );
  }

  if (packageInfo) {
    return (
      <div className="p-4 bg-surface border border-taupe/30 rounded-2xl space-y-2">
        <span className="mobile-overline text-taupe flex items-center gap-1.5">
          <Package size={14} className="text-taupe" /> Package Inquiry
        </span>
        <div className="flex items-center justify-between">
          <h3 className="mobile-h4 font-medium text-ink">{packageInfo.name}</h3>
          <span className="mobile-body-sm font-semibold text-taupe">
            ₱{(packageInfo.bundle_price
              ? Number(packageInfo.bundle_price)
              : packageInfo.services.reduce((sum, s) => sum + (Number(s.base_price) || 0), 0)
            ).toLocaleString()}
          </span>
        </div>
        <p className="mobile-body-sm text-ink-muted font-normal">
          Includes: {packageInfo.services.map((s) => s.name).join(', ')}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-surface border border-line rounded-2xl space-y-2">
      <span className="mobile-overline text-taupe flex items-center gap-1.5">
        <MessageSquare size={14} className="text-taupe" /> Appointment Purpose
      </span>
      <h3 className="mobile-h4 font-medium text-ink capitalize">{appointmentType} Consultation</h3>
      <p className="mobile-body-sm text-ink-muted font-normal">Store consultation and fitting service.</p>
    </div>
  );
}
