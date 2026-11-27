'use client';

import { useEffect, useState } from 'react';
import { DAVAO_DISTRICTS } from '@/lib/davaoLocations';
import { fetchCities, fetchProvinces, type PsgcItem } from '@/lib/psgc';

/** PSGC codes: Davao del Sur, and Davao City in it (the only city here with districts). */
export const DAVAO_DEL_SUR_CODE = '112400000';
export const DAVAO_CITY_CODE = '112402000';

/** "Davao Del Norte" → "Davao del Norte", "City of Tagum" → "Tagum City" (PSGC writes the official names). */
export function placeLabel(name: string): string {
  return name.replace(/\bDel\b/g, 'del').replace(/\bDe\b/g, 'de').replace(/^City of (.+)$/, '$1 City');
}

/** province / city: PSGC codes; district: one of Davao City's 11. '' = all. */
export interface LocationValue {
  province: string;
  city: string;
  district: string;
}

/** A district from an older link (no province yet) is a Davao City district, in Davao del Sur. */
export function withPlace(v: LocationValue): LocationValue {
  if (v.district && !v.city) return { province: v.province || DAVAO_DEL_SUR_CODE, city: DAVAO_CITY_CODE, district: v.district };
  return v;
}

const chip = (on: boolean) =>
  `flex h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm transition-colors ${
    on ? 'border-ink bg-ink font-semibold text-white' : 'border-line bg-surface text-ink hover:border-ink'
  }`;

/**
 * Thesis objective "Map-Based Interface: filter shops by area". The province comes first (the Davao provinces), then
 * that province's own districts: "All <province>", and, in Davao del Sur, Davao City and its 11 districts, then the
 * other cities and municipalities. The server filters by the same codes (StoreBranch::placeFilter).
 */
export default function LocationChips({ value, onChange, titleClass }: {
  readonly value: LocationValue;
  readonly onChange: (next: LocationValue) => void;
  readonly titleClass: string;
}) {
  const v = withPlace(value);
  const [provinces, setProvinces] = useState<PsgcItem[]>([]);
  const [cities, setCities] = useState<PsgcItem[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchProvinces().then((p) => { if (alive) setProvinces(p); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!v.province) { setCities([]); return; }
    let alive = true;
    fetchCities(v.province).then((c) => { if (alive) setCities(c); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [v.province]);

  const province = provinces.find((p) => p.code === v.province);
  const hasDavaoCity = cities.some((c) => c.code === DAVAO_CITY_CODE);
  const otherCities = cities.filter((c) => c.code !== DAVAO_CITY_CODE);
  const pick = (city: string, district = '') => onChange({ province: v.province, city, district });

  return (
    <>
      <h3 className={titleClass}>Province</h3>
      <div role="group" aria-label="Province" className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={!v.province} onClick={() => onChange({ province: '', city: '', district: '' })} className={chip(!v.province)}>
          All provinces
        </button>
        {provinces.map((p) => (
          <button
            key={p.code}
            type="button"
            aria-pressed={v.province === p.code}
            onClick={() => onChange({ province: p.code, city: '', district: '' })}
            className={chip(v.province === p.code)}
          >
            {placeLabel(p.name)}
          </button>
        ))}
      </div>

      {v.province && (
        <>
          <h3 className={`${titleClass} mt-5`}>District</h3>
          <div role="group" aria-label="District" className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={!v.city} onClick={() => pick('')} className={chip(!v.city)}>
              All {province ? placeLabel(province.name) : 'of this province'}
            </button>
            {hasDavaoCity && (
              <>
                <button type="button" aria-pressed={v.city === DAVAO_CITY_CODE && !v.district} onClick={() => pick(DAVAO_CITY_CODE)} className={chip(v.city === DAVAO_CITY_CODE && !v.district)}>
                  Davao City
                </button>
                {DAVAO_DISTRICTS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={v.district === d}
                    onClick={() => pick(DAVAO_CITY_CODE, v.district === d ? '' : d)}
                    className={chip(v.district === d)}
                  >
                    {d}
                  </button>
                ))}
              </>
            )}
            {otherCities.map((c) => (
              <button
                key={c.code}
                type="button"
                aria-pressed={v.city === c.code}
                onClick={() => pick(v.city === c.code ? '' : c.code)}
                className={chip(v.city === c.code)}
              >
                {placeLabel(c.name)}
              </button>
            ))}
          </div>
        </>
      )}
      {failed && <p className="mt-2 text-xs text-danger">Couldn’t load the places. Check your connection and open the filter again.</p>}
    </>
  );
}
