'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  User as UserIcon, Settings, ChevronRight, ChevronLeft,
  Hammer, PackageCheck, Flag,
  Ruler, List as ListIcon, Calendar as CalendarIcon,
  Clock, CheckCircle2, XCircle, Ban, Lock, Info, CalendarDays, LifeBuoy,
  Store, Star, History, LogIn, ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { getMediaUrl } from '@/lib/media';
import api from '@/lib/axios';

interface MyOrder {
  id: number;
  status: string;
}

interface MyAppointment {
  id: number;
  appointment_type: string;
  intake_channel: string | null;
  status: string;
  scheduled_at: string;
  service_name: string | null;
  cancellation_reason: string | null;
  rebooking_blocked: boolean;
  shop: { name: string; slug: string } | null;
  branch: { name: string } | null;
}

// Matches Appointment::STATUSES exactly.
const STATUS_META: Record<string, { label: string; Icon: typeof Clock; tone: string }> = {
  pending: { label: 'Pending Confirmation', Icon: Clock, tone: 'text-ink-muted bg-sunken border-line' },
  confirmed: { label: 'Confirmed', Icon: CheckCircle2, tone: 'text-sage bg-sage/10 border-sage/20' },
  in_progress: { label: 'In Progress', Icon: Clock, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  completed: { label: 'Completed', Icon: CheckCircle2, tone: 'text-sage bg-sage/10 border-sage/20' },
  cancelled: { label: 'Cancelled', Icon: XCircle, tone: 'text-danger bg-danger/10 border-danger/20' },
  no_show: { label: 'No Show', Icon: Ban, tone: 'text-danger bg-danger/10 border-danger/20' },
};

const TYPE_LABELS: Record<string, string> = {
  consultation: 'Consultation', measurement: 'Measurement', fitting: 'Fitting',
  alteration: 'Alteration', pickup: 'Pickup',
};

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Same real tailoring-pipeline grouping as account/orders/page.tsx's own
// TABS — kept in sync manually since both need the exact same bucket
// logic (not imported from a shared module to avoid coupling a hub-page
// icon row to a list page's internal tab state).
const IN_PRODUCTION = new Set([
  'pending', 'design', 'pattern_making', 'mass_cutting_printing', 'cutting',
  'sewing', 'ready_for_fitting', 'final_adjustments', 'qc_ironing', 'on_hold',
]);

// The "Me" hub — reached by tapping the bottom nav's Me tab. Structurally
// modeled on Shopee's own Me tab (profile header + a "My Purchases"-style
// quick-filter icon row + other account sections), adapted to SUTURA's
// real domain: "Job Orders" instead of "My Purchases" (no shipping/
// payment-gateway steps here — the real pipeline is SUTURA's own
// production stages), plus Appointments and Measurements as their own
// cards since those are real, separate concepts this app has that an
// e-commerce app doesn't. Settings lives behind the gear icon, not as this
// page's own content — matches the reference's own separation between the
// Me hub and a dedicated settings screen.
// Guest Mode: the same 7 items a logged-in customer sees on the hub, as a
// plain list — no live data to preview since there's nothing to fetch for a
// guest. Every item routes straight to /login rather than its real
// destination (which would just bounce there anyway via AccountLayout's
// guard) — one hop instead of two.
const GUEST_MENU_ITEMS = [
  { label: 'Job Orders', Icon: ClipboardList },
  { label: 'My Appointments', Icon: CalendarIcon },
  { label: 'My Measurements', Icon: Ruler },
  { label: 'My Ratings', Icon: Star },
  { label: 'Recently Viewed', Icon: History },
  { label: 'Support Ticket', Icon: LifeBuoy },
  { label: 'Settings', Icon: Settings },
];

function GuestAccountHub() {
  const router = useRouter();
  return (
    <div>
      <div className="-mx-[10px] -mt-[10px] bg-surface border-b border-line p-4 mb-[10px]">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/');
              }
            }}
            aria-label="Back"
            className="p-1 -ml-1 text-ink-muted hover:text-ink active:opacity-70 transition-colors shrink-0"
          >
            <ChevronLeft size={22} />
          </button>
          <span className="text-sm font-bold text-ink">My Profile</span>
          <div className="w-8 shrink-0" aria-hidden="true" />
        </div>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-sunken flex items-center justify-center mx-auto mb-3">
            <UserIcon size={20} className="text-ink-faint" />
          </div>
          <p className="text-sm font-bold text-ink mb-1">You&apos;re browsing as a guest</p>
          <p className="text-xs text-ink-muted mb-4">Log in or sign up to book appointments, place orders, and track your garment.</p>
          <div className="flex items-center justify-center gap-2.5">
            <Link href="/login" className="px-5 py-2.5 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold rounded-lg transition-colors">
              Log In
            </Link>
            <Link href="/register" className="px-5 py-2.5 border border-line rounded-lg text-sm font-semibold text-ink hover:bg-sunken transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl overflow-hidden divide-y divide-line">
        {GUEST_MENU_ITEMS.map(({ label, Icon }) => (
          <Link key={label} href="/login" className="flex items-center gap-3 px-4 py-3.5 hover:bg-canvas transition-colors">
            <div className="w-9 h-9 rounded-full bg-sunken flex items-center justify-center shrink-0">
              <Icon size={16} className="text-taupe" />
            </div>
            <p className="flex-1 text-sm font-semibold text-ink">{label}</p>
            <ChevronRight size={16} className="text-ink-faint shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AccountHubPage() {
  const router = useRouter();
  const { user, isAuthenticated, hydrated } = useAuthStore();
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [appointments, setAppointments] = useState<MyAppointment[] | null>(null);
  const [measurementCount, setMeasurementCount] = useState<number | null>(null);
  const [apptView, setApptView] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/my-orders', { params: { per_page: 100 } })
      .then((res) => setOrders(res.data.data ?? []))
      .catch(() => setOrders([]));
    api.get('/my-appointments', { params: { per_page: 100 } })
      .then((res) => setAppointments(res.data.data ?? []))
      .catch(() => setAppointments([]));
    api.get('/my-measurements')
      .then((res) => setMeasurementCount((res.data.data ?? []).length))
      .catch(() => setMeasurementCount(0));
  }, [isAuthenticated]);

  const hasActiveAppointment = useMemo(
    () => (appointments ?? []).some((a) => a.status === 'pending' || a.status === 'confirmed'),
    [appointments],
  );
  // Backend already orders my-appointments by scheduled_at desc — the
  // active one (if any) is what's worth surfacing on the hub; otherwise
  // just the most recent overall.
  const previewAppt = useMemo(() => {
    const list = appointments ?? [];
    return list.find((a) => a.status === 'pending' || a.status === 'confirmed') ?? list[0] ?? null;
  }, [appointments]);
  const countsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of appointments ?? []) {
      const key = dayKey(new Date(a.scheduled_at));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [appointments]);

  const today = new Date();
  const calMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstWeekday = calMonthStart.getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const calCells: { key: string; num: number | null; isToday: boolean; isPast: boolean; hasAppt: boolean }[] = [];
  for (let i = 0; i < firstWeekday; i++) calCells.push({ key: `lead-${i}`, num: null, isToday: false, isPast: false, hasAppt: false });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(today.getFullYear(), today.getMonth(), d);
    const key = dayKey(date);
    calCells.push({
      key, num: d, isToday: key === dayKey(today),
      isPast: date < new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      hasAppt: (countsByDay.get(key) ?? 0) > 0,
    });
  }

  // Show the guest hub immediately — it has no auth-dependent data, so it's
  // safe to render before hydration completes. This prevents the blank flash
  // that was making it look like nothing happened when tapping the Me icon.
  if (!hydrated || !isAuthenticated) return <GuestAccountHub />;
  if (!user) return null;

  const inProduction = orders.filter((o) => IN_PRODUCTION.has(o.status)).length;
  const readyForPickup = orders.filter((o) => o.status === 'ready_for_pickup').length;
  const completed = orders.filter((o) => o.status === 'completed').length;

  // Track by Code moved to the header icon (PublicNav) — it's a no-login
  // lookup, so it belongs somewhere reachable without being on this page.
  const orderShortcuts = [
    { href: '/account/orders?tab=production', label: 'In Production', Icon: Hammer, count: inProduction },
    { href: '/account/orders?tab=pickup', label: 'Ready for Pickup', Icon: PackageCheck, count: readyForPickup },
    { href: '/account/orders?tab=completed', label: 'Completed', Icon: Flag, count: completed },
  ];

  return (
    <div>
      {/* Profile header — this section's real top header now that PublicNav's
          search bar is gone from here (a search bar made no sense above a
          profile screen). Full-bleed edge-to-edge (negative margins cancel
          AccountLayout's padding), not a rounded card, so it reads as the
          page's header rather than its first content block. Height matches
          PublicNav's search header exactly (36px content + 10px padding =
          56px) — avatar and settings button are both 36px (w-9 h-9), same
          padding, so every page's top header reads as one consistent bar
          app-wide. Settings is the plain standard gear glyph with no chip
          background, deliberately — a bare icon next to a round avatar
          reads as two different things at a glance; two same-sized circles
          didn't. Still the one way into Manage Account. */}
      <div className="-mx-[10px] -mt-[10px] bg-surface border-b border-line flex items-center gap-2.5 px-4 py-[10px] mb-[10px]">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push('/');
            }
          }}
          aria-label="Back"
          className="p-1 -ml-1 text-ink-muted hover:text-ink active:opacity-70 transition-colors shrink-0"
        >
          <ChevronLeft size={22} />
        </button>
        <Link
          href="/account/settings/account"
          aria-label="My Profile"
          className="w-9 h-9 rounded-full bg-sunken overflow-hidden relative shrink-0"
        >
          {user.profile_picture ? (
            <Image src={getMediaUrl(user.profile_picture)} alt="" fill unoptimized className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserIcon size={15} className="text-ink-faint" />
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink truncate">{user.name}</p>
          <p className="text-[11px] text-ink-muted truncate">{user.email}</p>
        </div>
        <Link
          href="/account/settings"
          aria-label="Manage Account"
          className="shrink-0 w-9 h-9 flex items-center justify-center text-ink-muted hover:text-ink transition-colors"
        >
          <Settings size={20} />
        </Link>
      </div>

      {/* Job Orders — the real equivalent of Shopee's "My Purchases" card. */}
      <div className="bg-surface border border-line rounded-2xl p-4 mb-[10px]">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-bold text-ink">Job Orders</h2>
          <Link href="/account/orders" className="flex items-center gap-0.5 text-xs font-semibold text-taupe">
            View All <ChevronRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {orderShortcuts.map(({ href, label, Icon, count }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-1.5 relative py-1">
              <span className="relative">
                <Icon size={22} className="text-ink-muted" />
                {!!count && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center bg-taupe text-white text-[9px] font-bold rounded-full">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </span>
              <span className="text-[10px] text-center leading-tight text-ink-muted">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Appointments — preview card right here on the hub (not just a
          count-only link) so the List/Calendar toggle and "see all" are
          visible without an extra tap. Full interaction (filters, cancel,
          day drill-down) lives on /account/appointments. */}
      <div className="bg-surface border border-line rounded-2xl p-4 mb-[10px]">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-bold text-ink">My Appointments</h2>
          <div className="flex bg-sunken border border-line rounded-lg p-1 gap-0.5">
            <button
              type="button"
              onClick={() => setApptView('list')}
              aria-label="List view"
              className={`w-7 h-6 rounded-md flex items-center justify-center ${apptView === 'list' ? 'bg-surface border border-line text-ink' : 'text-ink-muted'}`}
            >
              <ListIcon size={13} />
            </button>
            <button
              type="button"
              onClick={() => setApptView('calendar')}
              aria-label="Calendar view"
              className={`w-7 h-6 rounded-md flex items-center justify-center ${apptView === 'calendar' ? 'bg-surface border border-line text-ink' : 'text-ink-muted'}`}
            >
              <CalendarIcon size={13} />
            </button>
          </div>
        </div>

        {hasActiveAppointment && (
          <div className="flex items-start gap-1.5 bg-sunken rounded-lg px-3 py-2 mb-3">
            <Info size={12} className="text-ink-muted shrink-0 mt-0.5" />
            <p className="text-[11px] text-ink-body leading-relaxed">One active appointment per shop at a time — cancel it first to book a different date.</p>
          </div>
        )}

        {appointments === null && <p className="text-xs text-ink-muted py-2">Loading…</p>}

        {appointments !== null && appointments.length === 0 && (
          <p className="text-xs text-ink-muted py-2">No appointments yet.</p>
        )}

        {appointments !== null && appointments.length > 0 && apptView === 'list' && previewAppt && (() => {
          const meta = STATUS_META[previewAppt.status] ?? STATUS_META.pending;
          const StatusIcon = meta.Icon;
          const scheduled = new Date(previewAppt.scheduled_at);
          return (
            <div className="border border-line rounded-xl p-3.5 mb-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-ink-muted truncate">{previewAppt.shop?.name ?? 'Shop'}</span>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border shrink-0 ${meta.tone}`}>
                  <StatusIcon size={11} /> {meta.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-medium bg-sunken text-ink-muted rounded-full px-2 py-0.5">
                  {TYPE_LABELS[previewAppt.appointment_type] ?? previewAppt.appointment_type}
                </span>
                {previewAppt.intake_channel === 'walk_in' && (
                  <span className="text-[10px] font-semibold bg-surface text-ink-muted border border-line rounded-full px-2 py-0.5">WALK-IN</span>
                )}
              </div>
              <p className="text-sm font-bold text-ink">
                {previewAppt.service_name ?? (TYPE_LABELS[previewAppt.appointment_type] ?? previewAppt.appointment_type)}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-ink-muted">
                <span className="flex items-center gap-1"><CalendarDays size={11} />{scheduled.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} · {scheduled.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}</span>
                {previewAppt.branch && <span>{previewAppt.branch.name}</span>}
              </div>
              {previewAppt.status === 'cancelled' && (
                <div className="mt-2.5 pt-2.5 border-t border-line">
                  {previewAppt.cancellation_reason && (
                    <p className="text-[10.5px] text-ink-muted leading-relaxed mb-1.5"><span className="font-semibold text-ink-body">Reason:</span> {previewAppt.cancellation_reason}</p>
                  )}
                  {previewAppt.rebooking_blocked ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-ink-faint"><Lock size={11} /> Rebooking unavailable</div>
                  ) : previewAppt.shop?.slug ? (
                    <Link href={`/shop/${previewAppt.shop.slug}/book`} className="text-[11px] font-semibold text-taupe">Book a new appointment →</Link>
                  ) : null}
                </div>
              )}
            </div>
          );
        })()}

        {appointments !== null && appointments.length > 0 && apptView === 'calendar' && (
          <div className="border border-line rounded-xl overflow-hidden mb-3">
            <div className="grid grid-cols-7 bg-canvas">
              {WEEKDAYS.map((w, i) => <div key={`${w}-${i}`} className="text-center text-[9px] font-semibold text-ink-faint py-1">{w}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {calCells.map((c) => (
                <div key={c.key} className={`h-8 flex flex-col items-center justify-center border-t border-line ${c.isToday ? 'bg-amber-50/50' : c.isPast ? 'bg-canvas/40' : 'bg-surface'}`}>
                  {c.num && (
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${c.isToday ? 'bg-taupe text-white' : c.isPast ? 'text-ink-faint' : 'text-ink'}`}>{c.num}</span>
                  )}
                  {c.hasAppt && <span className="w-1 h-1 rounded-full bg-taupe mt-0.5" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {appointments !== null && appointments.length > 0 && (
          <Link href="/account/appointments" className="flex items-center justify-center gap-1.5 bg-sunken rounded-lg h-10 text-xs font-semibold text-ink hover:bg-line transition-colors">
            See all appointments <ChevronRight size={13} className="text-taupe" />
          </Link>
        )}
      </div>

      <div className="space-y-[10px]">
        <Link
          href="/account/measurements"
          className="flex items-center gap-3 bg-surface border border-line rounded-2xl p-4"
        >
          <div className="w-10 h-10 rounded-full bg-sunken flex items-center justify-center shrink-0">
            <Ruler size={18} className="text-taupe" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink">My Measurements</p>
            <p className="text-xs text-ink-muted">
              {measurementCount === null ? 'Loading…' : `${measurementCount} record${measurementCount === 1 ? '' : 's'}`}
            </p>
          </div>
          <ChevronRight size={16} className="text-ink-faint shrink-0" />
        </Link>
      </div>

      {/* More Activities — a titled card holding a short row list, same
          shape as the Support card below it (title inside, content below),
          not the Account Settings menu's grouped-section style — this
          lives on the hub itself so it's visible without an extra tap. */}
      <div className="bg-surface border border-line rounded-2xl p-4 mt-[10px]">
        <h2 className="text-sm font-bold text-ink mb-1">More Activities</h2>
        <div className="-mx-4">
          <Link href="/account/settings/become-shop-owner" className="flex items-center gap-3 px-4 py-3 border-t border-line">
            <div className="w-9 h-9 rounded-full bg-sunken flex items-center justify-center shrink-0">
              <Store size={16} className="text-taupe" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink">Start a Shop Owner Account</p>
              <p className="text-xs text-ink-muted">Be a Shop Owner</p>
            </div>
            <ChevronRight size={16} className="text-ink-faint shrink-0" />
          </Link>
          <Link href="/account/ratings" className="flex items-center gap-3 px-4 py-3 border-t border-line">
            <div className="w-9 h-9 rounded-full bg-sunken flex items-center justify-center shrink-0">
              <Star size={16} className="text-taupe" />
            </div>
            <p className="flex-1 text-sm font-semibold text-ink">My Ratings</p>
            <ChevronRight size={16} className="text-ink-faint shrink-0" />
          </Link>
          <Link href="/account/recently-viewed" className="flex items-center gap-3 px-4 py-3 border-t border-line">
            <div className="w-9 h-9 rounded-full bg-sunken flex items-center justify-center shrink-0">
              <History size={16} className="text-taupe" />
            </div>
            <p className="flex-1 text-sm font-semibold text-ink">Recently Viewed</p>
            <ChevronRight size={16} className="text-ink-faint shrink-0" />
          </Link>
        </div>
      </div>

      {/* Support — no customer-facing ticket backend yet, so the CTA lands
          on an honest "coming soon" screen rather than faking a working
          ticket flow. */}
      <div className="bg-surface border border-line rounded-2xl p-5 mt-[10px]">
        <h2 className="text-sm font-bold text-ink mb-4">Support</h2>
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-11 h-11 rounded-full bg-sunken flex items-center justify-center mb-2.5">
            <LifeBuoy size={20} className="text-ink-faint" />
          </div>
          <p className="text-xs text-ink-muted mb-3">No support tickets yet</p>
          <Link href="/account/settings/support" className="border border-line rounded-lg px-4 py-2 text-xs font-semibold text-taupe">
            Open a Ticket
          </Link>
        </div>
      </div>
    </div>
  );
}
