import type { MeasurementRecord } from '@/components/measurements/measurementTypes';

export interface MyMeasurement extends MeasurementRecord {
  store_id: number;
  store: { id: number; name: string; slug: string; logo_path: string | null } | null;
}

export interface ProfileGroup {
  storeId: number;
  storeName: string;
  storeSlug: string;
  storeLogo: string | null;
  profileName: string;
  versions: MyMeasurement[];
}

export const SOURCE_LABELS: Record<string, string> = {
  store_owner: "Store's own record",
  customer: 'Self-reported by you',
};

export function groupMeasurements(records: MyMeasurement[]): ProfileGroup[] {
  const groups = new Map<string, ProfileGroup>();
  for (const r of records) {
    const key = `${r.store_id}::${r.profile_name.trim()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.versions.push(r);
    } else {
      groups.set(key, {
        storeId: r.store_id,
        storeName: r.store?.name ?? 'Store',
        storeSlug: r.store?.slug ?? '',
        storeLogo: r.store?.logo_path ?? null,
        profileName: r.profile_name,
        versions: [r],
      });
    }
  }
  for (const g of groups.values()) {
    g.versions.sort((a, b) => a.id - b.id);
  }
  return Array.from(groups.values());
}
