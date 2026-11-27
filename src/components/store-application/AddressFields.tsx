'use client';

import { useCallback, useEffect, useState } from 'react';
import AddressSelect from './AddressSelect';
import {
  EMPTY_PSGC_ADDRESS, fetchBarangays, fetchCities, fetchDistricts, fetchProvinces,
  type PsgcAddress, type PsgcItem,
} from '@/lib/psgc';

type ListState = { items: PsgcItem[]; loading: boolean; error: string };
const EMPTY_LIST: ListState = { items: [], loading: false, error: '' };
const LOAD_ERROR = 'Couldn’t load this list. Check your connection.';

/** Davao City (PSGC). The only city in the Davao provinces with districts: its 11. */
export const DAVAO_CITY_CODE = '112402000';

/** Which picks are missing. Davao City asks for its district too. */
export function addressErrors(
  a: PsgcAddress,
  districtRequired: boolean = a.city_code === DAVAO_CITY_CODE,
): Partial<Record<keyof PsgcAddress, string>> {
  const e: Partial<Record<keyof PsgcAddress, string>> = {};
  if (!a.province_code) e.province_code = 'Choose your province.';
  if (!a.city_code) e.city_code = 'Choose your city or municipality.';
  if (districtRequired && !a.district_code) e.district_code = 'Choose the district.';
  if (!a.barangay_code) e.barangay_code = 'Choose the barangay.';
  return e;
}

/**
 * Province (the Davao provinces) → City/Municipality → District (Davao City only) → Barangay, all from the server's PSGC
 * copy. Each list shows only what belongs to the pick above it, and changing a pick clears everything below it. In
 * Davao City the district comes first and the barangays are only that district's. A value the lists no longer have (a
 * kept draft, a renamed barangay) is cleared instead of being sent.
 */
