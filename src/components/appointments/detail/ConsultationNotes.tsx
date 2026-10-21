import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import DesignSourceField from '@/components/shared/DesignSourceField';
import PhotoThumb from '@/components/jobs/form/PhotoThumb';
import { getErrorMessage } from '@/lib/apiError';
import { designSourceLabel, type DesignSource } from '@/lib/designSource';
import type { Appointment } from '../appointmentHelpers';

type Draft = { visit_notes: string; people_count: string; pieces_count: string; design_source: DesignSource | null; design_link: string | null; photos: string[] };

const draftOf = (a: Appointment): Draft => ({
  visit_notes: a.visit_notes ?? '', people_count: a.people_count ? String(a.people_count) : '', pieces_count: a.pieces_count ? String(a.pieces_count) : '',
  design_source: a.design_source ?? null, design_link: a.design_link ?? null, photos: a.reference_images ?? [],
});

/** What the customer wants, written as it is said. It saves by itself and is copied onto the production order. */
export default function ConsultationNotes({ apt, editable, onSaved }: Readonly<{ apt: Appointment; editable: boolean; onSaved?: () => void }>) {
  const store = useAuthStore((s) => s.store);
  const [draft, setDraft] = useState<Draft>(() => draftOf(apt));
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // A different appointment opened: start from its own values.
  useEffect(() => { dirty.current = false; setDraft(draftOf(apt)); }, [apt.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => clearTimeout(timer.current), []);

  const save = async (d: Draft) => {
    if (!store) return;
    setState('saving');
    try {
      await api.put(`/stores/${store.id}/appointments/${apt.id}`, {
        visit_notes: d.visit_notes || null, people_count: d.people_count ? Number(d.people_count) : null, pieces_count: d.pieces_count ? Number(d.pieces_count) : null,
        design_source: d.design_source, design_link: d.design_link, reference_images: d.photos,
      });
      dirty.current = false;
      setState('saved');
      onSaved?.();
    } catch { setState('error'); }
  };

  const change = (patch: Partial<Draft>, now = false) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    dirty.current = true;
    clearTimeout(timer.current);
    if (now) void save(next); else timer.current = setTimeout(() => void save(next), 900);
  };

  const upload = async (file: File | undefined) => {
    if (!file || !store) return;
    setUploading(true);
    setUploadError('');
    const body = new FormData();
    body.append('file', file);
    try {
      const res = await api.post(`/stores/${store.id}/upload`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url: string | undefined = res.data?.data?.url || res.data?.url;
      if (url) change({ photos: [...draft.photos, url] }, true);
    } catch (err) {
      setUploadError(getErrorMessage(err, 'Could not upload the photo.'));
    } finally {
      setUploading(false);
    }
  };

  const people = Number(draft.people_count) || 0;
  const pieces = Number(draft.pieces_count) || 0;

  if (!editable) {
    const facts = [apt.people_count && `${apt.people_count} people`, apt.pieces_count && `${apt.pieces_count} pieces`, designSourceLabel(apt.design_source)].filter(Boolean).join(' · ');
    return (
      <div className="border-t border-line pt-5">
        <h3 className="mb-2 text-base font-semibold text-ink">Consultation</h3>
        {facts && <p className="mb-2 text-sm text-ink">{facts}{apt.design_link && <> · <a href={apt.design_link} target="_blank" rel="noopener noreferrer" className="text-taupe hover:underline">their file</a></>}</p>}
        {apt.visit_notes ? <p className="whitespace-pre-wrap rounded-lg bg-canvas p-3 text-sm text-ink">{apt.visit_notes}</p> : <p className="text-sm text-ink-muted">Nothing was written.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4 border-t border-line pt-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-ink">Consultation</h3>
        <span className="flex items-center gap-1 text-xs text-ink-muted">
          {state === 'saving' && <><Loader2 size={12} className="animate-spin" /> Saving</>}
          {state === 'saved' && <><Check size={12} className="text-sage" /> Saved</>}
          {state === 'error' && <span className="text-rose-600">Not saved. Check the connection.</span>}
        </span>
      </div>
      <div>
        <label htmlFor={`cn-${apt.id}`} className="mb-1.5 block text-[13px] font-medium text-ink-muted">What did they say?</label>
        <textarea
          id={`cn-${apt.id}`} rows={5} value={draft.visit_notes} maxLength={4000}
          onChange={(e) => change({ visit_notes: e.target.value })}
          onBlur={() => { if (dirty.current) { clearTimeout(timer.current); void save(draft); } }}
          placeholder="Style, colours, deadline, anything agreed…"
          className="w-full rounded-lg border border-line-strong bg-canvas p-3 text-base text-ink placeholder:text-ink-faint focus:border-espresso focus:bg-white focus:outline-none sm:text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:max-w-lg">
        <div>
          <label htmlFor={`cp-${apt.id}`} className="mb-1.5 block text-[13px] font-medium text-ink-muted">People to measure</label>
          <input id={`cp-${apt.id}`} type="number" inputMode="numeric" min={1} max={500} value={draft.people_count} onChange={(e) => change({ people_count: e.target.value })} placeholder="1" className="h-12 w-full rounded-xl border border-line-strong bg-canvas px-3.5 text-base text-ink focus:border-espresso focus:bg-white focus:outline-none sm:text-sm" />
        </div>
        <div>
          <label htmlFor={`cq-${apt.id}`} className="mb-1.5 block text-[13px] font-medium text-ink-muted">Total pieces to make</label>
          <input id={`cq-${apt.id}`} type="number" inputMode="numeric" min={1} max={5000} value={draft.pieces_count} onChange={(e) => change({ pieces_count: e.target.value })} placeholder={draft.people_count || '1'} className="h-12 w-full rounded-xl border border-line-strong bg-canvas px-3.5 text-base text-ink focus:border-espresso focus:bg-white focus:outline-none sm:text-sm" />
        </div>
        <p className="col-span-2 text-[13px] text-ink-muted">Each person gets their own measurements. Total pieces counts all garments together, and the price follows it.</p>
      </div>
      {people > 0 && pieces > 0 && pieces < people && (
        <p role="status" className="rounded-lg bg-amber-50 p-3 text-[13px] text-amber-900">Each person gets at least one piece, so this will count as <strong>{people} pieces</strong>, not {pieces}.</p>
      )}
      <DesignSourceField source={draft.design_source} link={draft.design_link} onChange={(p) => change(p, true)} />
      <div>
        <span className="mb-1.5 block text-[13px] font-medium text-ink-muted">Photos <span className="font-normal text-ink-faint">(optional)</span></span>
        <p className="mb-2 text-[13px] text-ink-muted">A picture the customer shows you, or one you take of the garment or the design.</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {draft.photos.map((url) => (
            <div key={url} className="space-y-1.5">
              <PhotoThumb url={url} alt="Photo of this visit" className="aspect-square h-auto w-full" />
              <button type="button" onClick={() => change({ photos: draft.photos.filter((u) => u !== url) }, true)} className="flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-line-strong bg-white text-xs font-medium text-ink hover:bg-sunken"><Trash2 size={13} />Remove</button>
            </div>
          ))}
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line-strong text-sm font-medium text-ink hover:bg-sunken">
            {uploading ? <><Loader2 size={16} className="animate-spin" />Uploading…</> : <><Plus size={18} />Add photo</>}
            <input type="file" accept="image/*" className="hidden" disabled={uploading || draft.photos.length >= 10} onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </div>
        {uploadError && <p className="mt-1.5 text-sm text-danger">{uploadError}</p>}
      </div>
    </div>
  );
}
