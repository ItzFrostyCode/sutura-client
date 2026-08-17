import React from 'react';
import { Filter, Download, Printer } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

interface ReportFiltersProps {
  readonly period: string;
  readonly setPeriod: (period: string) => void;
  readonly onExportCSV: () => void;
  readonly onPrint: () => void;
}

export default function ReportFilters({
  period,
  setPeriod,
  onExportCSV,
  onPrint,
}: ReportFiltersProps) {
  return (
    <div className="no-print">
      <PageHeader
        eyebrow="Analytics"
        title="Reports & Insights"
        description="Revenue, production trends, and business performance at a glance."
        actions={
          <>
            <div className="flex items-center gap-2 bg-surface border border-line rounded-lg px-3 py-2 filter-bar min-h-[44px]">
              <Filter size={15} className="text-ink-faint shrink-0" />
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                aria-label="Reporting period"
                className="bg-transparent text-sm text-ink-body font-medium focus:outline-none cursor-pointer"
              >
                <option value="all_time">All Time</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="ytd">Year to Date</option>
              </select>
            </div>
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 bg-surface hover:bg-sunken border border-line text-ink-body font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors cursor-pointer min-h-[44px]"
            >
              <Download size={14} /> <span className="hidden sm:inline">Export</span> CSV
            </button>
            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 bg-taupe hover:bg-taupe-hover text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors cursor-pointer min-h-[44px]"
            >
              <Printer size={14} /> Print<span className="hidden sm:inline"> Report</span>
            </button>
          </>
        }
      />
    </div>
  );
}
