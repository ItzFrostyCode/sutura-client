'use client';

import { useState } from 'react';
import { EMPTY_BODY_MEASUREMENTS, hasAnyMeasurement, type BodyMeasurements } from '@/lib/garmentMeasurements';

/**
 * The people on a group order, entered one at a time: a saved list plus one
 * editor (the draft). Shared by the customer's online order and the shop's
 * walk-in Create Job Order wizard so both record people the same way.
 */

/** How one person is sized: their own body measurements, a standard size, or measured at the shop. */
export type SizingMethod = 'body' | 'standard' | 'shop';

/** Optional; '' = not given. Helps the shop cut men's vs women's patterns. */
export type PersonGender = '' | 'male' | 'female';
export const GENDER_LABELS: Record<Exclude<PersonGender, ''>, string> = { male: 'Male', female: 'Female' };

export interface OrderPerson {
  id: number;
  name: string;
  gender: PersonGender;
  method: SizingMethod;
  /** Standard size (only when method is 'standard'). */
  size: string;
  values: BodyMeasurements;
  /** Set when the values came from a measurement profile the shop has on file. */
  profileId: number | null;
  /** Printed uniforms only (walk-in): name and number printed on the garment. */
  printName: string;
  number: string;
}
export type PersonDraft = Omit<OrderPerson, 'id'>;

export function blankDraft(method: SizingMethod = 'body', unit: 'in' | 'cm' = 'in'): PersonDraft {
  return { name: '', gender: '', method, size: '', values: { ...EMPTY_BODY_MEASUREMENTS, unit }, profileId: null, printName: '', number: '' };
}

interface Options {
  /** Standard sizes a person can pick. */
  sizes: string[];
  /** Order-wide garment type: decides which measurements count. */
  garmentType: string;
  /** A photo of the measurement list lets a body-measurement person be saved with no values. */
  hasSheets: boolean;
  max: number;
}

export function usePeopleList({ sizes, garmentType, hasSheets, max }: Options) {
  const [persons, setPersons] = useState<OrderPerson[]>([]);
  const [draft, setDraft] = useState<PersonDraft>(() => blankDraft());
  const [editingId, setEditingId] = useState<number | null>(null);

  const isValid = (p: PersonDraft) => {
    if (p.method === 'standard') return sizes.includes(p.size);
    if (p.method === 'shop') return true;
    return hasAnyMeasurement(p.values, garmentType) || p.profileId !== null || hasSheets;
  };

  const draftHasContent =
    // Gender carries over to the next person, so on its own it isn't "unsaved".
    draft.name.trim() !== '' ||
    draft.printName.trim() !== '' ||
    draft.number.trim() !== '' ||
    (draft.method === 'standard' && draft.size !== '') ||
    (draft.method === 'body' && (hasAnyMeasurement(draft.values, garmentType) || draft.profileId !== null));

  const updateDraft = (patch: Partial<PersonDraft>) => setDraft((prev) => ({ ...prev, ...patch }));
  const setDraftValue = (key: keyof BodyMeasurements, value: string) =>
    // Typing over a profile's values makes them this person's own.
    setDraft((prev) => ({ ...prev, profileId: key === 'unit' ? prev.profileId : null, values: { ...prev.values, [key]: value } }));
  /** Fills the editor from a saved measurement profile. */
  const fillDraft = (values: Partial<BodyMeasurements>, profileId: number, name?: string) =>
    setDraft((prev) => ({
      ...prev,
      name: prev.name || name || '',
      values: { ...EMPTY_BODY_MEASUREMENTS, unit: values.unit ?? prev.values.unit, ...values },
      profileId,
    }));
  const copyDraftFromLast = () => {
    const source = [...persons].reverse().find((p) => p.method === 'body');
    if (source) setDraft((prev) => ({ ...prev, values: { ...source.values }, profileId: null }));
  };

  /** Saves the editor into the list. Returns an error message when it can't. */
  const saveDraft = (): string | null => {
    if (!isValid(draft)) {
      return draft.method === 'standard'
        ? 'Pick a size first.'
        : 'Enter at least one measurement, or attach a photo of the measurement list.';
    }
    if (editingId === null && persons.length >= max) return `An order can list up to ${max} people.`;
    const entry: PersonDraft = {
      ...draft,
      name: draft.name.trim(),
      printName: draft.printName.trim(),
      number: draft.number.trim(),
      size: draft.method === 'standard' ? draft.size : '',
    };
    if (editingId !== null) setPersons((prev) => prev.map((p) => (p.id === editingId ? { ...entry, id: editingId } : p)));
    else setPersons((prev) => [...prev, { ...entry, id: Date.now() }]);
    setEditingId(null);
    // The next person starts with the same gender, method and unit; name and
    // size / measurements start empty so nothing is copied by accident.
    setDraft({ ...blankDraft(draft.method, draft.values.unit), gender: draft.gender });
    return null;
  };

  const editPerson = (id: number) => {
    const target = persons.find((p) => p.id === id);
    if (!target) return;
    setEditingId(id);
    setDraft({
      name: target.name,
      gender: target.gender,
      method: target.method,
      size: target.size,
      values: { ...target.values },
      profileId: target.profileId,
      printName: target.printName,
      number: target.number,
    });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setDraft(blankDraft(draft.method, draft.values.unit));
  };
  const duplicatePerson = (id: number) => {
    const target = persons.find((p) => p.id === id);
    if (!target || persons.length >= max) return;
    setPersons((prev) => [
      ...prev,
      { ...target, id: Date.now(), name: target.name ? `${target.name} (copy)` : '', number: '', values: { ...target.values } },
    ]);
  };
  const removePerson = (id: number) => {
    setPersons((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) cancelEdit();
  };

  return {
    persons,
    draft,
    editingId,
    draftHasContent,
    /** The editor holds a complete person (used as-is by a one-person order). */
    draftValid: isValid(draft),
    max,
    updateDraft,
    setDraftValue,
    fillDraft,
    copyDraftFromLast,
    saveDraft,
    editPerson,
    cancelEdit,
    duplicatePerson,
    removePerson,
  };
}

export type PeopleListState = ReturnType<typeof usePeopleList>;
