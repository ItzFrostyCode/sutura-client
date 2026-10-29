import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { JobCreateForm } from '../useJobCreateForm';
import type { JobWizard } from './useJobWizard';

/** What is kept of an unfinished New Job Order: everything typed, and the step it was on. */
interface Draft {
  savedAt: number;
  step: number;
  customer: string;
  data: Record<string, unknown>;
}

const MAX_AGE = 2 * 24 * 60 * 60 * 1000;
const keyOf = (storeId: number) => `sutura.jobDraft.${storeId}`;

const read = (storeId: number): Draft | null => {
  try {
    const raw = localStorage.getItem(keyOf(storeId));
    const draft = raw ? (JSON.parse(raw) as Draft) : null;
    return draft && Date.now() - draft.savedAt < MAX_AGE ? draft : null;
  } catch { return null; }
};

const remove = (storeId: number | undefined) => {
  if (!storeId) return;
  try { localStorage.removeItem(keyOf(storeId)); } catch { /* nothing saved */ }
};

/** Set once the order was created: a save still waiting on its timer must not bring the draft back. Cleared when a new form opens. */
let created = false;

/** The order was created: nothing left to resume, and nothing more is saved for this form. */
export function clearJobDraft(storeId: number | undefined) {
  created = true;
  remove(storeId);
}

/**
 * Keeps the New Job Order as a draft on this device while it is filled in, so leaving the page (Cancel, the arrow, the browser's
 * Back, a refresh) never loses what was typed. Coming back offers to continue it or start over; nothing is restored on its own.
 * Orders opened from a booking, a customer or a design arrive pre-filled and are not drafted.
 */
export function useJobDraft(form: JobCreateForm, wizard: JobWizard) {
  const prefilled = useSearchParams().size > 0;
  const storeId = form.store?.id;
  const [offer, setOffer] = useState<Draft | null>(null);
  const [checked, setChecked] = useState(false);

  // A fresh form is open: whatever happened to the last one no longer applies.
  useEffect(() => { created = false; }, []);

  useEffect(() => {
    if (!storeId || prefilled || checked) return;
    setChecked(true);
    setOffer(read(storeId));
  }, [storeId, prefilled, checked]);

  const data = {
    formData: form.formData, garmentCategory: form.garmentCategory, catalogItemId: form.design ? String(form.design.id) : '', extras: form.extras,
    standardSize: form.standardSize, standardSizeBottom: form.standardSizeBottom, customFieldValues: form.customFieldValues, bulkChosen: form.bulkChosen, teamName: form.teamName,
    roster: form.roster, rosterColumns: form.rosterColumns, damageNotes: form.damageNotes, referenceImages: form.referenceImages,
    referenceLink: form.referenceLink, assignees: form.assignees, measurementMode: form.measurementMode, addMeasurements: form.addMeasurements,
    inlineMeasurements: form.inlineMeasurements,
  };

  // Saved a moment after the last change. Nothing is written until a customer is chosen, while the offer is still open, or once the order exists.
  useEffect(() => {
    if (!storeId || prefilled || !checked || offer || created || !form.formData.customer_id) return;
    const t = setTimeout(() => {
      if (created) return;
      try { localStorage.setItem(keyOf(storeId), JSON.stringify({ savedAt: Date.now(), step: wizard.step, customer: form.formData.customer_id, data } satisfies Draft)); } catch { /* storage full or blocked */ }
    }, 500);
    return () => clearTimeout(t);
  });

  const resume = () => {
    if (!offer) return;
    const d = offer.data as typeof data;
    form.set(d.formData);
    form.setGarmentCategory(d.garmentCategory);
    form.setCatalogItemId(d.catalogItemId);
    form.setExtras(d.extras);
    form.setStandardSize(d.standardSize);
    form.setStandardSizeBottom(d.standardSizeBottom ?? 'Custom Measurements');
    form.setCustomFieldValues(d.customFieldValues);
    form.setBulkChosen(d.bulkChosen);
    form.setTeamName(d.teamName);
    form.setRoster(d.roster);
    form.setRosterColumns(d.rosterColumns);
    form.setDamageNotes(d.damageNotes);
    form.setReferenceImages(d.referenceImages);
    form.setReferenceLink(d.referenceLink);
    form.setAssignees(d.assignees);
    form.setMeasurementMode(d.measurementMode);
    form.setAddMeasurements(d.addMeasurements);
    form.setInlineMeasurements(d.inlineMeasurements);
    wizard.restore(offer.step);
    setOffer(null);
  };

  // Start over throws the old draft away and keeps the form as it is (a blank order); saving carries on for the new one.
  const startOver = () => { remove(storeId); setOffer(null); };

  // Choosing a customer while the offer is still showing means a new order was started: the old draft is dropped, not left to come back.
  useEffect(() => {
    if (offer && form.formData.customer_id) startOver();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer, form.formData.customer_id]);

  return { offer, resume, startOver, customerName: offer ? form.customers.find((c) => String(c.id) === offer.customer)?.name : undefined };
}
