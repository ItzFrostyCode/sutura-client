import {
  Radar, ShieldCheck, LineChart,
  ScanSearch, CalendarCheck2, Activity, PackageCheck,
} from 'lucide-react';
import type { OperatingHours } from '@/lib/storeStatus';

export interface StoreResult {
  id: number;
  slug: string;
  name: string;
  logo_path: string | null;
  banner_path: string | null;
  reviews_count: number;
  reviews_avg_rating: number | null;
  branches: { city: string | null; name: string }[];
  operating_hours?: OperatingHours | null;
}

export const ABOUT_PILLARS = [
  {
    Icon: Radar,
    title: 'Discover by Garment & Location',
    desc: 'Search verified tailoring stores across Davao City by the exact garment you need — Barong, Filipiniana, uniforms, and more — and see them pinned on the map.',
  },
  {
    Icon: ShieldCheck,
    title: 'Verified Stores Only',
    desc: 'Every store goes through admin review before it appears here — no unverified listings, no guessing which tailor is legitimate.',
  },
  {
    Icon: LineChart,
    title: 'Real-Time Order Tracking',
    desc: 'Once you place an order, follow it from cutting to pickup with a live status tracker — no more "sa na po ba?" messages.',
  },
];

// Matches the approved thesis's own Order Tracking and Measurement Module
// sequence exactly (use case, BPMN, and activity diagrams — pages 66-75):
// order type → payment → shop feasibility review/approval → fabrication →
// fitting → balance settlement/pickup/rating. Earlier drafts of this list
// compressed that into 4 generic steps and silently dropped the payment
// and fitting steps the approved diagrams both call out explicitly.
export const HOW_IT_WORKS = [
  {
    step: '01',
    Icon: ScanSearch,
    title: 'Search & Discover',
    desc: 'Filter by garment type, price, rating, or Davao district to find a verified store that does exactly what you need.',
  },
  {
    step: '02',
    Icon: CalendarCheck2,
    title: 'Order & Pay Downpayment',
    desc: 'Reserve a fitting or place a custom order, then settle the required downpayment to confirm it with the store.',
  },
  {
    step: '03',
    Icon: ShieldCheck,
    title: 'Store Reviews & Approves',
    desc: 'The store checks feasibility and confirms your order before any cutting or fabrication begins.',
  },
  {
    step: '04',
    Icon: Activity,
    title: 'Track Production Live',
    desc: 'Watch your garment move through cutting, sewing, and quality checks in real time until it’s ready for fitting.',
  },
  {
    step: '05',
    Icon: PackageCheck,
    title: 'Fitting, Balance & Pickup',
    desc: 'Try it on, request adjustments if needed, settle the remaining balance, then claim and rate your finished garment.',
  },
];
