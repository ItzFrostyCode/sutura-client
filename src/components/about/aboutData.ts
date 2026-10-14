import {
  BarChart3, CalendarCheck2, ClipboardList, LayoutDashboard, Map as MapIcon, Search, ShieldCheck, type LucideIcon,
} from 'lucide-react';

// From the approved capstone proposal (Title&Objectives.md), in plain words. Keep these in step with the paper.
export const THESIS_TITLE = 'SUTURA: A Web-Based Tailoring Shop Tracker System';

/** The seven specific objectives, customer-facing ones first. */
export const OBJECTIVES: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: Search, title: 'Shop discovery & search', desc: 'Search for tailoring services by garment, filter by place and specialization, and see the full profile of every verified shop in Davao City.' },
  { Icon: MapIcon, title: 'Map of verified branches', desc: 'See every verified branch on the map, filter by area, and get directions to the one you choose.' },
  { Icon: ClipboardList, title: 'Order tracking & measurements', desc: 'Staff record your measurements and update each production stage; you follow your order from placement to pickup.' },
  { Icon: LayoutDashboard, title: 'Shop dashboard', desc: 'Shops set up their storefront, services and designs, itemized prices, appointment schedules and visibility.' },
  { Icon: CalendarCheck2, title: 'Subscriptions & accounts', desc: 'Shops register, choose the Basic, Pro or Premium plan, and give their staff role-based access.' },
  { Icon: BarChart3, title: 'Reports & analytics', desc: 'Owners see real-time reports on sales, outstanding balances and staff productivity; the admin sees subscription activity.' },
  { Icon: ShieldCheck, title: 'Admin dashboard', desc: 'The system admin approves shop registrations, checks apparel categories and branch locations, and watches platform activity.' },
];

/** The capstone group, alphabetical by surname. Names only, on purpose. */
export const TEAM = ['Joshua Wayman A. Arabejo', 'Jossua A. Bongo', 'Renalyn C. Bulotano', 'Clareynz June A. Masudog'];
export const ADVISER = 'Jessiel Chris D. Hilot';
