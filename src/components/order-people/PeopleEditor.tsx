'use client';

import React, { useRef, useState } from 'react';
import { Check, Copy, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Em, FIELD, FitTip } from '@/components/service-order/orderUi';
import { MEASUREMENT_FIELDS, measurementFieldsFor, measurementKeysFor } from '@/lib/garmentMeasurements';
import type { OrderPerson, PeopleListState, PersonDraft, SizingMethod } from './usePeopleList';

// The people list + one-person editor, shared by the customer's online order
// and the shop's walk-in Create Job Order wizard.

const INPUT = `${FIELD.replace('px-4', 'px-3')} tabular-nums`;
const TEXT_INPUT = FIELD.replace('px-4', 'px-3');
/** Rows shown before "View all". */
const LIST_LIMIT = 6;

const METHODS: { value: SizingMethod; label: string }[] = [
  { value: 'body', label: 'Body measurement' },
  { value: 'standard', label: 'Standard size' },
  { value: 'shop', label: 'Shop measures' },
];

/** Short description of how a saved person is sized, for their list row. */
export function sizingSummary(p: OrderPerson, garmentType: string): string {
  if (p.method === 'standard') return `Standard: ${p.size}`;
  if (p.method === 'shop') return 'Measured at the shop';
  const filled = measurementFieldsFor(garmentType)
    .map((f) => p.values[f.key].trim())
    .filter(Boolean);
  if (filled.length === 0) return p.profileId !== null ? 'Measurements on file' : 'From the photo';
  return `${filled.slice(0, 3).join(' · ')} ${p.values.unit}${filled.length > 3 ? ' …' : ''}`;
}

/** How many saved people have body measurements the current garment type won't send. */
export function droppedMeasurementCount(persons: OrderPerson[], garmentType: string): number {
  const asked = new Set(measurementKeysFor(garmentType));
  return persons.filter(
    (p) => p.method === 'body' && MEASUREMENT_FIELDS.some((f) => !asked.has(f.key) && p.values[f.key].trim() !== '')
  ).length;
}

/** "3 standard size · 2 body measurement · 1 measured at shop" */
export function peopleBreakdown(persons: OrderPerson[]): string {
  const count = (m: SizingMethod) => persons.filter((p) => p.method === m).length;
  return [
    count('standard') > 0 && `${count('standard')} standard size`,
    count('body') > 0 && `${count('body')} body measurement`,
    count('shop') > 0 && `${count('shop')} measured at shop`,
  ].filter(Boolean).join(' · ');
}

function UnitToggle({ unit, onChange }: Readonly<{ unit: 'in' | 'cm'; onChange: (u: 'in' | 'cm') => void }>) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-line shrink-0" role="radiogroup" aria-label="Unit">
      {(['in', 'cm'] as const).map((u) => (
        <button
          key={u}
          type="button"
          role="radio"
          aria-checked={unit === u}
          onClick={() => onChange(u)}
          className={`h-8 px-2.5 text-xs font-semibold transition-colors ${unit === u ? 'bg-taupe text-white' : 'text-ink-muted hover:text-ink'}`}
        >
          {u}
        </button>
      ))}
    </div>
  );
}

