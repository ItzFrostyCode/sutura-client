'use client';

import { useCallback, useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import AddressSelect from './AddressSelect';
import {
  EMPTY_PSGC_ADDRESS, fetchBarangays, fetchDistricts,
  type PsgcAddress, type PsgcItem,
} from '@/lib/psgc';

type ListState = { items: PsgcItem[]; loading: boolean; error: string };
const EMPTY_LIST: ListState = { items: [], loading: false, error: '' };
const LOAD_ERROR = 'Couldn’t load this list. Check your connection.';

/** SUTURA lists shops in Davao City (the server refuses anywhere else), so the province and city are fixed. */
export const DAVAO_AREA = {
  province_code: '112400000', province_name: 'Davao del Sur',
  city_code: '112402000', city_name: 'Davao City',
} as const;

const isDavao = (a: PsgcAddress) => a.province_code === DAVAO_AREA.province_code && a.city_code === DAVAO_AREA.city_code;

/** Which picks are missing. Davao City asks for its district too. (`_districtRequired` is kept for older callers.) */
export function addressErrors(a: PsgcAddress, _districtRequired = true): Partial<Record<keyof PsgcAddress, string>> {
  const e: Partial<Record<keyof PsgcAddress, string>> = {};
  if (!isDavao(a)) e.city_code = 'SUTURA is open to shops in Davao City for now.';
  if (!a.district_code) e.district_code = 'Choose the district.';
  if (!a.barangay_code) e.barangay_code = 'Choose the barangay.';
  return e;
}

/** A fixed value, shown like a field so the rows line up. */
function LockedField({ id, label, value }: { readonly id: string; readonly label: string; readonly value: string }) {
  return (
    <div data-field={id}>
      <p className="mb-1.5 text-[13px] font-medium text-ink-body">{label}</p>
      <div id={id} className="flex min-h-12 items-center justify-between gap-2 rounded-xl bg-sunken px-4 text-base text-ink">
        <span className="truncate">{value}</span>
        <Lock size={14} className="shrink-0 text-ink-muted" aria-label="Fixed" />
      </div>
    </div>
  );
}

/**
 * Province and City (fixed: Davao del Sur, Davao City) → District → Barangay, all from the server's PSGC copy.
 * District narrows the barangays; picking a barangay first fills in its district. A value the lists no longer
 * have (a kept draft, a renamed barangay) is cleared instead of being sent.
 */
export default function AddressFields({
  idPrefix, value, onChange, showErrors, onDistrictRequiredChange,
}: {
  readonly idPrefix: string;
  readonly value: PsgcAddress;
  readonly onChange: (next: PsgcAddress) => void;
  /** Show "missing" errors (after Continue was pressed). */
  readonly showErrors: boolean;
  /** Always true now (Davao City); kept for older callers. */
  readonly onDistrictRequiredChange?: (required: boolean) => void;
}) {
  const [districts, setDistricts] = useState<ListState>(EMPTY_LIST);
  const [barangays, setBarangays] = useState<ListState>(EMPTY_LIST);
  const [retry, setRetry] = useState(0);

  // Anything outside Davao City (an old draft, another form's value) starts again inside it.
  useEffect(() => {
    if (!isDavao(value)) onChange({ ...EMPTY_PSGC_ADDRESS, ...DAVAO_AREA });
  }, [value, onChange]);

  useEffect(() => { onDistrictRequiredChange?.(true); }, [onDistrictRequiredChange]);

  const run = useCallback((set: (s: ListState) => void, load: () => Promise<PsgcItem[]>) => {
    let alive = true;
    set({ items: [], loading: true, error: '' });
    load()
      .then((items) => { if (alive) set({ items, loading: false, error: '' }); })
      .catch(() => { if (alive) set({ items: [], loading: false, error: LOAD_ERROR }); });
    return () => { alive = false; };
  }, []);

  useEffect(() => run(setDistricts, () => fetchDistricts(DAVAO_AREA.city_code).then((r) => r.items)), [run, retry]);
  // The whole city until a district is picked, then that district's barangays.
  useEffect(() => run(setBarangays, () => fetchBarangays(DAVAO_AREA.city_code, value.district_code || undefined)), [run, value.district_code, retry]);

  // Drop picks the lists don't have (never send a code the server would refuse).
  useEffect(() => {
    if (districts.loading || districts.error || districts.items.length === 0 || !value.district_code) return;
    if (!districts.items.some((d) => d.code === value.district_code)) {
      onChange({ ...value, district_code: '', district_name: '', barangay_code: '', barangay_name: '' });
    }
  }, [districts, value, onChange]);
  useEffect(() => {
    if (barangays.loading || barangays.error || barangays.items.length === 0 || !value.barangay_code) return;
    if (!barangays.items.some((b) => b.code === value.barangay_code)) onChange({ ...value, barangay_code: '', barangay_name: '' });
  }, [barangays, value, onChange]);

  const errors = showErrors ? addressErrors(value) : {};
  const again = () => setRetry((n) => n + 1);

  const pickBarangay = (b: PsgcItem | null) => {
    if (!b) { onChange({ ...value, barangay_code: '', barangay_name: '' }); return; }
    // Picked straight from the whole city: its district comes with it.
    const district = b.district ? districts.items.find((d) => d.name === b.district) : undefined;
    onChange({
      ...value,
      ...(district ? { district_code: district.code, district_name: district.name } : {}),
      barangay_code: b.code, barangay_name: b.name,
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <LockedField id={`${idPrefix}-province`} label="Province" value={DAVAO_AREA.province_name} />
        <div>
          <LockedField id={`${idPrefix}-city`} label="City/Municipality" value={DAVAO_AREA.city_name} />
          {errors.city_code && <p className="mt-1.5 text-xs text-danger">{errors.city_code}</p>}
        </div>
      </div>
      <p className="-mt-3 text-[13px] text-ink-muted">SUTURA is open to shops in Davao City for now.</p>

      <div className="grid gap-5 sm:grid-cols-2">
        <AddressSelect
          id={`${idPrefix}-district`}
          label="District"
          required
          placeholder="Search district"
          items={districts.items}
          value={value.district_code}
          loading={districts.loading}
          loadError={districts.error}
          onRetry={again}
          error={errors.district_code}
          // A new district: keep the barangay only if it is in that district (the list reloads and checks).
          onChange={(d) => onChange(d
            ? { ...value, district_code: d.code, district_name: d.name }
            : { ...value, district_code: '', district_name: '', barangay_code: '', barangay_name: '' })}
        />
        <AddressSelect
          id={`${idPrefix}-barangay`}
          label="Barangay"
          required
          placeholder={value.district_code ? `Search ${value.district_name} barangays` : 'Search barangay'}
          items={barangays.items}
          value={value.barangay_code}
          loading={barangays.loading}
          loadError={barangays.error}
          onRetry={again}
          error={errors.barangay_code}
          onChange={pickBarangay}
        />
      </div>
    </div>
  );
}
