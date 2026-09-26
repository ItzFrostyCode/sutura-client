'use client';

import { FormEvent } from 'react';
import Image from 'next/image';
import {
  CheckCircle2,
  Mail,
  Phone,
  Shirt,
  StickyNote,
  Wallet,
  Sparkles,
  Scissors,
  Package,
  MapPin,
  Calendar,
  Clock,
  MessageSquare,
  Edit2,
} from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { getServicePriceLabel } from '@/lib/servicePricing';
import {
  StoreSettings,
  Branch,
  Service,
  PackageInfo,
  BookingCustomer,
} from '../types';

interface UserInfo {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface BookingStep3ReviewProps {
  readonly refName: string | null;
  readonly refImage: string | null;
  readonly refPrice: string | null;
  readonly refSize: string | null;
  readonly refColor: string | null;
  readonly selectedService: Service | null;
  readonly packageInfo: PackageInfo | null;
  readonly appointmentType: string;
  readonly date: string;
  readonly time: string;
  readonly selectedBranch: Branch | null;
  readonly formatDatePreview: (d: string) => string;
  readonly formatTimePreview: (t: string) => string;
  readonly onEditPurpose: () => void;
  readonly onEditSchedule: () => void;
  readonly user: UserInfo | null;
  readonly customer: BookingCustomer;
  readonly remarks: string;
  readonly orderReference: string;
  readonly answers: Record<string, string>;
  readonly storeSettings: StoreSettings | null;
  readonly materialSource: 'own' | 'shop' | '';
  readonly materialDescription: string;
  readonly paymentMethod: string;
  readonly paymentReceiptUrl: string;
  readonly quantity?: string | null;
  readonly handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

const PURPOSE_MAP: Record<string, { label: string; hint: string }> = {
  consultation: {
    label: 'Consultation',
    hint: 'Discuss your garment idea, materials, design, and pricing with the store.',
  },
  measurement: {
    label: 'Measurement',
    hint: 'Get measured in person for your garment.',
  },
  alteration: {
    label: 'Alteration / Repair',
    hint: 'Bring an existing garment for adjustment or repair.',
  },
  fitting: {
    label: 'Fitting',
    hint: 'Try on your garment in progress so the store can adjust the fit.',
  },
  pickup: {
    label: 'Pickup',
    hint: 'Collect your finished garment or order at the store.',
  },
};

export default function BookingStep3Review({
  refName,
  refImage,
  refPrice,
  refSize,
  refColor,
  selectedService,
  packageInfo,
  appointmentType,
  date,
  time,
  selectedBranch,
  formatDatePreview,
  formatTimePreview,
  onEditPurpose,
  onEditSchedule,
  user,
  customer,
  remarks,
  orderReference,
  answers,
  storeSettings,
  materialSource,
  materialDescription,
  paymentMethod,
  paymentReceiptUrl,
  quantity,
  handleSubmit,
}: BookingStep3ReviewProps) {
  const answerEntries = Object.entries(answers).filter(([, v]) => v);
  const hasFittingFee = Number(storeSettings?.fitting_fee) > 0;
  const isDiscussion = appointmentType === 'consultation' && selectedService && (
    selectedService.name.toLowerCase().includes('print') ||
    selectedService.name.toLowerCase().includes('sublimat') ||
    selectedService.name.toLowerCase().includes('embroid') ||
    selectedService.name.toLowerCase().includes('bulk') ||
    selectedService.name.toLowerCase().includes('uniform')
  );

  const basePurpose = PURPOSE_MAP[appointmentType] ?? {
    label: appointmentType.charAt(0).toUpperCase() + appointmentType.slice(1),
    hint: 'Visit the store for your tailoring appointment.',
  };

  const purposeInfo = isDiscussion
    ? {
        label: 'Consultation / Order Discussion',
        hint: 'Discuss your artwork, print placement, fabrics, quantities, and pricing with the store.',
      }
    : basePurpose;

  return (
    <form id="booking-form" onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="mobile-h2 text-ink">Review</h2>

      {/* 1. Appointment Purpose */}
      <div className="p-4 bg-surface border border-line rounded-none space-y-2">
        <div className="flex items-center justify-between">
          <span className="mobile-overline text-taupe flex items-center gap-1.5">
            <MessageSquare size={14} className="text-taupe" /> Appointment Purpose
          </span>
          <button
            type="button"
            onClick={onEditPurpose}
            className="mobile-caption font-semibold text-taupe hover:underline flex items-center gap-1 cursor-pointer py-1"
          >
            <Edit2 size={12} /> Edit
          </button>
        </div>
        <h3 className="mobile-h4 font-medium text-ink">{purposeInfo.label}</h3>
        <p className="mobile-body-sm text-ink-muted font-normal">{purposeInfo.hint}</p>
      </div>

      {/* 2. Design Reference (if entering from catalog item) */}
      {refName && (
        <div className="p-4 bg-surface border border-line rounded-none space-y-3">
          <span className="mobile-overline text-taupe flex items-center gap-1.5">
            <Sparkles size={14} className="text-taupe" /> Design Reference
          </span>
          <div className="flex items-center gap-3">
            {refImage && (
              <div className="relative w-14 h-14 rounded-none overflow-hidden border border-line shrink-0 bg-sunken">
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
                {refSize && (
                  <span className="bg-sunken border border-line rounded px-1.5 py-0.5 text-[10px] font-medium text-ink">
                    Size {refSize}
                  </span>
                )}
                {refColor && <span>{refColor}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Selected Service (if entering from service or chosen in Step 2) */}
      {!refName && selectedService && (
        <div className="p-4 bg-surface border border-line rounded-none space-y-2">
          <div className="flex items-center justify-between">
            <span className="mobile-overline text-taupe flex items-center gap-1.5">
              <Scissors size={14} className="text-taupe" /> Selected Service
            </span>
            <button
              type="button"
              onClick={onEditSchedule}
              className="mobile-caption font-semibold text-taupe hover:underline flex items-center gap-1 cursor-pointer py-1"
            >
              <Edit2 size={12} /> Edit
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="mobile-h4 font-medium text-ink">{selectedService.name}</h3>
            <span className="mobile-body-sm font-semibold text-taupe shrink-0 text-right">
              {getServicePriceLabel(selectedService.base_price)}
            </span>
          </div>
          {selectedService.description && (
            <p className="mobile-body-sm text-ink-muted line-clamp-2 font-normal">
              {selectedService.description}
            </p>
          )}
        </div>
      )}

      {/* 4. Package Inquiry */}
      {!refName && packageInfo && (
        <div className="p-4 bg-surface border border-taupe/30 rounded-none space-y-2">
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
      )}

      {/* 5. Branch */}
      {selectedBranch && (
        <div className="p-4 bg-surface border border-line rounded-none space-y-2">
          <div className="flex items-center justify-between">
            <span className="mobile-overline text-taupe flex items-center gap-1.5">
              <MapPin size={14} className="text-taupe" /> Branch
            </span>
            <button
              type="button"
              onClick={onEditSchedule}
              className="mobile-caption font-semibold text-taupe hover:underline flex items-center gap-1 cursor-pointer py-1"
            >
              <Edit2 size={12} /> Edit
            </button>
          </div>
          <div>
            <h3 className="mobile-h4 font-medium text-ink">{selectedBranch.name}</h3>
            {selectedBranch.distanceKm !== null && selectedBranch.distanceKm !== undefined && (
              <p className="mobile-caption text-taupe font-medium mt-0.5">
                {selectedBranch.distanceKm < 1
                  ? `${Math.round(selectedBranch.distanceKm * 1000)}m away`
                  : `${selectedBranch.distanceKm.toFixed(1)} km away`}
              </p>
            )}
            {selectedBranch.address && (
              <p className="mobile-caption text-ink-faint mt-0.5 font-normal">
                {selectedBranch.address}
                {selectedBranch.city ? `, ${selectedBranch.city}` : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 6. Date & Time */}
      {date && (
        <div className="p-4 bg-surface border border-line rounded-none space-y-2">
          <div className="flex items-center justify-between">
            <span className="mobile-overline text-taupe flex items-center gap-1.5">
              <Calendar size={14} className="text-taupe" /> Date &amp; Time
            </span>
            <button
              type="button"
              onClick={onEditSchedule}
              className="mobile-caption font-semibold text-taupe hover:underline flex items-center gap-1 cursor-pointer py-1"
            >
              <Edit2 size={12} /> Edit
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock size={16} className="text-taupe shrink-0" />
            <span className="mobile-body-sm text-ink font-semibold">
              {formatDatePreview(date)} • {formatTimePreview(time)}
            </span>
          </div>
        </div>
      )}

      {/* 7. Material */}
      {materialSource && (
        <div className="p-4 bg-surface border border-line rounded-none space-y-2">
          <div className="flex items-center justify-between">
            <span className="mobile-overline text-taupe flex items-center gap-1.5">
              <Shirt size={14} className="text-taupe" /> Material
            </span>
            <button
              type="button"
              onClick={onEditSchedule}
              className="mobile-caption font-semibold text-taupe hover:underline flex items-center gap-1 cursor-pointer py-1"
            >
              <Edit2 size={12} /> Edit
            </button>
          </div>
          <p className="mobile-body-sm text-ink font-medium">
            {materialSource === 'own'
              ? `I'll bring my own fabric/sample${materialDescription.trim() ? ` — ${materialDescription.trim()}` : ''}`
              : "I'll use the shop's material"}
          </p>
        </div>
      )}

      {/* 8. What to Bring (Section 14) */}
      {materialSource === 'own' && (
        <div className="bg-sunken border border-line rounded-none p-4">
          <span className="mobile-overline text-taupe block mb-1.5">What to Bring</span>
          <p className="text-sm font-medium text-ink flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> Your fabric/sample
          </p>
        </div>
      )}

      {/* 9. Quantity (if applicable) */}
      {quantity && (
        <div className="p-4 bg-surface border border-line rounded-none space-y-1">
          <span className="mobile-overline text-taupe">Quantity</span>
          <p className="mobile-body-sm text-ink font-medium">{quantity} items/people</p>
        </div>
      )}

      {/* 10. Contact (read-only — authenticated) */}
      <div className="p-4 bg-surface border border-line rounded-none space-y-2">
        <span className="mobile-overline text-taupe">Contact</span>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-taupe/15 border border-taupe/30 flex items-center justify-center text-taupe font-bold text-sm shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="mobile-h4 font-medium text-ink truncate">{user?.name || customer.name}</p>
              <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2 py-0.5 rounded-none shrink-0 flex items-center gap-1">
                <CheckCircle2 size={12} /> Verified
              </span>
            </div>
            <p className="mobile-caption text-ink-muted truncate mt-0.5 flex items-center gap-1 font-normal">
              <Mail size={12} className="text-ink-faint shrink-0" /> {user?.email || customer.email}
            </p>
            {customer.phone && (
              <p className="mobile-caption text-ink-muted truncate mt-0.5 flex items-center gap-1 font-normal">
                <Phone size={12} className="text-ink-faint shrink-0" /> {customer.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 11. Relevant Details (notes, order reference, owner questions) */}
      {(orderReference.trim() || remarks.trim() || answerEntries.length > 0) && (
        <div className="p-4 bg-surface border border-line rounded-none space-y-3">
          <span className="mobile-overline text-taupe">Relevant Details</span>
          {orderReference.trim() && (
            <div className="flex items-start gap-2.5">
              <StickyNote size={15} className="text-taupe shrink-0 mt-0.5" />
              <p className="mobile-body-sm text-ink-body font-normal">
                Existing order: {orderReference.trim()}
              </p>
            </div>
          )}
          {remarks.trim() && (
            <div className="flex items-start gap-2.5">
              <StickyNote size={15} className="text-taupe shrink-0 mt-0.5" />
              <p className="mobile-body-sm text-ink-body font-normal">{remarks.trim()}</p>
            </div>
          )}
          {answerEntries.map(([q, a]) => (
            <div key={q} className="text-sm">
              <p className="text-ink-faint text-xs font-semibold">{q}</p>
              <p className="text-ink-body">{a}</p>
            </div>
          ))}
        </div>
      )}

      {/* 12. Payment (read-only) */}
      {hasFittingFee && (
        <div className="p-4 bg-surface border border-line rounded-none flex items-center gap-2.5">
          <Wallet size={16} className="text-taupe shrink-0" />
          <p className="mobile-body-sm text-ink-body font-normal">
            Reservation fee via <span className="font-semibold text-ink capitalize">{paymentMethod}</span>
            {paymentMethod !== 'cash' && (paymentReceiptUrl ? ' — receipt attached' : ' — no receipt attached yet')}
          </p>
        </div>
      )}
    </form>
  );
}
