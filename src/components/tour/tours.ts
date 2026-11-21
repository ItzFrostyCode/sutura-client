/**
 * Product tours started from the Welcome Guide's "Configure now" (…?tour=<id>).
 * Each stop points at a `data-tour` element on that page; stops whose element
 * isn't on screen (another role, a phone layout, an empty list) are skipped.
 */
export type TourId = 'services' | 'jobs' | 'payments' | 'appointments' | 'staff' | 'branches' | 'catalog' | 'profile';

export interface TourStop {
  /** CSS selector of the element to spotlight. */
  element: string;
  title: string;
  text: string;
}

export interface Tour {
  id: TourId;
  /** Page the tour runs on. */
  path: string;
  /** Also runs on pages under this prefix (the Shop Profile is the owner's /store/<slug> page). */
  pathPrefix?: string;
  stops: TourStop[];
}

export const TOURS: Record<TourId, Tour> = {
  services: {
    id: 'services',
    path: '/dashboard/services',
    stops: [
      {
        element: '[data-tour="services-create"]',
        title: 'Add your services',
        text: 'Start here. Add each service you offer, like Barong, School Uniform or Alterations, with its price and how many days it usually takes.',
      },
      {
        element: '[data-tour="services-list"]',
        title: 'Your service list',
        text: 'Everything you offer shows here, the same way customers see it on your shop page. Open a service to edit it; every section has a pencil.',
      },
      {
        element: '[data-tour="tab-packages"]',
        title: 'Combo packages',
        text: 'Bundle two or more services at a special price, for example a full uniform set. Customers book the whole set as one order.',
      },
      {
        element: '[data-tour="tab-analytics"]',
        title: 'What sells',
        text: 'See which services bring in the most orders and revenue, and how customers rate them.',
      },
    ],
  },
  jobs: {
    id: 'jobs',
    path: '/dashboard/jobs',
    stops: [
      {
        element: '[data-tour="jobs-create"]',
        title: 'Create an order',
        text: 'For walk-in customers: enter who it is for, their measurements, what they are ordering, and the payment. Online orders arrive here on their own.',
      },
      {
        element: '[data-tour="jobs-toolbar"]',
        title: 'Find any order',
        text: 'Switch between walk-in and online orders, search by customer or order number, and change the view: board, list or columns.',
      },
      {
        element: '[data-tour="jobs-board"]',
        title: 'Your production board',
        text: 'Each column is a step in the work, from Pending to Ready for Pickup. Approve new orders, then use each card’s button to move it forward as the work is done. The customer sees every step in My Orders.',
      },
    ],
  },
  payments: {
    id: 'payments',
    path: '/dashboard/payments',
    stops: [
      {
        element: '[data-tour="payments-stats"]',
        title: 'Money at a glance',
        text: 'What customers still owe, GCash receipts waiting for you to check, and balances due at pickup.',
      },
      {
        element: '[data-tour="tab-receipts"]',
        title: 'Check GCash receipts',
        text: 'When a customer pays by GCash, their receipt lands here. Compare it with your GCash app, then Verify it, or Reject it with a reason so they can send it again.',
      },
      {
        element: '[data-tour="tab-job_balances"]',
        title: 'Collect balances',
        text: 'Every order with money still due. Use Log Payment when a customer pays in cash at the counter.',
      },
      {
        element: '[data-tour="tab-methods"]',
        title: 'Your GCash account',
        text: 'Add the GCash number customers pay to. It shows on online orders so customers can pay right away.',
      },
      {
        element: '[data-tour="tab-statements"]',
        title: 'Statements',
        text: 'Download or print your payment records for any period, as a PDF or Excel file.',
      },
      {
        element: 'a[href="/dashboard/reports"]',
        title: 'Reports',
        text: 'Revenue, best-selling garments, staff output and unclaimed pickups, all in one place, and printable too.',
      },
    ],
  },
  appointments: {
    id: 'appointments',
    path: '/dashboard/appointments',
    stops: [
      {
        element: '[data-tour="appts-create"]',
        title: 'Book an appointment',
        text: 'Add a fitting, consultation or measurement session for a walk-in or phone customer. Online bookings arrive here on their own.',
      },
      {
        element: '[data-tour="appts-stats"]',
        title: 'Today at a glance',
        text: 'Today’s schedule, bookings waiting for your approval, and what’s confirmed. Tap a card to filter the list.',
      },
      {
        element: '[data-tour="appts-toolbar"]',
        title: 'Find and switch views',
        text: 'Search by customer, filter by status, and switch between list, cards and a calendar.',
      },
      {
        element: '[data-tour="appts-list"]',
        title: 'Run each visit',
        text: 'Approve or decline new bookings, check customers in when they arrive, and turn a fitting into a Job Order once measurements are confirmed.',
      },
    ],
  },
  staff: {
    id: 'staff',
    path: '/dashboard/staff',
    stops: [
      {
        element: '[data-tour="staff-create"]',
        title: 'Add your team',
        text: 'Create an account for each tailor, cutter or designer, pick their branch and role. Make someone a branch manager to let them run that branch.',
      },
      {
        element: '[data-tour="staff-stats"]',
        title: 'Workload at a glance',
        text: 'How many staff are active, how many jobs they’re on, and whether anyone is overloaded.',
      },
      {
        element: '[data-tour="staff-list"]',
        title: 'Your staff list',
        text: 'Filter by role, status, workload or branch. Open anyone to see their profile, jobs and work history. Whoever moves an order to a stage is recorded on it automatically.',
      },
    ],
  },
  branches: {
    id: 'branches',
    path: '/dashboard/branches',
    stops: [
      {
        element: '[data-tour="branches-create"]',
        title: 'Add a branch shop',
        text: 'Add each extra location with its address, map pin and contact number. Your main shop never counts toward your plan’s branch limit.',
      },
      {
        element: '[data-tour="branches-list"]',
        title: 'Your locations',
        text: 'A new or moved branch waits for SUTURA to check its map pin before customers can see it. Assign a branch manager to let them run it.',
      },
      {
        element: '[data-tour="branches-view"]',
        title: 'Cards or map',
        text: 'Switch to the map to see every location the way customers find you.',
      },
    ],
  },
  profile: {
    id: 'profile',
    path: '/dashboard/profile',
    pathPrefix: '/store/',
    stops: [
      {
        element: '[data-tour="profile-hero"]',
        title: 'This is your shop page',
        text: 'It’s exactly what customers see. Signed in as the owner, you edit it right here: change your cover photo and logo, and use Edit Profile to update your details.',
      },
      {
        element: '[data-tour="profile-content"]',
        title: 'Fill in every tab',
        text: 'Use the tabs to add your description and social links (About), your opening hours, and your services and designs. A complete page helps customers choose you.',
      },
    ],
  },
  catalog: {
    id: 'catalog',
    path: '/dashboard/catalog',
    stops: [
      {
        element: '[data-tour="catalog-create"]',
        title: 'Show your work',
        text: 'Add photos of past work: a barong, a gown, a uniform set. Customers browse them and can order or book a fitting for a design they like.',
      },
      {
        element: '[data-tour="catalog-grid"]',
        title: 'Your catalog',
        text: 'Every design shows here the way customers see it. Search and filter by garment type, or open one to edit its photos, price and sizes.',
      },
    ],
  },
};

export const isTourId = (v: string | null): v is TourId => v !== null && v in TOURS;

// Progress is kept in this browser (per signed-in user): finishing or skipping a tour marks it done.
const key = (userId: number | string | undefined) => `sutura_tours_done:${userId ?? 'guest'}`;

export function doneTours(userId: number | string | undefined): TourId[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key(userId)) ?? '[]');
    return Array.isArray(raw) ? raw.filter((x): x is TourId => isTourId(x)) : [];
  } catch {
    return [];
  }
}

export function markTourDone(userId: number | string | undefined, id: TourId) {
  try {
    const next = Array.from(new Set([...doneTours(userId), id]));
    localStorage.setItem(key(userId), JSON.stringify(next));
    window.dispatchEvent(new Event('sutura-tours-changed'));
  } catch { /* storage blocked: the badge just won't show */ }
}
