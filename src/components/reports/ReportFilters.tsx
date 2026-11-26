import React, { useState } from 'react';
import { Filter, Download, Printer, FileSpreadsheet, Loader2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import PlanTierTag from '@/components/shared/PlanTierTag';
import { customPeriod, parseCustomPeriod } from './reportExport';

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local

interface ReportFiltersProps {
  readonly period: string;
  readonly setPeriod: (period: string) => void;
  readonly onExportCSV: () => void;
  /** Branded .xlsx (logo + SUTURA colours). */
  readonly onExportExcel?: () => void;
  readonly exportingExcel?: boolean;
  readonly onPrint: () => void;
  /** True on Basic plan: hides export/print/filter controls because the report below is locked. */
  readonly locked?: boolean;
}

export default function ReportFilters({
  period,
  setPeriod,
  onExportCSV,
  onExportExcel,
  exportingExcel = false,
  onPrint,
  locked = false,
}: ReportFiltersProps) {
  // "Custom range" shows two date boxes; the report switches once both are picked and in order.
  const current = parseCustomPeriod(period);
  const [customOpen, setCustomOpen] = useState(Boolean(current));
  const [from, setFrom] = useState(current?.from ?? '');
  const [to, setTo] = useState(current?.to ?? '');
  const applyRange = (f: string, t: string) => {
    setFrom(f);
    setTo(t);
    if (f && t && f <= t) setPeriod(customPeriod(f, t));
  };
  const onSelect = (value: string) => {
    if (value === 'custom') {
      setCustomOpen(true);
      if (from && to && from <= to) setPeriod(customPeriod(from, to));
      return;
    }
    setCustomOpen(false);
    setPeriod(value);
  };
  const dateBox = 'h-9 min-w-0 bg-transparent text-sm tabular-nums text-ink-body focus:outline-none';

  return (
    <div className="no-print">
      <PageHeader
        title="Reports & Insights"
        description="Revenue, production trends, and business performance at a glance."
        actions={
          locked ? (
            <PlanTierTag plan="Pro" />
          ) : (
            <>
            <div className="flex items-center gap-2 bg-surface border border-line rounded-lg px-3 py-2 filter-bar min-h-[44px]">
              <Filter size={15} className="text-ink-faint shrink-0" />
              <select
                value={customOpen ? 'custom' : period}
                onChange={e => onSelect(e.target.value)}
                aria-label="Reporting period"
                className="bg-transparent text-sm text-ink-body font-medium focus:outline-none cursor-pointer"
              >
                <option value="all_time">All Time</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="ytd">Year to Date</option>
                <option value="custom">Custom range…</option>
              </select>
            </div>
            {customOpen && (
              <div
                className={`flex items-center gap-1.5 bg-surface border rounded-lg px-3 min-h-[44px] ${current ? 'border-taupe' : 'border-line'}`}
                role="group"
                aria-label="Custom date range"
              >
                <input type="date" aria-label="Start date" value={from} max={to || today()} onChange={(e) => applyRange(e.target.value, to)} className={dateBox} />
                <span className="text-ink-faint" aria-hidden="true">–</span>
                <input type="date" aria-label="End date" value={to} min={from || undefined} max={today()} onChange={(e) => applyRange(from, e.target.value)} className={dateBox} />
              </div>
            )}
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 bg-surface hover:bg-sunken border border-line text-ink-body font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors cursor-pointer min-h-[44px]"
            >
              <Download size={14} /> <span className="hidden sm:inline">Export</span> CSV
            </button>
            {onExportExcel && (
              <button
                type="button"
                onClick={onExportExcel}
                disabled={exportingExcel}
                className="flex items-center gap-1.5 bg-surface hover:bg-sunken border border-line text-ink-body font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors cursor-pointer min-h-[44px] disabled:opacity-50"
              >
                {exportingExcel ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />} Excel
              </button>
            )}
            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 bg-taupe hover:bg-taupe-hover text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors cursor-pointer min-h-[44px]"
            >
              <Printer size={14} /> Print<span className="hidden sm:inline"> Report</span>
            </button>
            </>
          )
        }
      />
    </div>
  );
}
