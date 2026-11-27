'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Map as MapIcon } from 'lucide-react';
import { DAVAO_DISTRICTS } from '@/lib/davaoLocations';
import { fetchCities, fetchProvinces, type PsgcItem } from '@/lib/psgc';
import { DAVAO_CITY_CODE, placeLabel } from './filter/LocationChips';

const MAP = '/search?tab=store';

const pill = (on: boolean) =>
  `flex h-11 items-center rounded-full border px-4 text-sm transition-colors ${
    on ? 'border-ink bg-ink font-semibold text-white' : 'border-line bg-surface text-ink hover:border-ink'
  }`;

/** The map, narrowed to a province, a city or municipality in it, and (Davao City) one of its districts. */
function mapLink(province: string, city = '', district = ''): string {
  const p = new URLSearchParams();
  p.set('province', province);
  if (city) p.set('city', city);
  if (district) p.set('district', district);
  return `${MAP}&${p.toString()}`;
}

/**
 * Thesis objective "Map-Based Interface: view the branch locations of verified shops and filter shops by area":
 * pick a Davao province first, then its districts appear (in Davao del Sur: Davao City and its 11 districts, then the
 * other cities and municipalities). Each one opens the map already narrowed to it; "Open the map" shows everything.
 */
export default function HomeMapDistricts() {
  const [provinces, setProvinces] = useState<PsgcItem[]>([]);
  const [province, setProvince] = useState('');
  const [cities, setCities] = useState<PsgcItem[]>([]);

  useEffect(() => {
    let alive = true;
    fetchProvinces().then((p) => { if (alive) setProvinces(p); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!province) { setCities([]); return; }
    let alive = true;
    fetchCities(province).then((c) => { if (alive) setCities(c); }).catch(() => {});
    return () => { alive = false; };
  }, [province]);

  const picked = provinces.find((p) => p.code === province);
  const hasDavaoCity = cities.some((c) => c.code === DAVAO_CITY_CODE);
  const otherCities = cities.filter((c) => c.code !== DAVAO_CITY_CODE);

  return (
    <section aria-labelledby="home-map-title" className="card-soft grid overflow-hidden sm:grid-cols-2">
      <div className="relative h-40 sm:order-last sm:h-auto">
        <Image src="/images/davao_map_banner.jpg" alt="" fill sizes="(min-width: 640px) 480px, 100vw" className="object-cover" />
      </div>
      <div className="flex flex-col p-4 sm:p-6">
        <h2 id="home-map-title" className="mobile-h2 sm:tablet-h2 text-ink">Shops by district</h2>
        <p className="mobile-body-sm mt-2 text-ink-muted">Pick a province, then a district, to see its verified tailoring branches on the map.</p>

        <p className="mt-4 text-xs font-medium text-ink-muted">Province</p>
        <div role="group" aria-label="Province" className="mt-2 flex flex-wrap gap-2">
          {provinces.map((p) => (
            <button key={p.code} type="button" aria-pressed={province === p.code} onClick={() => setProvince(province === p.code ? '' : p.code)} className={pill(province === p.code)}>
              {placeLabel(p.name)}
            </button>
          ))}
        </div>

        {province && (
          <>
            <p className="mt-4 text-xs font-medium text-ink-muted">District</p>
            <ul className="mt-2 flex flex-wrap gap-2" aria-label={`Districts of ${picked ? placeLabel(picked.name) : 'the province'}`}>
              <li><Link href={mapLink(province)} className={pill(false)}>All {picked ? placeLabel(picked.name) : 'of this province'}</Link></li>
              {hasDavaoCity && (
                <>
                  <li><Link href={mapLink(province, DAVAO_CITY_CODE)} className={pill(false)}>Davao City</Link></li>
                  {DAVAO_DISTRICTS.map((d) => (
                    <li key={d}><Link href={mapLink(province, DAVAO_CITY_CODE, d)} className={pill(false)}>{d}</Link></li>
                  ))}
                </>
              )}
              {otherCities.map((c) => (
                <li key={c.code}><Link href={mapLink(province, c.code)} className={pill(false)}>{placeLabel(c.name)}</Link></li>
              ))}
            </ul>
          </>
        )}

        <Link href={MAP} className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-taupe-dark px-6 text-base font-semibold text-white transition-colors hover:bg-nav-bar sm:w-fit">
          <MapIcon size={18} aria-hidden /> Open the map
        </Link>
      </div>
    </section>
  );
}
