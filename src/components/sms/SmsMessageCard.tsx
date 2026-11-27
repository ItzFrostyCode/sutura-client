'use client';

import React, { useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { formatWhen, measure, type SmsMessage } from './smsHelpers';

const BADGE: Record<string, string> = {
  draft: 'bg-amber-50 text-amber-800 border-amber-200', sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blocked: 'bg-rose-50 text-rose-700 border-rose-200', failed: 'bg-rose-50 text-rose-700 border-rose-200', cancelled: 'bg-canvas text-ink-muted border-line',
};

interface Props {
  readonly message: SmsMessage;
  readonly busy: boolean;
  readonly onSave: (patch: { body?: string; number?: string; update_customer_number?: boolean }) => Promise<void>;
  readonly onApprove: () => Promise<void>;
  readonly onCancel: () => Promise<void>;
}

// One text waiting for a decision: fix the number, fix the words, then send (or drop it).
export default function SmsMessageCard({ message: m, busy, onSave, onApprove, onCancel }: Props) {
  const editable = m.status === 'draft' || m.status === 'blocked' || m.status === 'failed';
  const [body, setBody] = useState(m.body);
  const [number, setNumber] = useState(m.to_number ?? m.raw_number ?? '');
  const [remember, setRemember] = useState(false);
  const count = measure(body);
  const dirty = body !== m.body || number !== (m.to_number ?? m.raw_number ?? '');

  const patch = () => ({ ...(body !== m.body ? { body } : {}), ...(number !== (m.to_number ?? m.raw_number ?? '') ? { number, update_customer_number: remember } : {}) });
  const sendNow = async () => { if (dirty) await onSave(patch()); await onApprove(); };

  return (
    <li className="px-4 py-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{m.customer ?? 'Customer'}</p>
          <p className="text-xs text-ink-muted">{m.event_label} · {formatWhen(m.sent_at ?? m.created_at)}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${BADGE[m.status] ?? BADGE.cancelled}`}>{m.status === 'blocked' ? 'Needs fixing' : m.status}</span>
          {m.is_test && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-line-strong bg-sunken text-ink-muted">Test — not delivered</span>}
        </div>
      </div>

      {(m.blocked_reason || m.error) && <p className="text-xs text-rose-700">{m.blocked_reason ?? m.error}</p>}

      {editable ? (
        <>
          <div>
            <label htmlFor={`num-${m.id}`} className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1">Send to this number</label>
            <input id={`num-${m.id}`} inputMode="tel" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="09XX XXX XXXX" className="w-full h-12 px-3.5 bg-surface border border-line text-base text-ink focus:outline-none focus:border-taupe" />
            {number !== (m.to_number ?? m.raw_number ?? '') && (
              <label className="flex items-center gap-2 text-xs text-ink-muted mt-2 min-h-11 cursor-pointer"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-5 h-5 accent-[#6B5346]" /> Also save this as the customer&apos;s number</label>
            )}
          </div>
          <div>
            <label htmlFor={`body-${m.id}`} className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1">Message</label>
            <textarea id={`body-${m.id}`} rows={3} value={body} onChange={(e) => setBody(e.target.value)} className="w-full px-3.5 py-3 bg-surface border border-line text-base text-ink focus:outline-none focus:border-taupe resize-none" />
            <p className={`text-xs mt-1 ${count.segments > 1 ? 'text-amber-700 font-semibold' : 'text-ink-muted'}`}>
              {count.chars}/160 · {count.segments === 1 ? '1 SMS' : `${count.segments} SMS (costs more)`}{count.foldedChars ? ' · ₱, accents and fancy quotes become plain letters' : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy || !number.trim()} onClick={sendNow} className="h-12 px-5 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {m.status === 'draft' ? 'Looks right — send' : 'Fix and send'}
            </button>
            {dirty && <button type="button" disabled={busy} onClick={() => onSave(patch())} className="h-12 px-4 border border-line-strong bg-white hover:bg-sunken text-sm font-semibold cursor-pointer">Save changes</button>}
            <button type="button" disabled={busy} onClick={onCancel} className="h-12 px-4 border border-rose-200 text-rose-700 hover:bg-rose-50 text-sm font-semibold flex items-center gap-1.5 cursor-pointer"><X size={16} /> Don&apos;t send</button>
          </div>
        </>
      ) : (
        <div className="bg-canvas border border-line p-3 text-sm text-ink-body">
          <p className="text-xs text-ink-muted mb-1">To {m.to_number ?? '—'}</p>
          {m.body}
        </div>
      )}
    </li>
  );
}
