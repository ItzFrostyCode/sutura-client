import React, { useState } from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import type { OrderReadinessApi } from './useOrderReadiness';
import type { ReadinessData } from './readinessTypes';

interface MaterialsCardProps {
  readonly data: ReadinessData;
  readonly api: OrderReadinessApi;
  /** Production already started or the order is closed: show the answer, don't ask again. */
  readonly locked: boolean;
}

const btn = 'h-11 sm:h-9 rounded-lg px-3 text-xs font-bold disabled:opacity-50';

/**
 * Materials as a yes/no check: the customer's own fabric is judged suitable or not, and the shop says the
 * materials are ready or still on the way. SUTURA deliberately keeps no stock, supplier or purchase records.
 */
export default function MaterialsCard({ data, api, locked }: MaterialsCardProps) {
  const m = data.materials;
  const [note, setNote] = useState(m?.note ?? '');
  if (!m) return null;
  const off = api.busy !== null;
  const items = m.customer_items;

  return (
    <section className="rounded-xl border border-line bg-surface shadow-2xs">
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h3 className="text-sm font-bold text-ink">Materials</h3>
        <span className={`flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold ${m.ready ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : m.waiting ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-line bg-sunken text-ink-muted'}`}>
          {m.ready ? <CheckCircle2 size={11} /> : <Clock size={11} />}{m.ready ? 'Ready' : m.waiting ? 'Waiting' : 'Not checked yet'}
        </span>
      </header>

      <div className="space-y-4 px-4 py-3 text-sm">
        {items.applicable && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">The customer&apos;s own fabric</p>
            <p className="text-xs text-ink-body">Is what they bring enough, and right for the approved design? This is checked before the price is final.</p>
            {locked ? (
              <p className="text-xs font-semibold text-ink">{items.assessment === 'suitable' ? 'Suitable' : items.assessment === 'not_suitable' ? 'Not suitable' : 'Not assessed'}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={off} onClick={() => api.actions.assessCustomerItems('suitable')} className={`${btn} ${items.assessment === 'suitable' ? 'bg-emerald-700 text-white' : 'border border-line text-ink-body hover:bg-sunken'}`}>Suitable</button>
                <button type="button" disabled={off} onClick={() => api.actions.assessCustomerItems('not_suitable')} className={`${btn} ${items.assessment === 'not_suitable' ? 'bg-rose-700 text-white' : 'border border-line text-ink-body hover:bg-sunken'}`}>Not suitable</button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">Ready for production?</p>
          {locked ? (
            <p className="text-xs text-ink-body">{m.ready ? 'Marked ready before production started.' : 'Not marked ready.'}{m.note ? ` ${m.note}` : ''}</p>
          ) : (
            <>
              <textarea
                aria-label="Materials note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Optional note, e.g. fabric arrives Friday"
                className="w-full resize-none rounded-lg border border-line bg-canvas px-3 py-2 text-base text-ink focus:border-taupe focus:outline-none sm:text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={off} onClick={() => api.actions.setMaterials('ready', note)} className={`${btn} bg-taupe text-white hover:bg-taupe-hover`}>Materials are ready</button>
                <button type="button" disabled={off || data.status === 'pending'} title={data.status === 'pending' ? 'Available once the order is confirmed' : undefined} onClick={() => api.actions.setMaterials('waiting', note)} className={`${btn} border border-line text-ink-body hover:bg-sunken`}>Waiting for materials</button>
              </div>
            </>
          )}
          <p className="text-[11px] text-ink-faint">A yes/no check only — SUTURA does not track stock, suppliers or purchases.</p>
        </div>
      </div>
    </section>
  );
}
