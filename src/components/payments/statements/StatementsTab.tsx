'use client';

import React from 'react';
import Link from 'next/link';
import { FileSpreadsheet, FileText, Loader2, Lock, Package } from 'lucide-react';
import StatementFilters from './StatementFilters';
import StatementRow from './StatementRow';
import { useStatements } from './useStatements';

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const btn = 'h-12 px-4 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

// Every payment record and its receipt screenshot, by period — for review, bookkeeping and the BIR/accountant.
export default function StatementsTab() {
  const s = useStatements();
  const d = s.data;
  const locked = d ? !d.plan_allows_export : false;
  const rows = d?.entries ?? [];

  return (
    <div className="p-4 min-[600px]:p-6 space-y-5">
      <p className="text-sm text-ink-muted max-w-2xl">Download your payment records and the receipt screenshots customers sent — one by one, the ones you tick, or a whole period (week, two weeks, month, year, or everything from your first record).</p>

      <StatementFilters period={s.period} onPeriod={s.setPeriod} from={s.from} to={s.to} onCustom={(r) => { s.setCustom(r); s.setPeriod('custom'); }} kinds={s.kinds} onKind={s.toggleKind} firstRecord={d?.first_record_date ?? null} />

      {d && (
        <dl className="grid grid-cols-2 min-[600px]:grid-cols-4 gap-3">
          {[['Records', String(d.totals.records)], ['With receipt image', String(d.totals.with_receipt)], ['Total (excl. rejected)', peso(d.totals.amount)], ['Verified', peso(d.totals.verified_amount)]].map(([k, v]) => (
            <div key={k} className="border border-line bg-canvas p-3"><dt className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">{k}</dt><dd className="text-lg font-bold text-ink mt-1 break-words">{v}</dd></div>
          ))}
        </dl>
      )}

      {locked && (
        <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 p-4">
          <Lock size={18} className="text-amber-700 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">Bulk download (ZIP, CSV) is part of the <strong>Premium</strong> plan. You can still download receipts one at a time and print the statement. <Link href="/dashboard/billing" className="font-semibold underline">See plans</Link></p>
        </div>
      )}

      <div className="flex flex-col min-[700px]:flex-row gap-3">
        <button type="button" disabled={locked || s.selected.length === 0 || s.busy !== null} onClick={() => s.download('selected', 'zip')} className={`${btn} bg-taupe hover:bg-taupe-hover text-white`}>
          {s.busy === 'selected-zip' ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />} Download selected ({s.selected.length}) as ZIP
        </button>
        <button type="button" disabled={locked || !d?.totals.records || s.busy !== null} onClick={() => s.download('range', 'zip')} className={`${btn} border border-line-strong bg-white hover:bg-sunken text-ink`}>
          {s.busy === 'range-zip' ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />} All receipts in period (ZIP)
        </button>
        <button type="button" disabled={locked || !d?.totals.records || s.busy !== null} onClick={() => s.download('range', 'csv')} className={`${btn} border border-line-strong bg-white hover:bg-sunken text-ink`}>
          {s.busy === 'range-csv' ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />} Statement (CSV / Excel)
        </button>
        <Link href={s.printHref} target="_blank" className={`${btn} border border-line-strong bg-white hover:bg-sunken text-ink`}><FileText size={16} /> Print / save as PDF</Link>
      </div>

      <div className="border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line">
          <label className="flex items-center gap-3 text-sm text-ink cursor-pointer min-h-11">
            <input type="checkbox" checked={s.selectableKeys.length > 0 && s.selected.length === s.selectableKeys.length} onChange={s.toggleAll} disabled={s.selectableKeys.length === 0} className="w-5 h-5 accent-[#6B5346]" />
            Select all with a receipt image
          </label>
          {s.loading && <Loader2 size={16} className="animate-spin text-taupe" />}
        </div>
        {!s.loading && rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-ink-muted">No payment records in this period.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((e) => <StatementRow key={e.key} entry={e} checked={s.selected.includes(e.key)} busy={s.busy === e.key} onToggle={() => s.toggleRow(e.key)} onDownload={() => s.downloadOne(e.key)} />)}
          </ul>
        )}
        {d?.truncated && <p className="px-4 py-3 text-xs text-ink-muted border-t border-line">Showing the newest 500 records. Downloads still include the whole period.</p>}
      </div>
    </div>
  );
}
