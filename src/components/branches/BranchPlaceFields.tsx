import React from 'react';
import { DAVAO_BARANGAYS, DAVAO_DISTRICTS, barangaysOf, districtOfBarangay } from '@/lib/davaoLocations';
import type { BranchFormData } from './branchHelpers';

const FIELD = 'w-full px-4 py-2 bg-canvas border border-line rounded-lg text-ink focus:outline-none focus:border-taupe text-base sm:text-sm';
const LABEL = 'block text-sm font-medium text-ink-body mb-1';

/**
 * District, then a barangay from Davao City's official list. Picking a barangay fills its district; changing the
 * district clears a barangay that is not in it. A barangay saved before this list existed stays as an option, so
 * editing an old branch never loses it (the server keeps an unchanged value as it is).
 */
export default function BranchPlaceFields({
  formData,
  setFormData,
}: Readonly<{ formData: BranchFormData; setFormData: React.Dispatch<React.SetStateAction<BranchFormData>> }>) {
  const district = formData.district ?? '';
  const barangay = formData.barangay ?? '';
  const isOldValue = barangay !== '' && districtOfBarangay(barangay) === null;

  const pickDistrict = (next: string) =>
    setFormData((prev) => {
      const inDistrict = districtOfBarangay(prev.barangay);
      return { ...prev, district: next, barangay: inDistrict && next && inDistrict !== next ? '' : prev.barangay };
    });

  const pickBarangay = (next: string) =>
    setFormData((prev) => ({ ...prev, barangay: next, district: districtOfBarangay(next) ?? prev.district }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label htmlFor="branch-district" className={LABEL}>
          District <span className="text-ink-faint font-normal">(for customer search)</span>
        </label>
        <select id="branch-district" value={district} onChange={(e) => pickDistrict(e.target.value)} className={FIELD}>
          <option value="">Not set</option>
          {DAVAO_DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="branch-barangay" className={LABEL}>
          Barangay <span className="text-ink-faint font-normal">(customers can search by it)</span>
        </label>
        <select id="branch-barangay" value={barangay} onChange={(e) => pickBarangay(e.target.value)} className={FIELD}>
          <option value="">Not set</option>
          {isOldValue && <option value={barangay}>{barangay} (saved earlier)</option>}
          {district
            ? barangaysOf(district).map((b) => <option key={b} value={b}>{b}</option>)
            : DAVAO_DISTRICTS.map((d) => (
                <optgroup key={d} label={d}>
                  {DAVAO_BARANGAYS[d].map((b) => <option key={b} value={b}>{b}</option>)}
                </optgroup>
              ))}
        </select>
      </div>
    </div>
  );
}
