'use client';

import { FormEvent } from 'react';
import Image from 'next/image';
import {
  CheckCircle2,
  Mail,
  Phone,
  Shirt,
  StickyNote,
  Sparkles,
  Scissors,
  MapPin,
  Calendar,
  Clock,
  MessageSquare,
  Edit2,
  ExternalLink,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { getMediaUrl } from '@/lib/media';
import { getServicePriceLabel } from '@/lib/servicePricing';
import {
  StoreSettings,
  Branch,
  Service,
  BookingCustomer,
} from '../types';

import { RequestedServiceItem } from '@/store/useRequestedItemsStore';
import BookingRequestedItemsList from '../BookingRequestedItemsList';

interface UserInfo {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface BookingStep3ReviewProps {
  readonly storeId?: string;
  readonly requestedItems?: RequestedServiceItem[];
  readonly onUpdateQuantity?: (id: string, qty: number) => void;
  readonly onRemoveItem?: (id: string) => void;
  readonly onOpenAddModal?: () => void;
  readonly onUpdateNotes?: (id: string, notes: string) => void;
  readonly onRemoveCatalogDesign?: (id: string, fallbackServiceName?: string) => void;
  readonly refName: string | null;
  readonly refDetailHref?: string | null;
  readonly serviceDetailHref?: string | null;
  readonly refImage: string | null;
  readonly refPrice: string | null;
  readonly refSize: string | null;
  readonly refColor: string | null;
  readonly refAddOns?: string | null;
  readonly selectedService: Service | null;
  readonly appointmentType: string;
  readonly purposeLabel?: string;
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
  readonly answers: Record<string, string>;
  readonly storeSettings: StoreSettings | null;
  readonly materialSource: 'own' | 'shop' | '';
  readonly materialDescription: string;
  readonly quantity?: string | null;
  readonly bookingError?: { message: string; isConflict?: boolean } | null;
  readonly onClearBookingError?: () => void;
  readonly handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

const PURPOSE_MAP: Record<string, { label: string; hint: string }> = {
  consultation: {
    label: 'Consultation / Order Discussion',
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
};

export default function BookingStep3Review({
  storeId,
  requestedItems,
  onUpdateQuantity,
  onRemoveItem,
  onOpenAddModal,
  onUpdateNotes,
  onRemoveCatalogDesign,
  refName,
  refDetailHref,
  serviceDetailHref,
  refImage,
  refPrice,
  refSize,
  refColor,
  refAddOns,
  selectedService,
  appointmentType,
  purposeLabel,
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
  answers,
  storeSettings,
  materialSource,
  materialDescription,
  quantity,
  bookingError,
  onClearBookingError,
  handleSubmit,
}: BookingStep3ReviewProps) {
  const answerEntries = Object.entries(answers).filter(([, v]) => v);
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

  const withLabel = appointmentType === 'other' && purposeLabel?.trim()
    ? { label: `Other — ${purposeLabel.trim()}`, hint: 'The store will go over this with you at your visit.' }
    : (appointmentType === 'alteration' && purposeLabel?.trim()
      ? { label: `Alteration / Repair · ${purposeLabel.trim()}`, hint: 'Bring this garment to the store for adjustment or repair.' }
      : basePurpose);

  const purposeInfo = isDiscussion
    ? {
        label: 'Consultation / Order Discussion',
        hint: 'Discuss your artwork, print placement, fabrics, quantities, and pricing with the store.',
      }
    : withLabel;

  return (
    <form id="booking-form" onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="mobile-h2 text-ink">Review</h2>

      {/* Booking Error & Conflict Alert Banner */}
      {bookingError && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <div className="flex-1 min-w-0">
              <h4 className="mobile-h4 font-medium text-amber-950">
                {bookingError.isConflict ? 'Appointment Conflict' : 'Unable to Complete Booking'}
              </h4>
              <p className="mobile-body-sm text-amber-900/90 font-normal mt-0.5 leading-relaxed">
                {bookingError.message}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-amber-500/20">
            <button
              type="button"
              onClick={() => {
                onClearBookingError?.();
                onEditSchedule();
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white mobile-caption font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Calendar size={13} /> Change Schedule / Time
            </button>
            {onClearBookingError && (
              <button
                type="button"
                onClick={onClearBookingError}
                className="px-2.5 py-1.5 mobile-caption text-amber-900 hover:text-amber-950 font-medium cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. Appointment Purpose */}
      <div className="p-4 bg-surface border border-line rounded-xl shadow-xs space-y-2">
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

      {/* 2. Multi-Item Appointment Requested Items */}
      {requestedItems && requestedItems.length > 0 ? (
        <BookingRequestedItemsList
          storeId={storeId ?? ''}
          items={requestedItems}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
          onOpenAddModal={onOpenAddModal}
          onUpdateNotes={onUpdateNotes}
          onRemoveCatalogDesign={onRemoveCatalogDesign}
          allowEdit={true}
        />
      ) : (
        <>
          {/* Design Reference (if entering from catalog item) */}
          {refName && (
            <div className="p-4 bg-surface border border-line rounded-xl shadow-xs space-y-3">
              <span className="mobile-overline text-taupe flex items-center gap-1.5">
                <Sparkles size={14} className="text-taupe" /> Design Reference
              </span>
              <div className="flex items-center gap-3">
                {refImage && (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-line shrink-0 bg-sunken">
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
                  {refColor && (
                    <div className="flex flex-wrap items-center gap-2 mt-1 mobile-caption text-ink-muted font-normal">
                      <span>{refColor}</span>
                    </div>
                  )}
                </div>
              </div>
              {refDetailHref && (
                <Link
                  href={refDetailHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-caption font-semibold text-taupe hover:underline flex items-center gap-1 w-fit"
                >
                  View full design details <ExternalLink size={11} />
                </Link>
              )}
            </div>
          )}

          {/* Selected Service (if entering from service or chosen in Step 2) */}
          {!refName && selectedService && (
            <div className="p-4 bg-surface border border-line rounded-xl shadow-xs space-y-2">
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
              {serviceDetailHref && (
                <Link
                  href={serviceDetailHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-caption font-semibold text-taupe hover:underline flex items-center gap-1 w-fit"
                >
                  View full service details <ExternalLink size={11} />
                </Link>
              )}
            </div>
          )}
        </>
      )}

      {/* 5. Branch */}
      {selectedBranch && (
        <div className="p-4 bg-surface border border-line rounded-xl shadow-xs space-y-2">
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
        <div className="p-4 bg-surface border border-line rounded-xl shadow-xs space-y-2">
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
        <div className="p-4 bg-surface border border-line rounded-xl shadow-xs space-y-2">
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
        <div className="bg-sunken border border-line rounded-xl shadow-xs p-4">
          <span className="mobile-overline text-taupe block mb-1.5">What to Bring</span>
          <p className="text-sm font-medium text-ink flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> Your fabric/sample
          </p>
        </div>
      )}

      {/* 9. Quantity (if applicable) */}
      {quantity && (!requestedItems || requestedItems.length <= 1) && (
        <div className="p-4 bg-surface border border-line rounded-xl shadow-xs space-y-1">
          <span className="mobile-overline text-taupe">Quantity</span>
          <p className="mobile-body-sm text-ink font-medium">{quantity} items/people</p>
        </div>
      )}

      {/* 10. Contact (read-only — authenticated) */}
      <div className="p-4 bg-surface border border-line rounded-xl shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="mobile-overline text-taupe">Contact</span>
          <button
            type="button"
            onClick={onEditSchedule}
            className="mobile-caption font-semibold text-taupe hover:underline flex items-center gap-1 cursor-pointer py-1"
          >
            <Edit2 size={12} /> Edit
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-taupe/15 border border-taupe/30 flex items-center justify-center text-taupe font-bold text-sm shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="mobile-h4 font-medium text-ink truncate">{user?.name || customer.name}</p>
              <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2 py-0.5 rounded shrink-0 flex items-center gap-1">
                <CheckCircle2 size={12} /> Verified
              </span>
            </div>
            <p className="mobile-caption text-ink-muted truncate mt-0.5 flex items-center gap-1 font-normal">
              <Mail size={12} className="text-ink-faint shrink-0" /> {user?.email || customer.email}
            </p>
            {(customer.phone || user?.phone) && (
              <p className="mobile-caption text-ink-muted truncate mt-0.5 flex items-center gap-1 font-normal">
                <Phone size={12} className="text-ink-faint shrink-0" /> {customer.phone || user?.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 11. Relevant Details (notes, owner questions) */}
      {(remarks.trim() || answerEntries.length > 0) && (
        <div className="p-4 bg-surface border border-line rounded-xl shadow-xs space-y-3">
          <span className="mobile-overline text-taupe">Relevant Details</span>
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

      <p className="mobile-caption text-ink-faint font-normal">
        Nothing is paid now. If the shop makes an order for you, the first payment comes after you accept the price.
      </p>
    </form>
  );
}
