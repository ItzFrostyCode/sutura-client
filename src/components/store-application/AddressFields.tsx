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

/** Which required picks are missing (district only where the city needs one). */
export function addressErrors(a: PsgcAddress, districtRequired: boolean): Partial<Record<keyof PsgcAddress, string>> {
  const e: Partial<Record<keyof PsgcAddress, string>> = {};
  if (!a.province_code) e.province_code = 'Choose your province.';
  if (!a.city_code) e.city_code = 'Choose your city or municipality.';
  if (districtRequired && !a.district_code) e.district_code = 'Choose the district.';
  if (!a.barangay_code) e.barangay_code = 'Choose your barangay.';
  return e;
}

/**
 * Province → City/Municipality → District → Barangay (PSGC). Each list loads
 * once its parent is chosen, and changing a parent clears everything below
 * it. District shows only where the city has districts (Manila's, or Davao
 * City's own); in Manila the barangays depend on it, so it's required there.
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

  // Barangays: the whole city, or one district's (Manila). Davao districts don't narrow the list.
  const narrowBy = districtRequired ? value.district_code : '';
  useEffect(() => {
    if (!value.city_code || (districtRequired && !value.district_code)) { setBarangays(EMPTY_LIST); return; }
    return run(setBarangays, () => fetchBarangays(value.city_code, narrowBy || undefined));
  }, [run, value.city_code, districtRequired, value.district_code, narrowBy, retry]);

  const errors = showErrors ? addressErrors(value, districtRequired) : {};
  const again = () => setRetry((n) => n + 1);

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
          placeholder="Search city or municipality"
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

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Only where the city has districts; otherwise the field is skipped. */}
        {value.city_code && (districts.loading || districts.error || districts.items.length > 0) && (
          <AddressSelect
            id={`${idPrefix}-district`}
            label="District"
            required={districtRequired}
            optional={!districtRequired}
            placeholder="Search district"
            items={districts.items}
            value={value.district_code}
            loading={districts.loading}
            loadError={districts.error}
            onRetry={again}
            error={errors.district_code}
            onChange={(d) => onChange({
              ...value,
              district_code: d?.code ?? '', district_name: d?.name ?? '',
              // Manila's barangays depend on the district; Davao's don't.
              ...(districtRequired ? { barangay_code: '', barangay_name: '' } : {}),
            })}
          />
        )}
        <AddressSelect
          id={`${idPrefix}-barangay`}
          label="Barangay"
          required
          placeholder="Search barangay"
          items={barangays.items}
          value={value.barangay_code}
          disabled={!value.city_code || (districtRequired && !value.district_code)}
          disabledHint={!value.city_code ? 'Choose a city or municipality first.' : 'Choose the district first.'}
          loading={barangays.loading}
          loadError={barangays.error}
          onRetry={again}
          error={errors.barangay_code}
          onChange={(b) => onChange({ ...value, barangay_code: b?.code ?? '', barangay_name: b?.name ?? '' })}
        />
      </div>
    </div>
  );
}
