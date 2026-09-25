import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

// Split layout (text panel + photo), not a full-bleed photo overlay — kept
// deliberately different from HomeSublimationBanner's treatment so the two
// don't read as the same template copy-pasted twice in a row. The text
// panel's own height (not a fixed short strip) is what scales this up
// properly on wider screens instead of staying a thin 230px band.
export default function HomeMapBanner() {
  return (
    <section className="max-w-7xl mx-auto mobile-screen-margins mt-8">
      <div className="grid sm:grid-cols-2 border border-line overflow-hidden">
        <div className="relative h-[200px] sm:h-auto sm:order-last">
          <Image
            src="/images/davao_map_banner.jpg"
            alt="Davao City Tailoring Stores Map"
            fill
            className="object-cover object-center"
          />
        </div>
        <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-surface">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sunken border border-line text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-3 w-fit">
            <MapPin size={11} className="text-taupe" />
            <span>Davao City Districts</span>
          </div>
          <h2 className="mobile-h2 sm:tablet-h2 text-ink mb-2">Find a Store Near You</h2>
          <p className="mobile-body-sm sm:tablet-body-md text-ink-muted font-normal leading-relaxed mb-5 max-w-sm">
            Browse verified tailoring branches across Davao City&apos;s districts on an interactive map.
          </p>
          <Link
            href="/map"
            className="min-h-[44px] h-[48px] px-6 w-fit bg-ink hover:bg-taupe text-white text-sm font-semibold transition-colors flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <MapPin size={16} />
            <span>Open Map</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
