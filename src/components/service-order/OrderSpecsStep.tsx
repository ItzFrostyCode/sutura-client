'use client';

import Image from 'next/image';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import BookingServiceQuestions from '@/components/booking/steps/BookingServiceQuestions';
import BookingMaterialSelector from '@/components/booking/steps/schedule/BookingMaterialSelector';
import type { Service as BookingService } from '@/components/booking/types';
import type { ServiceOrderState } from './useServiceOrder';
import { ChoiceCard, Em, FIELD, FitTip, SectionLabel, StepIntro, peso } from './orderUi';

// Step 3 — Order Specifications, like the walk-in form's: the service and
// option, size, fabric source, the shop's questions, references and notes.
export default function OrderSpecsStep({ o }: Readonly<{ o: ServiceOrderState }>) {
  const service = o.service!;
  const fields = (service.custom_fields ?? []) as unknown as NonNullable<BookingService['custom_fields']>;

  return (
    <div className="space-y-7">
      <StepIntro title="Order Specifications" text="Style, fabric and anything the shop should follow." />

      <div className="flex items-center gap-3.5 bg-surface border border-line rounded-lg p-3">
        <div className="relative w-16 h-16 shrink-0 rounded-md bg-sunken overflow-hidden">
          {service.image_url && <Image src={getMediaUrl(service.image_url)} alt="" fill sizes="64px" className="object-cover" />}
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-ink truncate">{service.name}</p>
          {o.pkg ? (
            <>
              <p className="text-sm text-ink-muted">{o.unitPrice > 0 ? `${peso(o.unitPrice)} for the set` : 'Price confirmed by the shop'}</p>
              <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">Includes {o.pkg.services.map((s) => s.name).join(', ')}</p>
            </>
          ) : (
            <p className="text-sm text-ink-muted">{o.unitPrice > 0 ? `${peso(o.unitPrice)} each` : 'Price confirmed by the shop'}</p>
          )}
        </div>
      </div>

      {o.pricing.length > 1 && (
        <fieldset className="space-y-2.5">
          <SectionLabel as="legend">Option</SectionLabel>
          <div className="grid grid-cols-1 gap-2.5" role="radiogroup" aria-label="Option">
            {o.pricing.map((p) => (
              <ChoiceCard
                key={p.id}
                selected={o.pricingId === p.id}
                onSelect={() => o.setPricingId(p.id)}
                label={p.label}
                trailing={p.amount !== null && p.amount !== '' ? peso(Number(p.amount)) : 'Quoted'}
              />
            ))}
          </div>
        </fieldset>
      )}

      {/* Each person's standard size is picked on the Measurements step. */}
      <BookingMaterialSelector
        materialSource={o.materialSource}
        setMaterialSource={o.setMaterialSource}
        materialDescription={o.materialDescription}
        setMaterialDescription={o.setMaterialDescription}
        rounded
        ownFabricNote={
          <FitTip title="Bringing your own fabric?">
            Drop off your fabric at the shop <Em>within 2 days after placing your order</Em>.{' '}
            {o.fabricDeductionEach > 0
              ? <>This shop takes <Em>{peso(o.fabricDeductionEach)} off per piece</Em> for your own fabric; it&apos;s already in the total. The shop may adjust it after checking the fabric.</>
              : 'The shop checks it and adjusts the price if needed, so the total shown is an estimate.'}
          </FitTip>
        }
      />

      {fields.some((f) => f.label?.trim()) && (
        <div className="space-y-2.5">
          <SectionLabel as="p">A few questions from the shop</SectionLabel>
          <BookingServiceQuestions fields={fields} answers={o.answers} setAnswers={o.setAnswers} rounded />
        </div>
      )}

      <div className="space-y-2.5">
        <SectionLabel as="p">
          Reference photos <span className="text-ink-faint font-normal">(Optional, up to {o.maxPhotos})</span>
        </SectionLabel>
        <p className="mobile-caption text-ink-muted -mt-1">A sample design, your old uniform, a patch layout — anything that shows what you want.</p>
        {o.designName && o.designImage && o.photos.includes(o.designImage) && (
          <p className="mobile-caption font-semibold text-taupe">Design photo attached: {o.designName}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {o.photos.map((url) => (
            <div key={url} className="relative w-20 h-20 rounded-lg border border-line overflow-hidden bg-sunken">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getMediaUrl(url)} alt="Reference" className="w-full h-full object-cover" />
              <button type="button" onClick={() => o.setPhotos((p) => p.filter((u) => u !== url))} aria-label="Remove photo" className="absolute top-1 right-1 w-6 h-6 rounded-full bg-ink/75 text-white flex items-center justify-center">
                <X size={12} />
              </button>
            </div>
          ))}
          {o.photos.length < o.maxPhotos && (
            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-line flex flex-col items-center justify-center gap-1 text-ink-faint cursor-pointer hover:border-taupe/50 hover:text-taupe transition-colors focus-within:border-taupe">
              {o.uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
              <span className="text-[11px] font-medium">{o.uploading ? 'Uploading' : 'Add'}</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={o.uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void o.uploadPhoto(file);
                  e.target.value = '';
                }}
              />
            </label>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        <SectionLabel htmlFor="order-link">
          Reference link <span className="text-ink-faint font-normal">(Optional)</span>
        </SectionLabel>
        <input id="order-link" type="url" inputMode="url" maxLength={500} value={o.referenceLink} onChange={(e) => o.setReferenceLink(e.target.value)} placeholder="https://" className={FIELD} />
      </div>

      <div className="space-y-2.5">
        <SectionLabel htmlFor="order-notes">
          Notes for the shop <span className="text-ink-faint font-normal">(Optional)</span>
        </SectionLabel>
        <textarea
          id="order-notes"
          rows={3}
          maxLength={2000}
          value={o.notes}
          onChange={(e) => o.setNotes(e.target.value)}
          placeholder="Name tag spelling, patches, sleeve length…"
          className={`${FIELD} h-auto resize-none py-3`}
        />
      </div>
    </div>
  );
}
