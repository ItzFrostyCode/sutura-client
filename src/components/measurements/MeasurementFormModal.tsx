'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Loader2, Eye, Pencil, Plus, X, ChevronDown, ArrowLeft, ArrowRight } from 'lucide-react';
import Modal from '@/components/Modal';
import { useAuthStore } from '@/store/useAuthStore';
import { CustomerData } from './measurementTypes';
import { emptyForm, humanizeMetricKey } from './measurementHelpers';
import MeasurementPhotos from './MeasurementPhotos';
import { GARMENT_TYPE_OPTIONS } from '@/components/jobs/jobHelpers';
import { MEASUREMENT_FIELDS, measurementFieldsFor, measurementKeysFor, type MeasurementKey } from '@/lib/garmentMeasurements';

interface MeasurementFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly editingId: number | null;
  readonly form: ReturnType<typeof emptyForm>;
  readonly setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyForm>>>;
  readonly customers: CustomerData[];
  readonly error: string;
  readonly isSubmitting: boolean;
  readonly onSubmit: (e: React.SyntheticEvent) => void;
}

type Unit = 'in' | 'cm';
type Extra = { id: number; name: string; value: string };

// Older profiles used other names for the same measurement. The first one that
// has a value fills the box; any other stays under "Anything else" so nothing is lost.
const ALIASES: Record<MeasurementKey, string[]> = {
  chest: ['chest', 'bust'],
  waist: ['waist'],
  hips: ['hips'],
  shoulders: ['shoulders', 'shoulder'],
  neck: ['neck'],
  sleeve: ['sleeve', 'sleeve_length'],
  top_length: ['top_length', 'length', 'shirt_length'],
  pants_length: ['pants_length', 'trouser_length', 'outseam'],
  inseam: ['inseam'],
};

const STD_KEYS = MEASUREMENT_FIELDS.map((f) => f.key);
const blankStd = () => Object.fromEntries(STD_KEYS.map((k) => [k, ''])) as Record<MeasurementKey, string>;
const filled = (v: unknown) => v !== undefined && v !== null && String(v).trim() !== '';

/** Saved metrics → the form's boxes, its extra rows, its unit and a best guess at what was made. */
function parseMetrics(metrics: Record<string, string | undefined> | null | undefined) {
  const m = metrics ?? {};
  const std = blankStd();
  const used = new Set<string>(['unit', 'garment']);
  for (const key of STD_KEYS) {
    const alias = ALIASES[key].find((a) => filled(m[a]));
    if (alias) { std[key] = String(m[alias]); used.add(alias); }
  }
  let nextId = 1;
  const extras: Extra[] = Object.entries(m)
    .filter(([k, v]) => !used.has(k) && filled(v))
    .map(([k, v]) => ({ id: nextId++, name: humanizeMetricKey(k), value: String(v) }));

  // The smallest garment that asks for every filled box; nothing filled = let them pick.
  const have = STD_KEYS.filter((k) => std[k] !== '');
  const garment = typeof m.garment === 'string' && m.garment
    ? m.garment
    : have.length === 0 ? '' : (['top', 'bottom', 'gown_dress', 'full_set'].find((g) => have.every((k) => measurementKeysFor(g).includes(k))) ?? 'full_set');

  return { std, extras, unit: (m.unit === 'cm' ? 'cm' : 'in') as Unit, garment, nextId };
}

/**
 * The shop's measurement profile form. Asks for the same measurements as the
 * Create Job Order form (by what's being made), so a saved profile loads
 * straight into a new order. Values are saved under the job order's names
 * (chest, waist, sleeve…), plus the unit and anything extra the shop adds.
 */
