import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

/** "Find a shop near you": a short pitch beside the Davao map art; Open Map goes to the map search. */
export default function HomeMapCta() {
  return (
    <section aria-labelledby="home-map-title" className="grid overflow-hidden rounded-xl border border-line bg-surface md:grid-cols-2">
      <div className="flex flex-col items-start justify-center gap-3 p-6 sm:p-10">
        <p className="mobile-overline flex items-center gap-1.5 bg-sunken px-3 py-1.5 text-ink-muted"><MapPin size={12} /> Davao City districts</p>
        <h2 id="home-map-title" className="mobile-h2 sm:tablet-h2 text-ink">Find a shop near you</h2>
        <p className="mobile-body-md max-w-sm text-ink-body">Browse verified tailoring branches across Davao City&rsquo;s districts on an interactive map.</p>
        <Link href="/search" className="btn-primary-mobile mt-3 inline-flex items-center gap-2 self-end bg-ink px-6 text-white transition-colors hover:bg-taupe lg:self-start">
          <MapPin size={16} /> Open map
        </Link>
      </div>
      <div className="relative aspect-[16/9] md:aspect-auto md:min-h-[260px]">
        <Image src="/images/davao_map_banner.jpg" alt="Map of Davao City with tailoring shops pinned" fill sizes="(min-width: 768px) 480px, 100vw" className="object-cover object-left" />
      </div>
    </section>
  );
}
