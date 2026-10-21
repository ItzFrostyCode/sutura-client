'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Copy, Plus, Trash2 } from 'lucide-react';
import { BTN_SM, PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';

interface MeasurementProfile {
  id?: number;
  profile_name: string;
  version: number;
  isNew?: boolean;
}

interface SubjectProfileBarProps {
  persons: MeasurementProfile[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  onAddPerson: () => void;
  onRemovePerson: (index: number) => void;
  onProfileNameChange: (newName: string) => void;
  customerName: string;
  /** This person's style (polo, V-neck…). A drop-down when the service lists its styles, else a free box. */
  style?: string;
  onStyleChange?: (style: string) => void;
  styleOptions?: string[];
  /** Fill this person with the previous person's measurements (and style); the name stays. */
  onCopyPrevious?: () => void;
}

/**
 * Who is being measured. One selector (with Previous / Next) instead of a button per person, so 5 or 50 people stay
 * tidy. Each person has their own name, style and measurements; the design is the same for everyone.
 */
export default function SubjectProfileBar({ persons, activeIndex, onSelectIndex, onAddPerson, onRemovePerson, onProfileNameChange, customerName, style = '', onStyleChange, styleOptions, onCopyPrevious }: SubjectProfileBarProps) {
  const current = persons[activeIndex] || persons[0];
  const nameOf = (p: MeasurementProfile, idx: number) => p.profile_name.trim() || (idx === 0 ? customerName : `Person ${idx + 1}`);
  const fallback = nameOf({ ...current, profile_name: '' }, activeIndex);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="person-select" className={PLAIN_LABEL}>Person being measured <span className="font-normal text-espresso/60">({activeIndex + 1} of {persons.length})</span></label>
        <div className="flex flex-wrap gap-2">
          <select id="person-select" value={activeIndex} onChange={(e) => onSelectIndex(Number(e.target.value))} className={`${PLAIN_FIELD} min-w-0 flex-1 basis-56`}>
            {persons.map((p, idx) => <option key={idx} value={idx}>{idx + 1}. {nameOf(p, idx)}{idx === 0 ? ' (customer)' : ''}</option>)}
          </select>
          <button type="button" aria-label="Previous person" disabled={activeIndex === 0} onClick={() => onSelectIndex(activeIndex - 1)} className={`${BTN_SM} h-11 w-11 px-0`}><ChevronLeft size={18} /></button>
          <button type="button" aria-label="Next person" disabled={activeIndex >= persons.length - 1} onClick={() => onSelectIndex(activeIndex + 1)} className={`${BTN_SM} h-11 w-11 px-0`}><ChevronRight size={18} /></button>
          <button type="button" onClick={onAddPerson} className={`${BTN_SM} h-11 px-4`}><Plus size={15} />Add person</button>
        </div>
      </div>
      {current && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="active-profile-name-input" className={PLAIN_LABEL}>Name</label>
              <input id="active-profile-name-input" type="text" value={current.profile_name} onChange={(e) => onProfileNameChange(e.target.value)} placeholder={fallback} className={PLAIN_FIELD} />
            </div>
            {onStyleChange && (
              <div>
                <label htmlFor="active-profile-style" className={PLAIN_LABEL}>Style</label>
                {styleOptions && styleOptions.length > 0 ? (
                  <select id="active-profile-style" value={style} onChange={(e) => onStyleChange(e.target.value)} className={PLAIN_FIELD}>
                    <option value="">No style yet</option>
                    {styleOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input id="active-profile-style" type="text" value={style} onChange={(e) => onStyleChange(e.target.value)} placeholder="e.g. Polo, V-neck, with jacket" className={PLAIN_FIELD} />
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-espresso/60">{current.id ? `Saved profile, version ${current.version}.` : 'Not saved yet. It is saved when the order is created.'} Leave the name empty to use “{fallback}”.</p>
            <div className="flex flex-wrap gap-2">
              {onCopyPrevious && activeIndex > 0 && <button type="button" onClick={onCopyPrevious} className={`${BTN_SM} h-11 px-4`}><Copy size={14} />Copy from previous person</button>}
              {persons.length > 1 && <button type="button" onClick={() => onRemovePerson(activeIndex)} className={`${BTN_SM} h-11 px-4`}><Trash2 size={14} />Remove this person</button>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