function PersonRow({ p, index, people, garmentType }: Readonly<{ p: OrderPerson; index: number; people: PeopleListState; garmentType: string }>) {
  const label = p.name || `Person ${index}`;
  const extra = [p.number && `#${p.number}`, p.printName].filter(Boolean).join(' ');
  return (
    <li className={`flex items-center gap-2.5 px-3.5 py-2 min-h-14 transition-colors ${people.editingId === p.id ? 'bg-taupe/10' : ''}`}>
      <span className="w-7 h-7 shrink-0 rounded-md bg-canvas border border-line text-[11px] font-bold text-taupe flex items-center justify-center tabular-nums">
        {index}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm font-semibold ${p.name ? 'text-ink' : 'text-ink-muted italic'}`}>
          {label}
          {extra && <span className="ml-1.5 font-normal not-italic text-ink-muted">{extra}</span>}
        </span>
        <span className="block truncate mobile-caption text-ink-muted tabular-nums">{sizingSummary(p, garmentType)}</span>
      </span>
      <span className="flex items-center shrink-0">
        <button type="button" onClick={() => people.editPerson(p.id)} aria-label={`Edit ${label}`} className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-muted hover:text-taupe hover:bg-sunken/60">
          <Pencil size={15} />
        </button>
        <button type="button" onClick={() => people.duplicatePerson(p.id)} aria-label={`Duplicate ${label}`} className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-muted hover:text-taupe hover:bg-sunken/60">
          <Copy size={15} />
        </button>
        <button type="button" onClick={() => people.removePerson(p.id)} aria-label={`Remove ${label}`} className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-muted hover:text-danger hover:bg-danger/5">
          <Trash2 size={15} />
        </button>
      </span>
    </li>
  );
}

export function PeopleList({ people, garmentType }: Readonly<{ people: PeopleListState; garmentType: string }>) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const total = people.persons.length;
  const searchable = total > 5;
  const q = searchable ? query.trim().toLowerCase() : '';

  const indexed = people.persons.map((p, i) => ({ p, index: i + 1 }));
  const matches = q
    ? indexed.filter(({ p, index }) =>
        `${p.name || `person ${index}`} ${p.printName} ${p.number} ${sizingSummary(p, garmentType)}`.toLowerCase().includes(q))
    : indexed;
  const sliced = !expanded && !q && matches.length > LIST_LIMIT;
  const visible = sliced ? matches.slice(0, LIST_LIMIT) : matches;

  if (total === 0) return null;

  return (
    <section aria-label="People on this order" className="bg-surface border border-line rounded-lg overflow-hidden">
      <div className="px-3.5 py-2.5 bg-canvas border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink flex items-center gap-2">
          People on this order
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-taupe text-white tabular-nums">{total}</span>
        </p>
        {searchable && (
          <div className="relative sm:w-56">
            <Search size={14} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or size"
              aria-label="Search people"
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-line bg-surface text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-taupe"
            />
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="px-4 py-4 text-center mobile-caption text-ink-muted">No one matches &ldquo;{query.trim()}&rdquo;.</p>
      ) : (
        <ul className="divide-y divide-line/70">
          {visible.map(({ p, index }) => (
            <PersonRow key={p.id} p={p} index={index} people={people} garmentType={garmentType} />
          ))}
        </ul>
      )}

      {!q && matches.length > LIST_LIMIT && (
        <div className="px-3.5 py-2 bg-canvas border-t border-line flex items-center justify-between gap-2">
          <span className="mobile-caption text-ink-muted tabular-nums">
            {expanded ? `Showing all ${matches.length}` : `Showing ${visible.length} of ${matches.length}`}
          </span>
          <button type="button" onClick={() => setExpanded((v) => !v)} className="h-9 px-2 text-xs font-semibold text-taupe hover:underline">
            {expanded ? 'Show less' : `View all (${matches.length})`}
          </button>
        </div>
      )}
    </section>
  );
}

interface SavedProfile {
  id: number;
  label: string;
}

function BodyFields({
  people,
  d,
  garmentType,
  savedProfiles,
  onPickProfile,
}: Readonly<{ people: PeopleListState; d: PersonDraft; garmentType: string; savedProfiles: SavedProfile[]; onPickProfile?: (id: number) => void }>) {
  const fields = measurementFieldsFor(garmentType);
  const canCopy = people.persons.some((p) => p.method === 'body');
  return (
    <div className="space-y-3">
      {savedProfiles.length > 0 && onPickProfile && (
        <div className="space-y-1.5">
          <label htmlFor="person-profile" className="block mobile-caption font-semibold text-ink-body">Measurements this shop has on file</label>
          <select
            id="person-profile"
            value={d.profileId ?? ''}
            onChange={(e) => e.target.value && onPickProfile(Number(e.target.value))}
            className={INPUT}
          >
            <option value="">Enter new measurements</option>
            {savedProfiles.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <p className="mobile-caption font-semibold text-ink-body">
          Measurements <span className="text-ink-faint font-normal">({d.values.unit === 'in' ? 'inches' : 'centimeters'})</span>
        </p>
        <div className="flex items-center gap-2">
          {canCopy && (
            <button
              type="button"
              onClick={people.copyDraftFromLast}
              className="h-8 px-2.5 rounded-lg border border-line bg-surface text-xs font-semibold text-taupe hover:border-taupe/50"
            >
              Copy from last saved
            </button>
          )}
          <UnitToggle unit={d.values.unit} onChange={(u) => people.setDraftValue('unit', u)} />
        </div>
      </div>

      <FitTip title="Measurement Tip">
        {d.values.unit === 'cm' ? (
          <>To ensure a comfortable fit, <Em>add 7.5 cm</Em> (3 inches) to each actual body measurement.</>
        ) : (
          <>To ensure a comfortable fit, <Em>add 3 inches</Em> to each actual body measurement. (Example: a 38-inch chest is entered as 41.)</>
        )}
      </FitTip>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {fields.map((f) => (
          <div key={f.key}>
            <label htmlFor={`m-${f.key}`} className="block mobile-caption mb-1 font-semibold text-ink-body">{f.label}</label>
            <div className="relative">
              <input
                id={`m-${f.key}`}
                type="number"
                inputMode="decimal"
                step="0.25"
                min="0"
                value={d.values[f.key]}
                onChange={(e) => people.setDraftValue(f.key, e.target.value)}
                placeholder={f.hint}
                className={`${INPUT} pr-9`}
              />
              <span aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-faint pointer-events-none">{d.values.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StandardSizes({ people, d, sizes, chart }: Readonly<{ people: PeopleListState; d: PersonDraft; sizes: string[]; chart?: React.ReactNode }>) {
  const [showChart, setShowChart] = useState(true);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="mobile-caption font-semibold text-ink-body">Choose a size</p>
        <p className={`mobile-caption ${d.size ? 'font-semibold text-taupe' : 'text-ink-muted'}`}>{d.size ? `Selected: ${d.size}` : 'Required'}</p>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2" role="radiogroup" aria-label="Standard size">
        {sizes.map((s) => {
          const on = d.size === s;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => people.updateDraft({ size: s })}
              className={`h-11 px-2 rounded-lg border text-sm font-semibold transition-colors ${
                on ? 'border-taupe bg-taupe text-white' : 'border-line bg-surface text-ink hover:border-taupe/50'
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>
      <FitTip title="Sizing Guide">
        For the best fit, please order <Em>one size larger</Em> than your usual size.
      </FitTip>
      {chart && (
        <div className="bg-canvas border border-line rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">This shop&apos;s size chart</p>
            <button type="button" onClick={() => setShowChart((v) => !v)} aria-expanded={showChart} className="h-8 px-1 text-xs font-semibold text-taupe hover:underline">
              {showChart ? 'Hide chart' : 'Show chart'}
            </button>
          </div>
          {showChart && chart}
        </div>
      )}
    </div>
  );
}

/**
 * How one person is sized: Body measurement / Standard size / Shop measures,
 * then that method's fields. Used inside the list's person editor and, on its
 * own, by a one-person (individual) order.
 */
export function SizingFields({
  people,
  sizes,
  garmentType,
  savedProfiles = [],
  onPickProfile,
  chart,
  onMethodChange,
  shopNote = 'The shop takes this person’s measurements at a fitting visit.',
}: Readonly<{
  people: PeopleListState;
  sizes: string[];
  garmentType: string;
  savedProfiles?: SavedProfile[];
  onPickProfile?: (id: number) => void;
  chart?: React.ReactNode;
  onMethodChange?: () => void;
  shopNote?: string;
}>) {
  const d = people.draft;
  return (
    <>
      <div className="space-y-1.5">
        <p id="sizing-method-label" className="mobile-caption font-semibold text-ink-body">Size</p>
        <div className="grid grid-cols-3 gap-1 p-1 rounded-lg border border-line bg-canvas" role="radiogroup" aria-labelledby="sizing-method-label">
          {METHODS.map((m) => {
            const on = d.method === m.value;
            return (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => { onMethodChange?.(); people.updateDraft({ method: m.value }); }}
                className={`min-h-10 px-1.5 py-1.5 rounded-md text-xs font-semibold leading-tight transition-colors ${
                  on ? 'bg-taupe text-white shadow-xs' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {d.method === 'body' && (
        <BodyFields people={people} d={d} garmentType={garmentType} savedProfiles={savedProfiles} onPickProfile={onPickProfile} />
      )}
      {d.method === 'standard' && <StandardSizes people={people} d={d} sizes={sizes} chart={chart} />}
      {d.method === 'shop' && (
        <p className="text-sm text-ink-body bg-canvas border border-line rounded-lg px-4 py-3">{shopNote}</p>
      )}
    </>
  );
}

export function PersonEditor({
  people,
  sizes,
  garmentType,
  savedProfiles = [],
  onPickProfile,
  chart,
  showPrintFields = false,
}: Readonly<{
  people: PeopleListState;
  sizes: string[];
  garmentType: string;
  /** Measurement profiles the shop already has for this customer. */
  savedProfiles?: SavedProfile[];
  onPickProfile?: (id: number) => void;
  /** The service's size chart, shown under the standard sizes. */
  chart?: React.ReactNode;
  /** Print name + number for printed uniforms (walk-in roster). */
  showPrintFields?: boolean;
}>) {
  const d = people.draft;
  const nameRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const editing = people.editingId !== null;
  const number = editing ? people.persons.findIndex((p) => p.id === people.editingId) + 1 : people.persons.length + 1;

  // Saving clears the editor for the next person, so the cursor goes back to Name.
  const save = () => {
    const message = people.saveDraft();
    setError(message ?? '');
    if (!message) nameRef.current?.focus();
  };

  return (
    <section aria-label={editing ? `Editing person ${number}` : `Person ${number}`} className="bg-surface border border-line rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-canvas border-b border-line flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 shrink-0 rounded-full bg-taupe text-white text-xs font-bold flex items-center justify-center tabular-nums">{number}</span>
          <h3 className="text-sm font-bold text-ink truncate">{editing ? `Editing person ${number}` : `Person ${number}`}</h3>
        </div>
        {editing && (
          <button type="button" onClick={() => { setError(''); people.cancelEdit(); }} className="h-8 px-2.5 rounded-lg text-xs font-semibold text-ink-muted hover:text-ink hover:bg-sunken/60">
            Cancel edit
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="person-name" className="block mobile-caption font-semibold text-ink-body">
            Name <span className="text-ink-faint font-normal">(Optional)</span>
          </label>
          <input
            id="person-name"
            ref={nameRef}
            type="text"
            maxLength={100}
            value={d.name}
            onChange={(e) => people.updateDraft({ name: e.target.value })}
            placeholder="e.g. Juan Dela Cruz"
            className={TEXT_INPUT}
          />
        </div>

        {showPrintFields && (
          <div className="grid grid-cols-[1fr_6rem] gap-3">
            <div className="space-y-1.5">
              <label htmlFor="person-print-name" className="block mobile-caption font-semibold text-ink-body">
                Print name <span className="text-ink-faint font-normal">(Optional)</span>
              </label>
              <input
                id="person-print-name"
                type="text"
                maxLength={50}
                value={d.printName}
                onChange={(e) => people.updateDraft({ printName: e.target.value })}
                placeholder="e.g. DELA CRUZ"
                className={TEXT_INPUT}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="person-number" className="block mobile-caption font-semibold text-ink-body">No.</label>
              <input
                id="person-number"
                type="text"
                maxLength={10}
                value={d.number}
                onChange={(e) => people.updateDraft({ number: e.target.value })}
                placeholder="23"
                className={`${INPUT} text-center`}
              />
            </div>
          </div>
        )}

        <SizingFields
          people={people}
          sizes={sizes}
          garmentType={garmentType}
          savedProfiles={savedProfiles}
          onPickProfile={onPickProfile}
          chart={chart}
          onMethodChange={() => setError('')}
        />


        {error && <p role="alert" className="text-sm text-danger">{error}</p>}

        <div className="pt-3 border-t border-line flex sm:justify-end">
          <button
            type="button"
            onClick={save}
            className="w-full sm:w-auto h-11 px-5 rounded-lg bg-taupe hover:bg-ink text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-taupe/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {editing ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
            {editing ? 'Update person' : 'Add to list'}
          </button>
        </div>
      </div>
    </section>
  );
}

/** Note shown when the editor holds details that aren't on the list yet. */
export function UnsavedDraftNote({ people }: Readonly<{ people: PeopleListState }>) {
  if (people.persons.length === 0 || !people.draftHasContent) return null;
  return (
    <p role="status" className="mobile-caption text-ink-muted">
      The details in the editor aren&apos;t on the list yet. Tap {people.editingId !== null ? 'Update person' : 'Add to list'} to include them.
    </p>
  );
}
