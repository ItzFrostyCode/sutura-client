'use client';

import React from 'react';
import { Download, ImageOff, Loader2 } from 'lucide-react';
import type { StatementEntry } from './useStatements';

const STATUS: Record<string, string> = {
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200', paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-800 border-amber-200', rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—');
const peso = (n: number | null) => (n == null ? '—' : `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`);

interface Props { readonly entry: StatementEntry; readonly checked: boolean; readonly busy: boolean; readonly onToggle: () => void; readonly onDownload: () => void }

// One payment record: checkbox (only when a receipt image exists), the facts, and a single-receipt download.
export default function StatementRow({ entry: e, checked, busy, onToggle, onDownload }: Props) {
  return (
    <li className="flex items-start gap-3 px-4 py-3 min-h-16">
      <input type="checkbox" checked={checked} disabled={!e.receipt_available} onChange={onToggle} aria-label={`Select ${e.doc_no ?? e.key}`} className="mt-1 w-5 h-5 accent-[#6B5346] shrink-0 disabled:opacity-30" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink truncate">{e.doc_no ?? e.kind_label} · {e.customer ?? 'Customer'}</p>
        <p className="text-xs text-ink-muted truncate">{when(e.date)} · {e.kind_label} · {e.method}{e.payment_type ? ` · ${e.payment_type}` : ''}{e.reference ? ` · ${e.reference}` : ''}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-ink">{peso(e.amount)}</p>
        <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${STATUS[e.status] ?? 'bg-canvas text-ink-muted border-line'}`}>{e.status}</span>
      </div>
      {e.receipt_available ? (
        <button type="button" onClick={onDownload} disabled={busy} aria-label="Download this receipt" className="w-11 h-11 shrink-0 flex items-center justify-center border border-line-strong bg-white hover:bg-sunken cursor-pointer">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        </button>
      ) : (
        <span className="w-11 h-11 shrink-0 flex items-center justify-center text-ink-faint" title={e.has_receipt ? 'The image is no longer on the server' : 'No receipt image (cash or not uploaded)'}><ImageOff size={16} /></span>
      )}
    </li>
  );
}
