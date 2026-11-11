import Image from 'next/image';
import Link from 'next/link';
import { Map as MapIcon } from 'lucide-react';
import { DAVAO_DISTRICTS } from '@/lib/davaoLocations';

const MAP = '/search?tab=store';

/**
 * Thesis objective "Map-Based Interface: view the branch locations of verified shops and filter shops by area":
 * Davao City's 11 districts, each one tap to the map already narrowed to it, plus the full map.
 */
export default function HomeMapDistricts() {
  return (
    <section aria-labelledby="home-map-title" className="card-soft grid overflow-hidden sm:grid-cols-2">
      <div className="relative h-40 sm:order-last sm:h-auto">
        <Image src="/images/davao_map_banner.jpg" alt="" fill sizes="(min-width: 640px) 480px, 100vw" className="object-cover" />
      </div>
      <div className="flex flex-col p-4 sm:p-6">
        <h2 id="home-map-title" className="mobile-h2 sm:tablet-h2 text-ink">Shops by district</h2>
        <p className="mobile-body-sm mt-2 text-ink-muted">See verified tailoring branches on the map, and get directions to the one you pick.</p>
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Davao City districts">
          {DAVAO_DISTRICTS.map((district) => (
            <li key={district}>
              <Link href={`${MAP}&district=${encodeURIComponent(district)}`} className="flex h-11 items-center rounded-full border border-line bg-surface px-4 text-sm text-ink transition-colors hover:border-ink">
                {district}
              </Link>
            </li>
          ))}
        </ul>
        <Link href={MAP} className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-taupe-dark px-6 text-base font-semibold text-white transition-colors hover:bg-nav-bar sm:w-fit">
          <MapIcon size={18} aria-hidden /> Open the map
        </Link>
      </div>
    </section>
  );
}
