import React from 'react';
import { ALL_DAVAO_BARANGAYS, districtOfBarangay } from '@/lib/davaoLocations';
import type { BranchFormData } from './branchHelpers';

const FIELD = 'w-full px-4 py-2 bg-canvas border border-line rounded-lg text-ink focus:outline-none focus:border-taupe text-base sm:text-sm';
const LABEL = 'block text-sm font-medium text-ink-body mb-1';

/**
 * Barangay from Davao City's official list.
 */
export default function BranchPlaceFields({
  formData,
  setFormData,
}: Readonly<{ formData: BranchFormData; setFormData: React.Dispatch<React.SetStateAction<BranchFormData>> }>) {
  const barangay = formData.barangay ?? '';
  const isOldValue = barangay !== '' && !ALL_DAVAO_BARANGAYS.includes(barangay);

  const pickBarangay = (next: string) =>
    setFormData((prev) => ({ ...prev, barangay: next, district: districtOfBarangay(next) ?? '' }));

  return (
    <div>
      <label htmlFor="branch-barangay" className={LABEL}>
        Barangay
      </label>
      <select id="branch-barangay" value={barangay} onChange={(e) => pickBarangay(e.target.value)} className={FIELD}>
        <option value="">Select Barangay (Davao City)</option>
        {isOldValue && <option value={barangay}>{barangay} (saved earlier)</option>}
        {ALL_DAVAO_BARANGAYS.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>
    </div>
  );
}
