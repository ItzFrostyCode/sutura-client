import type { OperatingHours } from '@/lib/storeStatus';

// The admin Shops map's pin data: one per live branch (or the shop's own
// location when it has none). Kept apart from the map file so the page can
// import it without pulling Leaflet into the server render.
export interface ShopPin {
  key: string;
  store_id: number;
  name: string;
  slug: string;
  branch_name: string | null;
  is_main: boolean;
  logo_path: string | null;
  operating_hours: OperatingHours | null;
  address: string | null;
  barangay: string | null;
  district: string | null;
  city: string | null;
  province: string | null;
  latitude: number;
  longitude: number;
  plan: string | null;
  plan_slug: string | null;
  subscription_status: string | null;
}

// Pin border per plan: the solid hue of each PlanPill tone (stone / blue / amber).
export const PLAN_RING: Record<string, string> = {
  basic: '#57534E',
  pro: '#1D4ED8',
  premium: '#B45309',
  none: '#A8A29E',
};

export const planRing = (planSlug: string | null) => PLAN_RING[planSlug ?? ''] ?? PLAN_RING.none;
