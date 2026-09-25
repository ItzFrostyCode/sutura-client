import React from 'react';
import Link from 'next/link';
import { Sparkles, Scissors, Calendar, ChevronRight } from 'lucide-react';

interface CustomerQuickActionsCardProps {
  readonly customerId?: number;
}

export default function CustomerQuickActionsCard({ customerId }: CustomerQuickActionsCardProps) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center gap-3 border-b border-line pb-4 min-h-12">
        <div className="w-8 h-8 rounded-xl bg-canvas border border-line flex items-center justify-center text-taupe shrink-0 shadow-2xs">
          <Sparkles size={15} />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-wider">Quick Actions</h4>
          <p className="text-[11px] text-ink-muted">Fast atelier shortcuts</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <Link
          href={`/dashboard/jobs/new?customer_id=${customerId}`}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-canvas hover:bg-surface border border-line text-xs font-semibold text-ink transition-colors shadow-2xs group"
        >
          <span className="flex items-center gap-2.5">
            <Scissors size={14} className="text-taupe" />
            <span>Create Custom Job Order</span>
          </span>
          <ChevronRight size={13} className="text-ink-muted group-hover:text-taupe transition-colors" />
        </Link>

        <Link
          href={`/dashboard/appointments?customer_id=${customerId}`}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-canvas hover:bg-surface border border-line text-xs font-semibold text-ink transition-colors shadow-2xs group"
        >
          <span className="flex items-center gap-2.5">
            <Calendar size={14} className="text-taupe" />
            <span>Book Fitting Appointment</span>
          </span>
          <ChevronRight size={13} className="text-ink-muted group-hover:text-taupe transition-colors" />
        </Link>
      </div>
    </div>
  );
}
