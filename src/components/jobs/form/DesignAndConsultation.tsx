import DesignSourceField from '@/components/shared/DesignSourceField';
import { FIELD, LABEL } from './FormStep';
import type { JobCreateForm } from './useJobCreateForm';

/**
 * The design's source and the style notes. A design chosen from the shop's own list already says where it comes from, so the question
 * only appears when no design is chosen (the customer's own, to be redone, or not decided). Both stay on the order and its work ticket.
 */
export default function DesignAndConsultation({ form }: Readonly<{ form: JobCreateForm }>) {
  const { formData, set } = form;
  return (
    <div className="space-y-4">
      {!form.design && (
        <DesignSourceField
          source={formData.design_source === 'shop_design' ? null : formData.design_source} link={formData.design_link} exclude={['shop_design']}
          legend="No shop design is chosen. Whose design is it?"
          onChange={(p) => set({ design_source: p.design_source, design_link: p.design_link ?? '' })}
        />
      )}
      <div>
        <label htmlFor="consultation_notes" className={LABEL}>Style notes <span className="font-normal text-espresso/60">(optional)</span></label>
        <textarea
          id="consultation_notes" rows={4} maxLength={6000} value={formData.consultation_notes}
          onChange={(e) => set({ consultation_notes: e.target.value })}
          placeholder="Collar, sleeves, logo or embroidery position, colours… anything about how it should look"
          className={`${FIELD} h-auto py-3`}
        />
        <p className="mt-1 text-sm text-espresso/60">Saved on the order so the people who make it can read it. When the order comes from a consultation, what was noted there is already filled in.</p>
      </div>
    </div>
  );
}
