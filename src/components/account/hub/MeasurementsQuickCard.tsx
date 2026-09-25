import Link from 'next/link';
import { Ruler, ChevronRight } from 'lucide-react';

interface MeasurementsQuickCardProps {
  measurementCount: number | null;
}

export default function MeasurementsQuickCard({ measurementCount }: Readonly<MeasurementsQuickCardProps>) {
  return (
    <Link
      href="/account/measurements"
      className="mobile-nav-row flex items-center gap-3.5 bg-surface border border-line p-4 mb-3 hover:border-line-strong transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-sunken flex items-center justify-center shrink-0">
        <Ruler size={20} className="text-taupe" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="mobile-h4 font-semibold text-ink leading-snug">My Measurements</p>
        <p className="mobile-caption font-normal text-ink-muted">
          {measurementCount === null
            ? 'Loading…'
            : `${measurementCount} record${measurementCount === 1 ? '' : 's'}`}
        </p>
      </div>
      <ChevronRight size={18} className="text-ink-faint shrink-0" />
    </Link>
  );
}
