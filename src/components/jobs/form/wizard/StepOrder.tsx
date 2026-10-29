import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { BTN } from '@/components/shared/plainForm';
import { garmentLabel, categoryOfGarment, GARMENT_CATEGORIES } from '@/lib/garmentTaxonomy';
import FormStep from '../FormStep';
import WhatStep from '../WhatStep';
import ExtraServices, { newExtraLine } from '../ExtraServices';
import DesignAndConsultation from '../DesignAndConsultation';
import PriceNow from '../PriceNow';
import ReferenceNotes from '../ReferenceNotes';
import AssignStaffSection from '../AssignStaffSection';
import type { JobCreateForm } from '../useJobCreateForm';

/** Step 2: what is being made: the service, its design, garment, fabric and how many pieces; then style, photos and who works on it. */
export default function StepOrder({ form, canCollectMoney }: Readonly<{ form: JobCreateForm; canCollectMoney: boolean }>) {
  const { store, service, formData, isRepair } = form;
  const category = categoryOfGarment(formData.garment_type);
  const jobTerms = [garmentLabel(formData.garment_type) ?? formData.garment_type, category ? GARMENT_CATEGORIES[category].label : '', service?.name ?? ''].filter(Boolean);
  // The optional parts stay folded until they are needed, or already have something in them.
  const [more, setMore] = useState<boolean | null>(null);
  const filled = form.extras.length > 0 || Boolean(formData.consultation_notes.trim() || formData.notes.trim() || form.referenceLink.trim()) || form.referenceImages.length > 0 || Object.values(form.assignees).some(Boolean);
  const showMore = more ?? filled;
  return (
    <div className="space-y-6">
      <FormStep title="What is being made" hint="Pick the service. A design is optional.">
        <WhatStep form={form} />
      </FormStep>
      {service && (
        <>
          <FormStep title="Price" hint="So you know the cost before the last step.">
            <PriceNow form={form} />
          </FormStep>
          <button
            type="button" onClick={() => setMore(!showMore)} aria-expanded={showMore}
            className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 text-left text-sm font-medium text-espresso hover:bg-espresso/[0.03] sm:px-6"
          >
            <span>More options <span className="font-normal text-espresso/60">· another service, style notes, photos, who works on it</span></span>
            <ChevronDown size={18} className={`shrink-0 transition-transform ${showMore ? 'rotate-180' : ''}`} />
          </button>
          {showMore && (
            <>
          <FormStep
            title="Another service?"
            hint="For the same customer. Each one becomes its own order with its own price, deposit and due date."
            action={<button type="button" onClick={() => form.setExtras((cur) => [...cur, newExtraLine()])} className={BTN}><Plus size={16} />Add another service</button>}
          >
            {form.extras.length === 0 ? <p className="text-sm text-espresso/60">None added.</p> : <ExtraServices form={form} />}
          </FormStep>
          <FormStep title="Style" hint="How it should look.">
            <DesignAndConsultation form={form} />
          </FormStep>
          <FormStep title="Photos and notes">
            <ReferenceNotes
              storeId={store?.id} images={form.referenceImages} onImages={form.setReferenceImages} link={form.referenceLink}
              onLink={form.setReferenceLink} notes={formData.notes} onNotes={(v) => form.set({ notes: v })}
              photoLabel={isRepair ? 'Photo of the garment as received' : 'Photo of what they want'}
              sources={{
                ...Object.fromEntries((form.design?.images ?? []).map((i) => [i.image_url, 'From the design'])),
                ...Object.fromEntries((form.appointment?.reference_images ?? []).map((u) => [u, 'Sent with the booking'])),
              }}
            />
          </FormStep>
          {canCollectMoney && store && (
            <FormStep title="Who works on it" hint="They are told right away. Staff with a matching skill are listed first.">
              <AssignStaffSection storeId={store.id} branchId={form.branchId} assignees={form.assignees} setAssignees={form.setAssignees} jobTerms={jobTerms} />
            </FormStep>
          )}
            </>
          )}
        </>
      )}
    </div>
  );
}