export default function MeasurementFormModal({
  isOpen,
  onClose,
  editingId,
  form,
  setForm,
  customers,
  error,
  isSubmitting,
  onSubmit,
}: MeasurementFormModalProps) {
  const { store } = useAuthStore();
  // Three short steps instead of one long scroll: who and what, the numbers, then a check.
  const [view, setView] = useState<'details' | 'measure' | 'preview'>('details');
  const [garment, setGarment] = useState('');
  const [unit, setUnit] = useState<Unit>('in');
  const [std, setStd] = useState<Record<MeasurementKey, string>>(blankStd);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [nextId, setNextId] = useState(1);

  // Fill the form from the record being opened (once per open, not per keystroke).
  useEffect(() => {
    if (!isOpen) return;
    const parsed = parseMetrics(form.metrics);
    setGarment(parsed.garment);
    setUnit(parsed.unit);
    setStd(parsed.std);
    setExtras(parsed.extras);
    setNextId(parsed.nextId);
    setView('details');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingId]);

  const fields = measurementFieldsFor(garment || null);

  // Keep form.metrics in step: the boxes for this garment, the extras, the unit and the garment.
  useEffect(() => {
    if (!isOpen) return;
    const metrics: Record<string, string> = {};
    for (const f of fields) if (std[f.key].trim() !== '') metrics[f.key] = std[f.key].trim();
    for (const x of extras) if (x.name.trim() && x.value.trim()) metrics[x.name.trim()] = x.value.trim();
    if (Object.keys(metrics).length > 0) {
      metrics.unit = unit;
      if (garment) metrics.garment = garment;
    }
    setForm((f) => ({ ...f, metrics }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [std, extras, unit, garment, isOpen]);

  const unitLabel = unit === 'in' ? 'in' : 'cm';
  const addExtra = () => { setExtras((xs) => [...xs, { id: nextId, name: '', value: '' }]); setNextId((n) => n + 1); };
  const setExtra = (id: number, patch: Partial<Extra>) => setExtras((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const selectedCustomer = customers.find((c) => c.id.toString() === form.customer_id);
  const garmentLabel = GARMENT_TYPE_OPTIONS.find((o) => o.value === garment)?.label;
  const reviewRows: [string, string][] = [
    ...fields.filter((f) => std[f.key].trim()).map((f) => [f.label, std[f.key].trim()] as [string, string]),
    ...extras.filter((x) => x.name.trim() && x.value.trim()).map((x) => [x.name.trim(), x.value.trim()] as [string, string]),
  ];

  const inputCls = 'w-full h-11 px-3.5 bg-surface border border-line rounded-xl text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe/30 tabular-nums';
  const fieldCls = 'w-full h-11 px-4 bg-canvas border border-line rounded-xl text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe/30';
  const labelCls = 'block text-sm font-medium text-ink-body mb-1.5';
  const unitWord = unit === 'in' ? 'inches' : 'centimeters';
  const detailsDone = !!form.customer_id && !!form.profile_name.trim() && !!garment;
  const STEPS = ['Details', 'Measurements', 'Review'] as const;
  const stepIndex = view === 'details' ? 0 : view === 'measure' ? 1 : 2;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingId ? 'Edit Measurement Profile' : 'New Measurement Profile'}
      maxWidth="max-w-2xl"
    >
      <form
        onSubmit={(e) => {
          // Enter on the first two steps moves on; only the Review step saves.
          if (view !== 'preview') {
            e.preventDefault();
            if (view === 'details' && detailsDone) setView('measure');
            else if (view === 'measure') setView('preview');
            return;
          }
          onSubmit(e);
        }}
        className="space-y-6"
      >
        {/* Where you are */}
        <ol className="flex items-center gap-2 text-xs font-semibold" aria-label="Steps">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2" aria-current={i === stepIndex ? 'step' : undefined}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center tabular-nums ${i <= stepIndex ? 'bg-taupe text-white' : 'bg-sunken text-ink-muted'}`}>{i + 1}</span>
              <span className={i === stepIndex ? 'text-ink' : 'text-ink-muted'}>{label}</span>
              {i < STEPS.length - 1 && <span className="w-6 h-px bg-line" aria-hidden="true" />}
            </li>
          ))}
        </ol>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-sm animate-fade-in">
            {error}
          </div>
        )}

        {view === 'details' && (
          <>
            <div>
              <label htmlFor="measurement-customer" className={labelCls}>Customer <span className="text-danger">*</span></label>
              {customers.length === 0 ? (
                <div className="bg-canvas border border-line border-dashed rounded-xl px-4 py-3 text-sm text-ink-muted">
                  No customers yet. <Link href="/dashboard/customers" className="text-taupe font-semibold hover:underline">Add one first</Link>. A measurement profile always belongs to a customer.
                </div>
              ) : (
                <div className="relative">
                  <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
                  <select
                    id="measurement-customer"
                    required
                    value={form.customer_id}
                    onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))}
                    className={`${fieldCls} pl-10 pr-10 appearance-none cursor-pointer`}
                  >
                    <option value="">Select customer…</option>
                    {customers.map((c) => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="measurement-profile-name" className={labelCls}>Profile name <span className="text-danger">*</span></label>
              <input
                id="measurement-profile-name"
                required
                type="text"
                value={form.profile_name}
                onChange={(e) => setForm((f) => ({ ...f, profile_name: e.target.value }))}
                placeholder="Wedding barong, school uniform…"
                className={fieldCls}
              />
            </div>

            <div>
              <label htmlFor="measurement-garment" className={labelCls}>What are you making? <span className="text-danger">*</span></label>
              <div className="relative">
                <select
                  id="measurement-garment"
                  required
                  value={garment}
                  onChange={(e) => setGarment(e.target.value)}
                  className={`${fieldCls} pr-10 appearance-none cursor-pointer`}
                >
                  <option value="">Pick one…</option>
                  {GARMENT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              </div>
              <p className="text-xs text-ink-muted mt-1.5">
                {garment ? GARMENT_TYPE_OPTIONS.find((o) => o.value === garment)?.examples : 'This decides which measurements you\'ll be asked for.'}
              </p>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-line">
              <button type="button" onClick={onClose} className="px-4 h-10 rounded-lg text-sm font-medium text-ink-body hover:text-ink hover:bg-sunken transition-colors">Cancel</button>
              <button
                type="button"
                disabled={!detailsDone}
                onClick={() => setView('measure')}
                className="bg-taupe hover:bg-taupe-hover text-white px-5 h-10 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                Next <ArrowRight size={15} />
              </button>
            </div>
          </>
        )}

        {view === 'measure' && (
          <>
            {/* The unit is set once here, not repeated in every box. */}
            <section className="space-y-4" aria-labelledby="m-heading">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 id="m-heading" className="text-sm font-semibold text-ink">
                  Measurements <span className="font-normal text-ink-muted">· in {unitWord}</span>
                </h3>
                <div className="flex p-0.5 bg-canvas border border-line rounded-lg" role="group" aria-label="Unit">
                  {(['in', 'cm'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      aria-pressed={unit === u}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${unit === u ? 'bg-taupe text-white' : 'text-ink-muted hover:text-ink'}`}
                    >
                      {u === 'in' ? 'Inches' : 'Centimeters'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4">
                {fields.map((f) => (
                  <div key={f.key}>
                    <label htmlFor={`m-${f.key}`} className="block text-sm font-medium text-ink-body mb-1.5 leading-snug">{f.label}</label>
                    <input
                      id={`m-${f.key}`}
                      type="number"
                      inputMode="decimal"
                      step="0.25"
                      min="0"
                      value={std[f.key]}
                      onChange={(e) => setStd((s) => ({ ...s, [f.key]: e.target.value }))}
                      placeholder={f.hint}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3 border-t border-line pt-5" aria-labelledby="x-heading">
              <div>
                <h3 id="x-heading" className="text-sm font-semibold text-ink">Anything else</h3>
                <p className="text-xs text-ink-muted mt-0.5">For a measurement that isn&apos;t listed above, like armhole or cuff.</p>
              </div>
              {extras.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-[minmax(0,1fr)_7rem_2.75rem] gap-2 text-xs font-medium text-ink-muted" aria-hidden="true">
                    <span>Measurement name</span>
                    <span>Value ({unit})</span>
                    <span />
                  </div>
                  {extras.map((x) => (
                    <div key={x.id} className="grid grid-cols-[minmax(0,1fr)_7rem_2.75rem] gap-2 items-center">
                      <input type="text" value={x.name} onChange={(e) => setExtra(x.id, { name: e.target.value })} placeholder="Armhole" aria-label="Measurement name" className={inputCls} />
                      <input type="number" inputMode="decimal" step="0.25" min="0" value={x.value} onChange={(e) => setExtra(x.id, { value: e.target.value })} placeholder="0" aria-label={`${x.name || 'Measurement'} in ${unitWord}`} className={inputCls} />
                      <button
                        type="button"
                        onClick={() => setExtras((xs) => xs.filter((y) => y.id !== x.id))}
                        aria-label={`Remove ${x.name || 'this measurement'}`}
                        className="h-11 w-11 rounded-xl text-ink-muted hover:text-danger hover:bg-danger/10 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={addExtra}
                className="h-10 px-4 rounded-lg border border-taupe text-taupe text-sm font-semibold hover:bg-taupe/10 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={16} /> {extras.length ? 'Add another measurement' : 'Add a measurement'}
              </button>
            </section>

            <div className="border-t border-line pt-5">
              <MeasurementPhotos urls={form.photo_urls} onChange={(photo_urls) => setForm((f) => ({ ...f, photo_urls }))} storeId={store?.id ?? 0} />
            </div>

            <div>
              <label htmlFor="measurement-notes" className={labelCls}>Notes <span className="text-ink-faint font-normal">(optional)</span></label>
              <textarea
                id="measurement-notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Likes a loose fit. Allergic to polyester."
                className={`${fieldCls} h-auto py-2.5 resize-none`}
              />
            </div>

            <div className="pt-4 flex justify-between gap-3 border-t border-line">
              <button type="button" onClick={() => setView('details')} className="px-4 h-10 rounded-lg text-sm font-medium text-ink-body hover:text-ink hover:bg-sunken transition-colors flex items-center gap-2">
                <ArrowLeft size={15} /> Back
              </button>
              <button type="button" onClick={() => setView('preview')} className="bg-taupe hover:bg-taupe-hover text-white px-5 h-10 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer">
                <Eye size={15} /> Review
              </button>
            </div>
          </>
        )}

        {view === 'preview' && (
          <>
            <div className="bg-canvas border border-line rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-ink-muted font-semibold">Customer</p>
                  <p className="text-sm font-semibold text-ink truncate">{selectedCustomer?.name || '—'}</p>
                </div>
                <div className="text-right min-w-0">
                  <p className="text-xs text-ink-muted font-semibold">Profile</p>
                  <p className="text-sm font-semibold text-ink truncate">{form.profile_name || '—'}{garmentLabel ? ` · ${garmentLabel}` : ''}</p>
                </div>
              </div>

              <div className="border-t border-line pt-3">
                <p className="text-xs text-ink-muted font-semibold mb-2">
                  {reviewRows.length} measurement{reviewRows.length === 1 ? '' : 's'}, in {unitWord}
                </p>
                {reviewRows.length === 0 ? (
                  <p className="text-sm text-ink-muted">No measurements typed in{form.photo_urls.length ? ', only the photo of the paper sheet' : ''}.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {reviewRows.map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-2 bg-surface border border-line rounded-lg px-3 py-2">
                        <span className="text-xs text-ink-muted">{label}</span>
                        <span className="text-sm font-semibold text-ink tabular-nums shrink-0">{value} {unitLabel}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {form.notes && (
                <div className="border-t border-line pt-3">
                  <p className="text-xs text-ink-muted font-semibold mb-1">Notes</p>
                  <p className="text-sm text-ink-body">{form.notes}</p>
                </div>
              )}
            </div>

            {editingId && (
              <p className="text-xs text-ink-body bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Saving adds a new version of this profile. The current one stays in its history.
              </p>
            )}

            <div className="pt-4 flex justify-between gap-3 border-t border-line">
              <button type="button" onClick={() => setView('measure')} className="px-4 h-10 rounded-lg text-sm font-medium text-ink-body hover:text-ink hover:bg-sunken transition-colors flex items-center gap-2">
                <Pencil size={14} /> Back to edit
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-taupe hover:bg-taupe-hover text-white px-5 h-10 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                Save profile
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
