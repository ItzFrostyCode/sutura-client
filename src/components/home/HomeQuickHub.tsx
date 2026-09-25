import Link from 'next/link';
import { MapPin, Sparkles, Scissors, Activity } from 'lucide-react';

export default function HomeQuickHub() {
  return (
    <section aria-labelledby="quick-hub-title" className="max-w-7xl mx-auto mobile-screen-margins pt-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="mobile-overline sm:tablet-overline text-taupe">Specialties & Services</p>
          <h2 id="quick-hub-title" className="mobile-h2 sm:tablet-h2 text-ink">Tailoring Quick Hub</h2>
        </div>
        <Link href="/search?tab=services" className="text-xs font-semibold text-taupe hover:text-taupe-hover min-h-[44px] flex items-center">
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Link
          href="/search?q=bespoke"
          className="bg-surface border border-line p-3.5 hover:border-taupe/60 transition-all group flex flex-col justify-between min-h-[96px] active:scale-[0.98]"
        >
          <div className="w-9 h-9 bg-sunken border border-line flex items-center justify-center text-taupe mb-2 group-hover:bg-taupe group-hover:text-white group-hover:border-taupe transition-colors">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="mobile-h4 text-ink">Bespoke & Custom</p>
            <p className="mobile-caption text-ink-muted leading-tight mt-0.5 font-normal">Barong, Suits, & Gowns</p>
          </div>
        </Link>

        <Link
          href="/search?q=alteration"
          className="bg-surface border border-line p-3.5 hover:border-taupe/60 transition-all group flex flex-col justify-between min-h-[96px] active:scale-[0.98]"
        >
          <div className="w-9 h-9 bg-sunken border border-line flex items-center justify-center text-taupe mb-2 group-hover:bg-taupe group-hover:text-white group-hover:border-taupe transition-colors">
            <Scissors size={18} />
          </div>
          <div>
            <p className="mobile-h4 text-ink">Alterations & Repairs</p>
            <p className="mobile-caption text-ink-muted leading-tight mt-0.5 font-normal">Hemming, resize & zipper</p>
          </div>
        </Link>

        <Link
          href="/map"
          className="bg-surface border border-line p-3.5 hover:border-taupe/60 transition-all group flex flex-col justify-between min-h-[96px] active:scale-[0.98]"
        >
          <div className="w-9 h-9 bg-sunken border border-line flex items-center justify-center text-taupe mb-2 group-hover:bg-taupe group-hover:text-white group-hover:border-taupe transition-colors">
            <MapPin size={18} />
          </div>
          <div>
            <p className="mobile-h4 text-ink">Find Local Stores</p>
            <p className="mobile-caption text-ink-muted leading-tight mt-0.5 font-normal">Davao districts map</p>
          </div>
        </Link>

        <Link
          href="/track"
          className="bg-surface border border-line p-3.5 hover:border-taupe/60 transition-all group flex flex-col justify-between min-h-[96px] active:scale-[0.98]"
        >
          <div className="w-9 h-9 bg-sunken border border-line flex items-center justify-center text-taupe mb-2 group-hover:bg-taupe group-hover:text-white group-hover:border-taupe transition-colors">
            <Activity size={18} />
          </div>
          <div>
            <p className="mobile-h4 text-ink">Track Order</p>
            <p className="mobile-caption text-ink-muted leading-tight mt-0.5 font-normal">Cutting to pickup status</p>
          </div>
        </Link>
      </div>
    </section>
  );
}
