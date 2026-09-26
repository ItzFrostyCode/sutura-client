'use client';

import { FormEvent } from 'react';
import { CheckCircle2, Mail, Phone, Shirt, StickyNote, Wallet } from 'lucide-react';
import BookingReferenceSummary from './review/BookingReferenceSummary';
import BookingScheduleSummary from './review/BookingScheduleSummary';
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
  readonly handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

// Review only — every field here was already collected in Steps 1-2. No new
// inputs, nothing asked twice; each card just links back ("Change"/"Edit")
// to the step that owns that data if something needs correcting.
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
  handleSubmit,
}: BookingStep3ReviewProps) {
  const answerEntries = Object.entries(answers).filter(([, v]) => v);
  const hasFittingFee = Number(storeSettings?.fitting_fee) > 0;

  return (
    <form id="booking-form" onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="mobile-h2 text-ink">Review</h2>

      {/* 1. Design/Service Context */}
      <BookingReferenceSummary
        refName={refName}
        refImage={refImage}
        refPrice={refPrice}
        refSize={refSize}
        refColor={refColor}
        selectedService={selectedService}
        packageInfo={packageInfo}
        appointmentType={appointmentType}
        onEditSchedule={onEditPurpose}
      />

      {/* 2. Schedule Card */}
      <BookingScheduleSummary
        date={date}
        time={time}
        selectedBranch={selectedBranch}
        appointmentType={appointmentType}
        formatDatePreview={formatDatePreview}
        formatTimePreview={formatTimePreview}
        onEditSchedule={onEditSchedule}
      />

      {/* 3. Contact (read-only — already authenticated) */}
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

      {/* 4. Material, order reference, notes, and owner questions — only
          shown if answered */}
      {(materialSource || orderReference.trim() || remarks.trim() || answerEntries.length > 0) && (
        <div className="p-4 bg-surface border border-line rounded-none space-y-3">
          {orderReference.trim() && (
            <div className="flex items-start gap-2.5">
              <StickyNote size={15} className="text-taupe shrink-0 mt-0.5" />
              <p className="mobile-body-sm text-ink-body font-normal">
                Existing order: {orderReference.trim()}
              </p>
            </div>
          )}
          {materialSource && (
            <div className="flex items-start gap-2.5">
              <Shirt size={15} className="text-taupe shrink-0 mt-0.5" />
              <p className="mobile-body-sm text-ink-body font-normal">
                {materialSource === 'own'
                  ? `I'll bring my own fabric/sample${materialDescription.trim() ? ` — ${materialDescription.trim()}` : ''}`
                  : "I'll use the shop's material"}
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

      {/* 5. What to Bring */}
      {materialSource === 'own' && (
        <div className="bg-sunken border border-line rounded-none p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-faint mb-2">What to Bring</p>
          <p className="text-sm text-ink flex items-center gap-2">
            <CheckCircle2 size={14} className="text-sage shrink-0" /> Your fabric/sample
          </p>
        </div>
      )}

      {/* 6. Payment (read-only) */}
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
