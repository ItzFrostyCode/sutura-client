'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Store, Building2, Tag, ShoppingBag, UserCog, Calendar, Scissors, CreditCard, LayoutDashboard, Check, RotateCcw, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { doneTours, type TourId } from '@/components/tour/tours';

interface OnboardingStep {
  step: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  href: string;
  /** "Configure now" starts this guided tour on the page. */
  tour?: TourId;
}

// Used to be 3 shallow steps that also referenced "rental deposits" — a
// feature that doesn't exist in this app (rental lifecycle management was
// explicitly excluded from SUTURA's approved thesis scope). Covers the
// real setup order a new store owner actually needs, matching what's
// genuinely built: storefront → branches → catalog/services → staff →
// day-to-day ops → money tracking.
const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    step: 'Step 1',
    title: 'Set Up Your Shop Profile',
    desc: 'Open your Shop Profile to add your logo, banner, description and social links, and set your map location and operating hours. This is what customers see when they find you.',
    icon: Store,
    href: '/dashboard/profile',
    tour: 'profile',
  },
  {
    step: 'Step 2',
    title: 'Add Your Branches',
    desc: 'If you operate from more than one location, add each branch here — address, contact number, and a guide photo customers can use to find it. Every branch-scoped view in the dashboard (Jobs, Appointments, Payments, Reports) can be filtered per branch from the header selector.',
    icon: Building2,
    href: '/dashboard/branches',
    tour: 'branches',
  },
  {
    step: 'Step 3',
    title: 'List Your Services & Pricing',
    desc: 'Declare what you offer — Barong, Gown, School Uniforms, Jerseys, Alterations, or custom services — with pricing tiers, estimated turnaround, and minimum order quantities for bulk work. You can bundle related services into Packages at a combo price too.',
    icon: Tag,
    href: '/dashboard/services',
    tour: 'services',
  },
  {
    step: 'Step 4',
    title: 'Build Your Catalog',
    desc: 'Add photos of past work and craftsmanship samples customers can browse and request fittings for — bespoke tailoring works, not off-the-shelf inventory. Each catalog item showcases your atelier craftsmanship.',
    icon: ShoppingBag,
    href: '/dashboard/catalog',
    tour: 'catalog',
  },
  {
    step: 'Step 5',
    title: 'Add Your Staff',
    desc: 'Bring on tailors, cutters, designers, and other roles, assign each to a branch, and set their specializations. Staff get their own profile with bio, workload, and job assignment history — visible to you only, never to customers.',
    icon: UserCog,
    href: '/dashboard/staff',
    tour: 'staff',
  },
  {
    step: 'Step 6',
    title: 'Manage Appointments',
    desc: 'Book fittings, consultations, and measurement sessions for walk-in or online customers. Each appointment auto-calculates duration by type, and a fitting can convert straight into a Job Order once measurements are confirmed.',
    icon: Calendar,
    href: '/dashboard/appointments',
    tour: 'appointments',
  },
  {
    step: 'Step 7',
    title: 'Track Production in Jobs',
    desc: ‘Every order moves through the production stages: Design, Pattern Making, Cutting, Sewing, Fitting, Final Adjustments, Quality Check and Ready for Pickup. Cutting waits until the required deposit is paid, and whoever moves an order to a stage is recorded on it. Bulk orders (a team’s jersey set, a school’s uniform batch) are counted by size.’,
    icon: Scissors,
    href: '/dashboard/jobs',
    tour: 'jobs',
  },
  {
    step: 'Step 8',
    title: 'Take Payments & Review Reports',
    desc: 'Log cash payments, verify customers’ GCash receipts as they come in, and reject a bad receipt with a reason. Reports rolls it all up: revenue, staff productivity, branch comparisons, and alerts for unclaimed pickups or orders on hold.',
    icon: CreditCard,
    href: '/dashboard/payments',
    tour: 'payments',
  },
];

export default function WelcomeView() {
  const { user } = useAuthStore();
  // Tours finished (or skipped) in this browser, read after mount (localStorage).
  const [done, setDone] = useState<TourId[]>([]);
  useEffect(() => {
    const read = () => setDone(doneTours(user?.id));
    read();
    window.addEventListener('sutura-tours-changed', read);
    return () => window.removeEventListener('sutura-tours-changed', read);
  }, [user?.id]);

  return (
    <div className="bg-surface border border-line rounded-3xl p-8 max-w-5xl mx-auto space-y-8 animate-fade-in text-ink">
      <div className="text-center space-y-3 pb-6 border-b border-[#FAF6F3]">
        <div className="w-16 h-16 bg-canvas rounded-full flex items-center justify-center mx-auto text-taupe">
          <BookOpen size={28} />
        </div>
        <h2 className="text-2xl font-heading font-semibold text-ink">Welcome to SUTURA Tailoring Tracker</h2>
        <p className="text-ink-muted text-sm max-w-lg mx-auto">A complete guide to setting up and running your shop on SUTURA, from your first shop profile edit to tracking a finished order.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ONBOARDING_STEPS.map((item) => {
          const Icon = item.icon;
          const isDone = !!item.tour && done.includes(item.tour);
          const href = item.tour ? `${item.href}?tour=${item.tour}` : item.href;
          return (
            <div key={item.title} className="bg-canvas border border-line rounded-2xl p-6 flex gap-4 transition-all hover:border-line-strong">
              <div className="bg-surface border border-line w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-taupe">
                <Icon size={22} />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-taupe uppercase tracking-wider">{item.step}</span>
                  {isDone && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sage/15 px-2 py-0.5 text-[10px] font-bold text-sage">
                      <Check size={11} aria-hidden="true" /> Done
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-sm text-ink">{item.title}</h4>
                <p className="text-xs text-ink-muted leading-relaxed mb-3">{item.desc}</p>
                <Link href={href} className="text-xs font-semibold text-taupe hover:text-[#91756A] inline-flex items-center gap-1.5 transition-colors">
                  {isDone ? <><RotateCcw size={12} aria-hidden="true" /> Replay tour</> : 'Configure now →'}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-canvas border border-line rounded-2xl p-6 flex gap-4">
        <div className="bg-surface border border-line w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-taupe">
          <LayoutDashboard size={22} />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-taupe uppercase tracking-wider">Once you&apos;re set up</span>
          <h4 className="font-semibold text-sm text-ink">This Home page is your daily overview</h4>
          <p className="text-xs text-ink-muted leading-relaxed">
            Needs Attention flags overdue orders, pending deposits, unclaimed pickups, and jobs stuck on hold. Use the branch selector in the header to switch between locations — it filters everything on this page and across Jobs, Appointments, Payments, and Reports.
          </p>
        </div>
      </div>

      <div className="pt-6 border-t border-[#FAF6F3] flex justify-between items-center flex-wrap gap-4 text-xs text-ink-faint">
        <p>Need support? Feel free to contact our administrative team via Support Tickets.</p>
        <Link href="/dashboard/support" className="px-4 py-2 bg-taupe hover:bg-[#91756A] text-white rounded-lg font-medium transition-all">
          Create Ticket
        </Link>
      </div>
    </div>
  );
}