export default function AddressFields({
  idPrefix, value, onChange, showErrors, onDistrictRequiredChange,
}: {
  readonly idPrefix: string;
  readonly value: PsgcAddress;
  readonly onChange: (next: PsgcAddress) => void;
  /** Show "missing" errors (after Continue was pressed). */
  readonly showErrors: boolean;
  readonly onDistrictRequiredChange?: (required: boolean) => void;
}) {
  const [provinces, setProvinces] = useState<ListState>(EMPTY_LIST);
  const [cities, setCities] = useState<ListState>(EMPTY_LIST);
  const [districts, setDistricts] = useState<ListState>(EMPTY_LIST);
  const [districtRequired, setDistrictRequired] = useState(false);
  const [barangays, setBarangays] = useState<ListState>(EMPTY_LIST);
  const [retry, setRetry] = useState(0);

  const run = useCallback((set: (s: ListState) => void, load: () => Promise<PsgcItem[]>) => {
    let alive = true;
    set({ items: [], loading: true, error: '' });
    load()
      .then((items) => { if (alive) set({ items, loading: false, error: '' }); })
      .catch(() => { if (alive) set({ items: [], loading: false, error: LOAD_ERROR }); });
    return () => { alive = false; };
  }, []);

  useEffect(() => run(setProvinces, fetchProvinces), [run, retry]);

  useEffect(() => {
    if (!value.province_code) { setCities(EMPTY_LIST); return; }
    return run(setCities, () => fetchCities(value.province_code));
  }, [run, value.province_code, retry]);

  useEffect(() => {
    if (!value.city_code) { setDistricts(EMPTY_LIST); setDistrictRequired(false); return; }
    let alive = true;
    setDistricts({ items: [], loading: true, error: '' });
    fetchDistricts(value.city_code)
      .then((r) => {
        if (!alive) return;
        setDistricts({ items: r.items, loading: false, error: '' });
        setDistrictRequired(!!r.districtRequired);
      })
      .catch(() => { if (alive) setDistricts({ items: [], loading: false, error: LOAD_ERROR }); });
    return () => { alive = false; };
  }, [value.city_code, retry]);

  useEffect(() => { onDistrictRequiredChange?.(districtRequired); }, [districtRequired, onDistrictRequiredChange]);

  // Barangays only once the city (and, in Davao City, its district) is known: never the whole list at once.
  const waitForDistrict = districts.loading || (districtRequired && !value.district_code);
  useEffect(() => {
    if (!value.city_code || waitForDistrict) { setBarangays(EMPTY_LIST); return; }
    return run(setBarangays, () => fetchBarangays(value.city_code, value.district_code || undefined));
  }, [run, value.city_code, value.district_code, waitForDistrict, retry]);

  // Drop picks the lists don't have (never send a code the server would refuse).
  useEffect(() => {
    if (provinces.loading || provinces.error || provinces.items.length === 0 || !value.province_code) return;
    if (!provinces.items.some((p) => p.code === value.province_code)) onChange({ ...EMPTY_PSGC_ADDRESS });
  }, [provinces, value, onChange]);
  useEffect(() => {
    if (cities.loading || cities.error || cities.items.length === 0 || !value.city_code) return;
    if (!cities.items.some((c) => c.code === value.city_code)) {
      onChange({ ...EMPTY_PSGC_ADDRESS, province_code: value.province_code, province_name: value.province_name });
    }
  }, [cities, value, onChange]);
  useEffect(() => {
    if (districts.loading || districts.error || !value.district_code) return;
    if (!districts.items.some((d) => d.code === value.district_code)) {
      onChange({ ...value, district_code: '', district_name: '', barangay_code: '', barangay_name: '' });
    }
  }, [districts, value, onChange]);
  useEffect(() => {
    if (barangays.loading || barangays.error || barangays.items.length === 0 || !value.barangay_code) return;
    if (!barangays.items.some((b) => b.code === value.barangay_code)) onChange({ ...value, barangay_code: '', barangay_name: '' });
  }, [barangays, value, onChange]);

  const errors = showErrors ? addressErrors(value, districtRequired) : {};
  const again = () => setRetry((n) => n + 1);
  const showDistrict = districtRequired || districts.items.length > 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <AddressSelect
          id={`${idPrefix}-province`}
          label="Province"
          required
          placeholder="Search province"
          items={provinces.items}
          value={value.province_code}
          loading={provinces.loading}
          loadError={provinces.error}
          onRetry={again}
          error={errors.province_code}
          onChange={(p) => onChange({ ...EMPTY_PSGC_ADDRESS, province_code: p?.code ?? '', province_name: p?.name ?? '' })}
        />
        <AddressSelect
          id={`${idPrefix}-city`}
          label="City/Municipality"
          required
          placeholder={value.province_name ? `Search ${value.province_name}` : 'Search city or municipality'}
          items={cities.items}
          value={value.city_code}
          disabled={!value.province_code}
          disabledHint="Choose a province first."
          loading={cities.loading}
          loadError={cities.error}
          onRetry={again}
          error={errors.city_code}
          onChange={(c) => onChange({
            ...EMPTY_PSGC_ADDRESS,
            province_code: value.province_code, province_name: value.province_name,
            city_code: c?.code ?? '', city_name: c?.name ?? '',
          })}
        />
      </div>
      <p className="-mt-3 text-[13px] text-ink-muted">SUTURA is open to shops in the Davao provinces.</p>

      {value.city_code && (
        <div className="grid gap-5 sm:grid-cols-2">
          {showDistrict && (
            <AddressSelect
              id={`${idPrefix}-district`}
              label="District"
              required={districtRequired}
              optional={!districtRequired}
              placeholder={`Search ${value.city_name} districts`}
              items={districts.items}
              value={value.district_code}
              loading={districts.loading}
              loadError={districts.error}
              onRetry={again}
              error={errors.district_code}
              // A new district: its own barangays only, so the barangay picked before is cleared.
              onChange={(d) => onChange({
                ...value,
                district_code: d?.code ?? '', district_name: d?.name ?? '',
                barangay_code: '', barangay_name: '',
              })}
            />
          )}
          <AddressSelect
            id={`${idPrefix}-barangay`}
            label="Barangay"
            required
            placeholder={value.district_name ? `Search ${value.district_name} barangays` : `Search ${value.city_name} barangays`}
            items={barangays.items}
            value={value.barangay_code}
            disabled={districtRequired && !value.district_code}
            disabledHint="Choose the district first."
            loading={barangays.loading}
            loadError={barangays.error}
            onRetry={again}
            error={errors.barangay_code}
            onChange={(b) => onChange({ ...value, barangay_code: b?.code ?? '', barangay_name: b?.name ?? '' })}
          />
        </div>
      )}
    </div>
  );
}
